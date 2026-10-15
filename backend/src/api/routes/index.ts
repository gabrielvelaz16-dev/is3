import { Router } from 'express';
import type { DbCheck } from '../../database/db-check.js';
import type { Repos } from '../../database/repositories.js';
import type { AlmacenamientoDocumentos } from '../../integrations/almacenamiento/almacenamiento.js';
import type { IdentityProvider } from '../../integrations/identity/identity-provider.js';
import { ActuacionesService } from '../../modules/actuaciones/actuaciones.service.js';
import { AuditoriaService } from '../../modules/auditoria/auditoria.service.js';
import { AuthService } from '../../modules/auth/auth.service.js';
import { DocumentosService } from '../../modules/documentos/documentos.service.js';
import { ExpedientesService } from '../../modules/expedientes/expedientes.service.js';
import { HistorialService } from '../../modules/historial/historial.service.js';
import { UsuariosService } from '../../modules/usuarios/usuarios.service.js';
import { healthController } from '../controllers/health.controller.js';
import { cargarSesion } from '../middlewares/auth.js';
import { authRouter } from './auth.routes.js';
import { expedientesRouter } from './expedientes.routes.js';
import { catalogosRouter, usuariosRouter } from './usuarios.routes.js';

export interface ApiDeps {
  dbCheck: DbCheck;
  version: string;
  repos: Repos;
  identity: IdentityProvider;
  /** Dónde se guardan los archivos de los documentos (S4-02). */
  almacenamiento: AlmacenamientoDocumentos;
  /** Tamaño máximo de un documento en bytes (por defecto 10 MB). */
  maxUploadBytes?: number;
  sesionHoras?: number;
  cookieSecure?: boolean;
  now?: () => Date;
}

/** Rutas bajo /api. Cada módulo nuevo agrega aquí su router. */
export function apiRouter(deps: ApiDeps): Router {
  const auditoria = new AuditoriaService(deps.repos.auditoria);
  const auth = new AuthService(deps.identity, deps.repos.usuarios, deps.repos.sesiones, auditoria, {
    sesionHoras: deps.sesionHoras ?? 8,
    now: deps.now,
  });
  const usuarios = new UsuariosService(deps.repos, auditoria);
  const expedientesService = new ExpedientesService(deps.repos, auditoria, { now: deps.now });
  const maxBytes = deps.maxUploadBytes ?? 10 * 1024 * 1024;
  const anexos = {
    documentos: new DocumentosService(deps.repos, deps.almacenamiento, auditoria, { maxBytes }),
    actuaciones: new ActuacionesService(deps.repos, auditoria),
    historial: new HistorialService(deps.repos),
    maxBytes,
  };

  const router = Router();
  router.get('/health', healthController(deps.dbCheck, deps.version));

  router.use(cargarSesion(auth));
  router.use('/auth', authRouter(auth, { secure: deps.cookieSecure ?? false }));
  router.use('/usuarios', usuariosRouter(usuarios));
  router.use('/expedientes', expedientesRouter(expedientesService, anexos));
  router.use('/', catalogosRouter(deps.repos.roles, deps.repos.dependencias));
  return router;
}
