import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { ApiError } from '../services/api';
import { expedientesApi, type ModificarExpediente } from '../services/expedientes';
import type { Expediente, EstadoExpediente } from '../services/tipos';
import { ESTADOS_EXPEDIENTE, ETIQUETA_TIPO } from '../services/tipos';

const TRANSICIONES: Record<EstadoExpediente, EstadoExpediente[]> = {
  BORRADOR: ['EN_TRAMITE'],
  EN_TRAMITE: ['EN_REVISION', 'RESUELTO'],
  EN_REVISION: ['EN_TRAMITE', 'RESUELTO'],
  RESUELTO: ['ARCHIVADO', 'EN_TRAMITE'],
  ARCHIVADO: [],
};

const claseEstado: Record<EstadoExpediente, string> = {
  BORRADOR: 'bg-slate-100 text-slate-700',
  EN_TRAMITE: 'bg-blue-100 text-blue-800',
  EN_REVISION: 'bg-amber-100 text-amber-800',
  RESUELTO: 'bg-green-100 text-green-800',
  ARCHIVADO: 'bg-slate-200 text-slate-600',
};

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-PY', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function Campo({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{valor ?? '—'}</dd>
    </div>
  );
}

export function ExpedienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { puede } = useAuth();
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    let vigente = true;
    expedientesApi.obtener(Number(id)).then((exp) => {
      if (vigente) setExpediente(exp);
    }).catch((err) => {
      if (!vigente) return;
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el expediente');
    });
    return () => { vigente = false; };
  }, [id]);

  async function cambiarEstado(nuevoEstado: EstadoExpediente) {
    if (!expediente) return;
    setCambiando(true);
    try {
      const actualizado = await expedientesApi.modificar(expediente.id, { estado: nuevoEstado } as ModificarExpediente);
      setExpediente(actualizado);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar el estado');
    } finally {
      setCambiando(false);
    }
  }

  if (error && !expediente) {
    return (
      <>
        <PageHeader title="Expediente" />
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        <Link to="/expedientes" className="mt-4 inline-block text-sm text-marca-700 hover:underline">← Volver a la lista</Link>
      </>
    );
  }

  if (!expediente) {
    return <p className="py-8 text-center text-slate-500">Cargando expediente…</p>;
  }

  const etiquetaEstado = (e: EstadoExpediente) =>
    ESTADOS_EXPEDIENTE.find((x) => x.valor === e)?.etiqueta ?? e;

  const transicionesDisponibles = TRANSICIONES[expediente.estado] ?? [];

  return (
    <>
      <PageHeader title={expediente.numero} subtitle={expediente.caratula}>
        <div className="flex gap-2">
          {puede('expedientes.modificar') && expediente.estado !== 'ARCHIVADO' && (
            <button
              type="button"
              onClick={() => navigate(`/expedientes/${expediente.id}/editar`)}
              className="rounded-md border border-marca-700 px-4 py-2 text-sm font-medium text-marca-700 hover:bg-marca-50"
            >
              Editar
            </button>
          )}
          <Link to="/expedientes" className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            ← Lista
          </Link>
        </div>
      </PageHeader>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {/* Estado y transiciones */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${claseEstado[expediente.estado]}`}>
          {etiquetaEstado(expediente.estado)}
        </span>
        {puede('expedientes.modificar') && transicionesDisponibles.length > 0 && (
          <>
            <span className="text-sm text-slate-400">→</span>
            {transicionesDisponibles.map((t) => (
              <button
                key={t}
                type="button"
                disabled={cambiando}
                onClick={() => cambiarEstado(t)}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {etiquetaEstado(t)}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Datos del expediente */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo etiqueta="Número" valor={<span className="font-mono">{expediente.numero}</span>} />
          <Campo etiqueta="Tipo" valor={ETIQUETA_TIPO[expediente.tipo] ?? expediente.tipo} />
          <Campo etiqueta="Prioridad" valor={expediente.prioridad} />
          <Campo etiqueta="Iniciador" valor={expediente.iniciador} />
          <Campo etiqueta="Dependencia" valor={expediente.dependenciaActual.nombre} />
          <Campo etiqueta="Creado por" valor={expediente.creadoPor.nombre} />
          <Campo etiqueta="Responsable" valor={expediente.responsable?.nombre ?? '—'} />
          <Campo etiqueta="Fecha de creación" valor={fecha(expediente.creadoEn)} />
          <Campo etiqueta="Última actualización" valor={fecha(expediente.actualizadoEn)} />
          <Campo etiqueta="Vencimiento" valor={fecha(expediente.fechaVencimiento)} />
        </dl>

        {expediente.asunto && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Asunto</dt>
            <dd className="mt-1 whitespace-pre-line text-sm text-slate-800">{expediente.asunto}</dd>
          </div>
        )}

        {expediente.descripcion && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Descripción</dt>
            <dd className="mt-1 whitespace-pre-line text-sm text-slate-700">{expediente.descripcion}</dd>
          </div>
        )}
      </div>
    </>
  );
}
