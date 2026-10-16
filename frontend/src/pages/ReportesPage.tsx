/**
 * Reportes — Sprint 6 (S6-02 consultar con filtros, S6-03 exportar a CSV; RF-19).
 * Los filtros se validan aquí y otra vez en el servidor; el alcance (dependencia) lo decide el servidor.
 */
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { Distribucion } from '../components/Dashboard';
import { PageHeader } from '../components/PageHeader';
import { api, ApiError } from '../services/api';
import { type FiltrosReporte, type Reporte, reportesApi, validarRango } from '../services/reportes';
import type { Dependencia, EstadoExpediente, Prioridad } from '../services/tipos';
import { ESTADOS_EXPEDIENTE, ETIQUETA_TIPO, PRIORIDADES, TIPOS_EXPEDIENTE } from '../services/tipos';

const POR_PAGINA = 20;
const campo = 'mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-marca-500';
const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-PY') : '—');
const etiquetaEstado = (e: EstadoExpediente) => ESTADOS_EXPEDIENTE.find((x) => x.valor === e)?.etiqueta ?? e;
const etiquetaPrioridad = (p: Prioridad) => PRIORIDADES.find((x) => x.valor === p)?.etiqueta ?? p;

interface Formulario {
  desde: string;
  hasta: string;
  estado: string;
  prioridad: string;
  tipo: string;
  dependenciaId: string;
}

const VACIO: Formulario = { desde: '', hasta: '', estado: '', prioridad: '', tipo: '', dependenciaId: '' };

function aFiltros(f: Formulario): FiltrosReporte {
  return {
    desde: f.desde || undefined,
    hasta: f.hasta || undefined,
    estado: (f.estado as EstadoExpediente) || undefined,
    prioridad: (f.prioridad as Prioridad) || undefined,
    tipo: f.tipo || undefined,
    dependenciaId: f.dependenciaId ? Number(f.dependenciaId) : undefined,
  };
}

