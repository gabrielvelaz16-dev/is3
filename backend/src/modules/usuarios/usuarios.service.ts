import type { DependenciasRepo, Repos, RolesRepo, SesionesRepo, UsuariosRepo } from '../../database/repositories.js';
import { hashPassword, validarPoliticaPassword } from '../../security/password.js';
import { ROL_ADMINISTRADOR } from '../../security/permissions.js';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors.js';
import type { AuditoriaService, Contexto } from '../auditoria/auditoria.service.js';
import { aPublico, type UsuarioPublico } from './usuario.dto.js';

export interface CrearUsuarioInput {
  username: string;
  email: string;
  nombre: string;
  password: string;
  rolId: number;
  dependenciaId: number;
}

export interface ModificarUsuarioInput {
  nombre?: string;
  rolId?: number;
  dependenciaId?: number;
  activo?: boolean;
  password?: string;
}

/**
 * Gestión de usuarios por el administrador (RF-03, S2-05).
 * Reglas: correo único, rol y dependencia existentes, política de contraseña,
 * y siempre debe quedar al menos un administrador activo.
 */
export class UsuariosService {
  private readonly usuarios: UsuariosRepo;
  private readonly roles: RolesRepo;
  private readonly dependencias: DependenciasRepo;
  private readonly sesiones: SesionesRepo;

  constructor(repos: Repos, private readonly auditoria: AuditoriaService) {
    this.usuarios = repos.usuarios;
    this.roles = repos.roles;
    this.dependencias = repos.dependencias;
    this.sesiones = repos.sesiones;
  }

  async listar(params: { q?: string; page: number; pageSize: number }): Promise<{ items: UsuarioPublico[]; total: number }> {
    const { items, total } = await this.usuarios.list({
      q: params.q?.trim() || undefined,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    });
    return { items: items.map(aPublico), total };
  }

  async obtener(id: number): Promise<UsuarioPublico> {
    const usuario = await this.usuarios.findById(id);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    return aPublico(usuario);
  }

  async crear(input: CrearUsuarioInput, ctx: Contexto): Promise<UsuarioPublico> {
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();
    this.validarPassword(input.password);
    if (await this.usuarios.findByUsername(username)) throw new ConflictError('Ya existe un usuario con ese nombre de usuario');
    if (await this.usuarios.findByEmail(email)) throw new ConflictError('Ya existe un usuario con ese correo');
    const rol = await this.rolExistente(input.rolId);
    await this.dependenciaExistente(input.dependenciaId);

    const creado = await this.usuarios.create({
      username,
      email,
      nombre: input.nombre.trim(),
      passwordHash: await hashPassword(input.password),
      rolId: input.rolId,
      dependenciaId: input.dependenciaId,
    });
    await this.auditoria.registrar(ctx, {
      accion: 'USUARIO_CREADO',
      resultado: 'EXITO',
      entidad: 'Usuario',
      entidadId: String(creado.id),
      detalle: { username, email, rol: rol.clave, dependenciaId: input.dependenciaId },
    });
    return aPublico(creado);
  }

  async modificar(id: number, input: ModificarUsuarioInput, ctx: Contexto): Promise<UsuarioPublico> {
    const actual = await this.usuarios.findById(id);
    if (!actual) throw new NotFoundError('Usuario no encontrado');
    const esUnoMismo = ctx.usuarioId === id;

    const nuevoRol = input.rolId !== undefined && input.rolId !== actual.rol.id ? await this.rolExistente(input.rolId) : undefined;
    if (input.dependenciaId !== undefined) await this.dependenciaExistente(input.dependenciaId);
    if (input.password !== undefined) this.validarPassword(input.password);

    if (esUnoMismo && input.activo === false) throw new ConflictError('No puede desactivar su propio usuario');
    if (esUnoMismo && nuevoRol) throw new ConflictError('No puede cambiar su propio rol');

    const dejaDeSerAdminActivo =
      actual.rol.clave === ROL_ADMINISTRADOR && actual.activo && (input.activo === false || (nuevoRol && nuevoRol.clave !== ROL_ADMINISTRADOR));
    if (dejaDeSerAdminActivo && (await this.usuarios.countActivosConRol(ROL_ADMINISTRADOR, id)) === 0) {
      throw new ConflictError('Debe quedar al menos un administrador activo en el sistema');
    }

    const actualizado = await this.usuarios.update(id, {
      ...(input.nombre !== undefined && { nombre: input.nombre.trim() }),
      ...(nuevoRol && { rolId: nuevoRol.id }),
      ...(input.dependenciaId !== undefined && { dependenciaId: input.dependenciaId }),
      ...(input.activo !== undefined && { activo: input.activo }),
      ...(input.password !== undefined && { passwordHash: await hashPassword(input.password) }),
    });

    // Al desactivar o cambiar la contraseña, se cierran las sesiones abiertas del usuario.
    if (input.activo === false || input.password !== undefined) await this.sesiones.deleteByUsuario(id);

    await this.auditoria.registrar(ctx, {
      accion: 'USUARIO_MODIFICADO',
      resultado: 'EXITO',
      entidad: 'Usuario',
      entidadId: String(id),
      detalle: {
        ...(input.nombre !== undefined && { nombre: input.nombre.trim() }),
        ...(nuevoRol && { rol: { antes: actual.rol.clave, despues: nuevoRol.clave } }),
        ...(input.dependenciaId !== undefined && { dependenciaId: input.dependenciaId }),
        ...(input.activo !== undefined && { activo: input.activo }),
        ...(input.password !== undefined && { passwordCambiada: true }),
      },
    });
    return aPublico(actualizado);
  }

  private validarPassword(password: string): void {
    const problema = validarPoliticaPassword(password);
    if (problema) throw new ValidationError([{ field: 'password', message: problema }]);
  }

  private async rolExistente(id: number) {
    const rol = await this.roles.findById(id);
    if (!rol) throw new ValidationError([{ field: 'rolId', message: 'El rol indicado no existe' }]);
    return rol;
  }

  private async dependenciaExistente(id: number) {
    const dep = await this.dependencias.findById(id);
    if (!dep || !dep.activa) throw new ValidationError([{ field: 'dependenciaId', message: 'La dependencia indicada no existe o está inactiva' }]);
    return dep;
  }
}
