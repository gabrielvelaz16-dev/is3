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

/** Archivo enviado tal cual como cuerpo de la petición (subida de documentos, ADR-12). */
export interface CuerpoArchivo {
  contenido: Blob;
  tipo: string;
  encabezados?: Record<string, string>;
}

export interface OpcionesApi {
  method?: Metodo;
  body?: unknown;
  archivo?: CuerpoArchivo;
  signal?: AbortSignal;
}

const ERROR_RED = 'No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.';

/** Hace la petición; solo traduce los errores de red a ApiError. */
export async function pedir(ruta: string, opciones: OpcionesApi = {}): Promise<Response> {
  let headers: Record<string, string> | undefined;
  let body: BodyInit | undefined;
  if (opciones.archivo) {
    headers = { 'Content-Type': opciones.archivo.tipo || 'application/octet-stream', ...opciones.archivo.encabezados };
    body = opciones.archivo.contenido;
  } else if (opciones.body !== undefined) {
    headers = { 'Content-Type': 'application/json' };
    body = JSON.stringify(opciones.body);
  }
  try {
    return await fetch(`/api${ruta}`, {
      method: opciones.method ?? 'GET',
      credentials: 'same-origin',
      headers,
      body,
      signal: opciones.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', ERROR_RED);
  }
}

/** Convierte una respuesta con el contrato de error en ApiError (si la hay). */
export async function errorDe(res: Response): Promise<ApiError> {
  let cuerpo: { error?: { code: string; message: string; requestId?: string; details?: ErrorDetail[] } } | null = null;
  try {
    cuerpo = await res.json();
  } catch {
    // Sin JSON.
  }
  const e = cuerpo?.error;
  return e
    ? new ApiError(res.status, e.code, e.message, e.requestId, e.details ?? [])
    : new ApiError(res.status, 'HTTP_ERROR', `El servidor respondió con un error (${res.status}).`);
}

export async function apiRaw<T>(ruta: string, opciones: OpcionesApi = {}): Promise<Pagina<T>> {
  const res = await pedir(ruta, opciones);

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

export async function api<T>(ruta: string, opciones: OpcionesApi = {}): Promise<T> {
  return (await apiRaw<T>(ruta, opciones)).data;
}
