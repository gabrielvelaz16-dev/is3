/**
 * Seguimiento del expediente — Sprint 5: estado, responsable, pases, tareas y pendientes.
 */
import { api } from './api';
import type { EstadoExpediente, Expediente, Referencia } from './tipos';

export type EstadoTarea = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';
export type Alerta = 'VENCIDA' | 'POR_VENCER' | null;

export interface ExpedienteRef {
  id: number;
  numero: string;
  caratula: string;
}

export interface Tarea {
  id: number;
  expedienteId: number;
  titulo: string;
  descripcion: string | null;
  vencimiento: string;
  estado: EstadoTarea;
  creadaEn: string;
  cerradaEn: string | null;
  asignadoA: Referencia;
  creadoPor: Referencia;
  expediente: ExpedienteRef;
}

export interface Pase {
  id: number;
  expedienteId: number;
  origen: Referencia & { codigo: string };
  destino: Referencia & { codigo: string };
  motivo: string;
  enviadoEn: string;
  enviadoPor: Referencia;
  recibidoEn: string | null;
  recibidoPor: Referencia | null;
  expediente: ExpedienteRef;
}

export interface Pendientes {
  tareas: (Tarea & { alerta: Alerta })[];
  recibidos: Pase[];
  expedientesPorVencer: (Expediente & { alerta: Alerta })[];
}

export const ETIQUETA_TAREA: Record<EstadoTarea, string> = {
  PENDIENTE: 'Pendiente',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

/** Una fecha del calendario (AAAA-MM-DD) como fin de ese día en la hora local, en ISO. */
export function finDelDia(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(a!, m! - 1, d!, 23, 59, 0).toISOString();
}

export const seguimientoApi = {
  cambiarEstado: (expedienteId: number, estado: EstadoExpediente, motivo?: string) =>
    api<Expediente>(`/expedientes/${expedienteId}/estado`, {
      method: 'POST',
      body: { estado, ...(motivo?.trim() ? { motivo: motivo.trim() } : {}) },
    }),

  asignarResponsable: (expedienteId: number, responsableId: number | null) =>
    api<Expediente>(`/expedientes/${expedienteId}/responsable`, { method: 'POST', body: { responsableId } }),

  enviar: (expedienteId: number, destinoId: number, motivo: string) =>
    api<Pase>(`/expedientes/${expedienteId}/pases`, { method: 'POST', body: { destinoId, motivo } }),

  tareas: (expedienteId: number) => api<Tarea[]>(`/expedientes/${expedienteId}/tareas`),

  crearTarea: (expedienteId: number, datos: { titulo: string; asignadoAId: number; vencimiento: string; descripcion?: string }) =>
    api<Tarea>(`/expedientes/${expedienteId}/tareas`, { method: 'POST', body: datos }),

  cambiarEstadoTarea: (tareaId: number, estado: EstadoTarea) =>
    api<Tarea>(`/tareas/${tareaId}`, { method: 'PATCH', body: { estado } }),

  usuariosDeDependencia: (dependenciaId: number) =>
    api<{ id: number; nombre: string; username: string }[]>(`/dependencias/${dependenciaId}/usuarios`),

  pendientes: () => api<Pendientes>('/pendientes'),

  recibir: (paseId: number) => api<Pase>(`/pases/${paseId}/recepcion`, { method: 'POST' }),
};
