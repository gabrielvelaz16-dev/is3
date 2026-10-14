import { useEffect, useState } from 'react';
import { ApiError, apiRaw } from '../services/api';
import type { Health } from '../services/tipos';

type Estado = { tipo: 'cargando' } | { tipo: 'ok'; health: Health } | { tipo: 'error'; mensaje: string };

const ETIQUETA: Record<'ok' | 'down', string> = { ok: 'Disponible', down: 'Sin conexión' };

/** Estado de la API y de la base de datos, leído de /api/health (S1-03). */
export function SystemStatus() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    const control = new AbortController();
    // /api/health responde 503 con datos cuando la base está caída: apiRaw lo devuelve igual.
    apiRaw<Health>('/health', { signal: control.signal })
      .then((r) => setEstado({ tipo: 'ok', health: r.data }))
      .catch((err: unknown) => {
        if ((err as Error).name === 'AbortError') return;
        setEstado({ tipo: 'error', mensaje: err instanceof ApiError ? err.message : 'No se pudo consultar el estado' });
      });
    return () => control.abort();
  }, []);

  return (
    <section aria-labelledby="titulo-estado" className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 id="titulo-estado" className="text-sm font-semibold text-slate-700">
        Estado del sistema
      </h2>
      {estado.tipo === 'cargando' && <p className="mt-2 text-sm text-slate-500">Consultando…</p>}
      {estado.tipo === 'error' && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          API: Sin conexión — {estado.mensaje}
        </p>
      )}
      {estado.tipo === 'ok' && (
        <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
          {(['api', 'database'] as const).map((k) => (
            <div key={k}>
              <dt className="text-slate-500">{k === 'api' ? 'API' : 'Base de datos'}</dt>
              <dd className={estado.health[k] === 'ok' ? 'font-medium text-green-700' : 'font-medium text-red-700'}>{ETIQUETA[estado.health[k]]}</dd>
            </div>
          ))}
          <div>
            <dt className="text-slate-500">Versión</dt>
            <dd className="font-medium text-slate-700">{estado.health.version}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
