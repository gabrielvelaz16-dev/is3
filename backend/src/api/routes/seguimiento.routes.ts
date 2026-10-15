/**
 * Seguimiento — Sprint 5 (S5-02, S5-05, RF-16, RF-17).
 * GET  /api/pendientes                 → tareas, recibidos y expedientes por vencer del usuario (sesión)
 * GET  /api/pases/recibidos            → bandeja de entrada de la dependencia     (expedientes.recibir)
 * POST /api/pases/:id/recepcion        → confirmar la recepción                   (expedientes.recibir)
 * PATCH /api/tareas/:id                → cambiar el estado de una tarea           (tareas.gestionar)
 * GET  /api/dependencias/:id/usuarios  → usuarios activos de una dependencia      (tareas.gestionar o responsables.asignar)
 */
import { Router } from 'express';
import type { Repos } from '../../database/repositories.js';
import type { PasesService } from '../../modules/pases/pases.service.js';
import type { PendientesService } from '../../modules/pendientes/pendientes.service.js';
import type { TareasService } from '../../modules/tareas/tareas.service.js';
import { ForbiddenError } from '../../shared/errors.js';
import { sendData } from '../../shared/http.js';
import { contexto, requierePermiso, requiereSesion, usuarioActual } from '../middlewares/auth.js';
import { cambiarEstadoTareaSchema, idSchema } from '../schemas/anexos.schemas.js';

export function seguimientoRouter(deps: {
  repos: Repos;
  pases: PasesService;
  tareas: TareasService;
  pendientes: PendientesService;
}): Router {
  const router = Router();

  router.get('/pendientes', requiereSesion, async (_req, res) => {
    const u = usuarioActual(res)!;
    sendData(res, await deps.pendientes.obtener({ id: u.id, dependenciaId: u.dependencia.id, permisos: u.permisos }));
  });

  router.get('/pases/recibidos', requierePermiso('expedientes.recibir'), async (_req, res) => {
    sendData(res, await deps.pases.bandeja(usuarioActual(res)!.dependencia.id));
  });

  router.post('/pases/:id/recepcion', requierePermiso('expedientes.recibir'), async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const u = usuarioActual(res)!;
    sendData(res, await deps.pases.recibir(id, { id: u.id, dependenciaId: u.dependencia.id }, contexto(req, res)));
  });

  router.patch('/tareas/:id', requierePermiso('tareas.gestionar'), async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const { estado } = cambiarEstadoTareaSchema.parse(req.body);
    const u = usuarioActual(res)!;
    sendData(res, await deps.tareas.cambiarEstado(id, estado, { id: u.id, permisos: u.permisos }, contexto(req, res)));
  });

  router.get('/dependencias/:id/usuarios', requiereSesion, async (req, res) => {
    const u = usuarioActual(res)!;
    if (!u.permisos.includes('tareas.gestionar') && !u.permisos.includes('responsables.asignar')) {
      throw new ForbiddenError();
    }
    const { id } = idSchema.parse(req.params);
    sendData(res, await deps.repos.usuarios.listActivosDeDependencia(id));
  });

  return router;
}
