/**
 * Notificaciones internas — Sprint 6 (S5-06, RF-17; movida desde el Sprint 5 por CR-03).
 * Avisa a un usuario cuando le asignan un expediente o una tarea, y a quienes pueden recibir
 * en una dependencia cuando le llega un pase. Cada usuario solo ve y marca sus propios avisos.
 *
 * Un aviso es complementario: si falla al guardarse, la operación principal (asignar, enviar)
 * no se revierte; el error queda en el log. La auditoría sí es obligatoria (ADR-07).
 */
import type { NotificacionRecord, Repos, TipoNotificacion } from '../../database/repositories.js';
import { logger } from '../../shared/logger.js';
import { NotFoundError } from '../../shared/errors.js';

export const MAX_NOTIFICACIONES = 30;

export class NotificacionesService {
  constructor(
    private readonly repos: Repos,
    private readonly opciones: { now?: () => Date } = {},
  ) {}

  private ahora() {
    return this.opciones.now?.() ?? new Date();
  }

  /** Crea el aviso para cada destinatario, salvo para quien hizo la acción. */
  async notificar(aviso: {
    usuarioIds: number[];
    tipo: TipoNotificacion;
    mensaje: string;
    expedienteId: number | null;
    autorId: number;
  }): Promise<void> {
    const usuarioIds = [...new Set(aviso.usuarioIds)].filter((id) => id !== aviso.autorId);
    if (usuarioIds.length === 0) return;
    try {
      await this.repos.notificaciones.crear({ usuarioIds, tipo: aviso.tipo, mensaje: aviso.mensaje, expedienteId: aviso.expedienteId });
    } catch (err) {
      logger.error('no se pudo registrar la notificación', { tipo: aviso.tipo, error: (err as Error).message });
    }
  }

  /** Avisa a los usuarios de una dependencia que tienen un permiso (por ejemplo, quienes reciben pases). */
  async notificarDependencia(
    dependenciaId: number,
    permiso: string,
    aviso: { tipo: TipoNotificacion; mensaje: string; expedienteId: number | null; autorId: number },
  ): Promise<void> {
    try {
      const usuarioIds = await this.repos.usuarios.listIdsConPermiso(dependenciaId, permiso);
      await this.notificar({ ...aviso, usuarioIds });
    } catch (err) {
      logger.error('no se pudo avisar a la dependencia', { dependenciaId, error: (err as Error).message });
    }
  }

  async listar(usuarioId: number, soloNoLeidas: boolean): Promise<{ items: NotificacionRecord[]; noLeidas: number }> {
    const [items, noLeidas] = await Promise.all([
      this.repos.notificaciones.listDe(usuarioId, { soloNoLeidas, take: MAX_NOTIFICACIONES }),
      this.repos.notificaciones.contarNoLeidas(usuarioId),
    ]);
    return { items, noLeidas };
  }

  /** 404 también si es de otro usuario: no se revela que existe. */
  async marcarLeida(id: number, usuarioId: number): Promise<void> {
    const ok = await this.repos.notificaciones.marcarLeida(id, usuarioId, this.ahora());
    if (!ok) throw new NotFoundError('Notificación no encontrada');
  }

  async marcarTodasLeidas(usuarioId: number): Promise<{ marcadas: number }> {
    return { marcadas: await this.repos.notificaciones.marcarTodasLeidas(usuarioId, this.ahora()) };
  }
}
