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

export interface ExpedienteRecord {
  id: number;
  numero: string;
  caratula: string;
  asunto: string;
  tipo: string;
  iniciador: string;
  estado: string;
  prioridad: string;
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
}

export interface NuevoExpediente {
  numero: string;
  caratula: string;
  asunto: string;
  tipo: string;
  iniciador: string;
  estado?: string;
  prioridad?: string;
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
  estado: string;
  prioridad: string;
  dependenciaActualId: number;
  responsableId: number | null;
  fechaVencimiento: Date | null;
  descripcion: string | null;
}>;

export interface FiltrosExpediente {
  q?: string;
  estado?: string;
  prioridad?: string;
  dependenciaId?: number;
  skip: number;
  take: number;
}

export interface ExpedientesRepo {
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

export interface Repos {
  usuarios: UsuariosRepo;
  roles: RolesRepo;
  dependencias: DependenciasRepo;
  sesiones: SesionesRepo;
  auditoria: AuditoriaRepo;
  expedientes: ExpedientesRepo;
  secuencia: SecuenciaRepo;
}
