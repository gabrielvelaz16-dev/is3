import { Router } from 'express';
import type { DbCheck } from '../../database/db-check.js';
import { healthController } from '../controllers/health.controller.js';

export interface ApiDeps {
  dbCheck: DbCheck;
  version: string;
}

/** Rutas bajo /api. Cada módulo nuevo agrega aquí su router. */
export function apiRouter(deps: ApiDeps): Router {
  const router = Router();
  router.get('/health', healthController(deps.dbCheck, deps.version));
  return router;
}
