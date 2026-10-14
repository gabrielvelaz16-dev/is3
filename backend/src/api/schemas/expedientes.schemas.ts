/**
 * Schemas Zod para expedientes — Sprint 3 (S3-06).
 */
import { z } from 'zod/v4';
import { ESTADOS_EXPEDIENTE, PRIORIDADES, TIPOS_EXPEDIENTE } from '../../modules/expedientes/expedientes.service.js';

export const crearExpedienteSchema = z.object({
  caratula: z.string().min(3).max(255),
  asunto: z.string().min(3).max(2000),
  tipo: z.enum(TIPOS_EXPEDIENTE),
  iniciador: z.string().min(2).max(160),
  prioridad: z.enum(PRIORIDADES).optional(),
  descripcion: z.string().max(5000).nullable().optional(),
  fechaVencimiento: z.iso.datetime().nullable().optional(),
  responsableId: z.number().int().positive().nullable().optional(),
});

export const modificarExpedienteSchema = z.object({
  caratula: z.string().min(3).max(255).optional(),
  asunto: z.string().min(3).max(2000).optional(),
  tipo: z.enum(TIPOS_EXPEDIENTE).optional(),
  iniciador: z.string().min(2).max(160).optional(),
  prioridad: z.enum(PRIORIDADES).optional(),
  estado: z.enum(ESTADOS_EXPEDIENTE).optional(),
  descripcion: z.string().max(5000).nullable().optional(),
  fechaVencimiento: z.iso.datetime().nullable().optional(),
  responsableId: z.number().int().positive().nullable().optional(),
}).strict();

export const listarExpedientesSchema = z.object({
  q: z.string().max(200).optional(),
  estado: z.enum(ESTADOS_EXPEDIENTE).optional(),
  prioridad: z.enum(PRIORIDADES).optional(),
  dependenciaId: z.coerce.number().int().positive().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

export const idExpedienteSchema = z.object({
  id: z.coerce.number().int().positive(),
});
