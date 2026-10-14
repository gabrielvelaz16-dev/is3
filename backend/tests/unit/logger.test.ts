import { describe, expect, it } from 'vitest';
import { redact } from '../../src/shared/logger.js';

describe('Logger sin datos sensibles (RNF-05)', () => {
  it('oculta contraseñas, tokens, cookies y la URL de la base, también en objetos anidados', () => {
    const limpio = redact({
      usuario: 'admin',
      password: '1234',
      contrasena: 'abcd',
      headers: { authorization: 'Bearer x', cookie: 'sid=1', accept: 'json' },
      DATABASE_URL: 'postgresql://u:c@h/db',
      lista: [{ token: 't' }],
    });

    expect(limpio).toEqual({
      usuario: 'admin',
      password: '[OCULTO]',
      contrasena: '[OCULTO]',
      headers: { authorization: '[OCULTO]', cookie: '[OCULTO]', accept: 'json' },
      DATABASE_URL: '[OCULTO]',
      lista: [{ token: '[OCULTO]' }],
    });
  });

  it('deja intactos los valores simples', () => {
    expect(redact('texto')).toBe('texto');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
  });
});
