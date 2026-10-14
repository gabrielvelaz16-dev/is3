import type { AuditoriaRepo, EventoAuditoria } from '../../database/repositories.js';
import { logger } from '../../shared/logger.js';

/** Datos de la petición que se agregan a cada evento de auditoría. */
export interface Contexto {
  usuarioId?: number;
  ip?: string;
  requestId?: string;
}

/**
 * Registra operaciones importantes (RF-20, ADR-07). Nunca guarda contraseñas.
 * Si la auditoría falla, la operación de negocio igual falla: una acción
 * importante sin registro no debe quedar silenciosa.
 */
export class AuditoriaService {
  constructor(private readonly repo: AuditoriaRepo) {}

  async registrar(ctx: Contexto, evento: Omit<EventoAuditoria, 'ip' | 'requestId'>): Promise<void> {
    try {
      await this.repo.insert({ usuarioId: ctx.usuarioId ?? null, ...evento, ip: ctx.ip, requestId: ctx.requestId });
    } catch (err) {
      logger.error('no se pudo registrar la auditoría', { accion: evento.accion, requestId: ctx.requestId, error: (err as Error).message });
      throw err;
    }
  }
}
