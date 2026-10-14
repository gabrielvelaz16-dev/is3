/** Tipos compartidos con la API (mismo formato que devuelve el backend). */

export interface Referencia {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
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

export interface Health {
  status: 'ok' | 'degraded';
  api: 'ok' | 'down';
  database: 'ok' | 'down';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}
