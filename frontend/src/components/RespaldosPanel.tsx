/**
 * Copias de seguridad — Sprint 7 (S7-04, RF-22, ADR-13).
 * Desde la pantalla solo se generan y listan. La restauración se hace por línea de comandos,
 * con el backend detenido, porque reemplaza todos los datos y no se puede deshacer.
 */
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../services/api';
import { type Respaldo, respaldosApi, tamano } from '../services/administracion';
import { useAviso } from './ui/Avisos';

const cuando = (iso: string) => new Date(iso).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' });

export function RespaldosPanel() {
  const [lista, setLista] = useState<Respaldo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const avisar = useAviso();
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLista(await respaldosApi.listar());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de respaldos');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function crear() {
    setError(null);
    setCreando(true);
    try {
      const r = await respaldosApi.crear();
      avisar(
        `Respaldo ${r.nombre} creado: ${r.totalFilas} filas y ${r.documentos} documentos.` +
          (r.documentosConProblemas ? ` Atención: ${r.documentosConProblemas} documento(s) sin archivo o con hash distinto.` : ''),
      );
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el respaldo');
    } finally {
      setCreando(false);
    }
  }

  return (
    <section aria-labelledby="titulo-respaldos" className="mt-10 rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-respaldos" className="text-lg font-semibold text-slate-800">
          Copias de seguridad
        </h2>
        <button
          type="button"
          onClick={() => void crear()}
          disabled={creando}
          className="rounded-md bg-marca-700 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-60"
        >
          {creando ? 'Creando respaldo…' : 'Crear respaldo ahora'}
        </button>
      </div>
      <p className="mb-3 text-sm text-slate-600">
        Cada respaldo guarda la base de datos, los documentos y un manifiesto con sus hashes. Para restaurar, detenga el backend y use{' '}
        <code className="rounded bg-slate-100 px-1">npm run respaldo:restaurar</code> sobre una base vacía (ver la guía de instalación).
      </p>

      {error && (
        <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {lista.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay respaldos.</p>
      ) : (
        <table className="min-w-full text-sm">
          <caption className="sr-only">Respaldos disponibles</caption>
          <thead className="text-left text-xs font-semibold text-slate-600">
            <tr>
              <th scope="col" className="py-2 pr-4">Respaldo</th>
              <th scope="col" className="py-2 pr-4">Fecha</th>
              <th scope="col" className="py-2 pr-4">Filas</th>
              <th scope="col" className="py-2 pr-4">Documentos</th>
              <th scope="col" className="py-2">Tamaño</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lista.map((r) => (
              <tr key={r.nombre}>
                <td className="py-2 pr-4 font-mono text-xs text-slate-800">{r.nombre}</td>
                <td className="py-2 pr-4 text-slate-600">{cuando(r.creadoEn)}</td>
                <td className="py-2 pr-4 text-slate-600">{r.totalFilas}</td>
                <td className="py-2 pr-4 text-slate-600">
                  {r.documentos}
                  {r.documentosConProblemas > 0 && <span className="ml-1 text-xs text-amber-700">({r.documentosConProblemas} con problemas)</span>}
                </td>
                <td className="py-2 text-slate-600">{tamano(r.bytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
