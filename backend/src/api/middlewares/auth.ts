import type { Request, RequestHandler, Response } from 'express';
import type { AuthService } from '../../modules/auth/auth.service.js';
import type { Contexto } from '../../modules/auditoria/auditoria.service.js';
import type { UsuarioSesion } from '../../modules/usuarios/usuario.dto.js';
import type { Permiso } from '../../security/permissions.js';
import { COOKIE_SESION, leerCookie } from '../../security/session-token.js';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors.js';

/** Usuario de la sesión actual (lo carga `cargarSesion`). */
export function usuarioActual(res: Response): UsuarioSesion | undefined {
  return res.locals.usuario as UsuarioSesion | undefined;
}

export function tokenDeSesion(req: Request): string | undefined {
  return leerCookie(req.headers.cookie, COOKIE_SESION);
}

/** Datos para auditoría: quién, desde dónde y qué petición. */
export function contexto(req: Request, res: Response): Contexto {
  return { usuarioId: usuarioActual(res)?.id, ip: req.ip, requestId: res.locals.requestId as string };
}

/** Lee la cookie de sesión y, si es válida, deja el usuario en res.locals. No rechaza por sí mismo. */
export function cargarSesion(auth: AuthService): RequestHandler {
  return async (req, res, next) => {
    const token = tokenDeSesion(req);
    if (token) {
      const usuario = await auth.usuarioDeSesion(token);
      if (usuario) res.locals.usuario = usuario;
    }
    next();
  };
}

/** Exige sesión iniciada (401 si no la hay). */
export const requiereSesion: RequestHandler = (_req, res, next) => {
  if (!usuarioActual(res)) throw new UnauthorizedError();
  next();
};

/**
 * Exige un permiso del rol (RF-02, RNF-02). La verificación ocurre siempre en el
 * servidor; el frontend solo oculta opciones para comodidad del usuario.
 */
export function requierePermiso(permiso: Permiso): RequestHandler {
  return (_req, res, next) => {
    const usuario = usuarioActual(res);
    if (!usuario) throw new UnauthorizedError();
    if (!usuario.permisos.includes(permiso)) throw new ForbiddenError();
    next();
  };
}
