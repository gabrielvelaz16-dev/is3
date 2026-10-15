import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type {
  CambiosExpediente,
  DependenciaRecord,
  ExpedienteRecord,
  DocumentoRecord,
  FiltrosExpediente,
  NuevoExpediente,
  Repos,
  RolRecord,
  UsuarioRecord,
} from '../repositories.js';

const incluirExpediente = {
  dependenciaActual: true,
  creadoPor: { select: { id: true, nombre: true, username: true } },
  responsable: { select: { id: true, nombre: true, username: true } },
} satisfies Prisma.ExpedienteInclude;

type ExpedienteCompleto = Prisma.ExpedienteGetPayload<{ include: typeof incluirExpediente }>;

function aExpediente(e: ExpedienteCompleto): ExpedienteRecord {
  return {
    id: e.id,
    numero: e.numero,
    caratula: e.caratula,
    asunto: e.asunto,
    tipo: e.tipo,
    iniciador: e.iniciador,
    estado: e.estado,
    prioridad: e.prioridad,
    dependenciaActualId: e.dependenciaActualId,
    creadoPorId: e.creadoPorId,
    responsableId: e.responsableId,
    fechaVencimiento: e.fechaVencimiento,
    descripcion: e.descripcion,
    creadoEn: e.creadoEn,
    actualizadoEn: e.actualizadoEn,
    dependenciaActual: e.dependenciaActual satisfies DependenciaRecord,
    creadoPor: e.creadoPor,
    responsable: e.responsable,
  };
}

const persona = { select: { id: true, nombre: true, username: true } } as const;

const incluirDocumento = { subidoPor: persona } satisfies Prisma.DocumentoInclude;
type DocumentoCompleto = Prisma.DocumentoGetPayload<{ include: typeof incluirDocumento }>;

function aDocumento(d: DocumentoCompleto): DocumentoRecord {
  return {
    id: d.id,
    expedienteId: d.expedienteId,
    nombreOriginal: d.nombreOriginal,
    nombreAlmacenado: d.nombreAlmacenado,
    tipoMime: d.tipoMime,
    tamanoBytes: d.tamanoBytes,
    hashSha256: d.hashSha256,
    descripcion: d.descripcion,
    subidoEn: d.subidoEn,
    subidoPor: d.subidoPor,
  };
}

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
    username: u.username,
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
      async findByUsername(username) {
        const u = await prisma.usuario.findUnique({ where: { username }, include: incluirUsuario });
        return u ? aUsuario(u) : null;
      },
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
          ? {
              OR: [
                { nombre: { contains: q, mode: 'insensitive' } },
                { username: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
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

    expedientes: {
      async findById(id) {
        const e = await prisma.expediente.findUnique({ where: { id }, include: incluirExpediente });
        return e ? aExpediente(e) : null;
      },
      async findByNumero(numero) {
        const e = await prisma.expediente.findUnique({ where: { numero }, include: incluirExpediente });
        return e ? aExpediente(e) : null;
      },
      async list(filtros: FiltrosExpediente) {
        const where: Prisma.ExpedienteWhereInput = {};
        if (filtros.q) {
          where.OR = [
            { caratula: { contains: filtros.q, mode: 'insensitive' } },
            { asunto: { contains: filtros.q, mode: 'insensitive' } },
            { numero: { contains: filtros.q, mode: 'insensitive' } },
            { iniciador: { contains: filtros.q, mode: 'insensitive' } },
          ];
        }
        if (filtros.estado) where.estado = filtros.estado;
        if (filtros.prioridad) where.prioridad = filtros.prioridad;
        if (filtros.dependenciaId) where.dependenciaActualId = filtros.dependenciaId;
        const [items, total] = await prisma.$transaction([
          prisma.expediente.findMany({
            where,
            include: incluirExpediente,
            orderBy: { creadoEn: 'desc' },
            skip: filtros.skip,
            take: filtros.take,
          }),
          prisma.expediente.count({ where }),
        ]);
        return { items: items.map(aExpediente), total };
      },
      async create(data: NuevoExpediente) {
        return aExpediente(await prisma.expediente.create({ data, include: incluirExpediente }));
      },
      async update(id, data: CambiosExpediente) {
        return aExpediente(await prisma.expediente.update({ where: { id }, data, include: incluirExpediente }));
      },
    },

    documentos: {
      async listByExpediente(expedienteId) {
        const filas = await prisma.documento.findMany({
          where: { expedienteId },
          include: incluirDocumento,
          orderBy: { subidoEn: 'asc' },
        });
        return filas.map(aDocumento);
      },
      async findById(id) {
        const d = await prisma.documento.findUnique({ where: { id }, include: incluirDocumento });
        return d ? aDocumento(d) : null;
      },
      async create(data) {
        return aDocumento(await prisma.documento.create({ data, include: incluirDocumento }));
      },
    },

    actuaciones: {
      async listByExpediente(expedienteId) {
        const filas = await prisma.actuacion.findMany({
          where: { expedienteId },
          include: { autor: persona },
          orderBy: { fecha: 'asc' },
        });
        return filas.map(({ autorId: _a, ...a }) => a);
      },
      async create(data) {
        const { autorId: _a, ...a } = await prisma.actuacion.create({ data, include: { autor: persona } });
        return a;
      },
    },

    cambiosEstado: {
      async listByExpediente(expedienteId) {
        const filas = await prisma.cambioEstado.findMany({
          where: { expedienteId },
          include: { usuario: persona },
          orderBy: { fecha: 'asc' },
        });
        return filas.map(({ usuarioId: _u, ...c }) => c);
      },
      async insert(data) {
        await prisma.cambioEstado.create({ data });
      },
    },

    secuencia: {
      async siguienteNumero(anio: number) {
        // Upsert atómico: crea la fila del año si no existe y luego incrementa.
        const result = await prisma.$queryRaw<[{ ultimo_numero: number }]>`
          INSERT INTO secuencias (anio, ultimo_numero)
          VALUES (${anio}, 1)
          ON CONFLICT (anio) DO UPDATE SET ultimo_numero = secuencias.ultimo_numero + 1
          RETURNING ultimo_numero
        `;
        return result[0]!.ultimo_numero;
      },
    },
  };
}
