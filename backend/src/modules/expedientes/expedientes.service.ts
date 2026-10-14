/**
 * Servicio de expedientes — Sprint 3 (S3-01 a S3-06).
 * Reglas de negocio para crear, consultar, modificar y listar expedientes.
 */
import type {
  CambiosExpediente,
  ExpedienteRecord,
  ExpedientesRepo,
  FiltrosExpediente,
  NuevoExpediente,
  Repos,
  SecuenciaRepo,
} from '../../database/repositories.js';
import type { AuditoriaService } from '../auditoria/auditoria.service.js';

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
] as const;

export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'] as const;

/** Formato: EXP-AAAA-NNNNNN */
export function formatearNumero(anio: number, secuencial: number): string {
  return `EXP-${anio}-${String(secuencial).padStart(6, '0')}`;
}

export interface CrearExpedienteInput {
  caratula: string;
  asunto: string;
  tipo: string;
  iniciador: string;
  prioridad?: string;
  descripcion?: string | null;
  fechaVencimiento?: string | null;
  responsableId?: number | null;
}

export interface ModificarExpedienteInput {
  caratula?: string;
  asunto?: string;
  tipo?: string;
  iniciador?: string;
  prioridad?: string;
  estado?: string;
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
    meta?: { ip?: string; requestId?: string },
  ): Promise<ExpedienteRecord> {
    // Validar que el responsable, si se indica, sea un usuario activo
    if (input.responsableId) {
      const resp = await this.repos.usuarios.findById(input.responsableId);
      if (!resp || !resp.activo) {
        throw Object.assign(new Error('El responsable indicado no existe o está inactivo'), { statusCode: 400 });
      }
    }

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

    await this.auditoria.registrar({
      usuarioId,
      accion: 'expediente.crear',
      resultado: 'EXITO',
      entidad: 'Expediente',
      entidadId: String(expediente.id),
      detalle: { numero },
      ip: meta?.ip,
      requestId: meta?.requestId,
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
    meta?: { ip?: string; requestId?: string },
  ): Promise<ExpedienteRecord> {
    const existente = await this.repos.expedientes.findById(id);
    if (!existente) {
      throw Object.assign(new Error('Expediente no encontrado'), { statusCode: 404 });
    }

    // No se puede modificar un expediente archivado
    if (existente.estado === 'ARCHIVADO') {
      throw Object.assign(new Error('No se puede modificar un expediente archivado'), { statusCode: 400 });
    }

    // Validar responsable si se cambia
    if (input.responsableId !== undefined && input.responsableId !== null) {
      const resp = await this.repos.usuarios.findById(input.responsableId);
      if (!resp || !resp.activo) {
        throw Object.assign(new Error('El responsable indicado no existe o está inactivo'), { statusCode: 400 });
      }
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

    await this.auditoria.registrar({
      usuarioId,
      accion: 'expediente.modificar',
      resultado: 'EXITO',
      entidad: 'Expediente',
      entidadId: String(id),
      detalle: { cambios: Object.keys(cambios) },
      ip: meta?.ip,
      requestId: meta?.requestId,
    });

    return actualizado;
  }

  /** Transiciones válidas del expediente. */
  private validarTransicion(desde: string, hacia: string): void {
    const transiciones: Record<string, string[]> = {
      BORRADOR: ['EN_TRAMITE'],
      EN_TRAMITE: ['EN_REVISION', 'RESUELTO'],
      EN_REVISION: ['EN_TRAMITE', 'RESUELTO'],
      RESUELTO: ['ARCHIVADO', 'EN_TRAMITE'],
      ARCHIVADO: [],
    };
    const permitidas = transiciones[desde];
    if (!permitidas?.includes(hacia)) {
      throw Object.assign(
        new Error(`Transición de estado no permitida: ${desde} → ${hacia}`),
        { statusCode: 400 },
      );
    }
  }
}
