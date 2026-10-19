import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { createPrismaRespaldoRepo } from './respaldo-repo.js';
import type {
  CambiosExpediente,
  EstadoExpediente,
  FiltrosReporte,
  NotificacionRecord,
  Prioridad,
  DependenciaRecord,
  ExpedienteRecord,
  DocumentoRecord,
  FiltrosExpediente,
  PaseRecord,
  TareaRecord,
  NuevoExpediente,
  Repos,
  RolRecord,
  UsuarioRecord,
} from '../repositories.js';

const incluirExpediente = {
  dependenciaActual: true,
  creadoPor: { select: { id: true, nombre: true, username: true } },
  responsable: { select: { id: true, nombre: true, username: true } },
  desactivadoPor: { select: { id: true, nombre: true, username: true } },
  // Pase sin recibir (a lo sumo uno, por el índice único parcial).
  pases: { where: { recibidoEn: null }, select: { id: true, enviadoEn: true, destino: true }, take: 1 },
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
    paseEnTransito: e.pases[0]
      ? { id: e.pases[0].id, enviadoEn: e.pases[0].enviadoEn, destino: aDependenciaRef(e.pases[0].destino) }
      : null,
    activo: e.activo,
    desactivadoEn: e.desactivadoEn,
    desactivadoPor: e.desactivadoPor,
    motivoDesactivacion: e.motivoDesactivacion,
  };
}

