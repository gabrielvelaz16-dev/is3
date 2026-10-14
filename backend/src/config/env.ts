import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

/**
 * Configuración del backend leída desde variables de entorno (ADR-01, RNF-06).
 * El archivo .env vive en la raíz del repositorio y nunca se versiona.
 */

// src/config -> src -> backend -> raíz del repositorio (igual desde dist/config).
const rootEnvFile = resolve(import.meta.dirname, '../../../.env');
if (process.env.NODE_ENV !== 'test' && existsSync(rootEnvFile)) {
  // No pisa variables que ya existan en el entorno (por ejemplo, en CI).
  process.loadEnvFile(rootEnvFile);
}

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: 'DATABASE_URL debe ser una URL de PostgreSQL' }),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/** Valida las variables y detiene el arranque si falta alguna (falla temprano y claro). */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const campos = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuración inválida. Revisar el archivo .env (${campos})`);
  }
  return result.data;
}
