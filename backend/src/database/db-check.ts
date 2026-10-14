import pg from 'pg';

/**
 * Comprobación mínima de la base de datos para /api/health (S1-01).
 * Desde el Sprint 2 el acceso a datos se hace con Prisma; esta comprobación
 * se mantiene porque no depende del esquema.
 */
export type DbCheck = () => Promise<boolean>;

export function createDbCheck(connectionString: string): { check: DbCheck; close: () => Promise<void> } {
  const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 2000, idleTimeoutMillis: 10_000 });
  // Un error de conexión inactiva no debe tumbar el proceso.
  pool.on('error', () => undefined);

  return {
    check: async () => {
      try {
        await pool.query('SELECT 1');
        return true;
      } catch {
        return false;
      }
    },
    close: () => pool.end(),
  };
}