function aDependenciaRef(d: { id: number; codigo: string; nombre: string }) {
  return { id: d.id, codigo: d.codigo, nombre: d.nombre };
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

const expedienteRef = { select: { id: true, numero: true, caratula: true } } as const;

const incluirTarea = { asignadoA: persona, creadoPor: persona, expediente: expedienteRef } satisfies Prisma.TareaInclude;
type TareaCompleta = Prisma.TareaGetPayload<{ include: typeof incluirTarea }>;

function aTarea(t: TareaCompleta): TareaRecord {
  return {
    id: t.id,
    expedienteId: t.expedienteId,
    titulo: t.titulo,
    descripcion: t.descripcion,
    vencimiento: t.vencimiento,
    estado: t.estado,
    creadaEn: t.creadaEn,
    cerradaEn: t.cerradaEn,
    asignadoA: t.asignadoA,
    creadoPor: t.creadoPor,
    expediente: t.expediente,
  };
}

const incluirPase = {
  origen: true,
  destino: true,
  enviadoPor: persona,
  recibidoPor: persona,
  expediente: expedienteRef,
} satisfies Prisma.PaseInclude;
type PaseCompleto = Prisma.PaseGetPayload<{ include: typeof incluirPase }>;

function aPase(p: PaseCompleto): PaseRecord {
  return {
    id: p.id,
    expedienteId: p.expedienteId,
    origen: aDependenciaRef(p.origen),
    destino: aDependenciaRef(p.destino),
    motivo: p.motivo,
    enviadoEn: p.enviadoEn,
    enviadoPor: p.enviadoPor,
    recibidoEn: p.recibidoEn,
    recibidoPor: p.recibidoPor,
    expediente: p.expediente,
  };
}

/** Condición común del listado, el dashboard y los reportes (Sprint 6). */
function whereReporte(f: FiltrosReporte): Prisma.ExpedienteWhereInput {
  const where: Prisma.ExpedienteWhereInput = { activo: f.activo ?? true };
  if (f.estado) where.estado = f.estado;
  if (f.prioridad) where.prioridad = f.prioridad;
  if (f.dependenciaId) where.dependenciaActualId = f.dependenciaId;
  if (f.tipo) where.tipo = f.tipo;
  if (f.desde || f.hasta) where.creadoEn = { ...(f.desde ? { gte: f.desde } : {}), ...(f.hasta ? { lte: f.hasta } : {}) };
  return where;
}

const ABIERTO: Prisma.ExpedienteWhereInput = { estado: { notIn: ['RESUELTO', 'ARCHIVADO'] } };

function aNotificacion(n: Prisma.NotificacionGetPayload<{ include: { expediente: typeof expedienteRef } }>): NotificacionRecord {
  return {
    id: n.id,
    usuarioId: n.usuarioId,
    tipo: n.tipo,
    mensaje: n.mensaje,
    expediente: n.expediente,
    creadaEn: n.creadaEn,
    leidaEn: n.leidaEn,
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
      async tieneActividad(id) {
        const u = await prisma.usuario.findUnique({
          where: { id },
          select: {
            _count: {
              select: {
                auditoria: true,
                expedientesCreados: true,
                expedientesResponsable: true,
                expedientesDesactivados: true,
                documentosSubidos: true,
                actuaciones: true,
                cambiosEstado: true,
                tareasAsignadas: true,
                tareasCreadas: true,
                pasesEnviados: true,
                pasesRecibidos: true,
                asignacionesHechas: true,
                asignacionesRecibidas: true,
              },
            },
          },
        });
        return !!u && Object.values(u._count).some((n) => n > 0);
      },
      async delete(id) {
        // Las sesiones y las notificaciones se borran en cascada (onDelete: Cascade).
        await prisma.usuario.delete({ where: { id } });
      },
      countActivosConRol(rolClave, excluirId) {
        return prisma.usuario.count({
          where: { activo: true, rol: { clave: rolClave }, ...(excluirId ? { id: { not: excluirId } } : {}) },
        });
      },
      async listIdsConPermiso(dependenciaId, permiso) {
        const filas = await prisma.usuario.findMany({
          where: { dependenciaId, activo: true, rol: { permisos: { some: { permiso: { clave: permiso } } } } },
          select: { id: true },
        });
        return filas.map((f) => f.id);
      },
      listActivosDeDependencia(dependenciaId) {
        return prisma.usuario.findMany({
          where: { dependenciaId, activo: true },
          select: { id: true, nombre: true, username: true },
          orderBy: { nombre: 'asc' },
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
      async list({ desde, hasta, usuarioId, accion, resultado, skip, take }) {
        const where: Prisma.AuditoriaWhereInput = {
          ...(desde || hasta ? { fecha: { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) } } : {}),
          ...(usuarioId ? { usuarioId } : {}),
          ...(accion ? { accion } : {}),
          ...(resultado ? { resultado } : {}),
        };
        const [filas, total] = await prisma.$transaction([
          prisma.auditoria.findMany({ where, include: { usuario: persona }, orderBy: [{ fecha: 'desc' }, { id: 'desc' }], skip, take }),
          prisma.auditoria.count({ where }),
        ]);
        return {
          items: filas.map(({ usuarioId: _u, ...a }) => ({ ...a, resultado: a.resultado as 'EXITO' | 'FALLO' })),
          total,
        };
      },
      async acciones() {
        const filas = await prisma.auditoria.findMany({ distinct: ['accion'], select: { accion: true }, orderBy: { accion: 'asc' } });
        return filas.map((f) => f.accion);
      },
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
      async listPorVencer({ dependenciaId, hasta }) {
        const filas = await prisma.expediente.findMany({
          where: {
            activo: true,
            fechaVencimiento: { lte: hasta },
            estado: { notIn: ['RESUELTO', 'ARCHIVADO'] },
            ...(dependenciaId ? { dependenciaActualId: dependenciaId } : {}),
          },
          include: incluirExpediente,
          orderBy: { fechaVencimiento: 'asc' },
          take: 50,
        });
        return filas.map(aExpediente);
      },
      async findById(id) {
        const e = await prisma.expediente.findUnique({ where: { id }, include: incluirExpediente });
        return e ? aExpediente(e) : null;
      },
      async findByNumero(numero) {
        const e = await prisma.expediente.findUnique({ where: { numero }, include: incluirExpediente });
        return e ? aExpediente(e) : null;
      },
      async list(filtros: FiltrosExpediente) {
        const where = whereReporte(filtros);
        if (filtros.q) {
          where.OR = [
            { caratula: { contains: filtros.q, mode: 'insensitive' } },
            { asunto: { contains: filtros.q, mode: 'insensitive' } },
            { numero: { contains: filtros.q, mode: 'insensitive' } },
            { iniciador: { contains: filtros.q, mode: 'insensitive' } },
          ];
        }
        const [items, total] = await prisma.$transaction([
          prisma.expediente.findMany({
            where,
            include: incluirExpediente,
            // Los desactivados se ordenan por fecha de baja (la más reciente primero).
            orderBy: filtros.activo === false ? { desactivadoEn: 'desc' } : { creadoEn: 'desc' },
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
      async tieneActividad(id) {
        const e = await prisma.expediente.findUnique({
          where: { id },
          select: {
            _count: {
              select: { documentos: true, actuaciones: true, cambiosEstado: true, tareas: true, pases: true, asignaciones: true, notificaciones: true },
            },
          },
        });
        return !!e && Object.values(e._count).some((n) => n > 0);
      },
      async delete(id) {
        await prisma.expediente.delete({ where: { id } });
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

    tareas: {
      async listByExpediente(expedienteId) {
        const filas = await prisma.tarea.findMany({ where: { expedienteId }, include: incluirTarea, orderBy: { creadaEn: 'asc' } });
        return filas.map(aTarea);
      },
      async listAbiertasDe(usuarioId) {
        const filas = await prisma.tarea.findMany({
          where: { asignadoAId: usuarioId, estado: { in: ['PENDIENTE', 'EN_CURSO'] }, expediente: { activo: true } },
          include: incluirTarea,
          orderBy: { vencimiento: 'asc' },
        });
        return filas.map(aTarea);
      },
      async findById(id) {
        const t = await prisma.tarea.findUnique({ where: { id }, include: incluirTarea });
        return t ? aTarea(t) : null;
      },
      async create(data) {
        return aTarea(await prisma.tarea.create({ data, include: incluirTarea }));
      },
      async actualizarEstado(id, estado, cerradaEn) {
        return aTarea(await prisma.tarea.update({ where: { id }, data: { estado, cerradaEn }, include: incluirTarea }));
      },
    },

    pases: {
      async listByExpediente(expedienteId) {
        const filas = await prisma.pase.findMany({ where: { expedienteId }, include: incluirPase, orderBy: { enviadoEn: 'asc' } });
        return filas.map(aPase);
      },
      async listPendientesHacia(dependenciaId) {
        const filas = await prisma.pase.findMany({
          where: { destinoId: dependenciaId, recibidoEn: null },
          include: incluirPase,
          orderBy: { enviadoEn: 'asc' },
        });
        return filas.map(aPase);
      },
      async findById(id) {
        const p = await prisma.pase.findUnique({ where: { id }, include: incluirPase });
        return p ? aPase(p) : null;
      },
      async create(data) {
        return aPase(await prisma.pase.create({ data, include: incluirPase }));
      },
      async recibir(id, usuarioId) {
        // Recepción y cambio de dependencia en una sola transacción. La condición
        // recibidoEn = null evita registrar dos veces la misma recepción.
        return prisma.$transaction(async (tx) => {
          const { count } = await tx.pase.updateMany({
            where: { id, recibidoEn: null },
            data: { recibidoPorId: usuarioId, recibidoEn: new Date() },
          });
          if (count === 0) return null;
          const pase = await tx.pase.findUniqueOrThrow({ where: { id }, include: incluirPase });
          await tx.expediente.update({
            where: { id: pase.expedienteId },
            data: { dependenciaActualId: pase.destinoId, responsableId: null },
          });
          return aPase(pase);
        });
      },
    },

    asignaciones: {
      async listByExpediente(expedienteId) {
        const filas = await prisma.asignacion.findMany({
          where: { expedienteId },
          include: { responsable: persona, usuario: persona },
          orderBy: { fecha: 'asc' },
        });
        return filas.map(({ responsableId: _r, usuarioId: _u, ...a }) => a);
      },
      async insert(data) {
        await prisma.asignacion.create({ data });
      },
    },

    notificaciones: {
      async crear({ usuarioIds, tipo, mensaje, expedienteId }) {
        if (usuarioIds.length === 0) return;
        await prisma.notificacion.createMany({
          data: usuarioIds.map((usuarioId) => ({ usuarioId, tipo, mensaje: mensaje.slice(0, 300), expedienteId })),
        });
      },
      async listDe(usuarioId, { soloNoLeidas, take }) {
        const filas = await prisma.notificacion.findMany({
          where: { usuarioId, ...(soloNoLeidas ? { leidaEn: null } : {}) },
          include: { expediente: expedienteRef },
          orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }],
          take,
        });
        return filas.map(aNotificacion);
      },
      contarNoLeidas: (usuarioId) => prisma.notificacion.count({ where: { usuarioId, leidaEn: null } }),
      async marcarLeida(id, usuarioId, fecha) {
        const n = await prisma.notificacion.findFirst({ where: { id, usuarioId }, select: { id: true } });
        if (!n) return false;
        await prisma.notificacion.updateMany({ where: { id, leidaEn: null }, data: { leidaEn: fecha } });
        return true;
      },
      async marcarTodasLeidas(usuarioId, fecha) {
        const { count } = await prisma.notificacion.updateMany({ where: { usuarioId, leidaEn: null }, data: { leidaEn: fecha } });
        return count;
      },
    },

    estadisticas: {
      async resumen(filtros) {
        const where = whereReporte(filtros);
        const [total, estados, prioridades, tipos, deps] = await Promise.all([
          prisma.expediente.count({ where }),
          prisma.expediente.groupBy({ by: ['estado'], where, _count: { _all: true } }),
          prisma.expediente.groupBy({ by: ['prioridad'], where, _count: { _all: true } }),
          prisma.expediente.groupBy({ by: ['tipo'], where, _count: { _all: true } }),
          prisma.expediente.groupBy({ by: ['dependenciaActualId'], where, _count: { _all: true } }),
        ]);
        const dependencias = await prisma.dependencia.findMany({ where: { id: { in: deps.map((d) => d.dependenciaActualId) } } });
        const porEstado = { BORRADOR: 0, EN_TRAMITE: 0, EN_REVISION: 0, RESUELTO: 0, ARCHIVADO: 0 } satisfies Record<EstadoExpediente, number>;
        for (const e of estados) porEstado[e.estado] = e._count._all;
        const porPrioridad = { BAJA: 0, MEDIA: 0, ALTA: 0 } satisfies Record<Prioridad, number>;
        for (const p of prioridades) porPrioridad[p.prioridad] = p._count._all;
        return {
          total,
          porEstado,
          porPrioridad,
          porTipo: tipos.map((t) => ({ tipo: t.tipo, total: t._count._all })).sort((a, b) => b.total - a.total || a.tipo.localeCompare(b.tipo)),
          porDependencia: deps
            .map((d) => ({ dependencia: aDependenciaRef(dependencias.find((x) => x.id === d.dependenciaActualId)!), total: d._count._all }))
            .sort((a, b) => b.total - a.total || a.dependencia.nombre.localeCompare(b.dependencia.nombre)),
        };
      },
      async seguimiento({ dependenciaId, ahora, hasta }) {
        const alcance: Prisma.ExpedienteWhereInput = { activo: true, ...(dependenciaId ? { dependenciaActualId: dependenciaId } : {}) };
        const tareaAbierta: Prisma.TareaWhereInput = { estado: { in: ['PENDIENTE', 'EN_CURSO'] }, expediente: alcance };
        const [vencidos, porVencer, enTransito, porRecibir, tareasAbiertas, tareasVencidas] = await Promise.all([
          prisma.expediente.count({ where: { ...alcance, ...ABIERTO, fechaVencimiento: { lt: ahora } } }),
          prisma.expediente.count({ where: { ...alcance, ...ABIERTO, fechaVencimiento: { gte: ahora, lte: hasta } } }),
          prisma.expediente.count({ where: { ...alcance, pases: { some: { recibidoEn: null } } } }),
          prisma.pase.count({ where: { recibidoEn: null, ...(dependenciaId ? { destinoId: dependenciaId } : {}) } }),
          prisma.tarea.count({ where: tareaAbierta }),
          prisma.tarea.count({ where: { ...tareaAbierta, vencimiento: { lt: ahora } } }),
        ]);
        return { vencidos, porVencer, enTransito, porRecibir, tareasAbiertas, tareasVencidas };
      },
    },

    respaldo: createPrismaRespaldoRepo(prisma),

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
