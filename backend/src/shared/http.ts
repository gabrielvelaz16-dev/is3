import type { Response } from 'express';
import type { ErrorCode, ErrorDetail } from './errors.js';

/** Contrato de la API (S1-03): éxito = { data }, error = { error }. */
export interface SuccessBody<T> {
  data: T;
}

export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
    details?: ErrorDetail[];
  };
}

export function sendData<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data } satisfies SuccessBody<T>);
}

export function requestIdOf(res: Response): string {
  return typeof res.locals.requestId === 'string' ? res.locals.requestId : 'sin-id';
}
