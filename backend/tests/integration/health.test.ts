import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

const baseSana = async () => true;
const baseCaida = async () => false;

describe('GET /api/health (S1-01)', () => {
  it('responde 200 con el estado de la API y de la base cuando todo funciona', async () => {
    const res = await request(createApp({ dbCheck: baseSana, version: '0.1.0' })).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.data).toMatchObject({ status: 'ok', api: 'ok', database: 'ok', version: '0.1.0' });
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
    expect(new Date(res.body.data.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('responde 503 con estado "degraded" si la base no responde, sin romper la API', async () => {
    const res = await request(createApp({ dbCheck: baseCaida, version: '0.1.0' })).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.data).toMatchObject({ status: 'degraded', api: 'ok', database: 'down' });
  });

  it('devuelve un identificador de petición en X-Request-Id', async () => {
    const res = await request(createApp({ dbCheck: baseSana, version: '0.1.0' })).get('/api/health');

    expect(res.headers['x-request-id']).toMatch(/^[\w-]{1,64}$/);
  });

  it('reutiliza un X-Request-Id válido recibido y descarta uno inválido', async () => {
    const app = createApp({ dbCheck: baseSana, version: '0.1.0' });

    const valido = await request(app).get('/api/health').set('X-Request-Id', 'prueba-123');
    expect(valido.headers['x-request-id']).toBe('prueba-123');

    const invalido = await request(app).get('/api/health').set('X-Request-Id', '<script>');
    expect(invalido.headers['x-request-id']).not.toBe('<script>');
  });

  it('no expone la tecnología del servidor (sin X-Powered-By)', async () => {
    const res = await request(createApp({ dbCheck: baseSana, version: '0.1.0' })).get('/api/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
