/**
 * Copias de seguridad desde la línea de comandos — Sprint 7 (S7-04, RF-22, ADR-13).
 *
 *   npm run respaldo:crear
 *   npm run respaldo:verificar -- <carpeta del respaldo>
 *   npm run respaldo:restaurar -- <carpeta del respaldo> --confirmar
 *
 * La restauración se hace con el backend detenido y sobre una base vacía recién migrada
 * (`npx prisma migrate deploy`). Sin --confirmar solo verifica y explica qué haría.
 */
import { resolve } from 'node:path';
import { loadEnv, RAIZ_REPOSITORIO } from '../config/env.js';
import { createPrismaClient } from '../database/prisma/client.js';
import { createPrismaRepos } from '../database/prisma/repos.js';
import { AlmacenamientoLocal } from '../integrations/almacenamiento/almacenamiento.js';
import { ErrorRespaldo, RespaldoService } from '../modules/respaldo/respaldo.service.js';

const [comando, ruta, ...opciones] = process.argv.slice(2);
const env = loadEnv();
const prisma = createPrismaClient(env.DATABASE_URL);
const repos = createPrismaRepos(prisma);
const servicio = new RespaldoService(
  repos.respaldo,
  new AlmacenamientoLocal(resolve(RAIZ_REPOSITORIO, env.STORAGE_PATH)),
  resolve(RAIZ_REPOSITORIO, env.BACKUP_PATH),
);

async function main(): Promise<void> {
  switch (comando) {
    case 'crear': {
      const r = await servicio.crear();
      await repos.auditoria.insert({
        accion: 'respaldo.crear',
        resultado: 'EXITO',
        entidad: 'Respaldo',
        entidadId: r.nombre,
        detalle: { filas: r.totalFilas, documentos: r.documentos, origen: 'linea de comandos' },
      });
      console.log(`Respaldo creado: ${r.ruta}`);
      console.log(`  ${r.totalFilas} filas, ${r.documentos} documentos, ${r.bytes} bytes`);
      if (r.documentosConProblemas > 0) {
        console.log(`  ATENCIÓN: ${r.documentosConProblemas} documento(s) registrados en la base no tenían su archivo o su hash no coincidía (ver manifiesto.json).`);
      }
      return;
    }
    case 'verificar': {
      if (!ruta) throw new ErrorRespaldo('Indique la carpeta del respaldo');
      const { manifiesto } = await servicio.verificar(ruta);
      console.log(`Respaldo válido: creado el ${manifiesto.creadoEn}, ${manifiesto.documentos.length} documentos.`);
      for (const [tabla, filas] of Object.entries(manifiesto.conteos)) console.log(`  ${tabla.padEnd(16)} ${filas}`);
      return;
    }
    case 'restaurar': {
      if (!ruta) throw new ErrorRespaldo('Indique la carpeta del respaldo');
      if (!opciones.includes('--confirmar')) {
        const { manifiesto } = await servicio.verificar(ruta);
        console.log(`El respaldo es válido (${manifiesto.creadoEn}). Para restaurarlo:`);
        console.log('  1. Detenga el backend.');
        console.log('  2. Use una base vacía con las migraciones aplicadas (npx prisma migrate deploy).');
        console.log('  3. Vuelva a ejecutar este comando agregando --confirmar.');
        return;
      }
      const r = await servicio.restaurar(ruta);
      await repos.auditoria.insert({
        accion: 'respaldo.restaurar',
        resultado: 'EXITO',
        entidad: 'Respaldo',
        entidadId: ruta,
        detalle: { creadoEn: r.manifiesto.creadoEn, filas: r.filas, documentos: r.documentos },
      });
      console.log(`Restauración completa y verificada: ${r.filas} filas y ${r.documentos} documentos coinciden con el respaldo.`);
      return;
    }
    default:
      throw new ErrorRespaldo('Uso: respaldo.ts crear | verificar <carpeta> | restaurar <carpeta> --confirmar');
  }
}

main()
  .catch((err: unknown) => {
    if (err instanceof ErrorRespaldo) {
      console.error(err.problemas.length ? `${err.message.split(':')[0]}:` : err.message);
      for (const p of err.problemas) console.error(`  - ${p}`);
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
