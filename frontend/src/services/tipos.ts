/** Tipos compartidos con la API (mismo formato que devuelve el backend). */

export interface Referencia {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  activo: boolean;
  ultimoAcceso: string | null;
  creadoEn: string;
  rol: Referencia & { clave: string };
  dependencia: Referencia & { codigo: string };
}

export interface UsuarioSesion extends Usuario {
  permisos: string[];
}

export interface Rol {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string;
  permisos: string[];
}

export interface Dependencia {
  id: number;
  codigo: string;
  nombre: string;
  activa: boolean;
}

export interface Expediente {
  id: number;
  numero: string;
  caratula: string;
  asunto: string;
  tipo: string;
  iniciador: string;
  estado: EstadoExpediente;
  prioridad: Prioridad;
  descripcion: string | null;
  fechaVencimiento: string | null;
  dependenciaActualId: number;
  creadoPorId: number;
  responsableId: number | null;
  creadoEn: string;
  actualizadoEn: string;
  dependenciaActual: Referencia & { codigo: string };
  creadoPor: { id: number; nombre: string; username: string };
  responsable: { id: number; nombre: string; username: string } | null;
  /** Pase sin recibir (Sprint 5): mientras exista, el expediente está en tránsito. */
  paseEnTransito: { id: number; destino: Referencia & { codigo: string }; enviadoEn: string } | null;
}

export type EstadoExpediente = 'BORRADOR' | 'EN_TRAMITE' | 'EN_REVISION' | 'RESUELTO' | 'ARCHIVADO';
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';

export const ESTADOS_EXPEDIENTE: { valor: EstadoExpediente; etiqueta: string }[] = [
  { valor: 'BORRADOR', etiqueta: 'Borrador' },
  { valor: 'EN_TRAMITE', etiqueta: 'En trámite' },
  { valor: 'EN_REVISION', etiqueta: 'En revisión' },
  { valor: 'RESUELTO', etiqueta: 'Resuelto' },
  { valor: 'ARCHIVADO', etiqueta: 'Archivado' },
];

export const PRIORIDADES: { valor: Prioridad; etiqueta: string }[] = [
  { valor: 'BAJA', etiqueta: 'Baja' },
  { valor: 'MEDIA', etiqueta: 'Media' },
  { valor: 'ALTA', etiqueta: 'Alta' },
];

export const TIPOS_EXPEDIENTE = [
  'NOTA', 'RESOLUCION', 'DICTAMEN', 'INFORME', 'SOLICITUD', 'DENUNCIA', 'RECLAMO', 'OTRO',
] as const;

export const ETIQUETA_TIPO: Record<string, string> = {
  NOTA: 'Nota',
  RESOLUCION: 'Resolución',
  DICTAMEN: 'Dictamen',
  INFORME: 'Informe',
  SOLICITUD: 'Solicitud',
  DENUNCIA: 'Denuncia',
  RECLAMO: 'Reclamo',
  OTRO: 'Otro',
};

export interface Health {
  status: 'ok' | 'degraded';
  api: 'ok' | 'down';
  database: 'ok' | 'down';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}
