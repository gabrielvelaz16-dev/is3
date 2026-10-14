import { type CookieOptions, Router } from 'express';
import type { AuthService } from '../../modules/auth/auth.service.js';
import { COOKIE_SESION } from '../../security/session-token.js';
import { sendData } from '../../shared/http.js';
import { contexto, requiereSesion, tokenDeSesion, usuarioActual } from '../middlewares/auth.js';
import { loginSchema } from '../schemas/usuarios.schemas.js';

export interface CookieConfig {
  secure: boolean;
}

/** /api/auth — inicio de sesión, cierre de sesión y usuario actual (RF-01). */
export function authRouter(auth: AuthService, cookie: CookieConfig): Router {
  const router = Router();
  const base: CookieOptions = { httpOnly: true, sameSite: 'strict', secure: cookie.secure, path: '/api' };

  router.post('/login', async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const { usuario, token, expiraEn } = await auth.login(email, password, {
      ...contexto(req, res),
      userAgent: req.get('user-agent'),
    });
    res.cookie(COOKIE_SESION, token, { ...base, expires: expiraEn });
    sendData(res, { usuario });
  });

  router.post('/logout', async (req, res) => {
    const token = tokenDeSesion(req);
    if (token) await auth.logout(token, contexto(req, res));
    res.clearCookie(COOKIE_SESION, base);
    sendData(res, { ok: true });
  });

  router.get('/me', requiereSesion, (_req, res) => {
    sendData(res, { usuario: usuarioActual(res) });
  });

  return router;
}
