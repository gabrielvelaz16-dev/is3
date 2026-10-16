/**
 * Contratos de acceso a datos (capa de persistencia, ADR-03).
 * Los servicios dependen de estas interfaces, no de Prisma: así se prueban con
 * repositorios en memoria y la implementación real vive en database/prisma/.
 */

export interface DependenciaRecord {
  id: number;
  codigo: string;
  nombre: string;
  activa: boolean;
}

export interface RolRecord {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string;
  permisos: string[];
}

export interface UsuarioRecord {
  id: number;
  username: string;
  email: string;
  nombre: string;
  passwordHash: string;
  activo: boolean;
  ultimoAcceso: Date | null;
  creadoEn: Date;
  rol: RolRecord;
  dependencia: DependenciaRecord;
}

export interface NuevoUsuario {
  username: string;
  email: string;
  nombre: string;
  passwordHash: string;
  rolId: number;
  dependenciaId: number;
}

export type CambiosUsuario = Partial<{
  nombre: string;
  passwordHash: string;
  rolId: number;
  dependenciaId: number;
  activo: boolean;
  ultimoAcceso: Date;
}>;

export interface UsuariosRepo {
  findByUsername(username: string): Promise<UsuarioRecord | null>;
  findByEmail(email: string): Promise<UsuarioRecord | null>;
  findById(id: number): Promise<UsuarioRecord | null>;
  list(params: { q?: string; skip: number; take: number }): Promise<{ items: UsuarioRecord[]; total: number }>;
  create(data: NuevoUsuario): Promise<UsuarioRecord>;
  update(id: number, data: CambiosUsuario): Promise<UsuarioRecord>;
  /** Cantidad de usuarios activos con un rol, opcionalmente excluyendo uno. */
  countActivosConRol(rolClave: string, excluirId?: number): Promise<number>;
  /** Usuarios activos de una dependencia (para asignar responsables y tareas, Sprint 5). */
  listActivosDeDependencia(dependenciaId: number): Promise<{ id: number; nombre: string; username: string }[]>;
  /** Ids de usuarios activos de una dependencia cuyo rol tiene un permiso (avisos, Sprint 6). */
  listIdsConPermiso(dependenciaId: number, permiso: string): Promise<number[]>;
}

export interface RolesRepo {
  list(): Promise<RolRecord[]>;
  findById(id: number): Promise<RolRecord | null>;
}

export interface DependenciasRepo {
  list(): Promise<DependenciaRecord[]>;
  findById(id: number): Promise<DependenciaRecord | null>;
}

export interface SesionRecord {
  id: string;
  usuarioId: number;
  expiraEn: Date;
}

export interface SesionesRepo {
  create(data: SesionRecord & { ip?: string; userAgent?: string }): Promise<void>;
  findById(id: string): Promise<SesionRecord | null>;
  delete(id: string): Promise<void>;
  deleteByUsuario(usuarioId: number): Promise<void>;
}

export interface EventoAuditoria {
  usuarioId?: number | null;
  accion: string;
  resultado: 'EXITO' | 'FALLO';
  entidad?: string;
  entidadId?: string;
  detalle?: Record<string, unknown>;
  ip?: string;
  requestId?: string;
}

export interface AuditoriaRepo {
  insert(evento: EventoAuditoria): Promise<void>;
}

// ── Sprint 3: Expedientes ──────────────────────────────────────────

export type EstadoExpediente = 'BORRADOR' | 'EN_TRAMITE' | 'EN_REVISION' | 'RESUELTO' | 'ARCHIVADO';
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';

export interface ExpedienteRecord {
  id: number;
  numero: string;
  caratula: string;
  asunto: string;
  tipo: string;
  iniciador: string;
  estado: EstadoExpediente;
  prioridad: Prioridad;
  dependenciaActualId: number;
  creadoPorId: number;
  responsableId: number | null;
  fechaVencimiento: Date | null;
  descripcion: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  dependenciaActual: DependenciaRecord;
  creadoPor: { id: number; nombre: string; username: string };
  responsable: { id: number; nombre: string; username: string } | null;
  /** Pase sin recibir (Sprint 5): mientras exista, el expediente está "en tránsito". */
  paseEnTransito: { id: number; destino: DependenciaRef; enviadoEn: Date } | null;
}

export type DependenciaRef = Pick<DependenciaRecord, 'id' | 'codigo' | 'nombre'>;

export interface NuevoExpediente {
  numero: string;
  caratula: string;
  asunto: string;
  tipo: string;
  iniciador: string;
  estado?: EstadoExpediente;
  prioridad?: Prioridad;
  dependenciaActualId: number;
  creadoPorId: number;
  responsableId?: number | null;
  fechaVencimiento?: Date | null;
  descripcion?: string | null;
}

