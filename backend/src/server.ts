import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createDbCheck } from './database/db-check.js';
import { logger } from './shared/logger.js';

const env = loadEnv();
const db = createDbCheck(env.DATABASE_URL);
const version = process.env.npm_package_version ?? '0.1.0';

const app = createApp({ dbCheck: db.check, version });

const server = app.listen(env.PORT, () => {
  logger.info('servidor iniciado', { port: env.PORT, env: env.NODE_ENV, version });
});

server.on('error', (err) => {
  logger.error('no se pudo iniciar el servidor', { error: err.message, port: env.PORT });
  process.exit(1);
});

/** Cierre ordenado: deja de aceptar conexiones y libera la base. */
function shutdown(signal: string): void {
  logger.info('cerrando servidor', { signal });
  server.close(() => {
    void db.close().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
