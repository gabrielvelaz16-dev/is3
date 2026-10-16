/**
 * Copia de seguridad y restauración — Sprint 7 (S7-04, RF-22, RNF-07, ADR-13).
 *
 * Un respaldo es una carpeta `respaldo-AAAAMMDD-HHMMSS/` con:
 *   - datos.json        todas las tablas (salvo sesiones)
 *   - documentos/<uuid> los archivos adjuntos tal como están en el almacenamiento
 *   - manifiesto.json   migraciones, cantidad de filas por tabla y SHA-256 de cada archivo
 *
 * La restauración verifica el manifiesto antes de tocar nada: si el respaldo fue alterado,
 * informa los problemas y no restaura. Solo restaura sobre una base vacía con las mismas migraciones,
 * y al terminar vuelve a contar las filas y a verificar los documentos.
 */
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { type DatosRespaldo, type RespaldoRepo, TABLAS_RESPALDO, type TablaRespaldo } from '../../database/repositories.js';
import { type AlmacenamientoDocumentos, NOMBRE_VALIDO, sha256 } from '../../integrations/almacenamiento/almacenamiento.js';

export const FORMATO = 'is3-respaldo';
export const VERSION_FORMATO = 1;

export interface ProblemaDocumento {
  nombre: string;
  motivo: 'FALTA' | 'HASH_DISTINTO';
}

export interface ManifiestoRespaldo {
  formato: typeof FORMATO;
  version: number;
  creadoEn: string;
  migraciones: string[];
  conteos: Record<TablaRespaldo, number>;
  datos: { archivo: 'datos.json'; sha256: string; bytes: number };
  documentos: { nombre: string; sha256: string; bytes: number }[];
  /** Documentos registrados en la base cuyo archivo faltaba o no coincidía con su hash al respaldar. */
  documentosConProblemas: ProblemaDocumento[];
}

export interface ResumenRespaldo {
  nombre: string;
  creadoEn: string;
  totalFilas: number;
  documentos: number;
  documentosConProblemas: number;
  bytes: number;
}

/** Error de respaldo con la lista de problemas encontrados (para mostrarlos todos juntos). */
export class ErrorRespaldo extends Error {
  constructor(
    message: string,
    public readonly problemas: string[] = [],
  ) {
    super(problemas.length ? `${message}: ${problemas.join('; ')}` : message);
    this.name = 'ErrorRespaldo';
  }
}

const dos = (n: number) => String(n).padStart(2, '0');
export function nombreRespaldo(d: Date): string {
  return `respaldo-${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}-${dos(d.getHours())}${dos(d.getMinutes())}${dos(d.getSeconds())}`;
}

const NOMBRE_CARPETA = /^respaldo-\d{8}-\d{6}(-\d+)?$/;
const total = (conteos: Record<string, number>) => Object.values(conteos).reduce((a, b) => a + b, 0);

export class RespaldoService {
  private readonly carpeta: string;

  constructor(
    private readonly repo: RespaldoRepo,
    private readonly almacenamiento: AlmacenamientoDocumentos,
    carpetaRespaldos: string,
    private readonly opciones: { now?: () => Date } = {},
  ) {
    this.carpeta = resolve(carpetaRespaldos);
  }

  /** Genera un respaldo completo y devuelve su resumen. */
  async crear(): Promise<ResumenRespaldo & { ruta: string }> {
    const ahora = this.opciones.now?.() ?? new Date();
    const [datos, migraciones] = await Promise.all([this.repo.exportar(), this.repo.migraciones()]);

    let nombre = nombreRespaldo(ahora);
    let ruta = join(this.carpeta, nombre);
    // Dos respaldos en el mismo segundo no se pisan.
    for (let i = 2; await existe(ruta); i++) {
      nombre = `${nombreRespaldo(ahora)}-${i}`;
      ruta = join(this.carpeta, nombre);
    }
    await mkdir(join(ruta, 'documentos'), { recursive: true });

    const documentos: ManifiestoRespaldo['documentos'] = [];
    const documentosConProblemas: ProblemaDocumento[] = [];
    for (const fila of datos.documentos) {
      const nombreDoc = String(fila.nombreAlmacenado);
      const contenido = NOMBRE_VALIDO.test(nombreDoc) ? await this.almacenamiento.leer(nombreDoc) : null;
      if (!contenido) {
        documentosConProblemas.push({ nombre: nombreDoc, motivo: 'FALTA' });
        continue;
      }
      const hash = sha256(contenido);
      if (hash !== fila.hashSha256) documentosConProblemas.push({ nombre: nombreDoc, motivo: 'HASH_DISTINTO' });
      await writeFile(join(ruta, 'documentos', nombreDoc), contenido);
      documentos.push({ nombre: nombreDoc, sha256: hash, bytes: contenido.length });
    }

    const json = Buffer.from(JSON.stringify(datos));
    await writeFile(join(ruta, 'datos.json'), json);
    const manifiesto: ManifiestoRespaldo = {
      formato: FORMATO,
      version: VERSION_FORMATO,
      creadoEn: ahora.toISOString(),
      migraciones,
      conteos: Object.fromEntries(TABLAS_RESPALDO.map((t) => [t, datos[t].length])) as Record<TablaRespaldo, number>,
      datos: { archivo: 'datos.json', sha256: sha256(json), bytes: json.length },
      documentos,
      documentosConProblemas,
    };
    await writeFile(join(ruta, 'manifiesto.json'), JSON.stringify(manifiesto, null, 2));
    return { ...resumen(nombre, manifiesto), ruta };
  }

