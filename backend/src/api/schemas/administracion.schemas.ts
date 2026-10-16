/**
 * Schemas Zod de la consulta de auditoría — Sprint 7 (S7-03, RF-21).
 */
import { z } from 'zod/v4';

export const consultarAuditoriaSchema = z.object({
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
  usuarioId: z.coerce.number().int().positive().optional(),
  accion: z.string().trim().min(1).max(60).optional(),
  resultado: z.enum(['EXITO', 'FALLO']).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(25),
});
