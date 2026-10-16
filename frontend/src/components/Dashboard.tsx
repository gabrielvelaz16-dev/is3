/**
 * Dashboard de estadísticas — Sprint 6 (S6-01, RF-18).
 * Muestra los indicadores del alcance del usuario (su dependencia o toda la institución).
 * Los números se calculan en el servidor; S6-04 los verifica contra la base en la CI.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../services/api';
import { type Dashboard as DatosDashboard, reportesApi } from '../services/reportes';
import { ESTADOS_EXPEDIENTE, ETIQUETA_TIPO, PRIORIDADES } from '../services/tipos';

function Tarjeta({ titulo, valor, detalle, alerta = false }: { titulo: string; valor: number; detalle?: string; alerta?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${alerta && valor > 0 ? 'border-l-4 border-sello/40 border-l-sello' : 'border-slate-200'}`}>
      <dt className="text-sm text-slate-600">{titulo}</dt>
      <dd className={`mt-1 text-3xl font-semibold tracking-tight ${alerta && valor > 0 ? 'text-sello' : 'text-tinta'}`}>{valor}</dd>
      {detalle && <dd className="mt-1 text-xs text-slate-500">{detalle}</dd>}
    </div>
  );
}

/** Tabla con barra proporcional: legible para lectores de pantalla y sin librerías de gráficos. */
export function Distribucion({ titulo, filas, total }: { titulo: string; filas: { etiqueta: string; valor: number }[]; total: number }) {
  const id = `dist-${titulo.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 id={id} className="mb-3 text-sm font-semibold text-tinta">
        {titulo}
      </h3>
      <table className="w-full text-sm">
        <caption className="sr-only">{titulo}</caption>
        <tbody>
          {filas.map((f) => (
            <tr key={f.etiqueta}>
              <th scope="row" className="w-32 py-1 pr-2 text-left font-normal text-slate-600">
                {f.etiqueta}
              </th>
              <td className="py-1">
                <div className="h-2.5 rounded bg-slate-100" aria-hidden="true">
                  <div className="h-2.5 rounded bg-marca-500" style={{ width: `${total ? (f.valor / total) * 100 : 0}%` }} />
                </div>
              </td>
              <td className="w-10 py-1 pl-2 text-right font-medium text-slate-800">{f.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function Dashboard() {
  const { puede } = useAuth();
  const [datos, setDatos] = useState<DatosDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    reportesApi
      .dashboard()
      .then((d) => vigente && setDatos(d))
      .catch((err: unknown) => vigente && setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las estadísticas'));
    return () => {
      vigente = false;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {error}
      </p>
    );
  }
  if (!datos) return <p className="mb-6 text-sm text-slate-500">Cargando estadísticas…</p>;

  const { resumen, seguimiento } = datos;
  const alcance = datos.alcance.tipo === 'INSTITUCION' ? 'toda la institución' : datos.alcance.dependencia.nombre;

  return (
    <section aria-labelledby="titulo-dashboard" className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-dashboard" className="text-base font-semibold text-tinta">
          Situación de {alcance}
        </h2>
        {puede('reportes.consultar') && (
          <Link to="/reportes" className="text-sm font-medium text-marca-700 hover:underline">
            Ver reportes
          </Link>
        )}
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Tarjeta titulo="Expedientes" valor={resumen.total} />
        <Tarjeta titulo="Vencidos" valor={seguimiento.vencidos} detalle="Sin resolver y con fecha pasada" alerta />
        <Tarjeta titulo="Por vencer" valor={seguimiento.porVencer} detalle={`En los próximos ${datos.diasAviso} días`} />
        <Tarjeta titulo="En tránsito" valor={seguimiento.enTransito} detalle="Enviados, sin recibir" />
        <Tarjeta titulo="Por recibir" valor={seguimiento.porRecibir} detalle="Pases hacia la dependencia" />
        <Tarjeta
          titulo="Tareas vencidas"
          valor={seguimiento.tareasVencidas}
          detalle={`de ${seguimiento.tareasAbiertas} tareas abiertas`}
          alerta
        />
      </dl>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Distribucion
          titulo="Por estado"
          total={resumen.total}
          filas={ESTADOS_EXPEDIENTE.map((e) => ({ etiqueta: e.etiqueta, valor: resumen.porEstado[e.valor] }))}
        />
        <Distribucion
          titulo="Por prioridad"
          total={resumen.total}
          filas={PRIORIDADES.map((p) => ({ etiqueta: p.etiqueta, valor: resumen.porPrioridad[p.valor] }))}
        />
        {datos.alcance.tipo === 'INSTITUCION' ? (
          <Distribucion
            titulo="Por dependencia"
            total={resumen.total}
            filas={resumen.porDependencia.map((d) => ({ etiqueta: d.dependencia.nombre, valor: d.total }))}
          />
        ) : (
          <Distribucion
            titulo="Por tipo"
            total={resumen.total}
            filas={resumen.porTipo.map((t) => ({ etiqueta: ETIQUETA_TIPO[t.tipo] ?? t.tipo, valor: t.total }))}
          />
        )}
      </div>
    </section>
  );
}
