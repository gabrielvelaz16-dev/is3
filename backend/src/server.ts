import { createApp } from './app.js';
import { resolve } from 'node:path';
import { loadEnv, RAIZ_REPOSITORIO } from './config/env.js';
import { createDbCheck } from './database/db-check.js';
import { createPrismaClient } from './database/prisma/client.js';
import { createPrismaRepos } from './database/prisma/repos.js';
import { AlmacenamientoLocal } from './integrations/almacenamiento/almacenamiento.js';
import { LocalIdentityProvider } from './integrations/identity/identity-provider.js';
import { logger } from './shared/logger.js';

const env = loadEnv();
const db = createDbCheck(env.DATABASE_URL);
const prisma = createPrismaClient(env.DATABASE_URL);
const repos = createPrismaRepos(prisma);
const version = process.env.npm_package_version ?? '1.0.0';

const app = createApp({
  dbCheck: db.check,
  version,
  repos,
  identity: new LocalIdentityProvider(repos.usuarios),
  sesionHoras: env.SESSION_HOURS,
  cookieSecure: env.COOKIE_SECURE,
  almacenamiento: new AlmacenamientoLocal(resolve(RAIZ_REPOSITORIO, env.STORAGE_PATH)),
  maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
  carpetaRespaldos: resolve(RAIZ_REPOSITORIO, env.BACKUP_PATH),
});

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
    void Promise.allSettled([db.close(), prisma.$disconnect()]).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
