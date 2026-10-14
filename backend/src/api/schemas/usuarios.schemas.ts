import { z } from 'zod';

/** Validación de entrada en la API (Zod). Las reglas de negocio están en los servicios. */

const nombre = z.string().trim().min(3, 'Ingrese al menos 3 caracteres').max(120);
const id = z.coerce.number().int().positive();

export const loginSchema = z.object({
  usuario: z.string().trim().min(1, 'Ingrese su usuario').max(160),
  password: z.string().min(1, 'Ingrese su contraseña').max(128),
});

export const crearUsuarioSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,30}$/, 'De 3 a 30 caracteres: letras, números, punto, guion o guion bajo'),
  email: z.email('Correo inválido').max(160),
  nombre,
  password: z.string().max(128),
  rolId: id,
  dependenciaId: id,
});

export const modificarUsuarioSchema = z
  .object({
    nombre: nombre.optional(),
    rolId: id.optional(),
    dependenciaId: id.optional(),
    activo: z.boolean().optional(),
    password: z.string().max(128).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Indique al menos un dato a modificar');

export const listarUsuariosSchema = z.object({
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({ id });
