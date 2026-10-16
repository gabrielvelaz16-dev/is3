/**
 * Tareas y pendientes — Sprint 5 (RF-13, RF-16, RF-17).
 * Lo que el usuario tiene que atender: expedientes recibidos sin confirmar, sus tareas
 * abiertas con alertas de vencimiento y los expedientes de su dependencia por vencer.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { ApiError } from '../services/api';
import { type Alerta, ETIQUETA_TAREA, type EstadoTarea, type Pendientes, seguimientoApi } from '../services/seguimiento';
import { useAviso } from '../components/ui/Avisos';

const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-PY', { dateStyle: 'medium' }) : '—');
const mensaje = (err: unknown, porDefecto: string) => (err instanceof ApiError ? err.message : porDefecto);

function EtiquetaAlerta({ alerta }: { alerta: Alerta }) {
  if (!alerta) return null;
  return alerta === 'VENCIDA' ? (
    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Vencida</span>
  ) : (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Por vencer</span>
  );
}

function Bloque({ titulo, id, vacio, children }: { titulo: string; id: string; vacio: string | null; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
      <h2 id={id} className="mb-3 text-lg font-semibold text-slate-800">
        {titulo}
      </h2>
      {vacio ? <p className="text-sm text-slate-500">{vacio}</p> : children}
    </section>
  );
}

export function PendientesPage() {
  const { puede } = useAuth();
  const [datos, setDatos] = useState<Pendientes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const avisar = useAviso();
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setDatos(await seguimientoApi.pendientes());
    } catch (err) {
      setError(mensaje(err, 'No se pudieron cargar los pendientes'));
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function accion(fn: () => Promise<unknown>, ok: string) {
    setError(null);
    setOcupado(true);
    try {
      await fn();
      avisar(ok);
      await cargar();
    } catch (err) {
      setError(mensaje(err, 'No se pudo completar la acción'));
    } finally {
      setOcupado(false);
    }
  }

  const cambiarTarea = (id: number, estado: EstadoTarea, titulo: string) =>
    accion(() => seguimientoApi.cambiarEstadoTarea(id, estado), `Tarea "${titulo}": ${ETIQUETA_TAREA[estado].toLowerCase()}`);

  return (
    <>
      <PageHeader title="Tareas y pendientes" subtitle="Expedientes recibidos, tareas asignadas y vencimientos próximos." />

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {!datos && !error && <p className="py-8 text-center text-slate-500">Cargando…</p>}

      {datos && (
        <>
          {puede('expedientes.recibir') && (
            <Bloque titulo="Expedientes recibidos" id="titulo-recibidos" vacio={datos.recibidos.length ? null : 'No hay expedientes pendientes de recepción.'}>
              <ul className="divide-y divide-slate-100" aria-label="Expedientes recibidos">
                {datos.recibidos.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0 text-sm">
                      <Link to={`/expedientes/${p.expediente.id}`} className="font-mono font-medium text-marca-700 hover:underline">
                        {p.expediente.numero}
                      </Link>{' '}
                      <span className="text-slate-800">{p.expediente.caratula}</span>
                      <p className="text-xs text-slate-500">
                        De {p.origen.nombre} · {p.enviadoPor.nombre} · {fecha(p.enviadoEn)} · {p.motivo}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => accion(() => seguimientoApi.recibir(p.id), `Expediente ${p.expediente.numero} recibido`)}
                      className="rounded-md bg-marca-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-50"
                    >
                      Confirmar recepción
                    </button>
                  </li>
                ))}
              </ul>
            </Bloque>
          )}

          <Bloque titulo="Mis tareas" id="titulo-mis-tareas" vacio={datos.tareas.length ? null : 'No tenés tareas abiertas.'}>
            <ul className="divide-y divide-slate-100" aria-label="Mis tareas">
              {datos.tareas.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-slate-800">
                      {t.titulo} <EtiquetaAlerta alerta={t.alerta} />
                    </p>
                    <p className="text-xs text-slate-500">
                      <Link to={`/expedientes/${t.expediente.id}`} className="font-mono text-marca-700 hover:underline">
                        {t.expediente.numero}
                      </Link>{' '}
                      · vence {fecha(t.vencimiento)} · {ETIQUETA_TAREA[t.estado]}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {t.estado === 'PENDIENTE' && (
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => cambiarTarea(t.id, 'EN_CURSO', t.titulo)}
                        className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-50"
                        aria-label={`Iniciar ${t.titulo}`}
                      >
                        Iniciar
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => cambiarTarea(t.id, 'COMPLETADA', t.titulo)}
                      className="rounded-md border border-green-600 px-3 py-1 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
                      aria-label={`Completar ${t.titulo}`}
                    >
                      Completar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Bloque>

          {puede('expedientes.consultar') && (
            <Bloque
              titulo="Expedientes por vencer"
              id="titulo-por-vencer"
              vacio={datos.expedientesPorVencer.length ? null : 'No hay expedientes de tu dependencia por vencer.'}
            >
              <ul className="divide-y divide-slate-100" aria-label="Expedientes por vencer">
                {datos.expedientesPorVencer.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <Link to={`/expedientes/${e.id}`} className="font-mono font-medium text-marca-700 hover:underline">
                        {e.numero}
                      </Link>{' '}
                      <span className="text-slate-800">{e.caratula}</span>
                      <p className="text-xs text-slate-500">Vence {fecha(e.fechaVencimiento)}</p>
                    </div>
                    <EtiquetaAlerta alerta={e.alerta} />
                  </li>
                ))}
              </ul>
            </Bloque>
          )}
        </>
      )}
    </>
  );
}