  /** Respaldos de la carpeta configurada, el más reciente primero. */
  async listar(): Promise<ResumenRespaldo[]> {
    let carpetas: string[];
    try {
      carpetas = await readdir(this.carpeta);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const lista: ResumenRespaldo[] = [];
    for (const nombre of carpetas.filter((c) => NOMBRE_CARPETA.test(c))) {
      try {
        const manifiesto = JSON.parse(await readFile(join(this.carpeta, nombre, 'manifiesto.json'), 'utf8')) as ManifiestoRespaldo;
        lista.push(resumen(nombre, manifiesto));
      } catch {
        // Carpeta incompleta o ajena: no se lista.
      }
    }
    return lista.sort((a, b) => b.nombre.localeCompare(a.nombre));
  }

  /**
   * Comprueba que el respaldo esté completo y sin alterar. Lanza ErrorRespaldo con todos
   * los problemas encontrados; si está bien, devuelve el manifiesto y los datos.
   */
  async verificar(ruta: string): Promise<{ manifiesto: ManifiestoRespaldo; datos: DatosRespaldo }> {
    const base = resolve(ruta);
    let manifiesto: ManifiestoRespaldo;
    try {
      manifiesto = JSON.parse(await readFile(join(base, 'manifiesto.json'), 'utf8')) as ManifiestoRespaldo;
    } catch {
      throw new ErrorRespaldo('El respaldo no tiene un manifiesto válido');
    }
    if (manifiesto.formato !== FORMATO || manifiesto.version !== VERSION_FORMATO) {
      throw new ErrorRespaldo('El formato del respaldo no es compatible');
    }

    const problemas: string[] = [];
    let datos: DatosRespaldo | null = null;
    try {
      const json = await readFile(join(base, 'datos.json'));
      if (sha256(json) !== manifiesto.datos.sha256) problemas.push('datos.json fue modificado (el hash no coincide)');
      else datos = JSON.parse(json.toString('utf8')) as DatosRespaldo;
    } catch {
      problemas.push('falta datos.json o no se puede leer');
    }
    if (datos) {
      for (const tabla of TABLAS_RESPALDO) {
        const filas = datos[tabla]?.length ?? -1;
        if (filas !== manifiesto.conteos[tabla]) problemas.push(`${tabla}: el manifiesto dice ${manifiesto.conteos[tabla]} filas y hay ${filas}`);
      }
    }
    for (const doc of manifiesto.documentos) {
      if (!NOMBRE_VALIDO.test(doc.nombre)) {
        problemas.push(`nombre de documento inválido: ${doc.nombre}`);
        continue;
      }
      try {
        const contenido = await readFile(join(base, 'documentos', doc.nombre));
        if (sha256(contenido) !== doc.sha256) problemas.push(`el documento ${doc.nombre} fue modificado`);
      } catch {
        problemas.push(`falta el documento ${doc.nombre}`);
      }
    }
    if (problemas.length > 0 || !datos) throw new ErrorRespaldo('El respaldo no es válido', problemas);
    return { manifiesto, datos };
  }

  /**
   * Restaura un respaldo verificado en una base vacía y migrada (ADR-13: solo desde la línea de
   * comandos, con el backend detenido). Al terminar compara las filas y los documentos restaurados.
   */
  async restaurar(ruta: string): Promise<{ manifiesto: ManifiestoRespaldo; filas: number; documentos: number }> {
    const { manifiesto, datos } = await this.verificar(ruta);

    const migraciones = await this.repo.migraciones();
    if (JSON.stringify(migraciones) !== JSON.stringify(manifiesto.migraciones)) {
      throw new ErrorRespaldo('La base de destino no tiene las mismas migraciones que el respaldo', [
        `respaldo: ${manifiesto.migraciones.at(-1) ?? 'ninguna'}`,
        `base: ${migraciones.at(-1) ?? 'ninguna'}`,
      ]);
    }

    await this.repo.importar(datos);
    for (const doc of manifiesto.documentos) {
      await this.almacenamiento.escribir(doc.nombre, await readFile(join(resolve(ruta), 'documentos', doc.nombre)));
    }

    // Comprobación posterior: lo que quedó en la base y en el almacenamiento es lo del respaldo.
    const problemas: string[] = [];
    const conteos = await this.repo.conteos();
    for (const tabla of TABLAS_RESPALDO) {
      if (conteos[tabla] !== manifiesto.conteos[tabla]) {
        problemas.push(`${tabla}: se esperaban ${manifiesto.conteos[tabla]} filas y hay ${conteos[tabla]}`);
      }
    }
    for (const doc of manifiesto.documentos) {
      const contenido = await this.almacenamiento.leer(doc.nombre);
      if (!contenido || sha256(contenido) !== doc.sha256) problemas.push(`el documento ${doc.nombre} no quedó igual`);
    }
    if (problemas.length > 0) throw new ErrorRespaldo('La restauración no coincide con el respaldo', problemas);
    return { manifiesto, filas: total(conteos), documentos: manifiesto.documentos.length };
  }
}

function resumen(nombre: string, m: ManifiestoRespaldo): ResumenRespaldo {
  return {
    nombre,
    creadoEn: m.creadoEn,
    totalFilas: total(m.conteos),
    documentos: m.documentos.length,
    documentosConProblemas: m.documentosConProblemas.length,
    bytes: m.datos.bytes + m.documentos.reduce((a, d) => a + d.bytes, 0),
  };
}

async function existe(ruta: string): Promise<boolean> {
  try {
    await stat(ruta);
    return true;
  } catch {
    return false;
  }
}
