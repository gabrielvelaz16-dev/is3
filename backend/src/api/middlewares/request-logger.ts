import type { RequestHandler } from 'express';
import { logger } from '../../shared/logger.js';

/** Registra cada petición al terminar: método, ruta (sin query), código y duración. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - inicio) / 1e6;
    const nivel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[nivel]('http', {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
    });
  });
  next();
};
