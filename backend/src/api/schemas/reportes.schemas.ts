/**
 * Schemas Zod del dashboard, los reportes y las notificaciones — Sprint 6.
 */
import { z } from 'zod/v4';
import { ESTADOS_EXPEDIENTE, PRIORIDADES, TIPOS_EXPEDIENTE } from '../../modules/expedientes/expedientes.service.js';

/** S6-02 / S6-03: mismos filtros para consultar y exportar. Fechas AAAA-MM-DD (creación). */
export const filtrosReporteSchema = z.object({
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
  estado: z.enum(ESTADOS_EXPEDIENTE).optional(),
  prioridad: z.enum(PRIORIDADES).optional(),
  tipo: z.enum(TIPOS_EXPEDIENTE).optional(),
  dependenciaId: z.coerce.number().int().positive().optional(),
});

export const consultarReporteSchema = filtrosReporteSchema.extend({
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

/** S5-06 */
export const listarNotificacionesSchema = z.object({
  soloNoLeidas: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});
