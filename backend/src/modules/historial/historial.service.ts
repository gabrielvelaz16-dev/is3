/**
 * Historial del expediente — Sprint 4 (S4-04, RF-11).
 * Une en una sola línea de tiempo la creación, los cambios de estado, los documentos
 * y las actuaciones. Todo sale de tablas de solo inserción: el historial no se reescribe.
 */
import type { EstadoExpediente, ExpedienteRecord, PersonaRef, Repos } from '../../database/repositories.js';

export type TipoEvento = 'CREACION' | 'CAMBIO_ESTADO' | 'DOCUMENTO' | 'ACTUACION' | 'OBSERVACION';

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

const ORDEN: Record<TipoEvento, number> = { CREACION: 0, CAMBIO_ESTADO: 1, DOCUMENTO: 2, ACTUACION: 3, OBSERVACION: 3 };

export class HistorialService {
  constructor(private readonly repos: Repos) {}

  async obtener(expediente: ExpedienteRecord): Promise<EventoHistorial[]> {
    const [cambios, documentos, actuaciones] = await Promise.all([
      this.repos.cambiosEstado.listByExpediente(expediente.id),
      this.repos.documentos.listByExpediente(expediente.id),
      this.repos.actuaciones.listByExpediente(expediente.id),
    ]);

    const eventos: EventoHistorial[] = [
      {
        tipo: 'CREACION',
        fecha: expediente.creadoEn,
        usuario: expediente.creadoPor,
        descripcion: `Expediente ${expediente.numero} registrado en ${expediente.dependenciaActual.nombre}`,
      },
      ...cambios.map((c) => ({
        tipo: 'CAMBIO_ESTADO' as const,
        fecha: c.fecha,
        usuario: c.usuario,
        descripcion: `Estado: ${c.estadoAnterior ?? '—'} → ${c.estadoNuevo}`,
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
