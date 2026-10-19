/**
 * Servicio de expedientes — Sprint 3 (S3-01 a S3-06), corregido antes del Sprint 4 (D-04 a D-07).
 * Sprint 5: el estado y el responsable se cambian con acciones propias (S5-01, S5-03).
 * Reglas de negocio para crear, consultar, modificar y listar expedientes.
 */
import type {
  CambiosExpediente,
  EstadoExpediente,
  ExpedienteRecord,
  FiltrosExpediente,
  NuevoExpediente,
  Prioridad,
  Repos,
} from '../../database/repositories.js';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors.js';
import { textoEstado } from '../../shared/etiquetas.js';
import type { AuditoriaService, Contexto } from '../auditoria/auditoria.service.js';
import type { NotificacionesService } from '../notificaciones/notificaciones.service.js';

export const TIPOS_EXPEDIENTE = [
  'NOTA',
  'RESOLUCION',
  'DICTAMEN',
  'INFORME',
  'SOLICITUD',
  'DENUNCIA',
  'RECLAMO',
  'OTRO',
] as const;

export const ESTADOS_EXPEDIENTE = [
  'BORRADOR',
  'EN_TRAMITE',
  'EN_REVISION',
  'RESUELTO',
  'ARCHIVADO',
] as const satisfies readonly EstadoExpediente[];

export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'] as const satisfies readonly Prioridad[];

/** Transiciones válidas del expediente (máquina de estados, RF-14). */
export const TRANSICIONES: Record<EstadoExpediente, readonly EstadoExpediente[]> = {
  BORRADOR: ['EN_TRAMITE'],
  EN_TRAMITE: ['EN_REVISION', 'RESUELTO'],
  EN_REVISION: ['EN_TRAMITE', 'RESUELTO'],
  RESUELTO: ['ARCHIVADO', 'EN_TRAMITE'],
  ARCHIVADO: [],
};

/**
 * Un expediente archivado o en tránsito hacia otra dependencia no admite cambios,
 * documentos, actuaciones, tareas ni asignaciones (409). Sí se puede consultar.
 */
export function verificarEditable(
  expediente: Pick<ExpedienteRecord, 'estado' | 'paseEnTransito'>,
  accion: string,
): void {
  if (expediente.estado === 'ARCHIVADO') {
    throw new ConflictError(`No se puede ${accion} un expediente archivado`);
  }
  if (expediente.paseEnTransito) {
    throw new ConflictError(
      `El expediente está en tránsito hacia ${expediente.paseEnTransito.destino.nombre}. No se puede ${accion} un expediente en tránsito hasta que la dependencia destino lo reciba`,
    );
  }
}

/** Formato: EXP-AAAA-NNNNNN */
export function formatearNumero(anio: number, secuencial: number): string {
  return `EXP-${anio}-${String(secuencial).padStart(6, '0')}`;
}

export interface CrearExpedienteInput {
  caratula: string;
  asunto: string;
  tipo: string;
  iniciador: string;
  prioridad?: Prioridad;
  descripcion?: string | null;
  fechaVencimiento?: string | null;
}

/** Datos generales. El estado y el responsable tienen acciones propias (Sprint 5). */
export interface ModificarExpedienteInput {
  caratula?: string;
  asunto?: string;
  tipo?: string;
  iniciador?: string;
  prioridad?: Prioridad;
  descripcion?: string | null;
  fechaVencimiento?: string | null;
}

export class ExpedientesService {
  constructor(
    private repos: Repos,
    private auditoria: AuditoriaService,
    private opciones: { now?: () => Date; notificaciones?: NotificacionesService } = {},
  ) {}

  private ahora() {
    return this.opciones.now?.() ?? new Date();
  }

  async crear(
    input: CrearExpedienteInput,
    usuarioId: number,
    dependenciaId: number,
    ctx: Contexto = {},
  ): Promise<ExpedienteRecord> {
    // Generar número único
    const anio = this.ahora().getFullYear();
    const secuencial = await this.repos.secuencia.siguienteNumero(anio);
    const numero = formatearNumero(anio, secuencial);

    const data: NuevoExpediente = {
      numero,
      caratula: input.caratula,
      asunto: input.asunto,
      tipo: input.tipo,
      iniciador: input.iniciador,
      prioridad: input.prioridad ?? 'MEDIA',
      descripcion: input.descripcion ?? null,
      fechaVencimiento: input.fechaVencimiento ? new Date(input.fechaVencimiento) : null,
      dependenciaActualId: dependenciaId,
      creadoPorId: usuarioId,
    };

    const expediente = await this.repos.expedientes.create(data);

    await this.auditoria.registrar({ ...ctx, usuarioId }, {
      accion: 'expediente.crear',
      resultado: 'EXITO',
      entidad: 'Expediente',
      entidadId: String(expediente.id),
      detalle: { numero },
    });

    return expediente;
  }

  async obtener(id: number): Promise<ExpedienteRecord | null> {
    return this.repos.expedientes.findById(id);
  }

  async listar(filtros: FiltrosExpediente): Promise<{ items: ExpedienteRecord[]; total: number }> {
    return this.repos.expedientes.list(filtros);
  }

