import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { crearEntorno } from '../support/memoria.js';
import { errorHandler } from '../../src/api/middlewares/error-handler.js';
import { requestId } from '../../src/api/middlewares/request-id.js';
import { ForbiddenError, NotFoundError } from '../../src/shared/errors.js';

const { app } = await crearEntorno();

/** App mínima con rutas que fallan a propósito, montando el mismo manejador de errores. */
function appConRutasQueFallan() {
  const a = express();
  a.use(requestId);
  a.get('/inesperado', () => {
    throw new Error('connect ECONNREFUSED 127.0.0.1:5432 password=secreta SELECT * FROM usuarios');
  });
  a.get('/async', async () => {
    await Promise.resolve();
    throw new Error('falla asíncrona interna');
  });
  a.get('/prohibido', () => {
    throw new ForbiddenError();
  });
  a.get('/no-existe', () => {
    throw new NotFoundError('Expediente no encontrado');
  });
  a.get('/zod', () => {
    z.object({ asunto: z.string().min(3) }).parse({ asunto: 'x' });
  });
  a.use(errorHandler);
  return a;
}

describe('Contrato de error y manejo centralizado (S1-05)', () => {
  it('una ruta inexistente responde 404 con el formato de error y el mismo requestId del encabezado', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
    expect(res.body.data).toBeUndefined();
  });

  it('un JSON mal formado responde 400 INVALID_JSON', async () => {
    const res = await request(app).post('/api/health').set('Content-Type', 'application/json').send('{"mal": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('un cuerpo mayor a 1 MB responde 413 PAYLOAD_TOO_LARGE', async () => {
    const grande = JSON.stringify({ texto: 'x'.repeat(1024 * 1024 + 10) });
    const res = await request(app).post('/api/health').set('Content-Type', 'application/json').send(grande);

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('un error inesperado responde 500 genérico sin trazas, SQL ni credenciales', async () => {
    const res = await request(appConRutasQueFallan()).get('/inesperado');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toContain(res.body.error.requestId);
    const texto = JSON.stringify(res.body);
    for (const prohibido of ['ECONNREFUSED', 'password', 'secreta', 'SELECT', 'stack', '.ts:']) {
      expect(texto).not.toContain(prohibido);
    }
  });

  it('los errores lanzados en funciones async también llegan al manejador central', async () => {
    const res = await request(appConRutasQueFallan()).get('/async');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('los errores de la aplicación conservan su código HTTP y mensaje', async () => {
    const a = appConRutasQueFallan();

    const prohibido = await request(a).get('/prohibido');
    expect(prohibido.status).toBe(403);
    expect(prohibido.body.error).toMatchObject({ code: 'FORBIDDEN', message: 'No tiene permiso para realizar esta acción' });

    const noExiste = await request(a).get('/no-existe');
    expect(noExiste.status).toBe(404);
    expect(noExiste.body.error.message).toBe('Expediente no encontrado');
  });

  it('un error de validación de Zod responde 400 con el detalle por campo', async () => {
    const res = await request(appConRutasQueFallan()).get('/zod');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('asunto');
  });
});
