import { Router } from 'express';
import type { DependenciasRepo, RolesRepo } from '../../database/repositories.js';
import type { UsuariosService } from '../../modules/usuarios/usuarios.service.js';
import { sendData } from '../../shared/http.js';
import { contexto, requierePermiso, requiereSesion } from '../middlewares/auth.js';
import { crearUsuarioSchema, idParamSchema, listarUsuariosSchema, modificarUsuarioSchema } from '../schemas/usuarios.schemas.js';

/** /api/usuarios — gestión de usuarios (RF-03). Solo con permiso usuarios.gestionar. */
export function usuariosRouter(service: UsuariosService): Router {
  const router = Router();
  router.use(requierePermiso('usuarios.gestionar'));

  router.get('/', async (req, res) => {
    const params = listarUsuariosSchema.parse(req.query);
    const { items, total } = await service.listar(params);
    res.json({ data: items, meta: { page: params.page, pageSize: params.pageSize, total } });
  });

  router.get('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    sendData(res, await service.obtener(id));
  });

  router.post('/', async (req, res) => {
    const input = crearUsuarioSchema.parse(req.body);
    sendData(res, await service.crear(input, contexto(req, res)), 201);
  });

  router.patch('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const input = modificarUsuarioSchema.parse(req.body);
    sendData(res, await service.modificar(id, input, contexto(req, res)));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await service.eliminar(id, contexto(req, res));
    res.status(204).end();
  });

  return router;
}

/** Catálogos para los formularios: roles (con sus permisos) y dependencias. */
export function catalogosRouter(roles: RolesRepo, dependencias: DependenciasRepo): Router {
  const router = Router();
  router.get('/roles', requierePermiso('usuarios.gestionar'), async (_req, res) => {
    sendData(res, await roles.list());
  });
  router.get('/dependencias', requiereSesion, async (_req, res) => {
    sendData(res, (await dependencias.list()).filter((d) => d.activa));
  });
  return router;
}
