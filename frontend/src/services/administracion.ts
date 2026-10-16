/**
 * Auditoría y respaldos — Sprint 7 (S7-03, S7-04).
 */
import { api } from './api';

export interface EventoAuditoria {
  id: number;
  fecha: string;
  usuario: { id: number; nombre: string; username: string } | null;
  accion: string;
  resultado: 'EXITO' | 'FALLO';
  entidad: string | null;
  entidadId: string | null;
  detalle: unknown;
  ip: string | null;
  requestId: string | null;
}

export interface FiltrosAuditoria {
  desde?: string;
  hasta?: string;
  usuarioId?: number;
  accion?: string;
  resultado?: 'EXITO' | 'FALLO';
}

export interface PaginaAuditoria {
  items: EventoAuditoria[];
  total: number;
  pagina: number;
  porPagina: number;
}

export interface Respaldo {
  nombre: string;
  creadoEn: string;
  totalFilas: number;
  documentos: number;
  documentosConProblemas: number;
  bytes: number;
}

function query(valores: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(valores)) if (v !== undefined && v !== '') p.set(k, String(v));
  const q = p.toString();
  return q ? `?${q}` : '';
}

export const auditoriaApi = {
  consultar: (filtros: FiltrosAuditoria, pagina: number, porPagina: number) =>
    api<PaginaAuditoria>(`/auditoria${query({ ...filtros, pagina, porPagina })}`),
  acciones: () => api<string[]>('/auditoria/acciones'),
};

export const respaldosApi = {
  listar: () => api<Respaldo[]>('/respaldos'),
  crear: () => api<Respaldo>('/respaldos', { method: 'POST' }),
};

/** Tamaño legible (KB / MB). */
export function tamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