export type CambiosExpediente = Partial<{
  caratula: string;
  asunto: string;
  tipo: string;
  iniciador: string;
  estado: EstadoExpediente;
  prioridad: Prioridad;
  dependenciaActualId: number;
  responsableId: number | null;
  fechaVencimiento: Date | null;
  descripcion: string | null;
}>;

/** Filtros comunes del listado y de los reportes (Sprint 6: tipo y rango de fechas de creación). */
export interface FiltrosReporte {
  estado?: EstadoExpediente;
  prioridad?: Prioridad;
  dependenciaId?: number;
  tipo?: string;
  /** Creados desde esta fecha (inclusive). */
  desde?: Date;
  /** Creados hasta esta fecha (inclusive). */
  hasta?: Date;
}

export interface FiltrosExpediente extends FiltrosReporte {
  q?: string;
  skip: number;
  take: number;
}

export interface ExpedientesRepo {
  /** Expedientes no resueltos ni archivados que vencen hasta `hasta` (pendientes, Sprint 5). */
  listPorVencer(params: { dependenciaId?: number; hasta: Date }): Promise<ExpedienteRecord[]>;
  findById(id: number): Promise<ExpedienteRecord | null>;
  findByNumero(numero: string): Promise<ExpedienteRecord | null>;
  list(filtros: FiltrosExpediente): Promise<{ items: ExpedienteRecord[]; total: number }>;
  create(data: NuevoExpediente): Promise<ExpedienteRecord>;
  update(id: number, data: CambiosExpediente): Promise<ExpedienteRecord>;
}

export interface SecuenciaRepo {
  /** Incrementa atómicamente y devuelve el próximo número para el año dado. */
  siguienteNumero(anio: number): Promise<number>;
}

// ── Sprint 4: Documentos, actuaciones y cambios de estado ─────────

export interface PersonaRef {
  id: number;
  nombre: string;
  username: string;
}

export interface DocumentoRecord {
  id: number;
  expedienteId: number;
  nombreOriginal: string;
  /** Nombre aleatorio en el almacenamiento; no sale por la API. */
  nombreAlmacenado: string;
  tipoMime: string;
  tamanoBytes: number;
  hashSha256: string;
  descripcion: string | null;
  subidoEn: Date;
  subidoPor: PersonaRef;
}

export type NuevoDocumento = Omit<DocumentoRecord, 'id' | 'subidoEn' | 'subidoPor'> & { subidoPorId: number };

export interface DocumentosRepo {
  listByExpediente(expedienteId: number): Promise<DocumentoRecord[]>;
  findById(id: number): Promise<DocumentoRecord | null>;
  create(data: NuevoDocumento): Promise<DocumentoRecord>;
}

export type TipoActuacion = 'ACTUACION' | 'OBSERVACION';

export interface ActuacionRecord {
  id: number;
  expedienteId: number;
  tipo: TipoActuacion;
  texto: string;
  fecha: Date;
  autor: PersonaRef;
}

export interface ActuacionesRepo {
  listByExpediente(expedienteId: number): Promise<ActuacionRecord[]>;
  create(data: { expedienteId: number; tipo: TipoActuacion; texto: string; autorId: number }): Promise<ActuacionRecord>;
}

export interface CambioEstadoRecord {
  id: number;
  expedienteId: number;
  estadoAnterior: EstadoExpediente | null;
  estadoNuevo: EstadoExpediente;
  motivo: string | null;
  fecha: Date;
  usuario: PersonaRef;
}

export interface CambiosEstadoRepo {
  listByExpediente(expedienteId: number): Promise<CambioEstadoRecord[]>;
  insert(data: {
    expedienteId: number;
    estadoAnterior: EstadoExpediente | null;
    estadoNuevo: EstadoExpediente;
    motivo?: string | null;
    usuarioId: number;
  }): Promise<void>;
}

// ── Sprint 5: Tareas, pases y asignaciones ────────────────────────

export type EstadoTarea = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';

export interface ExpedienteRef {
  id: number;
  numero: string;
  caratula: string;
}

export interface TareaRecord {
  id: number;
  expedienteId: number;
  titulo: string;
  descripcion: string | null;
  vencimiento: Date;
  estado: EstadoTarea;
  creadaEn: Date;
  cerradaEn: Date | null;
  asignadoA: PersonaRef;
  creadoPor: PersonaRef;
  expediente: ExpedienteRef;
}

export interface TareasRepo {
  listByExpediente(expedienteId: number): Promise<TareaRecord[]>;
  /** Tareas pendientes o en curso asignadas a un usuario, por vencimiento. */
  listAbiertasDe(usuarioId: number): Promise<TareaRecord[]>;
  findById(id: number): Promise<TareaRecord | null>;
  create(data: {
    expedienteId: number;
    titulo: string;
    descripcion: string | null;
    asignadoAId: number;
    creadoPorId: number;
    vencimiento: Date;
  }): Promise<TareaRecord>;
  actualizarEstado(id: number, estado: EstadoTarea, cerradaEn: Date | null): Promise<TareaRecord>;
}

