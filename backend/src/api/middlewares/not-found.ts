import type { RequestHandler } from 'express';
import { NotFoundError } from '../../shared/errors.js';

/** Cualquier ruta que no exista termina en un 404 con el contrato de error. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`No existe la ruta ${req.method} ${req.originalUrl.split('?')[0]}`));
};