  async modificar(
    id: number,
    input: ModificarExpedienteInput,
    usuarioId: number,
    ctx: Contexto = {},
  ): Promise<ExpedienteRecord> {
    const existente = await this.repos.expedientes.findById(id);
    if (!existente) throw new NotFoundError('Expediente no encontrado');
    verificarEditable(existente, 'modificar');

    const cambios: CambiosExpediente = {};
    if (input.caratula !== undefined) cambios.caratula = input.caratula;
    if (input.asunto !== undefined) cambios.asunto = input.asunto;
    if (input.tipo !== undefined) cambios.tipo = input.tipo;
    if (input.iniciador !== undefined) cambios.iniciador = input.iniciador;
    if (input.prioridad !== undefined) cambios.prioridad = input.prioridad;
    if (input.descripcion !== undefined) cambios.descripcion = input.descripcion;
    if (input.fechaVencimiento !== undefined) {
      cambios.fechaVencimiento = input.fechaVencimiento ? new Date(input.fechaVencimiento) : null;
    }

    const actualizado = await this.repos.expedientes.update(id, cambios);

    await this.auditoria.registrar({ ...ctx, usuarioId }, {
      accion: 'expediente.modificar',
      resultado: 'EXITO',
      entidad: 'Expediente',
      entidadId: String(id),
      detalle: { cambios: Object.keys(cambios) },
    });

    return actualizado;
  }

  /** S5-03: cambio de estado según la máquina de estados (RF-14). Queda en el historial con su motivo. */
  async cambiarEstado(
    expediente: ExpedienteRecord,
    estado: EstadoExpediente,
    motivo: string | null,
    usuarioId: number,
    ctx: Contexto = {},
  ): Promise<ExpedienteRecord> {
    verificarEditable(expediente, 'cambiar el estado de');
    this.validarTransicion(expediente.estado, estado);
    return this.aplicarEstado(expediente, estado, motivo, usuarioId, ctx);
  }

  /** Aplica una transición ya validada (la usa también el envío de un expediente en borrador). */
  async aplicarEstado(
    expediente: ExpedienteRecord,
    estado: EstadoExpediente,
    motivo: string | null,
    usuarioId: number,
    ctx: Contexto = {},
  ): Promise<ExpedienteRecord> {
    const actualizado = await this.repos.expedientes.update(expediente.id, { estado });
    await this.repos.cambiosEstado.insert({
      expedienteId: expediente.id,
      estadoAnterior: expediente.estado,
      estadoNuevo: estado,
      motivo,
      usuarioId,
    });
    await this.auditoria.registrar({ ...ctx, usuarioId }, {
      accion: 'expediente.cambiar_estado',
      resultado: 'EXITO',
      entidad: 'Expediente',
      entidadId: String(expediente.id),
      detalle: { estado: `${expediente.estado} → ${estado}`, ...(motivo ? { motivo } : {}) },
    });
    return actualizado;
  }

  /** S5-01: asigna (o quita, con null) el responsable. Debe ser un usuario activo de la dependencia del expediente. */
  async asignarResponsable(
    expediente: ExpedienteRecord,
    responsableId: number | null,
    usuarioId: number,
    ctx: Contexto = {},
  ): Promise<ExpedienteRecord> {
    verificarEditable(expediente, 'asignar el responsable de');
    if (responsableId !== null) await this.verificarDeLaDependencia(responsableId, expediente.dependenciaActualId, 'responsableId');

    const actualizado = await this.repos.expedientes.update(expediente.id, { responsableId });
    await this.repos.asignaciones.insert({ expedienteId: expediente.id, responsableId, usuarioId });
    await this.auditoria.registrar({ ...ctx, usuarioId }, {
      accion: 'expediente.asignar_responsable',
      resultado: 'EXITO',
      entidad: 'Expediente',
      entidadId: String(expediente.id),
      detalle: { anterior: expediente.responsableId, nuevo: responsableId },
    });
    if (responsableId !== null && responsableId !== expediente.responsableId) {
      await this.opciones.notificaciones?.notificar({
        usuarioIds: [responsableId],
        tipo: 'EXPEDIENTE_ASIGNADO',
        mensaje: `Le asignaron el expediente ${expediente.numero}: ${expediente.caratula}`,
        expedienteId: expediente.id,
        autorId: usuarioId,
      });
    }
    return actualizado;
  }

  /** Usuario activo que pertenece a la dependencia indicada; si no, 400 sobre el campo indicado. */
  async verificarDeLaDependencia(usuarioId: number, dependenciaId: number, campo: string): Promise<void> {
    const u = await this.repos.usuarios.findById(usuarioId);
    if (!u || !u.activo || u.dependencia.id !== dependenciaId) {
      const mensaje = 'Debe ser un usuario activo de la dependencia donde está el expediente';
      throw new ValidationError([{ field: campo, message: mensaje }], mensaje);
    }
  }

  /** 409 si la transición no está permitida por la máquina de estados (contrato de la API). */
  validarTransicion(desde: EstadoExpediente, hacia: EstadoExpediente): void {
    if (!TRANSICIONES[desde].includes(hacia)) {
      throw new ConflictError(`No se puede pasar de ${textoEstado(desde)} a ${textoEstado(hacia)}`);
    }
  }
}
