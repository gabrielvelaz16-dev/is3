/**
 * Servicio de expedientes — Sprint 3 (S3-01 a S3-06), corregido antes del Sprint 4 (D-04 a D-07).
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
import type { AuditoriaService, Contexto } from '../auditoria/auditoria.service.js';

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

/** Un expediente archivado no admite cambios, documentos ni actuaciones. */
export function verificarNoArchivado(expediente: Pick<ExpedienteRecord, 'estado'>, accion: string): void {
  if (expediente.estado === 'ARCHIVADO') {
    throw new ConflictError(`No se puede ${accion} un expediente archivado`);
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
  responsableId?: number | null;
}

export interface ModificarExpedienteInput {
  caratula?: string;
  asunto?: string;
  tipo?: string;
  iniciador?: string;
  prioridad?: Prioridad;
  estado?: EstadoExpediente;
  descripcion?: string | null;
  fechaVencimiento?: string | null;
  responsableId?: number | null;
}

export class ExpedientesService {
  constructor(
    private repos: Repos,
    private auditoria: AuditoriaService,
    private opciones: { now?: () => Date } = {},
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
    if (input.responsableId) await this.verificarResponsable(input.responsableId);

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
      responsableId: input.responsableId ?? null,
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
    verificarNoArchivado(existente, 'modificar');

    if (input.responsableId !== undefined && input.responsableId !== null) {
      await this.verificarResponsable(input.responsableId);
    }

    // Validar transiciones de estado
    if (input.estado && input.estado !== existente.estado) {
      this.validarTransicion(existente.estado, input.estado);
    }

    const cambios: CambiosExpediente = {};
    if (input.caratula !== undefined) cambios.caratula = input.caratula;
    if (input.asunto !== undefined) cambios.asunto = input.asunto;
    if (input.tipo !== undefined) cambios.tipo = input.tipo;
    if (input.iniciador !== undefined) cambios.iniciador = input.iniciador;
    if (input.prioridad !== undefined) cambios.prioridad = input.prioridad;
    if (input.estado !== undefined) cambios.estado = input.estado;
    if (input.descripcion !== undefined) cambios.descripcion = input.descripcion;
    if (input.fechaVencimiento !== undefined) {
      cambios.fechaVencimiento = input.fechaVencimiento ? new Date(input.fechaVencimiento) : null;
    }
    if (input.responsableId !== undefined) cambios.responsableId = input.responsableId;

    const actualizado = await this.repos.expedientes.update(id, cambios);

    // Historial (S4-04): cada transición queda en una tabla de solo inserción.
    if (cambios.estado && cambios.estado !== existente.estado) {
      await this.repos.cambiosEstado.insert({
        expedienteId: id,
        estadoAnterior: existente.estado,
        estadoNuevo: cambios.estado,
        usuarioId,
      });
    }

    await this.auditoria.registrar({ ...ctx, usuarioId }, {
      accion: 'expediente.modificar',
      resultado: 'EXITO',
      entidad: 'Expediente',
      entidadId: String(id),
      detalle: { cambios: Object.keys(cambios), ...(cambios.estado ? { estado: `${existente.estado} → ${cambios.estado}` } : {}) },
    });

    return actualizado;
  }

  private async verificarResponsable(responsableId: number): Promise<void> {
    const resp = await this.repos.usuarios.findById(responsableId);
    if (!resp || !resp.activo) {
      throw new ValidationError(
        [{ field: 'responsableId', message: 'El responsable indicado no existe o está inactivo' }],
        'El responsable indicado no existe o está inactivo',
      );
    }
  }

  /** 409 si la transición no está permitida por la máquina de estados (contrato de la API). */
  private validarTransicion(desde: EstadoExpediente, hacia: EstadoExpediente): void {
    if (!TRANSICIONES[desde].includes(hacia)) {
      throw new ConflictError(`Transición de estado no permitida: ${desde} → ${hacia}`);
    }
  }
}
