import type {
  ActuacionRecord,
  AsignacionRecord,
  PaseRecord,
  TareaRecord,
  CambioEstadoRecord,
  CambiosExpediente,
  DocumentoRecord,
  DependenciaRecord,
  EventoAuditoria,
  ExpedienteRecord,
  FiltrosExpediente,
  FiltrosReporte,
  NotificacionRecord,
  NuevoExpediente,
  Repos,
  RolRecord,
  SesionRecord,
  UsuarioRecord,
} from '../../src/database/repositories.js';
import { createApp } from '../../src/app.js';
import type { ApiDeps } from '../../src/api/routes/index.js';
import { AlmacenamientoEnMemoria } from '../../src/integrations/almacenamiento/almacenamiento.js';
import { LocalIdentityProvider } from '../../src/integrations/identity/identity-provider.js';
import { hashPassword } from '../../src/security/password.js';
import { ROLES } from '../../src/security/permissions.js';

/**
 * Repositorios en memoria: misma interfaz que los de Prisma, para probar reglas
 * de negocio, permisos y rutas sin base de datos.
 */
export function crearReposEnMemoria() {
  const dependencias: DependenciaRecord[] = [
    { id: 1, codigo: 'ADM', nombre: 'Administración General', activa: true },
    { id: 2, codigo: 'MESA', nombre: 'Mesa de Entradas', activa: true },
    { id: 3, codigo: 'VIEJA', nombre: 'Dependencia inactiva', activa: false },
  ];
  const roles: RolRecord[] = Object.entries(ROLES).map(([clave, r], i) => ({
    id: i + 1,
    clave,
    nombre: r.nombre,
    descripcion: r.descripcion,
    permisos: [...r.permisos].sort(),
  }));
  type Fila = Omit<UsuarioRecord, 'rol' | 'dependencia'> & { rolId: number; dependenciaId: number };
  const usuarios: Fila[] = [];
  const sesiones = new Map<string, SesionRecord>();
  const auditoria: EventoAuditoria[] = [];
  /** Fecha de cada evento de auditoría (mismo índice que `auditoria`). */
  const fechasAuditoria: Date[] = [];

  // Sprint 3: expedientes en memoria
  type FilaExp = Omit<ExpedienteRecord, 'dependenciaActual' | 'creadoPor' | 'responsable' | 'paseEnTransito' | 'desactivadoPor'> & {
    desactivadoPorId: number | null;
  };
  const expedientes: FilaExp[] = [];
  const secuencias = new Map<number, number>();

  // Sprint 4: documentos, actuaciones y cambios de estado en memoria
  const documentos: DocumentoRecord[] = [];
  const actuaciones: ActuacionRecord[] = [];
  const cambiosEstado: CambioEstadoRecord[] = [];
  const persona = (id: number) => {
    const u = usuarios.find((x) => x.id === id)!;
    return { id: u.id, nombre: u.nombre, username: u.username };
  };
  // Sprint 5: tareas, pases y asignaciones
  const tareas: (Omit<TareaRecord, 'asignadoA' | 'creadoPor' | 'expediente'> & { asignadoAId: number; creadoPorId: number })[] = [];
  const pases: (Omit<PaseRecord, 'origen' | 'destino' | 'enviadoPor' | 'recibidoPor' | 'expediente'> & {
    origenId: number;
    destinoId: number;
    enviadoPorId: number;
    recibidoPorId: number | null;
  })[] = [];
  const asignaciones: AsignacionRecord[] = [];
  // Sprint 6: notificaciones
  const notificaciones: (Omit<NotificacionRecord, 'expediente'> & { expedienteId: number | null })[] = [];
  const depRef = (id: number) => {
    const d = dependencias.find((x) => x.id === id)!;
    return { id: d.id, codigo: d.codigo, nombre: d.nombre };
  };
  const expRef = (id: number) => {
    const e = expedientes.find((x) => x.id === id)!;
    return { id: e.id, numero: e.numero, caratula: e.caratula };
  };
  const completarTarea = (t: (typeof tareas)[number]): TareaRecord => {
    const { asignadoAId, creadoPorId, ...resto } = t;
    return { ...resto, asignadoA: persona(asignadoAId), creadoPor: persona(creadoPorId), expediente: expRef(t.expedienteId) };
  };
  const completarPase = (p: (typeof pases)[number]): PaseRecord => {
    const { origenId, destinoId, enviadoPorId, recibidoPorId, ...resto } = p;
    return {
      ...resto,
      origen: depRef(origenId),
      destino: depRef(destinoId),
      enviadoPor: persona(enviadoPorId),
      recibidoPor: recibidoPorId ? persona(recibidoPorId) : null,
      expediente: expRef(p.expedienteId),
    };
  };

  // Fechas estrictamente crecientes, para que el orden del historial sea determinista.
  let reloj = Date.now();
  const ahora = () => new Date(++reloj);

  const completarExp = (f: FilaExp): ExpedienteRecord => {
    const dep = dependencias.find((d) => d.id === f.dependenciaActualId)!;
    const creador = usuarios.find((u) => u.id === f.creadoPorId)!;
    const resp = f.responsableId ? usuarios.find((u) => u.id === f.responsableId) : null;
    const { desactivadoPorId, ...resto } = f;
    const baja = desactivadoPorId ? usuarios.find((u) => u.id === desactivadoPorId) : null;
    return {
      ...resto,
      desactivadoPor: baja ? { id: baja.id, nombre: baja.nombre, username: baja.username } : null,
      dependenciaActual: dep,
      creadoPor: creador ? { id: creador.id, nombre: creador.nombre, username: creador.username } : { id: f.creadoPorId, nombre: '', username: '' },
      responsable: resp ? { id: resp.id, nombre: resp.nombre, username: resp.username } : null,
      paseEnTransito: (() => {
        const p = pases.find((x) => x.expedienteId === f.id && !x.recibidoEn);
        return p ? { id: p.id, enviadoEn: p.enviadoEn, destino: depRef(p.destinoId) } : null;
      })(),
    };
  };

  const cumpleReporte = (e: FilaExp, f: FiltrosReporte) =>
    e.activo === (f.activo ?? true) &&
    (!f.estado || e.estado === f.estado) &&
    (!f.prioridad || e.prioridad === f.prioridad) &&
    (!f.dependenciaId || e.dependenciaActualId === f.dependenciaId) &&
    (!f.tipo || e.tipo === f.tipo) &&
    (!f.desde || e.creadoEn.getTime() >= f.desde.getTime()) &&
    (!f.hasta || e.creadoEn.getTime() <= f.hasta.getTime());
  const abierto = (e: FilaExp) => e.estado !== 'RESUELTO' && e.estado !== 'ARCHIVADO';
  const contar = <T,>(lista: T[], clave: (x: T) => string) => {
    const m = new Map<string, number>();
    for (const x of lista) m.set(clave(x), (m.get(clave(x)) ?? 0) + 1);
    return m;
  };

  const completar = (f: Fila): UsuarioRecord => {
    const { rolId, dependenciaId, ...resto } = f;
    return { ...resto, rol: roles.find((r) => r.id === rolId)!, dependencia: dependencias.find((d) => d.id === dependenciaId)! };
  };

  const repos: Repos = {
    usuarios: {
      findByUsername: async (username) => {
        const f = usuarios.find((u) => u.username === username);
        return f ? completar(f) : null;
      },
      findByEmail: async (email) => {
        const f = usuarios.find((u) => u.email === email);
        return f ? completar(f) : null;
      },
      findById: async (id) => {
        const f = usuarios.find((u) => u.id === id);
        return f ? completar(f) : null;
      },
      list: async ({ q, skip, take }) => {
        const filtrados = usuarios
          .filter((u) => !q || `${u.nombre} ${u.username} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        return { items: filtrados.slice(skip, skip + take).map(completar), total: filtrados.length };
      },
      create: async (data) => {
        const id = Math.max(0, ...usuarios.map((u) => u.id)) + 1;
        const fila: Fila = { id, activo: true, ultimoAcceso: null, creadoEn: new Date(), ...data };
        usuarios.push(fila);
        return completar(fila);
      },
      update: async (id, data) => {
        const fila = usuarios.find((u) => u.id === id);
        if (!fila) throw new Error('no existe');
        Object.assign(fila, data);
        return completar(fila);
      },
      tieneActividad: async (id) =>
        auditoria.some((e) => e.usuarioId === id) ||
        expedientes.some((e) => e.creadoPorId === id || e.responsableId === id || e.desactivadoPorId === id) ||
        documentos.some((d) => d.subidoPor.id === id) ||
        actuaciones.some((a) => a.autor.id === id) ||
        cambiosEstado.some((c) => c.usuario.id === id) ||
        tareas.some((t) => t.asignadoAId === id || t.creadoPorId === id) ||
        pases.some((p) => p.enviadoPorId === id || p.recibidoPorId === id) ||
        asignaciones.some((a) => a.usuario.id === id || a.responsable?.id === id),
      delete: async (id) => {
        usuarios.splice(
          usuarios.findIndex((u) => u.id === id),
          1,
        );
        for (const [k, s] of sesiones) if (s.usuarioId === id) sesiones.delete(k);
        for (let i = notificaciones.length - 1; i >= 0; i--) if (notificaciones[i]!.usuarioId === id) notificaciones.splice(i, 1);
      },
      listActivosDeDependencia: async (dependenciaId) =>
        usuarios
          .filter((u) => u.activo && u.dependenciaId === dependenciaId)
          .map((u) => ({ id: u.id, nombre: u.nombre, username: u.username })),
      listIdsConPermiso: async (dependenciaId, permiso) =>
        usuarios
          .filter((u) => u.activo && u.dependenciaId === dependenciaId && roles.find((r) => r.id === u.rolId)!.permisos.includes(permiso))
          .map((u) => u.id),
      countActivosConRol: async (clave, excluirId) =>
        usuarios.filter((u) => u.activo && u.id !== excluirId && roles.find((r) => r.id === u.rolId)?.clave === clave).length,
    },
    roles: {
      list: async () => roles,
      findById: async (id) => roles.find((r) => r.id === id) ?? null,
    },
    dependencias: {
      list: async () => dependencias,
      findById: async (id) => dependencias.find((d) => d.id === id) ?? null,
    },
    sesiones: {
      create: async ({ id, usuarioId, expiraEn }) => {
        sesiones.set(id, { id, usuarioId, expiraEn });
      },
      findById: async (id) => sesiones.get(id) ?? null,
      delete: async (id) => {
        sesiones.delete(id);
      },
      deleteByUsuario: async (usuarioId) => {
        for (const [k, s] of sesiones) if (s.usuarioId === usuarioId) sesiones.delete(k);
      },
    },
    auditoria: {
      insert: async (e) => {
        auditoria.push(e);
        fechasAuditoria.push(ahora());
      },
      list: async ({ desde, hasta, usuarioId, accion, resultado, skip, take }) => {
        const filas = auditoria
          .map((e, i) => ({ e, id: i + 1, fecha: fechasAuditoria[i]! }))
          .filter(
            ({ e, fecha }) =>
              (!desde || fecha.getTime() >= desde.getTime()) &&
              (!hasta || fecha.getTime() <= hasta.getTime()) &&
              (!usuarioId || e.usuarioId === usuarioId) &&
              (!accion || e.accion === accion) &&
              (!resultado || e.resultado === resultado),
          )
          .sort((a, b) => b.fecha.getTime() - a.fecha.getTime() || b.id - a.id);
        return {
          total: filas.length,
          items: filas.slice(skip, skip + take).map(({ e, id, fecha }) => ({
            id,
            fecha,
            usuario: e.usuarioId ? persona(e.usuarioId) : null,
            accion: e.accion,
            resultado: e.resultado,
            entidad: e.entidad ?? null,
            entidadId: e.entidadId ?? null,
            detalle: e.detalle ?? null,
            ip: e.ip ?? null,
            requestId: e.requestId ?? null,
          })),
        };
      },
      acciones: async () => [...new Set(auditoria.map((e) => e.accion))].sort(),
    },

    expedientes: {
      listPorVencer: async ({ dependenciaId, hasta }) =>
        expedientes
          .filter(
            (e) =>
              e.activo &&
              e.fechaVencimiento &&
              e.fechaVencimiento.getTime() <= hasta.getTime() &&
              !['RESUELTO', 'ARCHIVADO'].includes(e.estado) &&
              (!dependenciaId || e.dependenciaActualId === dependenciaId),
          )
          .sort((a, b) => a.fechaVencimiento!.getTime() - b.fechaVencimiento!.getTime())
          .map(completarExp),
      findById: async (id) => {
        const f = expedientes.find((e) => e.id === id);
        return f ? completarExp(f) : null;
      },
      findByNumero: async (numero) => {
        const f = expedientes.find((e) => e.numero === numero);
        return f ? completarExp(f) : null;
      },
      list: async (filtros: FiltrosExpediente) => {
        let filtrados = expedientes.filter((e) => cumpleReporte(e, filtros));
        if (filtros.q) {
          const q = filtros.q.toLowerCase();
          filtrados = filtrados.filter(
            (e) =>
              e.caratula.toLowerCase().includes(q) ||
              e.asunto.toLowerCase().includes(q) ||
              e.numero.toLowerCase().includes(q) ||
              e.iniciador.toLowerCase().includes(q),
          );
        }
        if (filtros.activo === false) filtrados.sort((a, b) => b.desactivadoEn!.getTime() - a.desactivadoEn!.getTime());
        else filtrados.sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime());
        return { items: filtrados.slice(filtros.skip, filtros.skip + filtros.take).map(completarExp), total: filtrados.length };
      },
      create: async (data: NuevoExpediente) => {
        const now = ahora();
        const fila: FilaExp = {
          id: Math.max(0, ...expedientes.map((e) => e.id)) + 1,
          numero: data.numero,
          caratula: data.caratula,
          asunto: data.asunto,
          tipo: data.tipo,
          iniciador: data.iniciador,
          estado: data.estado ?? 'BORRADOR',
          prioridad: data.prioridad ?? 'MEDIA',
          dependenciaActualId: data.dependenciaActualId,
          creadoPorId: data.creadoPorId,
          responsableId: data.responsableId ?? null,
          fechaVencimiento: data.fechaVencimiento ?? null,
          descripcion: data.descripcion ?? null,
          creadoEn: now,
          actualizadoEn: now,
          activo: true,
          desactivadoEn: null,
          desactivadoPorId: null,
          motivoDesactivacion: null,
        };
        expedientes.push(fila);
        return completarExp(fila);
      },
      update: async (id, data: CambiosExpediente) => {
        const fila = expedientes.find((e) => e.id === id);
        if (!fila) throw new Error('expediente no existe');
        Object.assign(fila, data, { actualizadoEn: new Date() });
        return completarExp(fila);
      },
      tieneActividad: async (id) =>
        documentos.some((d) => d.expedienteId === id) ||
        actuaciones.some((a) => a.expedienteId === id) ||
        cambiosEstado.some((c) => c.expedienteId === id) ||
        tareas.some((t) => t.expedienteId === id) ||
        pases.some((p) => p.expedienteId === id) ||
        asignaciones.some((a) => a.expedienteId === id) ||
        notificaciones.some((n) => n.expedienteId === id),
      delete: async (id) => {
        expedientes.splice(
          expedientes.findIndex((e) => e.id === id),
          1,
        );
      },
    },

    documentos: {
      listByExpediente: async (expedienteId) => documentos.filter((d) => d.expedienteId === expedienteId),
      findById: async (id) => documentos.find((d) => d.id === id) ?? null,
      create: async ({ subidoPorId, ...data }) => {
        const doc: DocumentoRecord = { ...data, id: documentos.length + 1, subidoEn: ahora(), subidoPor: persona(subidoPorId) };
        documentos.push(doc);
        return doc;
      },
    },

    actuaciones: {
      listByExpediente: async (expedienteId) => actuaciones.filter((a) => a.expedienteId === expedienteId),
      create: async ({ autorId, ...data }) => {
        const act: ActuacionRecord = { ...data, id: actuaciones.length + 1, fecha: ahora(), autor: persona(autorId) };
        actuaciones.push(act);
        return act;
      },
    },

    cambiosEstado: {
      listByExpediente: async (expedienteId) => cambiosEstado.filter((c) => c.expedienteId === expedienteId),
      insert: async ({ usuarioId, motivo, ...data }) => {
        cambiosEstado.push({ ...data, motivo: motivo ?? null, id: cambiosEstado.length + 1, fecha: ahora(), usuario: persona(usuarioId) });
      },
    },

    tareas: {
      listByExpediente: async (expedienteId) => tareas.filter((t) => t.expedienteId === expedienteId).map(completarTarea),
      listAbiertasDe: async (usuarioId) =>
        tareas
          .filter((t) => t.asignadoAId === usuarioId && (t.estado === 'PENDIENTE' || t.estado === 'EN_CURSO') && expedientes.find((e) => e.id === t.expedienteId)?.activo)
          .sort((a, b) => a.vencimiento.getTime() - b.vencimiento.getTime())
          .map(completarTarea),
      findById: async (id) => {
        const t = tareas.find((x) => x.id === id);
        return t ? completarTarea(t) : null;
      },
      create: async (data) => {
        const t = { ...data, id: tareas.length + 1, estado: 'PENDIENTE' as const, creadaEn: ahora(), cerradaEn: null };
        tareas.push(t);
        return completarTarea(t);
      },
      actualizarEstado: async (id, estado, cerradaEn) => {
        const t = tareas.find((x) => x.id === id)!;
        Object.assign(t, { estado, cerradaEn });
        return completarTarea(t);
      },
    },

    pases: {
      listByExpediente: async (expedienteId) => pases.filter((p) => p.expedienteId === expedienteId).map(completarPase),
      listPendientesHacia: async (dependenciaId) => pases.filter((p) => p.destinoId === dependenciaId && !p.recibidoEn).map(completarPase),
      findById: async (id) => {
        const p = pases.find((x) => x.id === id);
        return p ? completarPase(p) : null;
      },
      create: async (data) => {
        // Igual que el índice único parcial de la base: un solo pase sin recibir por expediente.
        if (pases.some((p) => p.expedienteId === data.expedienteId && !p.recibidoEn)) {
          throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
        }
        const p = { ...data, id: pases.length + 1, enviadoEn: ahora(), recibidoEn: null, recibidoPorId: null };
        pases.push(p);
        return completarPase(p);
      },
      recibir: async (id, usuarioId) => {
        const p = pases.find((x) => x.id === id);
        if (!p || p.recibidoEn) return null;
        Object.assign(p, { recibidoEn: ahora(), recibidoPorId: usuarioId });
        const e = expedientes.find((x) => x.id === p.expedienteId)!;
        Object.assign(e, { dependenciaActualId: p.destinoId, responsableId: null });
        return completarPase(p);
      },
    },

    asignaciones: {
      listByExpediente: async (expedienteId) => asignaciones.filter((a) => a.expedienteId === expedienteId),
      insert: async ({ responsableId, usuarioId, expedienteId }) => {
        asignaciones.push({
          id: asignaciones.length + 1,
          expedienteId,
          responsable: responsableId ? persona(responsableId) : null,
          usuario: persona(usuarioId),
          fecha: ahora(),
        });
      },
    },

    notificaciones: {
      crear: async ({ usuarioIds, tipo, mensaje, expedienteId }) => {
        for (const usuarioId of usuarioIds) {
          notificaciones.push({ id: notificaciones.length + 1, usuarioId, tipo, mensaje, expedienteId, creadaEn: ahora(), leidaEn: null });
        }
      },
      listDe: async (usuarioId, { soloNoLeidas, take }) =>
        notificaciones
          .filter((n) => n.usuarioId === usuarioId && (!soloNoLeidas || !n.leidaEn))
          .sort((a, b) => b.creadaEn.getTime() - a.creadaEn.getTime() || b.id - a.id)
          .slice(0, take)
          .map(({ expedienteId, ...n }) => ({ ...n, expediente: expedienteId ? expRef(expedienteId) : null })),
      contarNoLeidas: async (usuarioId) => notificaciones.filter((n) => n.usuarioId === usuarioId && !n.leidaEn).length,
      marcarLeida: async (id, usuarioId, fecha) => {
        const n = notificaciones.find((x) => x.id === id && x.usuarioId === usuarioId);
        if (!n) return false;
        n.leidaEn ??= fecha;
        return true;
      },
      marcarTodasLeidas: async (usuarioId, fecha) => {
        const pendientes = notificaciones.filter((n) => n.usuarioId === usuarioId && !n.leidaEn);
        for (const n of pendientes) n.leidaEn = fecha;
        return pendientes.length;
      },
    },

    estadisticas: {
      resumen: async (f) => {
        const lista = expedientes.filter((e) => cumpleReporte(e, f));
        const porEstado = { BORRADOR: 0, EN_TRAMITE: 0, EN_REVISION: 0, RESUELTO: 0, ARCHIVADO: 0 };
        for (const e of lista) porEstado[e.estado]++;
        const porPrioridad = { BAJA: 0, MEDIA: 0, ALTA: 0 };
        for (const e of lista) porPrioridad[e.prioridad]++;
        return {
          total: lista.length,
          porEstado,
          porPrioridad,
          porTipo: [...contar(lista, (e) => e.tipo)]
            .map(([tipo, total]) => ({ tipo, total }))
            .sort((a, b) => b.total - a.total || a.tipo.localeCompare(b.tipo)),
          porDependencia: [...contar(lista, (e) => String(e.dependenciaActualId))]
            .map(([id, total]) => ({ dependencia: depRef(Number(id)), total }))
            .sort((a, b) => b.total - a.total || a.dependencia.nombre.localeCompare(b.dependencia.nombre)),
        };
      },
      seguimiento: async ({ dependenciaId, ahora: t, hasta }) => {
        const enAlcance = (e: FilaExp) => e.activo && (!dependenciaId || e.dependenciaActualId === dependenciaId);
        const lista = expedientes.filter(enAlcance);
        const fv = (e: FilaExp) => e.fechaVencimiento?.getTime();
        const idsAlcance = new Set(lista.map((e) => e.id));
        const abiertas = tareas.filter((x) => idsAlcance.has(x.expedienteId) && (x.estado === 'PENDIENTE' || x.estado === 'EN_CURSO'));
        return {
          vencidos: lista.filter((e) => abierto(e) && fv(e) !== undefined && fv(e)! < t.getTime()).length,
          porVencer: lista.filter((e) => abierto(e) && fv(e) !== undefined && fv(e)! >= t.getTime() && fv(e)! <= hasta.getTime()).length,
          enTransito: lista.filter((e) => pases.some((p) => p.expedienteId === e.id && !p.recibidoEn)).length,
          porRecibir: pases.filter((p) => !p.recibidoEn && (!dependenciaId || p.destinoId === dependenciaId)).length,
          tareasAbiertas: abiertas.length,
          tareasVencidas: abiertas.filter((x) => x.vencimiento.getTime() < t.getTime()).length,
        };
      },
    },

    // Respaldo en memoria: exporta lo que hay; restaurar se prueba con PostgreSQL en la CI (S7-04).
    respaldo: {
      exportar: async () => ({
        dependencias: dependencias.map((d) => ({ ...d })),
        roles: roles.map(({ permisos: _p, ...r }) => ({ ...r })),
        permisos: [],
        rolesPermisos: [],
        usuarios: usuarios.map((u) => ({ ...u })),
        auditoria: auditoria.map((e, i) => ({ ...e, id: i + 1, fecha: fechasAuditoria[i] })),
        secuencias: [...secuencias].map(([anio, ultimoNumero]) => ({ anio, ultimoNumero })),
        expedientes: expedientes.map((x) => ({ ...x })),
        documentos: documentos.map(({ subidoPor, ...d }) => ({ ...d, subidoPorId: subidoPor.id })),
        actuaciones: actuaciones.map(({ autor, ...a }) => ({ ...a, autorId: autor.id })),
        cambiosEstado: cambiosEstado.map(({ usuario, ...c }) => ({ ...c, usuarioId: usuario.id })),
        tareas: tareas.map((t) => ({ ...t })),
        pases: pases.map((p) => ({ ...p })),
        asignaciones: asignaciones.map((a) => ({ ...a })),
        notificaciones: notificaciones.map((n) => ({ ...n })),
      }),
      importar: async () => {
        throw new Error('La restauración en memoria no está soportada');
      },
      conteos: async () => ({
        dependencias: dependencias.length,
        roles: roles.length,
        permisos: 0,
        rolesPermisos: 0,
        usuarios: usuarios.length,
        auditoria: auditoria.length,
        secuencias: secuencias.size,
        expedientes: expedientes.length,
        documentos: documentos.length,
        actuaciones: actuaciones.length,
        cambiosEstado: cambiosEstado.length,
        tareas: tareas.length,
        pases: pases.length,
        asignaciones: asignaciones.length,
        notificaciones: notificaciones.length,
      }),
      migraciones: async () => ['memoria'],
    },

    secuencia: {
      siguienteNumero: async (anio: number) => {
        const actual = secuencias.get(anio) ?? 0;
        const siguiente = actual + 1;
        secuencias.set(anio, siguiente);
        return siguiente;
      },
    },
  };

  const rolId = (clave: string) => roles.find((r) => r.clave === clave)!.id;

  async function agregarUsuario(email: string, password: string, rolClave: string, extra: Partial<Fila> = {}) {
    // El nombre de usuario es la parte del correo antes de la arroba (admin, funcionario...).
    const username = email.split('@')[0]!;
    return repos.usuarios.create({ username, email, nombre: username, passwordHash: await hashPassword(password), rolId: rolId(rolClave), dependenciaId: 1, ...extra });
  }

  return { repos, auditoria, sesiones, rolId, agregarUsuario, documentos, actuaciones, cambiosEstado, tareas, pases, asignaciones, expedientes, notificaciones };
}

export const PASSWORD_ADMIN = '12345';
export const PASSWORD_USUARIO = 'clave1';

/** App de prueba con repos en memoria, un administrador y un funcionario. */
export async function crearEntorno(overrides: Partial<ApiDeps> = {}) {
  const mem = crearReposEnMemoria();
  const admin = await mem.agregarUsuario('admin@institucion.test', PASSWORD_ADMIN, 'ADMINISTRADOR');
  const funcionario = await mem.agregarUsuario('funcionario@institucion.test', PASSWORD_USUARIO, 'FUNCIONARIO');
  const almacenamiento = new AlmacenamientoEnMemoria();
  const app = createApp({
    almacenamiento,
    dbCheck: async () => true,
    version: '0.1.0',
    repos: mem.repos,
    identity: new LocalIdentityProvider(mem.repos.usuarios),
    ...overrides,
  });
  return { app, ...mem, admin, funcionario, almacenamiento };
}
