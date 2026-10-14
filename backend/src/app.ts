import express, { type Express } from 'express';
import { errorHandler } from './api/middlewares/error-handler.js';
import { notFound } from './api/middlewares/not-found.js';
import { requestId } from './api/middlewares/request-id.js';
import { requestLogger } from './api/middlewares/request-logger.js';
import { type ApiDeps, apiRouter } from './api/routes/index.js';

/**
 * Crea la aplicación Express sin abrir puertos, para poder probarla con
 * Supertest. Las dependencias externas (base de datos) se inyectan.
 */
export function createApp(deps: ApiDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(requestLogger);
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter(deps));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
