import type { SesionesRepo, UsuariosRepo } from '../../database/repositories.js';
import type { IdentityProvider } from '../../integrations/identity/identity-provider.js';
import { hashToken, nuevoToken } from '../../security/session-token.js';
import { AppError, UnauthorizedError } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';
import type { AuditoriaService, Contexto } from '../auditoria/auditoria.service.js';
import { aSesion, type UsuarioSesion } from '../usuarios/usuario.dto.js';

const MENSAJE_CREDENCIALES = 'Usuario o contraseña incorrectos';
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;

export interface AuthOptions {
  sesionHoras: number;
  now?: () => Date;
}

/**
 * Inicio y cierre de sesión (RF-01, S2-02) con sesiones en el servidor (ADR-05).
 * Limita los intentos fallidos por correo para frenar ataques de fuerza bruta.
 */
export class AuthService {
  private readonly intentos = new Map<string, { fallos: number; hasta: number }>();
  private readonly now: () => Date;

  constructor(
    private readonly identity: IdentityProvider,
    private readonly usuarios: UsuariosRepo,
    private readonly sesiones: SesionesRepo,
    private readonly auditoria: AuditoriaService,
    private readonly opciones: AuthOptions,
  ) {
    this.now = opciones.now ?? (() => new Date());
  }

  /** `identificador` es el nombre de usuario (o el correo). */
  async login(
    identificadorIngresado: string,
    password: string,
    ctx: Contexto & { userAgent?: string },
  ): Promise<{ usuario: UsuarioSesion; token: string; expiraEn: Date }> {
    const identificador = identificadorIngresado.trim().toLowerCase();
    this.verificarBloqueo(identificador);

    const usuario = await this.identity.authenticate(identificador, password);
    if (!usuario || !usuario.activo) {
      this.registrarFallo(identificador);
      // El motivo real va a la auditoría y al log del servidor; al usuario siempre el mismo mensaje.
      const motivo = usuario ? 'usuario inactivo' : (await this.existe(identificador)) ? 'contraseña incorrecta' : 'usuario inexistente';
      logger.warn('login fallido', { usuario: identificador, motivo, requestId: ctx.requestId });
      await this.auditoria.registrar(ctx, {
        usuarioId: usuario?.id ?? null,
        accion: 'LOGIN',
        resultado: 'FALLO',
        detalle: { usuario: identificador, motivo, proveedor: this.identity.nombre },
      });
      throw new UnauthorizedError(MENSAJE_CREDENCIALES);
    }

    this.intentos.delete(identificador);
    const token = nuevoToken();
    const expiraEn = new Date(this.now().getTime() + this.opciones.sesionHoras * 3600_000);
    await this.sesiones.create({ id: hashToken(token), usuarioId: usuario.id, expiraEn, ip: ctx.ip, userAgent: ctx.userAgent });
    const actualizado = await this.usuarios.update(usuario.id, { ultimoAcceso: this.now() });
    await this.auditoria.registrar({ ...ctx, usuarioId: usuario.id }, {
      accion: 'LOGIN',
      resultado: 'EXITO',
      detalle: { proveedor: this.identity.nombre },
    });
    return { usuario: aSesion(actualizado), token, expiraEn };
  }

  /** Devuelve el usuario de una sesión válida, o null si no existe, venció o el usuario fue desactivado. */
  async usuarioDeSesion(token: string): Promise<UsuarioSesion | null> {
    const id = hashToken(token);
    const sesion = await this.sesiones.findById(id);
    if (!sesion) return null;
    if (sesion.expiraEn.getTime() <= this.now().getTime()) {
      await this.sesiones.delete(id);
      return null;
    }
    const usuario = await this.usuarios.findById(sesion.usuarioId);
    if (!usuario || !usuario.activo) {
      await this.sesiones.delete(id);
      return null;
    }
    return aSesion(usuario);
  }

  async logout(token: string, ctx: Contexto): Promise<void> {
    await this.sesiones.delete(hashToken(token));
    if (ctx.usuarioId) {
      await this.auditoria.registrar(ctx, { accion: 'LOGOUT', resultado: 'EXITO' });
    }
  }

  private async existe(identificador: string): Promise<boolean> {
    const u = identificador.includes('@') ? await this.usuarios.findByEmail(identificador) : await this.usuarios.findByUsername(identificador);
    return u !== null;
  }

  private verificarBloqueo(email: string): void {
    const registro = this.intentos.get(email);
    if (registro && registro.fallos >= MAX_INTENTOS && registro.hasta > this.now().getTime()) {
      throw new AppError(429, 'TOO_MANY_REQUESTS', 'Demasiados intentos fallidos. Espere 15 minutos e intente de nuevo');
    }
  }

  private registrarFallo(email: string): void {
    const ahora = this.now().getTime();
    const previo = this.intentos.get(email);
    const fallos = previo && previo.hasta > ahora ? previo.fallos + 1 : 1;
    this.intentos.set(email, { fallos, hasta: ahora + BLOQUEO_MS });
  }
}
