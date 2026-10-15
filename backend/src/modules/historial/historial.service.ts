/**
 * Historial del expediente — Sprint 4 (S4-04, RF-11).
 * Une en una sola línea de tiempo la creación, los cambios de estado, los documentos
 * y las actuaciones. Todo sale de tablas de solo inserción: el historial no se reescribe.
 */
import type { EstadoExpediente, ExpedienteRecord, PersonaRef, Repos } from '../../database/repositories.js';

export type TipoEvento =
  | 'CREACION'
  | 'CAMBIO_ESTADO'
  | 'DOCUMENTO'
  | 'ACTUACION'
  | 'OBSERVACION'
  | 'PASE_ENVIADO'
  | 'PASE_RECIBIDO'
  | 'ASIGNACION'
  | 'TAREA';

export interface EventoHistorial {
  tipo: TipoEvento;
  fecha: Date;
  usuario: PersonaRef;
  descripcion: string;
  /** Referencia al registro de origen (documento, actuación o cambio de estado). */
  referenciaId?: number;
  estadoAnterior?: EstadoExpediente | null;
  estadoNuevo?: EstadoExpediente;
}

const ORDEN: Record<TipoEvento, number> = {
  CREACION: 0,
  PASE_ENVIADO: 1,
  CAMBIO_ESTADO: 2,
  PASE_RECIBIDO: 3,
  ASIGNACION: 4,
  DOCUMENTO: 5,
  ACTUACION: 6,
  OBSERVACION: 6,
  TAREA: 7,
};

export class HistorialService {
  constructor(private readonly repos: Repos) {}

  async obtener(expediente: ExpedienteRecord): Promise<EventoHistorial[]> {
    const [cambios, documentos, actuaciones, pases, asignaciones, tareas] = await Promise.all([
      this.repos.cambiosEstado.listByExpediente(expediente.id),
      this.repos.documentos.listByExpediente(expediente.id),
      this.repos.actuaciones.listByExpediente(expediente.id),
      this.repos.pases.listByExpediente(expediente.id),
      this.repos.asignaciones.listByExpediente(expediente.id),
      this.repos.tareas.listByExpediente(expediente.id),
    ]);

    const eventos: EventoHistorial[] = [
      {
        tipo: 'CREACION',
        fecha: expediente.creadoEn,
        usuario: expediente.creadoPor,
        // La dependencia de creación es el origen del primer pase (o la actual, si nunca se envió).
        descripcion: `Expediente ${expediente.numero} registrado en ${(pases[0]?.origen ?? expediente.dependenciaActual).nombre}`,
      },
      ...cambios.map((c) => ({
        tipo: 'CAMBIO_ESTADO' as const,
        fecha: c.fecha,
        usuario: c.usuario,
        descripcion: `Estado: ${c.estadoAnterior ?? '—'} → ${c.estadoNuevo}${c.motivo ? ` (${c.motivo})` : ''}`,
        referenciaId: c.id,
        estadoAnterior: c.estadoAnterior,
        estadoNuevo: c.estadoNuevo,
      })),
      ...documentos.map((d) => ({
        tipo: 'DOCUMENTO' as const,
        fecha: d.subidoEn,
        usuario: d.subidoPor,
        descripcion: `Documento adjuntado: ${d.nombreOriginal}`,
        referenciaId: d.id,
      })),
      ...pases.flatMap((p) => {
        const enviado: EventoHistorial = {
          tipo: 'PASE_ENVIADO',
          fecha: p.enviadoEn,
          usuario: p.enviadoPor,
          descripcion: `Enviado de ${p.origen.nombre} a ${p.destino.nombre}: ${p.motivo}`,
          referenciaId: p.id,
        };
        if (!p.recibidoEn || !p.recibidoPor) return [enviado];
        const recibido: EventoHistorial = {
          tipo: 'PASE_RECIBIDO',
          fecha: p.recibidoEn,
          usuario: p.recibidoPor,
          descripcion: `Recibido en ${p.destino.nombre}`,
          referenciaId: p.id,
        };
        return [enviado, recibido];
      }),
      ...asignaciones.map((a) => ({
        tipo: 'ASIGNACION' as const,
        fecha: a.fecha,
        usuario: a.usuario,
        descripcion: a.responsable ? `Responsable asignado: ${a.responsable.nombre}` : 'Se quitó el responsable',
        referenciaId: a.id,
      })),
      ...tareas.map((t) => ({
        tipo: 'TAREA' as const,
        fecha: t.creadaEn,
        usuario: t.creadoPor,
        descripcion: `Tarea para ${t.asignadoA.nombre}: ${t.titulo} (vence ${t.vencimiento.toISOString().slice(0, 10)})`,
        referenciaId: t.id,
      })),
      ...actuaciones.map((a) => ({
        tipo: a.tipo,
        fecha: a.fecha,
        usuario: a.autor,
        descripcion: a.texto,
        referenciaId: a.id,
      })),
    ];

    // Orden cronológico; ante la misma fecha, la creación va primero (orden estable).
    return eventos.sort((x, y) => x.fecha.getTime() - y.fecha.getTime() || ORDEN[x.tipo] - ORDEN[y.tipo]);
  }
}