export interface PaseRecord {
  id: number;
  expedienteId: number;
  origen: DependenciaRef;
  destino: DependenciaRef;
  motivo: string;
  enviadoEn: Date;
  enviadoPor: PersonaRef;
  recibidoEn: Date | null;
  recibidoPor: PersonaRef | null;
  expediente: ExpedienteRef;
}

export interface PasesRepo {
  listByExpediente(expedienteId: number): Promise<PaseRecord[]>;
  /** Bandeja de entrada: pases sin recibir hacia una dependencia. */
  listPendientesHacia(dependenciaId: number): Promise<PaseRecord[]>;
  findById(id: number): Promise<PaseRecord | null>;
  create(data: { expedienteId: number; origenId: number; destinoId: number; motivo: string; enviadoPorId: number }): Promise<PaseRecord>;
  /**
   * Registra la recepción y pasa el expediente a la dependencia destino (sin responsable),
   * todo junto. Devuelve null si el pase ya había sido recibido.
   */
  recibir(id: number, usuarioId: number): Promise<PaseRecord | null>;
}

export interface AsignacionRecord {
  id: number;
  expedienteId: number;
  responsable: PersonaRef | null;
  usuario: PersonaRef;
  fecha: Date;
}

export interface AsignacionesRepo {
  listByExpediente(expedienteId: number): Promise<AsignacionRecord[]>;
  insert(data: { expedienteId: number; responsableId: number | null; usuarioId: number }): Promise<void>;
}

// ── Sprint 6: Notificaciones, estadísticas y reportes ─────────────

export type TipoNotificacion = 'EXPEDIENTE_ASIGNADO' | 'TAREA_ASIGNADA' | 'PASE_ENTRANTE';

export interface NotificacionRecord {
  id: number;
  usuarioId: number;
  tipo: TipoNotificacion;
  mensaje: string;
  expediente: ExpedienteRef | null;
  creadaEn: Date;
  leidaEn: Date | null;
}

export interface NotificacionesRepo {
  crear(data: { usuarioIds: number[]; tipo: TipoNotificacion; mensaje: string; expedienteId: number | null }): Promise<void>;
  /** Las más recientes primero. */
  listDe(usuarioId: number, params: { soloNoLeidas: boolean; take: number }): Promise<NotificacionRecord[]>;
  contarNoLeidas(usuarioId: number): Promise<number>;
  /** false si la notificación no existe o es de otro usuario. */
  marcarLeida(id: number, usuarioId: number, fecha: Date): Promise<boolean>;
  marcarTodasLeidas(usuarioId: number, fecha: Date): Promise<number>;
}

export interface ResumenExpedientes {
  total: number;
  porEstado: Record<EstadoExpediente, number>;
  porPrioridad: Record<Prioridad, number>;
  porTipo: { tipo: string; total: number }[];
  porDependencia: { dependencia: DependenciaRef; total: number }[];
}

export interface IndicadoresSeguimiento {
  /** Abiertos (no resueltos ni archivados) con vencimiento anterior a ahora. */
  vencidos: number;
  /** Abiertos que vencen entre ahora y `hasta`. */
  porVencer: number;
  /** Expedientes del alcance con un pase sin recibir (salieron y todavía no llegaron). */
  enTransito: number;
  /** Pases sin recibir hacia la dependencia (sin dependencia: todos los pases sin recibir). */
  porRecibir: number;
  /** Tareas pendientes o en curso de expedientes del alcance. */
  tareasAbiertas: number;
  /** De esas, las que ya vencieron. */
  tareasVencidas: number;
}

export interface EstadisticasRepo {
  resumen(filtros: FiltrosReporte): Promise<ResumenExpedientes>;
  seguimiento(params: { dependenciaId?: number; ahora: Date; hasta: Date }): Promise<IndicadoresSeguimiento>;
}

export interface Repos {
  usuarios: UsuariosRepo;
  roles: RolesRepo;
  dependencias: DependenciasRepo;
  sesiones: SesionesRepo;
  auditoria: AuditoriaRepo;
  expedientes: ExpedientesRepo;
  secuencia: SecuenciaRepo;
  documentos: DocumentosRepo;
  actuaciones: ActuacionesRepo;
  cambiosEstado: CambiosEstadoRepo;
  tareas: TareasRepo;
  pases: PasesRepo;
  asignaciones: AsignacionesRepo;
  notificaciones: NotificacionesRepo;
  estadisticas: EstadisticasRepo;
}
