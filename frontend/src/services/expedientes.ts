import { api, apiRaw } from './api';
import type { Expediente, EstadoExpediente, Prioridad } from './tipos';

export interface CrearExpediente {
  caratula: string;
  asunto: string;
  tipo: string;
  iniciador: string;
  prioridad?: Prioridad;
  descripcion?: string | null;
  fechaVencimiento?: string | null;
  responsableId?: number | null;
}

export type ModificarExpediente = Partial<CrearExpediente & { estado: EstadoExpediente }>;

export interface FiltrosExpediente {
  q?: string;
  estado?: EstadoExpediente;
  prioridad?: Prioridad;
  dependenciaId?: number;
  pagina: number;
  porPagina: number;
}

interface PaginacionResp {
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export const expedientesApi = {
  listar: async (filtros: FiltrosExpediente) => {
    const query = new URLSearchParams({
      pagina: String(filtros.pagina),
      porPagina: String(filtros.porPagina),
    });
    if (filtros.q) query.set('q', filtros.q);
    if (filtros.estado) query.set('estado', filtros.estado);
    if (filtros.prioridad) query.set('prioridad', filtros.prioridad);
    if (filtros.dependenciaId) query.set('dependenciaId', String(filtros.dependenciaId));

    const res = await apiRaw<Expediente[]>(`/expedientes?${query.toString()}`);
    const paginacion = (res as unknown as { paginacion: PaginacionResp }).paginacion;
    return { items: res.data, paginacion };
  },

  obtener: (id: number) => api<Expediente>(`/expedientes/${id}`),

  crear: (datos: CrearExpediente) =>
    api<Expediente>('/expedientes', { method: 'POST', body: datos }),

  modificar: (id: number, datos: ModificarExpediente) =>
    api<Expediente>(`/expedientes/${id}`, { method: 'PATCH', body: datos }),
};
