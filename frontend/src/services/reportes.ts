/**
 * Dashboard, reportes y notificaciones — Sprint 6 (S6-01, S6-02, S6-03, S5-06).
 */
import { api, errorDe, pedir } from './api';
import type { EstadoExpediente, Expediente, Prioridad } from './tipos';

export interface DependenciaRef {
  id: number;
  codigo: string;
  nombre: string;
}

export interface ResumenExpedientes {
  total: number;
  porEstado: Record<EstadoExpediente, number>;
  porPrioridad: Record<Prioridad, number>;
  porTipo: { tipo: string; total: number }[];
  porDependencia: { dependencia: DependenciaRef; total: number }[];
}

export interface Dashboard {
  alcance: { tipo: 'INSTITUCION' } | { tipo: 'DEPENDENCIA'; dependencia: DependenciaRef };
  generadoEn: string;
  diasAviso: number;
  resumen: ResumenExpedientes;
  seguimiento: {
    vencidos: number;
    porVencer: number;
    enTransito: number;
    porRecibir: number;
    tareasAbiertas: number;
    tareasVencidas: number;
  };
}

export interface FiltrosReporte {
  desde?: string;
  hasta?: string;
  estado?: EstadoExpediente;
  prioridad?: Prioridad;
  tipo?: string;
  dependenciaId?: number;
}

export interface Reporte {
  resumen: ResumenExpedientes;
  items: Expediente[];
  total: number;
  pagina: number;
  porPagina: number;
}

export type TipoNotificacion = 'EXPEDIENTE_ASIGNADO' | 'TAREA_ASIGNADA' | 'PASE_ENTRANTE';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
  expediente: { id: number; numero: string; caratula: string } | null;
  creadaEn: string;
  leidaEn: string | null;
}

/** Query string sin los filtros vacíos. */
export function consulta(filtros: FiltrosReporte & { pagina?: number; porPagina?: number }): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== '') params.set(clave, String(valor));
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

/** Validación del formulario de reportes (el servidor la repite). */
export function validarRango(desde?: string, hasta?: string): string | null {
  if (desde && hasta && hasta < desde) return 'La fecha "hasta" no puede ser anterior a "desde"';
  return null;
}

export const reportesApi = {
  dashboard: () => api<Dashboard>('/estadisticas/dashboard'),

  consultar: (filtros: FiltrosReporte, pagina: number, porPagina: number) =>
    api<Reporte>(`/reportes/expedientes${consulta({ ...filtros, pagina, porPagina })}`),

  /** Descarga el CSV con los mismos filtros (S6-03). */
  async exportar(filtros: FiltrosReporte): Promise<{ archivo: Blob; nombre: string }> {
    const res = await pedir(`/reportes/expedientes/exportar${consulta(filtros)}`);
    if (!res.ok) throw await errorDe(res);
    const disposicion = res.headers.get('Content-Disposition') ?? '';
    const nombre = /filename="([^"]+)"/.exec(disposicion)?.[1] ?? 'reporte-expedientes.csv';
    return { archivo: await res.blob(), nombre };
  },
};

export const notificacionesApi = {
  listar: () => api<{ items: Notificacion[]; noLeidas: number }>('/notificaciones'),
  marcarLeida: (id: number) => api<{ id: number; leida: boolean }>(`/notificaciones/${id}/leida`, { method: 'POST' }),
  marcarTodas: () => api<{ marcadas: number }>('/notificaciones/leidas', { method: 'POST' }),
};
