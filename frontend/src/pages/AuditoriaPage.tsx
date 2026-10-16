/**
 * Auditoría — Sprint 7 (S7-03, RF-21).
 * Solo lectura: el registro no se puede modificar ni borrar (ADR-07, triggers en la base).
 */
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { ApiError } from '../services/api';
import { auditoriaApi, type FiltrosAuditoria, type PaginaAuditoria } from '../services/administracion';

const POR_PAGINA = 25;
const campo = 'mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-marca-500';
const cuando = (iso: string) => new Date(iso).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'medium' });

/** Detalle como texto corto (el JSON completo queda en el título de la celda). */
function resumenDetalle(detalle: unknown): string {
  if (detalle === null || detalle === undefined) return '—';
  const texto = typeof detalle === 'string' ? detalle : JSON.stringify(detalle);
  return texto.length > 80 ? `${texto.slice(0, 80)}…` : texto;
}

export function AuditoriaPage() {
  const [form, setForm] = useState({ desde: '', hasta: '', accion: '', resultado: '' });
  const [aplicados, setAplicados] = useState<FiltrosAuditoria>({});
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState<PaginaAuditoria | null>(null);
  const [acciones, setAcciones] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorRango, setErrorRango] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setDatos(await auditoriaApi.consultar(aplicados, pagina, POR_PAGINA));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo consultar la auditoría');
    }
  }, [aplicados, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    auditoriaApi
      .acciones()
      .then(setAcciones)
      .catch(() => setAcciones([]));
  }, []);

  const cambiar = (clave: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [clave]: e.target.value }));

  function aplicar(e: FormEvent) {
    e.preventDefault();
    if (form.desde && form.hasta && form.hasta < form.desde) {
      setErrorRango('La fecha "hasta" no puede ser anterior a "desde"');
      return;
    }
    setErrorRango(null);
    setPagina(1);
    setAplicados({
      desde: form.desde || undefined,
      hasta: form.hasta || undefined,
      accion: form.accion || undefined,
      resultado: (form.resultado as 'EXITO' | 'FALLO') || undefined,
    });
  }

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / POR_PAGINA)) : 1;

  return (
    <>
      <PageHeader title="Auditoría" subtitle="Registro de las operaciones importantes. Es de solo lectura: no se puede modificar ni borrar." />

      <form onSubmit={aplicar} noValidate aria-label="Filtros de auditoría" className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="aud-desde" className="text-sm font-medium text-slate-700">Desde</label>
            <input id="aud-desde" type="date" value={form.desde} onChange={cambiar('desde')} className={campo} />
          </div>
          <div>
            <label htmlFor="aud-hasta" className="text-sm font-medium text-slate-700">Hasta</label>
            <input
              id="aud-hasta"
              type="date"
              value={form.hasta}
              onChange={cambiar('hasta')}
              aria-invalid={errorRango ? true : undefined}
              aria-describedby={errorRango ? 'aud-error-hasta' : undefined}
              className={campo}
            />
            {errorRango && <p id="aud-error-hasta" className="mt-1 text-xs text-red-700">{errorRango}</p>}
          </div>
          <div>
            <label htmlFor="aud-accion" className="text-sm font-medium text-slate-700">Acción</label>
            <select id="aud-accion" value={form.accion} onChange={cambiar('accion')} className={campo}>
              <option value="">Todas</option>
              {acciones.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="aud-resultado" className="text-sm font-medium text-slate-700">Resultado</label>
            <select id="aud-resultado" value={form.resultado} onChange={cambiar('resultado')} className={campo}>
              <option value="">Todos</option>
              <option value="EXITO">Éxito</option>
              <option value="FALLO">Fallo</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button type="submit" className="rounded-md bg-marca-700 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900">
            Filtrar
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {datos && (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <caption className="sr-only">Eventos de auditoría</caption>
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Usuario</th>
                  <th scope="col" className="px-4 py-3">Acción</th>
                  <th scope="col" className="px-4 py-3">Resultado</th>
                  <th scope="col" className="px-4 py-3">Entidad</th>
                  <th scope="col" className="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datos.items.map((ev) => (
                  <tr key={ev.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{cuando(ev.fecha)}</td>
                    <td className="px-4 py-2 text-slate-800">{ev.usuario ? ev.usuario.username : 'Sistema'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-800">{ev.accion}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ev.resultado === 'EXITO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {ev.resultado === 'EXITO' ? 'Éxito' : 'Fallo'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{ev.entidad ? `${ev.entidad}${ev.entidadId ? ` ${ev.entidadId}` : ''}` : '—'}</td>
                    <td className="max-w-xs truncate px-4 py-2 font-mono text-xs text-slate-500" title={ev.detalle ? JSON.stringify(ev.detalle) : undefined}>
                      {resumenDetalle(ev.detalle)}
                    </td>
                  </tr>
                ))}
                {datos.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">No hay eventos con estos filtros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>{datos.total} evento{datos.total === 1 ? '' : 's'} · página {datos.pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              <button type="button" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50">
                Anterior
              </button>
              <button type="button" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50">
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
