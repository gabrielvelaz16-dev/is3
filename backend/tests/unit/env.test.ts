import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

const URL_OK = 'postgresql://usuario:clave@localhost:5432/expediente?schema=public';

describe('Configuración por variables de entorno (RNF-06)', () => {
  it('aplica valores por defecto y convierte el puerto a número', () => {
    const env = loadEnv({ DATABASE_URL: URL_OK, PORT: '4000' });

    expect(env).toMatchObject({ NODE_ENV: 'development', PORT: 4000, LOG_LEVEL: 'info' });
  });

  it('falla con un mensaje claro si falta DATABASE_URL', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rechaza una URL que no es de PostgreSQL', () => {
    expect(() => loadEnv({ DATABASE_URL: 'mysql://u:c@localhost/db' })).toThrow(/PostgreSQL/);
  });

  it('rechaza un puerto fuera de rango', () => {
    expect(() => loadEnv({ DATABASE_URL: URL_OK, PORT: '70000' })).toThrow(/PORT/);
  });

  it('el mensaje de error no incluye el valor de la URL (puede tener la contraseña)', () => {
    let mensaje = '';
    try {
      loadEnv({ DATABASE_URL: 'mysql://usuario:supersecreta@localhost/db' });
    } catch (e) {
      mensaje = (e as Error).message;
    }
    expect(mensaje).toMatch(/DATABASE_URL/);
    expect(mensaje).not.toContain('supersecreta');
  });
});
