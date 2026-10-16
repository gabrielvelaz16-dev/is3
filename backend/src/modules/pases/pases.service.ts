/**
 * Pases entre dependencias — Sprint 5 (S5-04, S5-05; RF-15, RF-16).
 * Enviar deja el expediente "en tránsito" (no se puede modificar); recién al confirmar la
 * recepción pasa a la dependencia destino, sin responsable, para que lo asigne la nueva dependencia.
 */
import type { ExpedienteRecord, PaseRecord, Repos } from '../../database/repositories.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors.js';
import type { AuditoriaService, Contexto } from '../auditoria/auditoria.service.js';
import { type ExpedientesService, verificarEditable } from '../expedientes/expedientes.service.js';
import type { NotificacionesService } from '../notificaciones/notificaciones.service.js';

export class PasesService {
  constructor(
    private readonly repos: Repos,
    private readonly expedientes: ExpedientesService,
    private readonly auditoria: AuditoriaService,
    private readonly notificaciones?: NotificacionesService,
  ) {}

  async enviar(
    expediente: ExpedienteRecord,
    input: { destinoId: number; motivo: string },
    usuarioId: number,
    ctx: Contexto = {},
  ): Promise<PaseRecord> {
    verificarEditable(expediente, 'enviar');

    const destino = await this.repos.dependencias.findById(input.destinoId);
    if (!destino || !destino.activa) {
      throw new ValidationError([{ field: 'destinoId', message: 'La dependencia destino no existe o está inactiva' }]);
    }
    if (destino.id === expediente.dependenciaActualId) {
      throw new ValidationError([{ field: 'destinoId', message: 'El expediente ya está en esa dependencia' }]);
    }

    let pase: PaseRecord;
    try {
      pase = await this.repos.pases.create({
        expedienteId: expediente.id,
        origenId: expediente.dependenciaActualId,
        destinoId: destino.id,
        motivo: input.motivo.trim(),
        enviadoPorId: usuarioId,
      });
    } catch (err) {
      // Índice único parcial: dos envíos simultáneos del mismo expediente.
      if ((err as { code?: string }).code === 'P2002') throw new ConflictError('El expediente ya está en tránsito');
      throw err;
    }

    // Un expediente en borrador queda registrado (en trámite) al enviarse por primera vez.
    if (expediente.estado === 'BORRADOR') {
      await this.expedientes.aplicarEstado(expediente, 'EN_TRAMITE', 'Registrado al enviarse', usuarioId, ctx);
    }

    await this.auditoria.registrar({ ...ctx, usuarioId }, {
      accion: 'expediente.enviar',
      resultado: 'EXITO',
      entidad: 'Pase',
      entidadId: String(pase.id),
      detalle: { expediente: expediente.numero, origen: pase.origen.codigo, destino: pase.destino.codigo },
    });
    // Aviso a quienes pueden confirmar la recepción en la dependencia destino (S5-06).
    await this.notificaciones?.notificarDependencia(destino.id, 'expedientes.recibir', {
      tipo: 'PASE_ENTRANTE',
      mensaje: `Llegó el expediente ${expediente.numero} desde ${pase.origen.nombre}: confirme la recepción`,
      expedienteId: expediente.id,
      autorId: usuarioId,
    });
    return pase;
  }

  /** Bandeja de entrada de una dependencia (pases sin recibir). */
  async bandeja(dependenciaId: number): Promise<PaseRecord[]> {
    return this.repos.pases.listPendientesHacia(dependenciaId);
  }

  async recibir(
    paseId: number,
    usuario: { id: number; dependenciaId: number },
    ctx: Contexto = {},
  ): Promise<PaseRecord> {
    const pase = await this.repos.pases.findById(paseId);
    if (!pase) throw new NotFoundError('Pase no encontrado');
    if (pase.destino.id !== usuario.dependenciaId) {
      throw new ForbiddenError('Solo la dependencia destino puede confirmar la recepción');
    }
    if (pase.recibidoEn) throw new ConflictError('El pase ya fue recibido');

    const recibido = await this.repos.pases.recibir(paseId, usuario.id);
    if (!recibido) throw new ConflictError('El pase ya fue recibido');

    await this.auditoria.registrar({ ...ctx, usuarioId: usuario.id }, {
      accion: 'expediente.recibir',
      resultado: 'EXITO',
      entidad: 'Pase',
      entidadId: String(pase.id),
      detalle: { expediente: pase.expediente.numero, origen: pase.origen.codigo, destino: pase.destino.codigo },
    });
    return recibido;
  }
}
