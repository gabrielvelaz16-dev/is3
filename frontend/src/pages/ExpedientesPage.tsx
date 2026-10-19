import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Boton } from '../components/ui/Boton';
import { EtiquetaEstado, EtiquetaPrioridad } from '../components/ui/Etiquetas';
import { ApiError } from '../services/api';
import { recordarListaExpedientes } from '../routes/navegacion';
import { expedientesApi } from '../services/expedientes';
import type { Expediente, EstadoExpediente, Prioridad } from '../services/tipos';
import { ESTADOS_EXPEDIENTE, ETIQUETA_TIPO, PRIORIDADES } from '../services/tipos';

const POR_PAGINA = 10;

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-PY', { dateStyle: 'short' }) : '—';

const selectClass = 'rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-marca-500';

export function ExpedientesPage() {
  const { puede } = useAuth();
  const navigate = useNavigate();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  // Búsqueda, filtros y página viven en la dirección (?q=...&estado=...&pagina=2): sobreviven
  // al ir a un expediente y volver, al botón Atrás del navegador y se pueden compartir.
  const [params, setParams] = useSearchParams();
  const busqueda = params.get('q') ?? '';
  const filtroEstado = params.get('estado') ?? '';
  const filtroPrioridad = params.get('prioridad') ?? '';
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);

  const cambiar = (cambios: Record<string, string>) => {
    setParams(
      (actual) => {
        const nuevos = new URLSearchParams(actual);
        for (const [clave, valor] of Object.entries(cambios)) {
          if (valor) nuevos.set(clave, valor);
          else nuevos.delete(clave);
        }
        // Cambiar un filtro vuelve a la primera página.
        if (!('pagina' in cambios)) nuevos.delete('pagina');
        return nuevos;
      },
      { replace: true },
    );
  };
  const irAPagina = (p: number) => cambiar({ pagina: p > 1 ? String(p) : '' });

  useEffect(() => {
    recordarListaExpedientes(params.size ? `?${params.toString()}` : '');
  }, [params]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await expedientesApi.listar({
        q: busqueda || undefined,
        estado: (filtroEstado as EstadoExpediente) || undefined,
        prioridad: (filtroPrioridad as Prioridad) || undefined,
        pagina,
        porPagina: POR_PAGINA,
      });
      setExpedientes(res.items);
      setTotal(res.paginacion.total);
      setTotalPaginas(res.paginacion.totalPaginas);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de expedientes');
    } finally {
      setCargando(false);
    }
  }, [busqueda, filtroEstado, filtroPrioridad, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <>
      <PageHeader title="Expedientes" subtitle="Registro, consulta y seguimiento de expedientes electrónicos.">
        {puede('expedientes.crear') && (
          <Boton variante="primario" onClick={() => navigate('/expedientes/nuevo')}>
            Nuevo expediente
          </Boton>
        )}
      </PageHeader>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="buscar" className="sr-only">Buscar expedientes</label>
          <input
            id="buscar"
            type="search"
            placeholder="Buscar por carátula, asunto, número o iniciador"
            value={busqueda}
            onChange={(e) => cambiar({ q: e.target.value })}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-marca-500"
          />
        </div>
        <select
          aria-label="Filtrar por estado"
          value={filtroEstado}
          onChange={(e) => cambiar({ estado: e.target.value })}
          className={selectClass}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_EXPEDIENTE.map((e) => (
            <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por prioridad"
          value={filtroPrioridad}
          onChange={(e) => cambiar({ prioridad: e.target.value })}
          className={selectClass}
        >
          <option value="">Todas las prioridades</option>
          {PRIORIDADES.map((p) => (
            <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
          ))}
        </select>
        {(busqueda || filtroEstado || filtroPrioridad) && (
          <Boton variante="fantasma" onClick={() => setParams({}, { replace: true })}>
            Limpiar filtros
          </Boton>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">Expedientes del sistema</caption>
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">Número</th>
              <th scope="col" className="px-4 py-3">Carátula</th>
              <th scope="col" className="px-4 py-3">Tipo</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">Prioridad</th>
              <th scope="col" className="px-4 py-3">Iniciador</th>
              <th scope="col" className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expedientes.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap text-marca-700">
                  <Link to={`/expedientes/${exp.id}`} className="hover:underline">{exp.numero}</Link>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800 max-w-72 truncate" title={exp.caratula}>
                  <Link to={`/expedientes/${exp.id}`} tabIndex={-1} className="hover:text-marca-700 hover:underline">
                    {exp.caratula}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{ETIQUETA_TIPO[exp.tipo] ?? exp.tipo}</td>
                <td className="px-4 py-3">
                  <EtiquetaEstado estado={exp.estado} />
                  {exp.paseEnTransito && <span className="mt-1 block text-xs text-violet-800">En tránsito</span>}
                </td>
                <td className="px-4 py-3">
                  <EtiquetaPrioridad prioridad={exp.prioridad} />
                </td>
                <td className="max-w-44 truncate px-4 py-3 text-slate-600" title={exp.iniciador}>
                  {exp.iniciador}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">{fecha(exp.creadoEn)}</td>
              </tr>
            ))}
            {expedientes.length === 0 && !cargando && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No hay expedientes que coincidan con los criterios.
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

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          {total} expediente{total === 1 ? '' : 's'} · página {pagina} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          <button type="button" disabled={pagina <= 1} onClick={() => irAPagina(pagina - 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50">
            Anterior
          </button>
          <button type="button" disabled={pagina >= totalPaginas} onClick={() => irAPagina(pagina + 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50">
            Siguiente
          </button>
        </div>
      </div>
    </>
  );
}
