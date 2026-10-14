import type { RequestHandler } from 'express';
import type { DbCheck } from '../../database/db-check.js';
import { getHealth } from '../../modules/health/health.service.js';
import { sendData } from '../../shared/http.js';

/** Solo traduce HTTP: 200 si todo está bien, 503 si la base no responde. */
export function healthController(dbCheck: DbCheck, version: string): RequestHandler {
  return async (_req, res) => {
    const report = await getHealth(dbCheck, version);
    res.setHeader('Cache-Control', 'no-store');
    sendData(res, report, report.status === 'ok' ? 200 : 503);
  };
}
