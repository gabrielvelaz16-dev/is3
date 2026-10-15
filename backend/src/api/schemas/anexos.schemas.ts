/**
 * Schemas Zod de documentos y actuaciones — Sprint 4 (S4-01, S4-03).
 */
import { z } from 'zod/v4';
import { TIPOS_ACTUACION } from '../../modules/actuaciones/actuaciones.service.js';

export const idDocumentoSchema = z.object({
  id: z.coerce.number().int().positive(),
  documentoId: z.coerce.number().int().positive(),
});

export const crearActuacionSchema = z
  .object({
    tipo: z.enum(TIPOS_ACTUACION),
    texto: z.string().trim().min(3).max(5000),
  })
  .strict();

/** Encabezados de la subida: el nombre y la descripción viajan codificados (encodeURIComponent). */
export const encabezadosArchivoSchema = z.object({
  nombre: z.string().min(1, 'Falta el nombre del archivo (encabezado X-Nombre-Archivo)').max(255),
  descripcion: z.string().max(500).optional(),
  tipoMime: z.string().min(1, 'Falta el tipo del archivo (encabezado Content-Type)'),
});
