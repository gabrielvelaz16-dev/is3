/**
 * Respaldo y restauración con Prisma (S7-04, RF-22, ADR-13).
 * Exporta cada tabla tal cual y la restaura con los mismos ids en una base vacía y migrada.
 * Las tablas de solo inserción admiten INSERT, así que la restauración no necesita desactivar triggers.
 */
import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import { type DatosRespaldo, type RespaldoRepo, TABLAS_RESPALDO, type TablaRespaldo } from '../repositories.js';

/** Delegado de Prisma de cada tabla y nombre en la base (para reiniciar la secuencia del id). */
const TABLAS: Record<TablaRespaldo, { modelo: string; sql: string | null }> = {
  dependencias: { modelo: 'dependencia', sql: 'dependencias' },
  roles: { modelo: 'rol', sql: 'roles' },
  permisos: { modelo: 'permiso', sql: 'permisos' },
  rolesPermisos: { modelo: 'rolPermiso', sql: null },
  usuarios: { modelo: 'usuario', sql: 'usuarios' },
  auditoria: { modelo: 'auditoria', sql: 'auditoria' },
  secuencias: { modelo: 'secuencia', sql: null },
  expedientes: { modelo: 'expediente', sql: 'expedientes' },
  documentos: { modelo: 'documento', sql: 'documentos' },
  actuaciones: { modelo: 'actuacion', sql: 'actuaciones' },
  cambiosEstado: { modelo: 'cambioEstado', sql: 'cambios_estado' },
  tareas: { modelo: 'tarea', sql: 'tareas' },
  pases: { modelo: 'pase', sql: 'pases' },
  asignaciones: { modelo: 'asignacion', sql: 'asignaciones' },
  notificaciones: { modelo: 'notificacion', sql: 'notificaciones' },
};

interface Delegado {
  findMany(args?: object): Promise<Record<string, unknown>[]>;
  createMany(args: { data: Record<string, unknown>[] }): Promise<{ count: number }>;
  count(): Promise<number>;
}

type Cliente = PrismaClient | Prisma.TransactionClient;
const delegado = (cliente: Cliente, tabla: TablaRespaldo) =>
  (cliente as unknown as Record<string, Delegado>)[TABLAS[tabla].modelo]!;

const LOTE = 1000;

/** El JSON nulo de `auditoria.detalle` se restaura como NULL de la base. */
function preparar(tabla: TablaRespaldo, fila: Record<string, unknown>): Record<string, unknown> {
  if (tabla === 'auditoria' && (fila.detalle === null || fila.detalle === undefined)) {
    return { ...fila, detalle: Prisma.DbNull };
  }
  return fila;
}

async function conteos(cliente: Cliente): Promise<Record<TablaRespaldo, number>> {
  const valores = await Promise.all(TABLAS_RESPALDO.map((t) => delegado(cliente, t).count()));
  return Object.fromEntries(TABLAS_RESPALDO.map((t, i) => [t, valores[i]!])) as Record<TablaRespaldo, number>;
}

export function createPrismaRespaldoRepo(prisma: PrismaClient): RespaldoRepo {
  return {
    async exportar() {
      const datos = {} as DatosRespaldo;
      for (const tabla of TABLAS_RESPALDO) datos[tabla] = await delegado(prisma, tabla).findMany();
      return datos;
    },

    async importar(datos) {
      await prisma.$transaction(
        async (tx) => {
          const actuales = await conteos(tx);
          const conDatos = TABLAS_RESPALDO.filter((t) => actuales[t] > 0);
          if (conDatos.length > 0) {
            throw new Error(`La base de destino no está vacía (${conDatos.join(', ')}). Restaure sobre una base nueva y migrada.`);
          }
          for (const tabla of TABLAS_RESPALDO) {
            const filas = datos[tabla] ?? [];
            for (let i = 0; i < filas.length; i += LOTE) {
              await delegado(tx, tabla).createMany({ data: filas.slice(i, i + LOTE).map((f) => preparar(tabla, f)) });
            }
          }
          // Las filas conservan sus ids: cada secuencia sigue desde el máximo restaurado.
          for (const tabla of TABLAS_RESPALDO) {
            const sql = TABLAS[tabla].sql;
            if (!sql) continue;
            await tx.$executeRawUnsafe(
              `SELECT setval(pg_get_serial_sequence('"${sql}"', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM "${sql}"`,
            );
          }
        },
        { timeout: 300_000, maxWait: 10_000 },
      );
    },

    conteos: () => conteos(prisma),

    async migraciones() {
      const filas = await prisma.$queryRaw<{ migration_name: string }[]>`
        SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`;
      return filas.map((f) => f.migration_name);
    },
  };
}
