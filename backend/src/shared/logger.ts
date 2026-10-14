/**
 * Logger estructurado en JSON (una línea por evento) — plan de configuración §9.
 * Nunca escribe valores de campos sensibles: se reemplazan por "[OCULTO]" (RNF-05).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;

const PRIORIDAD: Record<LogLevel | 'silent', number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };
const CAMPO_SENSIBLE = /pass(word)?|contrase|token|secret|authorization|cookie|database_url/i;

function nivelActual(): number {
  const nivel = (process.env.LOG_LEVEL ?? 'info') as keyof typeof PRIORIDAD;
  return PRIORIDAD[nivel] ?? PRIORIDAD.info;
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Fields).map(([k, v]) => [k, CAMPO_SENSIBLE.test(k) ? '[OCULTO]' : redact(v, depth + 1)]),
  );
}

function write(level: LogLevel, msg: string, fields: Fields = {}): void {
  if (PRIORIDAD[level] < nivelActual()) return;
  const line = JSON.stringify({ level, time: new Date().toISOString(), msg, ...(redact(fields) as Fields) });
  if (level === 'error' || level === 'warn') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

export const logger = {
  debug: (msg: string, fields?: Fields) => write('debug', msg, fields),
  info: (msg: string, fields?: Fields) => write('info', msg, fields),
  warn: (msg: string, fields?: Fields) => write('warn', msg, fields),
  error: (msg: string, fields?: Fields) => write('error', msg, fields),
};
