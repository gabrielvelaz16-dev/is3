/**
 * Rutas de expedientes — Sprint 3 (S3-01 a S3-04).
 * POST   /api/expedientes      → crear expediente
 * GET    /api/expedientes      → listar con búsqueda, filtros y paginación
 * GET    /api/expedientes/:id  → consultar expediente
 * PATCH  /api/expedientes/:id  → modificar expediente
 */
import { Router } from 'express';
import type { ExpedienteRecord } from '../../database/repositories.js';
import type { ExpedientesService } from '../../modules/expedientes/expedientes.service.js';
import type { UsuarioSesion } from '../../modules/usuarios/usuario.dto.js';
import { ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { sendData } from '../../shared/http.js';
import { contexto, requierePermiso, requiereSesion, usuarioActual } from '../middlewares/auth.js';
import {
  crearExpedienteSchema,
  idExpedienteSchema,
  listarExpedientesSchema,
  modificarExpedienteSchema,
} from '../schemas/expedientes.schemas.js';

/** Quien no tiene `expedientes.consultar_todas` solo ve los expedientes de su dependencia. */
export function puedeVerTodas(usuario: UsuarioSesion): boolean {
  return usuario.permisos.includes('expedientes.consultar_todas');
}

/**
 * Busca un expediente y verifica que el usuario pueda verlo (RF-06, RNF-02).
 * Lo reutilizan los módulos que cuelgan de un expediente (documentos, actuaciones, historial).
 */
export async function expedienteVisible(
  expedientes: ExpedientesService,
  id: number,
  usuario: UsuarioSesion,
): Promise<ExpedienteRecord> {
  const expediente = await expedientes.obtener(id);
  if (!expediente) throw new NotFoundError('Expediente no encontrado');
  if (!puedeVerTodas(usuario) && expediente.dependenciaActualId !== usuario.dependencia.id) {
    throw new ForbiddenError('No tiene permiso para ver este expediente');
  }
  return expediente;
}

export function expedientesRouter(expedientes: ExpedientesService): Router {
  const router = Router();

  // Todas las rutas requieren sesión
  router.use(requiereSesion);

  // POST /expedientes — crear (queda en la dependencia del usuario)
  router.post('/', requierePermiso('expedientes.crear'), async (req, res) => {
    const body = crearExpedienteSchema.parse(req.body);
    const usuario = usuarioActual(res)!;
    const expediente = await expedientes.crear(body, usuario.id, usuario.dependencia.id, contexto(req, res));
    sendData(res, expediente, 201);
  });

  // GET /expedientes — listar
  router.get('/', requierePermiso('expedientes.consultar'), async (req, res) => {
    const { pagina, porPagina, ...filtros } = listarExpedientesSchema.parse(req.query);
    const usuario = usuarioActual(res)!;

    const resultado = await expedientes.listar({
      ...filtros,
      dependenciaId: puedeVerTodas(usuario) ? filtros.dependenciaId : usuario.dependencia.id,
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
    sendData(res, await expedienteVisible(expedientes, id, usuarioActual(res)!));
  });

  // PATCH /expedientes/:id — modificar (solo expedientes que el usuario puede ver)
  router.patch('/:id', requierePermiso('expedientes.modificar'), async (req, res) => {
    const { id } = idExpedienteSchema.parse(req.params);
    const body = modificarExpedienteSchema.parse(req.body);
    const usuario = usuarioActual(res)!;
    await expedienteVisible(expedientes, id, usuario);
    sendData(res, await expedientes.modificar(id, body, usuario.id, contexto(req, res)));
  });

  return router;
}
