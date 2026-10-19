/**
 * Textos legibles de los valores internos (S8-03).
 * El historial, los mensajes de error y los reportes muestran "En trámite", no "EN_TRAMITE".
 */
import type { EstadoExpediente, EstadoTarea, Prioridad } from '../database/repositories.js';

export const ESTADO_TEXTO: Record<EstadoExpediente, string> = {
  BORRADOR: 'Borrador',
  EN_TRAMITE: 'En trámite',
  EN_REVISION: 'En revisión',
  RESUELTO: 'Resuelto',
  ARCHIVADO: 'Archivado',
};

export const PRIORIDAD_TEXTO: Record<Prioridad, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };

export const textoEstado = (estado: EstadoExpediente | null | undefined): string => (estado ? ESTADO_TEXTO[estado] : '—');

export const ESTADO_TAREA_TEXTO: Record<EstadoTarea, string> = {
  PENDIENTE: 'Pendiente',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};
