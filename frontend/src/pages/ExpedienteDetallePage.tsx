/**
 * Detalle del expediente (S3-02, rediseñado en CR-05).
 * Arriba, la carátula —como la tapa de una carpeta— con número, estado y datos clave, y las
 * acciones de estado. Abajo, el contenido en pestañas: Datos, Documentos, Actuaciones, Tareas
 * e Historial. La pestaña activa queda en la dirección (?pestana=documentos) para poder enlazarla.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { AccionesExpediente } from '../components/expediente/AccionesExpediente';
import { AnexoExpediente, type ClaveAnexo } from '../components/expediente/AnexosExpediente';
import { PageHeader } from '../components/PageHeader';
import { Boton, BotonEnlace } from '../components/ui/Boton';
import { EtiquetaEstado, EtiquetaPrioridad, etiquetaEstado } from '../components/ui/Etiquetas';
import { type Pestana, Pestanas } from '../components/ui/Pestanas';
import { ApiError } from '../services/api';
import { expedientesApi } from '../services/expedientes';
import { seguimientoApi } from '../services/seguimiento';
import type { EstadoExpediente, Expediente } from '../services/tipos';
import { ETIQUETA_TIPO } from '../services/tipos';

const TRANSICIONES: Record<EstadoExpediente, EstadoExpediente[]> = {
  BORRADOR: ['EN_TRAMITE'],
  EN_TRAMITE: ['EN_REVISION', 'RESUELTO'],
  EN_REVISION: ['EN_TRAMITE', 'RESUELTO'],
  RESUELTO: ['ARCHIVADO', 'EN_TRAMITE'],
  ARCHIVADO: [],
};

const PESTANAS: (Pestana & { clave: 'datos' | ClaveAnexo })[] = [
  { clave: 'datos', titulo: 'Datos' },
  { clave: 'documentos', titulo: 'Documentos' },
  { clave: 'actuaciones', titulo: 'Actuaciones' },
  { clave: 'tareas', titulo: 'Tareas' },
  { clave: 'historial', titulo: 'Historial' },
];

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-PY', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const dia = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-PY', { dateStyle: 'medium' }) : 'Sin vencimiento');

function Campo({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{valor ?? '—'}</dd>
    </div>
  );
}

export function ExpedienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { puede } = useAuth();
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState(false);
  /** Aumenta cuando cambia algo del expediente, para recargar documentos, actuaciones e historial. */
  const [version, setVersion] = useState(0);
  const [motivo, setMotivo] = useState('');

  const pestana = PESTANAS.some((p) => p.clave === params.get('pestana')) ? params.get('pestana')! : 'datos';
  const cambiarPestana = (clave: string) =>
    setParams(
      (p) => {
        if (clave === 'datos') p.delete('pestana');
        else p.set('pestana', clave);
        return p;
      },
      { replace: true },
    );

  useEffect(() => {
    let vigente = true;
    expedientesApi
      .obtener(Number(id))
      .then((exp) => {
        if (vigente) setExpediente(exp);
      })
      .catch((err) => {
        if (!vigente) return;
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el expediente');
      });
    return () => {
      vigente = false;
    };
  }, [id, version]);

  /** Después de una acción: usa el expediente devuelto o lo vuelve a pedir, y recarga las secciones. */
  function actualizado(exp?: Expediente) {
    if (exp) setExpediente(exp);
    setError(null);
    setVersion((v) => v + 1);
  }

  async function cambiarEstado(nuevoEstado: EstadoExpediente) {
    if (!expediente) return;
    setCambiando(true);
    try {
      actualizado(await seguimientoApi.cambiarEstado(expediente.id, nuevoEstado, motivo));
      setMotivo('');
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
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
        <BotonEnlace to="/expedientes" className="mt-4">
          Volver a la lista
        </BotonEnlace>
      </>
    );
  }

  if (!expediente) {
    return <p className="py-8 text-center text-slate-500">Cargando expediente…</p>;
  }

  const enTransito = expediente.paseEnTransito;
  const editable = expediente.estado !== 'ARCHIVADO' && !enTransito;
  const transicionesDisponibles = editable ? (TRANSICIONES[expediente.estado] ?? []) : [];
  const abierto = expediente.estado !== 'RESUELTO' && expediente.estado !== 'ARCHIVADO';
  const vencido = abierto && expediente.fechaVencimiento !== null && new Date(expediente.fechaVencimiento).getTime() < Date.now();

  return (
    <>
      {/* Carátula: la tapa de la carpeta, con el número en la pestaña. */}
      <div className="relative mt-7 mb-8">
        <span className="absolute -top-7 left-0 rounded-t-lg border border-b-0 border-carpeta/50 bg-carpeta-claro px-4 pt-1.5 pb-1 text-sm font-semibold tracking-wide text-tinta">
          {expediente.numero}
        </span>
        <div className="rounded-lg rounded-tl-none border border-carpeta/50 border-t-4 border-t-carpeta bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl leading-snug font-semibold tracking-tight text-tinta">
                <span className="sr-only">Expediente {expediente.numero}: </span>
                {expediente.caratula}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {ETIQUETA_TIPO[expediente.tipo] ?? expediente.tipo} de {expediente.iniciador}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {puede('expedientes.modificar') && editable && (
                <Boton onClick={() => navigate(`/expedientes/${expediente.id}/editar`)}>Editar</Boton>
              )}
              <BotonEnlace to="/expedientes" variante="fantasma">
                Volver a la lista
              </BotonEnlace>
            </div>
          </div>

          <dl className="mt-5 grid gap-x-8 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-5">
            <Campo etiqueta="Estado" valor={<EtiquetaEstado estado={expediente.estado} grande />} />
            <Campo etiqueta="Prioridad" valor={<EtiquetaPrioridad prioridad={expediente.prioridad} />} />
            <Campo etiqueta="Dependencia actual" valor={expediente.dependenciaActual.nombre} />
            <Campo etiqueta="Responsable" valor={expediente.responsable?.nombre ?? 'Sin asignar'} />
            <Campo
              etiqueta="Vencimiento"
              valor={<span className={vencido ? 'font-semibold text-sello' : undefined}>{dia(expediente.fechaVencimiento)}{vencido && ' (vencido)'}</span>}
            />
          </dl>

          {puede('estados.cambiar') && transicionesDisponibles.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-md bg-papel px-3 py-2.5">
              <span className="text-sm text-slate-600">Pasar a:</span>
              {transicionesDisponibles.map((t) => (
                <Boton key={t} tamano="chico" disabled={cambiando} onClick={() => void cambiarEstado(t)}>
                  {etiquetaEstado(t)}
                </Boton>
              ))}
              <label htmlFor="motivo-estado" className="sr-only">
                Motivo del cambio de estado
              </label>
              <input
                id="motivo-estado"
                type="text"
                placeholder="Motivo del cambio (opcional)"
                maxLength={500}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="min-w-48 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {enTransito && (
        <p role="status" className="mb-6 rounded-md border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          En tránsito hacia <strong>{enTransito.destino.nombre}</strong> desde el {fecha(enTransito.enviadoEn)}. No se puede modificar hasta que
          la dependencia destino confirme la recepción.
        </p>
      )}

      <Pestanas pestanas={PESTANAS} activa={pestana} onCambiar={cambiarPestana} etiqueta="Secciones del expediente">
        {pestana === 'datos' ? (
          <>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                <Campo etiqueta="Tipo" valor={ETIQUETA_TIPO[expediente.tipo] ?? expediente.tipo} />
                <Campo etiqueta="Iniciador" valor={expediente.iniciador} />
                <Campo etiqueta="Creado por" valor={expediente.creadoPor.nombre} />
                <Campo etiqueta="Fecha de creación" valor={fecha(expediente.creadoEn)} />
                <Campo etiqueta="Última actualización" valor={fecha(expediente.actualizadoEn)} />
              </dl>
              {expediente.asunto && (
                <dl className="mt-5 border-t border-slate-100 pt-4">
                  <dt className="text-xs text-slate-500">Asunto</dt>
                  <dd className="mt-1 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-slate-800">{expediente.asunto}</dd>
                </dl>
              )}
              {expediente.descripcion && (
                <dl className="mt-4 border-t border-slate-100 pt-4">
                  <dt className="text-xs text-slate-500">Descripción</dt>
                  <dd className="mt-1 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-slate-700">{expediente.descripcion}</dd>
                </dl>
              )}
            </div>
            <AccionesExpediente expediente={expediente} editable={editable} onActualizado={actualizado} />
          </>
        ) : (
          <AnexoExpediente seccion={pestana as ClaveAnexo} expediente={expediente} version={version} onCambio={() => setVersion((v) => v + 1)} />
        )}
      </Pestanas>
    </>
  );
}
