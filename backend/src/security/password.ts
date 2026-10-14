import { randomBytes, scrypt as scryptCb, type ScryptOptions, timingSafeEqual } from 'node:crypto';

/**
 * Hash de contraseñas con scrypt (RNF-01, ADR-10).
 * Formato guardado: scrypt$N$r$p$salt(base64)$hash(base64). Nunca se guarda ni
 * se registra la contraseña en claro.
 */

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const partes = stored.split('$');
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, hashB64] = partes as [string, string, string, string, string, string];
  const esperado = Buffer.from(hashB64, 'base64');
  const calculado = await scrypt(password, Buffer.from(saltB64, 'base64'), esperado.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAXMEM,
  });
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

/** Hash válido que no corresponde a ninguna contraseña: iguala el tiempo de respuesta cuando el usuario no existe. */
export const HASH_FICTICIO = 'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');

/** Política mínima: 10 caracteres, al menos una letra y un número. */
export function validarPoliticaPassword(password: string): string | null {
  if (password.length < 10) return 'La contraseña debe tener al menos 10 caracteres';
  if (password.length > 128) return 'La contraseña no puede superar 128 caracteres';
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe combinar letras y números';
  }
  return null;
}
