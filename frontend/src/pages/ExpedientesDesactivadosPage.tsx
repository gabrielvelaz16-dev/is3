/**
 * Expedientes desactivados — CR-08.
 * Los expedientes dados de baja por el administrador: quién y cuándo los desactivó y por qué.
 * Desde aquí se reactivan o, si no tienen actividad, se eliminan.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { useAviso } from '../components/ui/Avisos';
import { Boton } from '../components/ui/Boton';
import { DialogoConfirmacion } from '../components/ui/DialogoConfirmacion';
import { EtiquetaEstado } from '../components/ui/Etiquetas';
import { ApiError } from '../services/api';
import { expedientesApi } from '../services/expedientes';
import type { Expediente } from '../services/tipos';

const POR_PAGINA = 10;
const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export function ExpedientesDesactivadosPage() {
  const avisar = useAviso();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState<Expediente | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await expedientesApi.listarDesactivados({ q: busqueda || undefined, pagina, porPagina: POR_PAGINA });
      setExpedientes(res.items);
      setTotal(res.paginacion.total);
      setTotalPaginas(Math.max(1, res.paginacion.totalPaginas));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de expedientes desactivados');
    } finally {
      setCargando(false);
    }
  }, [busqueda, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function reactivar(exp: Expediente) {
    try {
      await expedientesApi.reactivar(exp.id);
      avisar(`Expediente ${exp.numero} reactivado: vuelve a la lista de expedientes.`);
      void cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo reactivar el expediente');
    }
  }

  async function eliminar(exp: Expediente) {
    await expedientesApi.eliminar(exp.id);
    setEliminando(null);
    avisar(`Expediente ${exp.numero} eliminado.`);
    void cargar();
  }

  return (
    <>
      <PageHeader
        title="Expedientes desactivados"
        subtitle="Expedientes dados de baja: no aparecen en la lista, en los indicadores ni en los pendientes, y no se pueden modificar. Se pueden reactivar en cualquier momento."
      />

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mb-4">
        <label htmlFor="buscar-desactivados" className="sr-only">
          Buscar expedientes desactivados
        </label>
        <input
          id="buscar-desactivados"
          type="search"
          placeholder="Buscar por carátula, asunto, número o iniciador"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1);
          }}
          className="block w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-marca-500"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">Expedientes desactivados</caption>
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">Número</th>
              <th scope="col" className="px-4 py-3">Carátula</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">Dependencia</th>
              <th scope="col" className="px-4 py-3">Desactivado</th>
              <th scope="col" className="px-4 py-3">Motivo</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expedientes.map((exp) => (
              <tr key={exp.id}>
                <td className="px-4 py-3 font-semibold whitespace-nowrap text-marca-700">
                  <Link to={`/expedientes/${exp.id}`} className="hover:underline">{exp.numero}</Link>
                </td>
                <td className="max-w-64 truncate px-4 py-3 text-slate-800" title={exp.caratula}>{exp.caratula}</td>
                <td className="px-4 py-3"><EtiquetaEstado estado={exp.estado} /></td>
                <td className="px-4 py-3 text-slate-600">{exp.dependenciaActual.nombre}</td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                  {fecha(exp.desactivadoEn)}
                  {exp.desactivadoPor && <span className="block text-xs text-slate-500">por {exp.desactivadoPor.nombre}</span>}
                </td>
                <td className="max-w-64 px-4 py-3 text-slate-700">{exp.motivoDesactivacion}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Boton tamano="chico" variante="fantasma" onClick={() => void reactivar(exp)} aria-label={`Reactivar ${exp.numero}`}>
                    Reactivar
                  </Boton>
                  <button
                    type="button"
                    onClick={() => setEliminando(exp)}
                    className="ml-2 text-sm font-medium text-sello hover:underline"
                    aria-label={`Eliminar ${exp.numero}`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {expedientes.length === 0 && !cargando && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  {busqueda ? 'No hay expedientes desactivados que coincidan con la búsqueda.' : 'No hay expedientes desactivados.'}
                </td>
              </tr>
            )}
            {cargando && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">Cargando…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          {total} expediente{total === 1 ? '' : 's'} desactivado{total === 1 ? '' : 's'} · página {pagina} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          <button type="button" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50">
            Anterior
          </button>
          <button type="button" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50">
            Siguiente
          </button>
        </div>
      </div>

      {eliminando && (
        <DialogoConfirmacion
          titulo="Eliminar expediente"
          textoConfirmar="Eliminar"
          onConfirmar={() => eliminar(eliminando)}
          onCancelar={() => setEliminando(null)}
        >
          ¿Eliminar <strong>{eliminando.numero}</strong> definitivamente? No se puede deshacer. Solo se eliminan expedientes sin actividad
          (sin documentos, actuaciones, tareas, pases ni cambios de estado); si tiene historial, queda desactivado.
        </DialogoConfirmacion>
      )}
    </>
  );
}
