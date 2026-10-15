/**
 * Actuaciones y observaciones — Sprint 4 (S4-03, RF-10).
 * La fecha y el autor los pone el servidor; una actuación no se edita ni se borra.
 */
import type { ActuacionRecord, ExpedienteRecord, Repos, TipoActuacion } from '../../database/repositories.js';
import type { AuditoriaService, Contexto } from '../auditoria/auditoria.service.js';
import { verificarNoArchivado } from '../expedientes/expedientes.service.js';

export const TIPOS_ACTUACION = ['ACTUACION', 'OBSERVACION'] as const satisfies readonly TipoActuacion[];

export class ActuacionesService {
  constructor(
    private readonly repos: Repos,
    private readonly auditoria: AuditoriaService,
  ) {}

  async listar(expedienteId: number): Promise<ActuacionRecord[]> {
    return this.repos.actuaciones.listByExpediente(expedienteId);
  }

  async registrar(
    expediente: ExpedienteRecord,
    input: { tipo: TipoActuacion; texto: string },
    usuarioId: number,
    ctx: Contexto = {},
  ): Promise<ActuacionRecord> {
    verificarNoArchivado(expediente, 'registrar actuaciones en');

    const actuacion = await this.repos.actuaciones.create({
      expedienteId: expediente.id,
      tipo: input.tipo,
      texto: input.texto.trim(),
      autorId: usuarioId,
    });

    await this.auditoria.registrar({ ...ctx, usuarioId }, {
      accion: input.tipo === 'OBSERVACION' ? 'observacion.registrar' : 'actuacion.registrar',
      resultado: 'EXITO',
      entidad: 'Actuacion',
      entidadId: String(actuacion.id),
      detalle: { expediente: expediente.numero },
    });

    return actuacion;
  }
}
