/**
 * Auditoría y respaldos — Sprint 7 (S7-03, S7-04; RF-21, RF-22).
 * GET  /api/auditoria           → registro de auditoría con filtros   (auditoria.consultar)
 * GET  /api/auditoria/acciones  → acciones registradas, para filtrar  (auditoria.consultar)
 * GET  /api/respaldos           → respaldos disponibles                (respaldo.gestionar)
 * POST /api/respaldos           → generar un respaldo                  (respaldo.gestionar)
 *
 * La restauración no tiene ruta (ADR-13): se hace con `npm run respaldo:restaurar`,
 * con el backend detenido y sobre una base vacía.
 */
import { Router } from 'express';
import type { AuditoriaService } from '../../modules/auditoria/auditoria.service.js';
import type { RespaldoService } from '../../modules/respaldo/respaldo.service.js';
import { ValidationError } from '../../shared/errors.js';
import { fechaLocal } from '../../shared/fechas.js';
import { sendData } from '../../shared/http.js';
import { contexto, requierePermiso, usuarioActual } from '../middlewares/auth.js';
import { consultarAuditoriaSchema } from '../schemas/administracion.schemas.js';

export function administracionRouter(deps: { auditoria: AuditoriaService; respaldo: RespaldoService }): Router {
  const router = Router();

  router.get('/auditoria', requierePermiso('auditoria.consultar'), async (req, res) => {
    const { pagina, porPagina, desde, hasta, ...filtros } = consultarAuditoriaSchema.parse(req.query);
    const inicio = desde ? fechaLocal(desde) : undefined;
    const fin = hasta ? fechaLocal(hasta, true) : undefined;
    if (inicio && fin && inicio.getTime() > fin.getTime()) {
      throw new ValidationError([{ field: 'hasta', message: 'La fecha "hasta" no puede ser anterior a "desde"' }]);
    }
    const { items, total } = await deps.auditoria.consultar({
      ...filtros,
      desde: inicio,
      hasta: fin,
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    });
    sendData(res, { items, total, pagina, porPagina });
  });

  router.get('/auditoria/acciones', requierePermiso('auditoria.consultar'), async (_req, res) => {
    sendData(res, await deps.auditoria.acciones());
  });

  router.get('/respaldos', requierePermiso('respaldo.gestionar'), async (_req, res) => {
    sendData(res, await deps.respaldo.listar());
  });

  router.post('/respaldos', requierePermiso('respaldo.gestionar'), async (req, res) => {
    const usuario = usuarioActual(res)!;
    const { ruta: _ruta, ...respaldo } = await deps.respaldo.crear();
    await deps.auditoria.registrar({ ...contexto(req, res), usuarioId: usuario.id }, {
      accion: 'respaldo.crear',
      resultado: 'EXITO',
      entidad: 'Respaldo',
      entidadId: respaldo.nombre,
      detalle: { filas: respaldo.totalFilas, documentos: respaldo.documentos, documentosConProblemas: respaldo.documentosConProblemas },
    });
    sendData(res, respaldo, 201);
  });

  return router;
}
