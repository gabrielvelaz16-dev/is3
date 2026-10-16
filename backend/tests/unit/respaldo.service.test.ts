import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type DatosRespaldo, type RespaldoRepo, TABLAS_RESPALDO } from '../../src/database/repositories.js';
import { AlmacenamientoEnMemoria, sha256 } from '../../src/integrations/almacenamiento/almacenamiento.js';
import { ErrorRespaldo, nombreRespaldo, RespaldoService } from '../../src/modules/respaldo/respaldo.service.js';

const vacio = (): DatosRespaldo => Object.fromEntries(TABLAS_RESPALDO.map((t) => [t, []])) as unknown as DatosRespaldo;

/** Repositorio falso: guarda en memoria lo importado, igual que una base vacía que se llena. */
function repoFalso(inicial: DatosRespaldo, migraciones = ['20261014155939_init', '20261016120000_notificaciones']) {
  let actual: DatosRespaldo = JSON.parse(JSON.stringify(inicial));
  const repo: RespaldoRepo = {
    exportar: async () => JSON.parse(JSON.stringify(actual)),
    importar: async (datos) => {
      if (TABLAS_RESPALDO.some((t) => actual[t].length > 0)) throw new Error('La base de destino no está vacía');
      actual = JSON.parse(JSON.stringify(datos));
    },
    conteos: async () => Object.fromEntries(TABLAS_RESPALDO.map((t) => [t, actual[t].length])) as Record<(typeof TABLAS_RESPALDO)[number], number>,
    migraciones: async () => migraciones,
  };
  return repo;
}

const DOC_A = '11111111-1111-4111-8111-111111111111';
const DOC_B = '22222222-2222-4222-8222-222222222222';

