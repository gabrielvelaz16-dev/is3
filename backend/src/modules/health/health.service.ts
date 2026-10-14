import type { DbCheck } from '../../database/db-check.js';

export type ComponentStatus = 'ok' | 'down';

export interface HealthReport {
  status: 'ok' | 'degraded';
  api: ComponentStatus;
  database: ComponentStatus;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

/**
 * Regla del estado del sistema: si la API responde pero la base no, el sistema
 * está "degradado". La regla vive en el servicio, no en el controlador (ADR-03).
 */
export async function getHealth(dbCheck: DbCheck, version: string, now: () => Date = () => new Date()): Promise<HealthReport> {
  const database: ComponentStatus = (await dbCheck()) ? 'ok' : 'down';
  return {
    status: database === 'ok' ? 'ok' : 'degraded',
    api: 'ok',
    database,
    version,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: now().toISOString(),
  };
}
