/**
 * Tareas y vencimientos — Sprint 5 (S5-02, RF-13).
 * Una tarea tiene responsable (de la dependencia del expediente) y vencimiento obligatorio.
 */
import type { EstadoTarea, ExpedienteRecord, Repos, TareaRecord } from '../../database/repositories.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors.js';
import type { AuditoriaService, Contexto } from '../auditoria/auditoria.service.js';
import { type ExpedientesService, verificarEditable } from '../expedientes/expedientes.service.js';

export const ESTADOS_TAREA = ['PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA'] as const satisfies readonly EstadoTarea[];

export const TRANSICIONES_TAREA: Record<EstadoTarea, readonly EstadoTarea[]> = {
  PENDIENTE: ['EN_CURSO', 'COMPLETADA', 'CANCELADA'],
  EN_CURSO: ['PENDIENTE', 'COMPLETADA', 'CANCELADA'],
  COMPLETADA: [],
  CANCELADA: [],
};

const CERRADAS: readonly EstadoTarea[] = ['COMPLETADA', 'CANCELADA'];

export class TareasService {
  constructor(
    private readonly repos: Repos,
    private readonly expedientes: ExpedientesService,
    private readonly auditoria: AuditoriaService,
    private readonly opciones: { now?: () => Date } = {},
  ) {}

  private ahora() {
    return this.opciones.now?.() ?? new Date();
  }

  async listar(expedienteId: number): Promise<TareaRecord[]> {
    return this.repos.tareas.listByExpediente(expedienteId);
  }

  async crear(
    expediente: ExpedienteRecord,
    input: { titulo: string; descripcion?: string | null; asignadoAId: number; vencimiento: string },
    usuarioId: number,
    ctx: Contexto = {},
  ): Promise<TareaRecord> {
    verificarEditable(expediente, 'crear tareas en');
    const vencimiento = new Date(input.vencimiento);
    if (vencimiento.getTime() < this.ahora().getTime()) {
      throw new ValidationError([{ field: 'vencimiento', message: 'El vencimiento no puede estar en el pasado' }]);
    }
    await this.expedientes.verificarDeLaDependencia(input.asignadoAId, expediente.dependenciaActualId, 'asignadoAId');

    const tarea = await this.repos.tareas.create({
      expedienteId: expediente.id,
      titulo: input.titulo.trim(),
      descripcion: input.descripcion?.trim() || null,
      asignadoAId: input.asignadoAId,
      creadoPorId: usuarioId,
      vencimiento,
    });
    await this.auditoria.registrar({ ...ctx, usuarioId }, {
      accion: 'tarea.crear',
      resultado: 'EXITO',
      entidad: 'Tarea',
      entidadId: String(tarea.id),
      detalle: { expediente: expediente.numero, asignadoA: input.asignadoAId, vencimiento: vencimiento.toISOString() },
    });
    return tarea;
  }

  /**
   * Cambia el estado de una tarea. Puede hacerlo quien la tiene asignada, quien la creó
   * o quien puede asignar responsables (jefe de dependencia).
   */
  async cambiarEstado(
    tareaId: number,
    estado: EstadoTarea,
    usuario: { id: number; permisos: string[] },
    ctx: Contexto = {},
  ): Promise<TareaRecord> {
    const tarea = await this.repos.tareas.findById(tareaId);
    if (!tarea) throw new NotFoundError('Tarea no encontrada');
    const autorizado =
      tarea.asignadoA.id === usuario.id || tarea.creadoPor.id === usuario.id || usuario.permisos.includes('responsables.asignar');
    if (!autorizado) throw new ForbiddenError('Solo quien tiene la tarea, quien la creó o el jefe de la dependencia puede cambiarla');
    if (!TRANSICIONES_TAREA[tarea.estado].includes(estado)) {
      throw new ConflictError(`Transición de tarea no permitida: ${tarea.estado} → ${estado}`);
    }

    const actualizada = await this.repos.tareas.actualizarEstado(tareaId, estado, CERRADAS.includes(estado) ? this.ahora() : null);
    await this.auditoria.registrar({ ...ctx, usuarioId: usuario.id }, {
      accion: 'tarea.cambiar_estado',
      resultado: 'EXITO',
      entidad: 'Tarea',
      entidadId: String(tareaId),
      detalle: { estado: `${tarea.estado} → ${estado}`, expediente: tarea.expediente.numero },
    });
    return actualizada;
  }
}
