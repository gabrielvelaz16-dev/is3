import { describe, expect, it } from 'vitest';
import { HASH_FICTICIO, hashPassword, validarPoliticaPassword, verifyPassword } from '../../src/security/password.js';
import { hashToken, leerCookie, nuevoToken } from '../../src/security/session-token.js';

describe('Contraseñas con hash seguro (RNF-01)', () => {
  it('el hash no contiene la contraseña y usa sal aleatoria', async () => {
    const a = await hashPassword('ClaveSegura123');
    const b = await hashPassword('ClaveSegura123');

    expect(a).toMatch(/^scrypt\$32768\$8\$1\$/);
    expect(a).not.toContain('ClaveSegura123');
    expect(a).not.toBe(b);
  });

  it('verifica la contraseña correcta y rechaza las incorrectas', async () => {
    const hash = await hashPassword('ClaveSegura123');

    expect(await verifyPassword('ClaveSegura123', hash)).toBe(true);
    expect(await verifyPassword('claveSegura123', hash)).toBe(false);
    expect(await verifyPassword('ClaveSegura123', 'texto-plano')).toBe(false);
    expect(await verifyPassword('cualquiera', HASH_FICTICIO)).toBe(false);
  });

  it('aplica la política mínima', () => {
    expect(validarPoliticaPassword('Corta1')).toMatch(/10 caracteres/);
    expect(validarPoliticaPassword('soloLetrasLargas')).toMatch(/letras y números/);
    expect(validarPoliticaPassword('1234567890123')).toMatch(/letras y números/);
    expect(validarPoliticaPassword('Valida12345')).toBeNull();
  });
});

describe('Token de sesión', () => {
  it('genera tokens únicos y guarda solo su hash SHA-256', () => {
    const t1 = nuevoToken();
    expect(t1).not.toBe(nuevoToken());
    expect(t1.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(t1)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('lee la cookie correcta del encabezado', () => {
    expect(leerCookie('a=1; is3_sid=abc%3D; b=2', 'is3_sid')).toBe('abc=');
    expect(leerCookie(undefined, 'is3_sid')).toBeUndefined();
    expect(leerCookie('otra=1', 'is3_sid')).toBeUndefined();
  });
});
