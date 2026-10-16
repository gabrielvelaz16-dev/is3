/**
 * Dashboard, reportes y notificaciones — Sprint 6 (S6-01, S6-02, S6-03, S5-06).
 * GET  /api/estadisticas/dashboard         → indicadores del alcance del usuario   (expedientes.consultar)
 * GET  /api/reportes/expedientes           → reporte con filtros, resumen y listado (reportes.consultar)
 * GET  /api/reportes/expedientes/exportar  → mismo reporte en CSV                   (reportes.consultar)
 * GET  /api/notificaciones                 → avisos del usuario y cantidad sin leer (sesión)
 * POST /api/notificaciones/:id/leida       → marcar un aviso como leído            (sesión, solo los propios)
 * POST /api/notificaciones/leidas          → marcar todos como leídos              (sesión)
 */
import { Router } from 'express';
import type { EstadisticasService } from '../../modules/estadisticas/estadisticas.service.js';
import type { NotificacionesService } from '../../modules/notificaciones/notificaciones.service.js';
import type { ReportesService } from '../../modules/reportes/reportes.service.js';
import { sendData } from '../../shared/http.js';
import { contexto, requierePermiso, requiereSesion, usuarioActual } from '../middlewares/auth.js';
import { idSchema } from '../schemas/anexos.schemas.js';
import { consultarReporteSchema, filtrosReporteSchema, listarNotificacionesSchema } from '../schemas/reportes.schemas.js';

export function reportesRouter(deps: {
  estadisticas: EstadisticasService;
  reportes: ReportesService;
  notificaciones: NotificacionesService;
}): Router {
  const router = Router();

  router.get('/estadisticas/dashboard', requierePermiso('expedientes.consultar'), async (_req, res) => {
    sendData(res, await deps.estadisticas.dashboard(usuarioActual(res)!));
  });

  router.get('/reportes/expedientes', requierePermiso('reportes.consultar'), async (req, res) => {
    const { pagina, porPagina, ...filtros } = consultarReporteSchema.parse(req.query);
    sendData(res, await deps.reportes.consultar(usuarioActual(res)!, filtros, pagina, porPagina));
  });

  router.get('/reportes/expedientes/exportar', requierePermiso('reportes.consultar'), async (req, res) => {
    const filtros = filtrosReporteSchema.parse(req.query);
    const csv = await deps.reportes.exportarCsv(usuarioActual(res)!, filtros, contexto(req, res));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${csv.nombreArchivo}"`);
    res.setHeader('X-Filas', String(csv.filas));
    res.status(200).send(csv.contenido);
  });

  router.get('/notificaciones', requiereSesion, async (req, res) => {
    const { soloNoLeidas } = listarNotificacionesSchema.parse(req.query);
    sendData(res, await deps.notificaciones.listar(usuarioActual(res)!.id, soloNoLeidas));
  });

  router.post('/notificaciones/leidas', requiereSesion, async (_req, res) => {
    sendData(res, await deps.notificaciones.marcarTodasLeidas(usuarioActual(res)!.id));
  });

  router.post('/notificaciones/:id/leida', requiereSesion, async (req, res) => {
    const { id } = idSchema.parse(req.params);
    await deps.notificaciones.marcarLeida(id, usuarioActual(res)!.id);
    sendData(res, { id, leida: true });
  });

  return router;
}
