/**
 * Cliente HTTP que aplica el contrato de la API (S1-03):
 * éxito = { data, meta? } · error = { error: { code, message, requestId, details? } }.
 * Ver docs/02-arquitectura/contrato-api.md.
 */

export interface ErrorDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Mensaje de un campo concreto (para mostrar debajo de cada input). */
  campo(nombre: string): string | undefined {
    return this.details.find((d) => d.field === nombre)?.message;
  }
}

export interface Pagina<T> {
  data: T;
  meta?: { page: number; pageSize: number; total: number };
}

type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function apiRaw<T>(ruta: string, opciones: { method?: Metodo; body?: unknown; signal?: AbortSignal } = {}): Promise<Pagina<T>> {
  let res: Response;
  try {
    res = await fetch(`/api${ruta}`, {
      method: opciones.method ?? 'GET',
      credentials: 'same-origin',
      headers: opciones.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
      signal: opciones.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.');
  }

  let cuerpo: unknown = null;
  try {
    cuerpo = await res.json();
  } catch {
    // Respuesta sin JSON (por ejemplo, un error del proxy).
  }

  const conError = cuerpo as { error?: { code: string; message: string; requestId?: string; details?: ErrorDetail[] } } | null;
  if (conError?.error) {
    const e = conError.error;
    throw new ApiError(res.status, e.code, e.message, e.requestId, e.details ?? []);
  }
  if (!res.ok && !(cuerpo && typeof cuerpo === 'object' && 'data' in cuerpo)) {
    throw new ApiError(res.status, 'HTTP_ERROR', `El servidor respondió con un error (${res.status}).`);
  }
  return cuerpo as Pagina<T>;
}

export async function api<T>(ruta: string, opciones: Parameters<typeof apiRaw>[1] = {}): Promise<T> {
  return (await apiRaw<T>(ruta, opciones)).data;
}