describe('Respaldo y restauración (S7-04, RF-22, RNF-07)', () => {
  let carpeta: string;
  let origen: AlmacenamientoEnMemoria;
  let datos: DatosRespaldo;

  beforeEach(async () => {
    carpeta = await mkdtemp(join(tmpdir(), 'is3-respaldo-'));
    origen = new AlmacenamientoEnMemoria();
    await origen.escribir(DOC_A, Buffer.from('%PDF-1.4 contenido A'));
    await origen.escribir(DOC_B, Buffer.from('contenido B'));
    datos = vacio();
    datos.usuarios = [{ id: 1, username: 'admin' }, { id: 2, username: 'mesa' }];
    datos.expedientes = [{ id: 1, numero: 'EXP-2026-000001', caratula: 'Prueba ñandú' }];
    datos.documentos = [
      { id: 1, nombreAlmacenado: DOC_A, hashSha256: sha256(Buffer.from('%PDF-1.4 contenido A')) },
      { id: 2, nombreAlmacenado: DOC_B, hashSha256: sha256(Buffer.from('contenido B')) },
    ];
  });

  afterEach(async () => {
    await rm(carpeta, { recursive: true, force: true });
  });

  it('crea el respaldo con manifiesto y lo restaura en una base vacía con los mismos datos y documentos', async () => {
    const respaldo = await new RespaldoService(repoFalso(datos), origen, carpeta, { now: () => new Date(2026, 9, 16, 10, 5, 9) }).crear();
    expect(respaldo).toMatchObject({ nombre: 'respaldo-20261016-100509', totalFilas: 5, documentos: 2, documentosConProblemas: 0 });

    const manifiesto = JSON.parse(await readFile(join(respaldo.ruta, 'manifiesto.json'), 'utf8'));
    expect(manifiesto.conteos).toMatchObject({ usuarios: 2, expedientes: 1, documentos: 2 });
    expect(manifiesto.migraciones.at(-1)).toBe('20261016120000_notificaciones');

    const destinoRepo = repoFalso(vacio());
    const destino = new AlmacenamientoEnMemoria();
    const resultado = await new RespaldoService(destinoRepo, destino, carpeta).restaurar(respaldo.ruta);
    expect(resultado).toMatchObject({ filas: 5, documentos: 2 });
    expect((await destinoRepo.exportar()).expedientes[0]).toMatchObject({ caratula: 'Prueba ñandú' });
    expect((await destino.leer(DOC_A))!.toString()).toBe('%PDF-1.4 contenido A');
  });

  it('lista los respaldos del más reciente al más antiguo y no pisa dos del mismo segundo', async () => {
    const servicio = new RespaldoService(repoFalso(datos), origen, carpeta, { now: () => new Date(2026, 9, 16, 10, 0, 0) });
    const a = await servicio.crear();
    const b = await servicio.crear();
    expect(b.nombre).toBe(`${a.nombre}-2`);
    expect((await servicio.listar()).map((r) => r.nombre)).toEqual([b.nombre, a.nombre]);
    expect(await new RespaldoService(repoFalso(datos), origen, join(carpeta, 'no-existe')).listar()).toEqual([]);
  });

  it('si datos.json fue alterado, no restaura nada e informa el problema', async () => {
    const { ruta } = await new RespaldoService(repoFalso(datos), origen, carpeta).crear();
    const json = JSON.parse(await readFile(join(ruta, 'datos.json'), 'utf8'));
    json.expedientes[0].caratula = 'Carátula cambiada';
    await writeFile(join(ruta, 'datos.json'), JSON.stringify(json));

    const destinoRepo = repoFalso(vacio());
    const error = await new RespaldoService(destinoRepo, new AlmacenamientoEnMemoria(), carpeta).restaurar(ruta).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorRespaldo);
    expect((error as ErrorRespaldo).problemas).toContain('datos.json fue modificado (el hash no coincide)');
    expect((await destinoRepo.conteos()).expedientes).toBe(0);
  });

  it('detecta un documento modificado o faltante dentro del respaldo', async () => {
    const { ruta } = await new RespaldoService(repoFalso(datos), origen, carpeta).crear();
    await writeFile(join(ruta, 'documentos', DOC_A), 'otro contenido');
    await rm(join(ruta, 'documentos', DOC_B));
    const error = (await new RespaldoService(repoFalso(vacio()), origen, carpeta).verificar(ruta).catch((e: unknown) => e)) as ErrorRespaldo;
    expect(error.problemas).toEqual([`el documento ${DOC_A} fue modificado`, `falta el documento ${DOC_B}`]);
  });

  it('rechaza un respaldo sin manifiesto, de otro formato o de otras migraciones', async () => {
    const servicio = new RespaldoService(repoFalso(vacio()), origen, carpeta);
    await expect(servicio.verificar(join(carpeta, 'nada'))).rejects.toThrow('El respaldo no tiene un manifiesto válido');

    const { ruta } = await new RespaldoService(repoFalso(datos), origen, carpeta).crear();
    const otraVersion = new RespaldoService(repoFalso(vacio(), ['20261014155939_init']), origen, carpeta);
    await expect(otraVersion.restaurar(ruta)).rejects.toThrow('no tiene las mismas migraciones');

    const manifiesto = JSON.parse(await readFile(join(ruta, 'manifiesto.json'), 'utf8'));
    await writeFile(join(ruta, 'manifiesto.json'), JSON.stringify({ ...manifiesto, formato: 'otro' }));
    await expect(servicio.verificar(ruta)).rejects.toThrow('El formato del respaldo no es compatible');
  });

  it('no restaura sobre una base que ya tiene datos', async () => {
    const { ruta } = await new RespaldoService(repoFalso(datos), origen, carpeta).crear();
    await expect(new RespaldoService(repoFalso(datos), new AlmacenamientoEnMemoria(), carpeta).restaurar(ruta)).rejects.toThrow('no está vacía');
  });

  it('registra en el manifiesto los documentos sin archivo o con hash distinto al respaldar', async () => {
    datos.documentos.push({ id: 3, nombreAlmacenado: '33333333-3333-4333-8333-333333333333', hashSha256: 'x' });
    datos.documentos[1]!.hashSha256 = 'hash-viejo';
    const r = await new RespaldoService(repoFalso(datos), origen, carpeta).crear();
    expect(r.documentosConProblemas).toBe(2);
    const manifiesto = JSON.parse(await readFile(join(r.ruta, 'manifiesto.json'), 'utf8'));
    expect(manifiesto.documentosConProblemas).toEqual([
      { nombre: DOC_B, motivo: 'HASH_DISTINTO' },
      { nombre: '33333333-3333-4333-8333-333333333333', motivo: 'FALTA' },
    ]);
  });

  it('el nombre del respaldo usa la fecha y hora local', () => {
    expect(nombreRespaldo(new Date(2026, 0, 2, 3, 4, 5))).toBe('respaldo-20260102-030405');
  });
});
