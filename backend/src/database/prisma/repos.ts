import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type {
  DependenciaRecord,
  Repos,
  RolRecord,
  UsuarioRecord,
} from '../repositories.js';

const incluirUsuario = {
  dependencia: true,
  rol: { include: { permisos: { include: { permiso: true } } } },
} satisfies Prisma.UsuarioInclude;

type RolConPermisos = Prisma.RolGetPayload<{ include: { permisos: { include: { permiso: true } } } }>;
type UsuarioCompleto = Prisma.UsuarioGetPayload<{ include: typeof incluirUsuario }>;

function aRol(rol: RolConPermisos): RolRecord {
  return {
    id: rol.id,
    clave: rol.clave,
    nombre: rol.nombre,
    descripcion: rol.descripcion,
    permisos: rol.permisos.map((rp) => rp.permiso.clave).sort(),
  };
}

function aUsuario(u: UsuarioCompleto): UsuarioRecord {
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    passwordHash: u.passwordHash,
    activo: u.activo,
    ultimoAcceso: u.ultimoAcceso,
    creadoEn: u.creadoEn,
    rol: aRol(u.rol),
    dependencia: u.dependencia satisfies DependenciaRecord,
  };
}

/** Implementación real de los repositorios con Prisma. */
export function createPrismaRepos(prisma: PrismaClient): Repos {
  return {
    usuarios: {
      async findByEmail(email) {
        const u = await prisma.usuario.findUnique({ where: { email }, include: incluirUsuario });
        return u ? aUsuario(u) : null;
      },
      async findById(id) {
        const u = await prisma.usuario.findUnique({ where: { id }, include: incluirUsuario });
        return u ? aUsuario(u) : null;
      },
      async list({ q, skip, take }) {
        const where: Prisma.UsuarioWhereInput = q
          ? { OR: [{ nombre: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }
          : {};
        const [items, total] = await prisma.$transaction([
          prisma.usuario.findMany({ where, include: incluirUsuario, orderBy: { nombre: 'asc' }, skip, take }),
          prisma.usuario.count({ where }),
        ]);
        return { items: items.map(aUsuario), total };
      },
      async create(data) {
        return aUsuario(await prisma.usuario.create({ data, include: incluirUsuario }));
      },
      async update(id, data) {
        return aUsuario(await prisma.usuario.update({ where: { id }, data, include: incluirUsuario }));
      },
      countActivosConRol(rolClave, excluirId) {
        return prisma.usuario.count({
          where: { activo: true, rol: { clave: rolClave }, ...(excluirId ? { id: { not: excluirId } } : {}) },
        });
      },
    },

    roles: {
      async list() {
        const roles = await prisma.rol.findMany({ include: { permisos: { include: { permiso: true } } }, orderBy: { nombre: 'asc' } });
        return roles.map(aRol);
      },
      async findById(id) {
        const rol = await prisma.rol.findUnique({ where: { id }, include: { permisos: { include: { permiso: true } } } });
        return rol ? aRol(rol) : null;
      },
    },

    dependencias: {
      list: () => prisma.dependencia.findMany({ orderBy: { nombre: 'asc' } }),
      findById: (id) => prisma.dependencia.findUnique({ where: { id } }),
    },

    sesiones: {
      async create({ id, usuarioId, expiraEn, ip, userAgent }) {
        await prisma.sesion.create({ data: { id, usuarioId, expiraEn, ip, userAgent: userAgent?.slice(0, 255) } });
      },
      findById: (id) => prisma.sesion.findUnique({ where: { id }, select: { id: true, usuarioId: true, expiraEn: true } }),
      async delete(id) {
        await prisma.sesion.deleteMany({ where: { id } });
      },
      async deleteByUsuario(usuarioId) {
        await prisma.sesion.deleteMany({ where: { usuarioId } });
      },
    },

    auditoria: {
      async insert(e) {
        await prisma.auditoria.create({
          data: {
            usuarioId: e.usuarioId ?? null,
            accion: e.accion,
            resultado: e.resultado,
            entidad: e.entidad,
            entidadId: e.entidadId,
            detalle: e.detalle as Prisma.InputJsonValue | undefined,
            ip: e.ip,
            requestId: e.requestId,
          },
        });
      },
    },
  };
}
