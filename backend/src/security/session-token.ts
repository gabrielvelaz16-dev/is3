import { createHash, randomBytes } from 'node:crypto';

export const COOKIE_SESION = 'is3_sid';

/** Token aleatorio de 256 bits que viaja solo en la cookie httpOnly. */
export function nuevoToken(): string {
  return randomBytes(32).toString('base64url');
}

/** En la base se guarda el hash del token: si alguien lee la tabla, no puede usar las sesiones. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Lee una cookie del encabezado Cookie sin dependencias externas. */
export function leerCookie(header: string | undefined, nombre: string): string | undefined {
  if (!header) return undefined;
  for (const parte of header.split(';')) {
    const [clave, ...resto] = parte.trim().split('=');
    if (clave === nombre) return decodeURIComponent(resto.join('='));
  }
  return undefined;
}
