import type { UsuarioRecord, UsuariosRepo } from '../../database/repositories.js';
import { HASH_FICTICIO, verifyPassword } from '../../security/password.js';

/**
 * Adaptador de identidad (ADR-06, RF-23, contingencia del riesgo R01).
 * El resto del sistema solo conoce esta interfaz. Cuando exista el proveedor
 * institucional real, se agrega otra implementación sin tocar el login.
 */
export interface IdentityProvider {
  readonly nombre: string;
  /** Devuelve el usuario si las credenciales son correctas; null en cualquier otro caso. */
  authenticate(identificador: string, password: string): Promise<UsuarioRecord | null>;
}

/** Implementación local (simulada): valida contra la tabla de usuarios por nombre de usuario o correo. */
export class LocalIdentityProvider implements IdentityProvider {
  readonly nombre = 'local';

  constructor(private readonly usuarios: UsuariosRepo) {}

  async authenticate(identificador: string, password: string): Promise<UsuarioRecord | null> {
    const usuario = identificador.includes('@')
      ? await this.usuarios.findByEmail(identificador)
      : await this.usuarios.findByUsername(identificador);
    // Se verifica igual aunque el usuario no exista, para no revelar por el tiempo de respuesta qué correos existen.
    const ok = await verifyPassword(password, usuario?.passwordHash ?? HASH_FICTICIO);
    return usuario && ok ? usuario : null;
  }
}
