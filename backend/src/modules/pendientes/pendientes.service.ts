/**
 * Pendientes y alertas — Sprint 5 (RF-17, parte de alertas de vencimiento).
 * Reúne lo que cada usuario tiene que atender: sus tareas abiertas, los expedientes
 * recibidos sin confirmar en su dependencia y los expedientes de su dependencia por vencer.
 */
import type { ExpedienteRecord, PaseRecord, Repos, TareaRecord } from '../../database/repositories.js';

/** Días de anticipación para avisar un vencimiento. */
export const DIAS_AVISO = 3;
const DIA_MS = 24 * 60 * 60 * 1000;

export type Alerta = 'VENCIDA' | 'POR_VENCER' | null;

export function alertaDe(vencimiento: Date | null, ahora: Date): Alerta {
  if (!vencimiento) return null;
  if (vencimiento.getTime() < ahora.getTime()) return 'VENCIDA';
  if (vencimiento.getTime() <= ahora.getTime() + DIAS_AVISO * DIA_MS) return 'POR_VENCER';
  return null;
}

export interface Pendientes {
  tareas: (TareaRecord & { alerta: Alerta })[];
  recibidos: PaseRecord[];
  expedientesPorVencer: (ExpedienteRecord & { alerta: Alerta })[];
}

export class PendientesService {
  constructor(
    private readonly repos: Repos,
    private readonly opciones: { now?: () => Date } = {},
  ) {}

  async obtener(usuario: { id: number; dependenciaId: number; permisos: string[] }): Promise<Pendientes> {
    const ahora = this.opciones.now?.() ?? new Date();
    const hasta = new Date(ahora.getTime() + DIAS_AVISO * DIA_MS);
    const [tareas, recibidos, expedientes] = await Promise.all([
      this.repos.tareas.listAbiertasDe(usuario.id),
      usuario.permisos.includes('expedientes.recibir') ? this.repos.pases.listPendientesHacia(usuario.dependenciaId) : [],
      usuario.permisos.includes('expedientes.consultar')
        ? this.repos.expedientes.listPorVencer({ dependenciaId: usuario.dependenciaId, hasta })
        : [],
    ]);
    return {
      tareas: tareas.map((t) => ({ ...t, alerta: alertaDe(t.vencimiento, ahora) })),
      recibidos,
      expedientesPorVencer: expedientes.map((e) => ({ ...e, alerta: alertaDe(e.fechaVencimiento, ahora) })),
    };
  }
}