/** Descarga un Blob como archivo con el nombre indicado. */
function descargar(archivo: Blob, nombre: string) {
  const url = URL.createObjectURL(archivo);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ReportesPage() {
  const { puede } = useAuth();
  const todas = puede('expedientes.consultar_todas');
  const [form, setForm] = useState<Formulario>(VACIO);
  const [aplicados, setAplicados] = useState<FiltrosReporte>({});
  const [pagina, setPagina] = useState(1);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorRango, setErrorRango] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setReporte(await reportesApi.consultar(aplicados, pagina, POR_PAGINA));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo generar el reporte');
    }
  }, [aplicados, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!todas) return;
    api<Dependencia[]>('/dependencias')
      .then(setDependencias)
      .catch(() => setDependencias([]));
  }, [todas]);

  const cambiar = (clave: keyof Formulario) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [clave]: e.target.value }));

  function aplicar(e: FormEvent) {
    e.preventDefault();
    const problema = validarRango(form.desde, form.hasta);
    setErrorRango(problema);
    if (problema) return;
    setAviso(null);
    setPagina(1);
    setAplicados(aFiltros(form));
  }

  function limpiar() {
    setForm(VACIO);
    setErrorRango(null);
    setPagina(1);
    setAplicados({});
  }

  async function exportar() {
    setError(null);
    setAviso(null);
    setExportando(true);
    try {
      const { archivo, nombre } = await reportesApi.exportar(aplicados);
      descargar(archivo, nombre);
      setAviso(`Se descargó ${nombre}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo exportar el reporte');
    } finally {
      setExportando(false);
    }
  }

  const totalPaginas = reporte ? Math.max(1, Math.ceil(reporte.total / POR_PAGINA)) : 1;

  return (
    <>
      <PageHeader title="Reportes" subtitle="Expedientes por fecha, estado, prioridad, tipo y dependencia, con exportación a CSV." />

      <form onSubmit={aplicar} noValidate aria-label="Filtros del reporte" className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="desde" className="text-sm font-medium text-slate-700">Creados desde</label>
            <input id="desde" type="date" value={form.desde} onChange={cambiar('desde')} className={campo} />
          </div>
          <div>
            <label htmlFor="hasta" className="text-sm font-medium text-slate-700">Creados hasta</label>
            <input
              id="hasta"
              type="date"
              value={form.hasta}
              onChange={cambiar('hasta')}
              aria-invalid={errorRango ? true : undefined}
              aria-describedby={errorRango ? 'error-hasta' : undefined}
              className={campo}
            />
            {errorRango && (
              <p id="error-hasta" className="mt-1 text-xs text-red-700">
                {errorRango}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="estado" className="text-sm font-medium text-slate-700">Estado</label>
            <select id="estado" value={form.estado} onChange={cambiar('estado')} className={campo}>
              <option value="">Todos</option>
              {ESTADOS_EXPEDIENTE.map((e) => (
                <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prioridad" className="text-sm font-medium text-slate-700">Prioridad</label>
            <select id="prioridad" value={form.prioridad} onChange={cambiar('prioridad')} className={campo}>
              <option value="">Todas</option>
              {PRIORIDADES.map((p) => (
                <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tipo" className="text-sm font-medium text-slate-700">Tipo</label>
            <select id="tipo" value={form.tipo} onChange={cambiar('tipo')} className={campo}>
              <option value="">Todos</option>
              {TIPOS_EXPEDIENTE.map((t) => (
                <option key={t} value={t}>{ETIQUETA_TIPO[t]}</option>
              ))}
            </select>
          </div>
          {todas && (
            <div>
              <label htmlFor="dependencia" className="text-sm font-medium text-slate-700">Dependencia</label>
              <select id="dependencia" value={form.dependenciaId} onChange={cambiar('dependenciaId')} className={campo}>
                <option value="">Todas</option>
                {dependencias.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="rounded-md bg-marca-700 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900">
            Generar reporte
          </button>
          <button type="button" onClick={limpiar} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Limpiar filtros
          </button>
          <button
            type="button"
            onClick={() => void exportar()}
            disabled={exportando || !reporte || reporte.total === 0}
            className="rounded-md border border-marca-700 px-4 py-2 text-sm font-medium text-marca-700 hover:bg-marca-50 disabled:opacity-50"
          >
            {exportando ? 'Exportando…' : 'Exportar a CSV'}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {aviso}
        </p>
      )}

      {!reporte && !error && <p className="text-sm text-slate-500">Generando reporte…</p>}

      {reporte && (
        <>
          <p className="mb-3 text-sm text-slate-700">
            <strong>{reporte.total}</strong> expediente{reporte.total === 1 ? '' : 's'} con los filtros aplicados.
          </p>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Distribucion
              titulo="Resumen por estado"
              total={reporte.resumen.total}
              filas={ESTADOS_EXPEDIENTE.map((e) => ({ etiqueta: e.etiqueta, valor: reporte.resumen.porEstado[e.valor] }))}
            />
            <Distribucion
              titulo="Resumen por prioridad"
              total={reporte.resumen.total}
              filas={PRIORIDADES.map((p) => ({ etiqueta: p.etiqueta, valor: reporte.resumen.porPrioridad[p.valor] }))}
            />
            <Distribucion
              titulo="Resumen por dependencia"
              total={reporte.resumen.total}
              filas={reporte.resumen.porDependencia.map((d) => ({ etiqueta: d.dependencia.nombre, valor: d.total }))}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <caption className="sr-only">Expedientes del reporte</caption>
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Número</th>
                  <th scope="col" className="px-4 py-3">Carátula</th>
                  <th scope="col" className="px-4 py-3">Tipo</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Prioridad</th>
                  <th scope="col" className="px-4 py-3">Dependencia</th>
                  <th scope="col" className="px-4 py-3">Creado</th>
                  <th scope="col" className="px-4 py-3">Vence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reporte.items.map((x) => (
                  <tr key={x.id}>
                    <td className="px-4 py-2 font-mono text-marca-700">
                      <Link to={`/expedientes/${x.id}`} className="hover:underline">{x.numero}</Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-2 text-slate-800" title={x.caratula}>{x.caratula}</td>
                    <td className="px-4 py-2 text-slate-600">{ETIQUETA_TIPO[x.tipo] ?? x.tipo}</td>
                    <td className="px-4 py-2 text-slate-600">{etiquetaEstado(x.estado)}</td>
                    <td className="px-4 py-2 text-slate-600">{etiquetaPrioridad(x.prioridad)}</td>
                    <td className="px-4 py-2 text-slate-600">{x.dependenciaActual.nombre}</td>
                    <td className="px-4 py-2 text-slate-500">{fecha(x.creadoEn)}</td>
                    <td className="px-4 py-2 text-slate-500">{fecha(x.fechaVencimiento)}</td>
                  </tr>
                ))}
                {reporte.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-500">No hay expedientes con estos filtros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>Página {reporte.pagina} de {totalPaginas}</span>
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
