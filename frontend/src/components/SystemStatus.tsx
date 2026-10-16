import { useEffect, useState } from 'react';
import { ApiError, apiRaw } from '../services/api';
import type { Health } from '../services/tipos';

type Estado = { tipo: 'cargando' } | { tipo: 'ok'; health: Health } | { tipo: 'error'; mensaje: string };

const ETIQUETA: Record<'ok' | 'down', string> = { ok: 'Disponible', down: 'Sin conexión' };

/** Estado de la API y de la base de datos, leído de /api/health (S1-03). Franja discreta al pie del inicio. */
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
    <section aria-labelledby="titulo-estado" className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm">
      <h2 id="titulo-estado" className="font-medium text-slate-600">
        Estado del sistema
      </h2>
      {estado.tipo === 'cargando' && <p className="text-slate-500">Consultando…</p>}
      {estado.tipo === 'error' && (
        <p role="alert" className="text-red-700">
          API: Sin conexión. {estado.mensaje}
        </p>
      )}
      {estado.tipo === 'ok' && (
        <dl className="flex flex-wrap gap-x-6 gap-y-1">
          {(['api', 'database'] as const).map((k) => (
            <div key={k} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${estado.health[k] === 'ok' ? 'bg-emerald-500' : 'bg-sello'}`} />
              <dt className="text-slate-500">{k === 'api' ? 'API' : 'Base de datos'}:</dt>
              <dd className={estado.health[k] === 'ok' ? 'font-medium text-emerald-800' : 'font-medium text-sello'}>{ETIQUETA[estado.health[k]]}</dd>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <dt className="text-slate-500">Versión:</dt>
            <dd className="font-medium text-slate-700">{estado.health.version}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
