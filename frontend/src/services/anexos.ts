/**
 * Documentos, actuaciones e historial de un expediente — Sprint 4.
 */
import { api, errorDe, pedir } from './api';
import type { EstadoExpediente, Referencia } from './tipos';

export interface DocumentoExpediente {
  id: number;
  expedienteId: number;
  nombreOriginal: string;
  tipoMime: string;
  tamanoBytes: number;
  hashSha256: string;
  descripcion: string | null;
  subidoEn: string;
  subidoPor: Referencia;
}

export type TipoActuacion = 'ACTUACION' | 'OBSERVACION';

export interface Actuacion {
  id: number;
  expedienteId: number;
  tipo: TipoActuacion;
  texto: string;
  fecha: string;
  autor: Referencia;
}

export type TipoEvento =
  | 'CREACION'
  | 'CAMBIO_ESTADO'
  | 'DOCUMENTO'
  | 'ACTUACION'
  | 'OBSERVACION'
  | 'PASE_ENVIADO'
  | 'PASE_RECIBIDO'
  | 'ASIGNACION'
  | 'TAREA';

export interface EventoHistorial {
  tipo: TipoEvento;
  fecha: string;
  usuario: Referencia;
  descripcion: string;
  referenciaId?: number;
  estadoAnterior?: EstadoExpediente | null;
  estadoNuevo?: EstadoExpediente;
}

/** Mismos tipos que valida el servidor (el servidor es quien decide; esto solo orienta al usuario). */
export const EXTENSIONES_PERMITIDAS = '.pdf,.docx,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.webp';
export const MAX_MB = 10;

export function tamanoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const anexosApi = {
  documentos: (expedienteId: number) => api<DocumentoExpediente[]>(`/expedientes/${expedienteId}/documentos`),

  subir: (expedienteId: number, archivo: File, descripcion?: string) =>
    api<DocumentoExpediente>(`/expedientes/${expedienteId}/documentos`, {
      method: 'POST',
      archivo: {
        contenido: archivo,
        tipo: archivo.type,
        encabezados: {
          'X-Nombre-Archivo': encodeURIComponent(archivo.name),
          ...(descripcion?.trim() ? { 'X-Descripcion': encodeURIComponent(descripcion.trim()) } : {}),
        },
      },
    }),

  /** Descarga el archivo y lo guarda con su nombre original. */
  descargar: async (expedienteId: number, documento: DocumentoExpediente) => {
    const res = await pedir(`/expedientes/${expedienteId}/documentos/${documento.id}/descarga`);
    if (!res.ok) throw await errorDe(res);
    const url = URL.createObjectURL(await res.blob());
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = documento.nombreOriginal;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  },

  actuaciones: (expedienteId: number) => api<Actuacion[]>(`/expedientes/${expedienteId}/actuaciones`),

  registrarActuacion: (expedienteId: number, datos: { tipo: TipoActuacion; texto: string }) =>
    api<Actuacion>(`/expedientes/${expedienteId}/actuaciones`, { method: 'POST', body: datos }),

  historial: (expedienteId: number) => api<EventoHistorial[]>(`/expedientes/${expedienteId}/historial`),
};
