import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorDetail } from '../../shared/errors.js';
import { type ErrorBody, requestIdOf } from '../../shared/http.js';
import { logger } from '../../shared/logger.js';

const MENSAJE_GENERICO = 'Ocurrió un error inesperado. Si el problema continúa, informe este código: ';

/** Error de express.json() / body-parser (tiene status y type). */
function esErrorDeBody(err: unknown): err is { status: number; type: string } {
  return typeof err === 'object' && err !== null && 'type' in err && 'status' in err;
}

/**
 * Manejador central de errores (S1-05, RNF-05).
 * - Errores conocidos → su código HTTP y mensaje pensado para el usuario.
 * - Errores desconocidos → 500 con mensaje genérico; el detalle (stack) va solo al log.
 * Nunca envía al cliente trazas, consultas SQL ni credenciales.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const requestId = requestIdOf(res);
  let status = 500;
  let body: ErrorBody['error'];

  if (err instanceof AppError) {
    status = err.status;
    body = { code: err.code, message: err.message, requestId, details: err.details };
  } else if (err instanceof ZodError) {
    status = 400;
    const details: ErrorDetail[] = err.issues.map((i) => ({ field: i.path.join('.') || undefined, message: i.message }));
    body = { code: 'VALIDATION_ERROR', message: 'Los datos enviados no son válidos', requestId, details };
  } else if (esErrorDeBody(err) && err.type === 'entity.parse.failed') {
    status = 400;
    body = { code: 'INVALID_JSON', message: 'El cuerpo de la petición no es un JSON válido', requestId };
  } else if (esErrorDeBody(err) && err.type === 'entity.too.large') {
    status = 413;
    body = { code: 'PAYLOAD_TOO_LARGE', message: 'El contenido enviado supera el tamaño permitido', requestId };
  } else {
    body = { code: 'INTERNAL_ERROR', message: MENSAJE_GENERICO + requestId, requestId };
  }

  if (status >= 500) {
    logger.error('error no controlado', {
      requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
    });
  }

  // Si la respuesta ya empezó a enviarse, Express debe cerrar la conexión.
  if (res.headersSent) return next(err);
  if (body.details === undefined) delete body.details;
  res.status(status).json({ error: body } satisfies ErrorBody);
};
