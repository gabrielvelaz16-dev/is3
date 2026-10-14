/**
 * Rutas de expedientes — Sprint 3 (S3-01 a S3-04).
 * POST   /api/expedientes      → crear expediente
 * GET    /api/expedientes      → listar con búsqueda, filtros y paginación
 * GET    /api/expedientes/:id  → consultar expediente
 * PATCH  /api/expedientes/:id  → modificar expediente
 */
import { Router } from 'express';
import type { ExpedientesService } from '../../modules/expedientes/expedientes.service.js';
import { contexto, requierePermiso, requiereSesion, usuarioActual } from '../middlewares/auth.js';
import {
  crearExpedienteSchema,
  idExpedienteSchema,
  listarExpedientesSchema,
  modificarExpedienteSchema,
} from '../schemas/expedientes.schemas.js';

export function expedientesRouter(expedientes: ExpedientesService): Router {
  const router = Router();

  // Todas las rutas requieren sesión
  router.use(requiereSesion);

  // POST /expedientes — crear
  router.post('/', requierePermiso('expedientes.crear'), async (req, res) => {
    const body = crearExpedienteSchema.parse(req.body);
    const usuario = usuarioActual(res)!;
    const { ip, requestId } = contexto(req, res);
    const expediente = await expedientes.crear(body, usuario.id, usuario.dependenciaId, { ip, requestId });
    res.status(201).json({ data: expediente });
  });

  // GET /expedientes — listar
  router.get('/', requierePermiso('expedientes.consultar'), async (req, res) => {
    const { pagina, porPagina, ...filtros } = listarExpedientesSchema.parse(req.query);
    const usuario = usuarioActual(res)!;

    // Si no tiene permiso de consultar todas, solo ve los de su dependencia
    const dependenciaId = usuario.permisos.includes('expedientes.consultar_todas')
      ? filtros.dependenciaId
      : (filtros.dependenciaId ?? usuario.dependenciaId);

    const resultado = await expedientes.listar({
      ...filtros,
      dependenciaId: usuario.permisos.includes('expedientes.consultar_todas') ? dependenciaId : usuario.dependenciaId,
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    });

    res.json({
      data: resultado.items,
      paginacion: {
        total: resultado.total,
        pagina,
        porPagina,
        totalPaginas: Math.ceil(resultado.total / porPagina),
      },
    });
  });

  // GET /expedientes/:id — consultar
  router.get('/:id', requierePermiso('expedientes.consultar'), async (req, res) => {
    const { id } = idExpedienteSchema.parse(req.params);
    const expediente = await expedientes.obtener(id);
    if (!expediente) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Expediente no encontrado', requestId: res.locals.requestId } });
      return;
    }

    // Verificar que el usuario pueda ver este expediente (misma dependencia o consultar_todas)
    const usuario = usuarioActual(res)!;
    if (!usuario.permisos.includes('expedientes.consultar_todas') && expediente.dependenciaActualId !== usuario.dependenciaId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No tiene permiso para ver este expediente', requestId: res.locals.requestId } });
      return;
    }

    res.json({ data: expediente });
  });

  // PATCH /expedientes/:id — modificar
  router.patch('/:id', requierePermiso('expedientes.modificar'), async (req, res) => {
    const { id } = idExpedienteSchema.parse(req.params);
    const body = modificarExpedienteSchema.parse(req.body);
    const usuario = usuarioActual(res)!;
    const { ip, requestId } = contexto(req, res);
    const actualizado = await expedientes.modificar(id, body, usuario.id, { ip, requestId });
    res.json({ data: actualizado });
  });

  return router;
}
