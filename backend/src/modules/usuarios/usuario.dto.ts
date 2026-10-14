import type { UsuarioRecord } from '../../database/repositories.js';

/** Datos de usuario que salen de la API: nunca incluyen el hash de la contraseña. */
export interface UsuarioPublico {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
  ultimoAcceso: string | null;
  creadoEn: string;
  rol: { id: number; clave: string; nombre: string };
  dependencia: { id: number; codigo: string; nombre: string };
}

export interface UsuarioSesion extends UsuarioPublico {
  permisos: string[];
}

export function aPublico(u: UsuarioRecord): UsuarioPublico {
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    activo: u.activo,
    ultimoAcceso: u.ultimoAcceso?.toISOString() ?? null,
    creadoEn: u.creadoEn.toISOString(),
    rol: { id: u.rol.id, clave: u.rol.clave, nombre: u.rol.nombre },
    dependencia: { id: u.dependencia.id, codigo: u.dependencia.codigo, nombre: u.dependencia.nombre },
  };
}

export function aSesion(u: UsuarioRecord): UsuarioSesion {
  return { ...aPublico(u), permisos: [...u.rol.permisos] };
}
