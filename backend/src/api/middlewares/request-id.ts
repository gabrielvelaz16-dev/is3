import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const ID_VALIDO = /^[\w-]{1,64}$/;

/**
 * Asigna un identificador a cada petición (o reutiliza el recibido si es válido)
 * y lo devuelve en el encabezado X-Request-Id. Sirve para encontrar un error en
 * los logs sin mostrar detalles internos al usuario.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const recibido = req.get('x-request-id');
  const id = recibido && ID_VALIDO.test(recibido) ? recibido : randomUUID();
  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};
