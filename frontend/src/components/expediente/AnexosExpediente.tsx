/**
 * Documentos, actuaciones e historial del expediente — Sprint 4 (RF-08 a RF-11).
 * Cada sección carga sus datos; `version` cambia cuando algo se modifica para que todas se actualicen.
 */
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  type Actuacion,
  anexosApi,
  type DocumentoExpediente,
  type EventoHistorial,
  EXTENSIONES_PERMITIDAS,
  MAX_MB,
  tamanoLegible,
  type TipoActuacion,
  type TipoEvento,
} from '../../services/anexos';
import { ApiError } from '../../services/api';
import type { Expediente } from '../../services/tipos';

const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-PY', { dateStyle: 'medium', timeStyle: 'short' });
const mensaje = (err: unknown, porDefecto: string) => (err instanceof ApiError ? err.message : porDefecto);

/** Carga datos y los recarga cuando cambia `version`. */
function useCarga<T>(cargar: () => Promise<T>, version: number) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let vigente = true;
    cargar()
      .then((d) => vigente && (setDatos(d), setError(null)))
      .catch((err) => vigente && setError(mensaje(err, 'No se pudieron cargar los datos')));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);
  return { datos, error };
}

function Seccion({ titulo, id, children }: { titulo: string; id: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id={id} className="mb-4 text-lg font-semibold text-slate-800">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

const Alerta = ({ texto }: { texto: string }) => (
  <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
    {texto}
  </p>
);

const Aviso = ({ texto }: { texto: string }) => (
  <p role="status" className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
    {texto}
  </p>
);

// ── Documentos ────────────────────────────────────────────────────

function DocumentosSeccion({ expediente, version, onCambio }: Props) {
  const { puede } = useAuth();
  const { datos: documentos, error } = useCarga(() => anexosApi.documentos(expediente.id), version);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const puedeAdjuntar = puede('documentos.adjuntar') && expediente.estado !== 'ARCHIVADO';

  async function adjuntar(ev: FormEvent) {
    ev.preventDefault();
    if (!archivo) return;
    setErrorAccion(null);
    setAviso(null);
    if (archivo.size > MAX_MB * 1024 * 1024) {
      setErrorAccion(`El archivo supera el máximo de ${MAX_MB} MB`);
      return;
    }
    setEnviando(true);
    try {
      const doc = await anexosApi.subir(expediente.id, archivo, descripcion);
      setAviso(`Documento "${doc.nombreOriginal}" adjuntado`);
      setArchivo(null);
      setDescripcion('');
      if (inputRef.current) inputRef.current.value = '';
      onCambio();
    } catch (err) {
      const e = err instanceof ApiError ? (err.campo('archivo') ?? err.message) : 'No se pudo adjuntar el documento';
      setErrorAccion(e);
    } finally {
      setEnviando(false);
    }
  }

  async function descargar(doc: DocumentoExpediente) {
    setErrorAccion(null);
    try {
      await anexosApi.descargar(expediente.id, doc);
    } catch (err) {
      setErrorAccion(mensaje(err, 'No se pudo descargar el documento'));
    }
  }

  return (
    <Seccion titulo="Documentos" id="titulo-documentos">
      {error && <Alerta texto={error} />}
      {errorAccion && <Alerta texto={errorAccion} />}
      {aviso && <Aviso texto={aviso} />}

      {documentos && documentos.length === 0 && <p className="text-sm text-slate-500">El expediente todavía no tiene documentos.</p>}
      {documentos && documentos.length > 0 && (
        <ul className="divide-y divide-slate-100" aria-label="Documentos del expediente">
          {documentos.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800" title={d.nombreOriginal}>
                  {d.nombreOriginal}
                </p>
                <p className="text-xs text-slate-500">
                  {tamanoLegible(d.tamanoBytes)} · {d.subidoPor.nombre} · {fechaHora(d.subidoEn)}
                  {d.descripcion ? ` · ${d.descripcion}` : ''}
                </p>
              </div>
              {puede('documentos.descargar') && (
                <button
                  type="button"
                  onClick={() => descargar(d)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
                  aria-label={`Descargar ${d.nombreOriginal}`}
                >
                  Descargar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {puedeAdjuntar && (
        <form onSubmit={adjuntar} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="text-sm">
            <label htmlFor="archivo-documento" className="mb-1 block font-medium text-slate-700">
              Archivo
            </label>
            <input
              id="archivo-documento"
              ref={inputRef}
              type="file"
              accept={EXTENSIONES_PERMITIDAS}
              aria-describedby="ayuda-archivo"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5"
            />
            <p id="ayuda-archivo" className="mt-1 text-xs text-slate-500">
              PDF, PNG, JPG, Word o Excel · máximo {MAX_MB} MB
            </p>
          </div>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Descripción (opcional)</span>
            <input
              type="text"
              maxLength={500}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5"
            />
          </label>
          <button
            type="submit"
            disabled={!archivo || enviando}
            className="rounded-md bg-marca-700 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-50"
          >
            {enviando ? 'Adjuntando…' : 'Adjuntar'}
          </button>
        </form>
      )}
    </Seccion>
  );
}

// ── Actuaciones ───────────────────────────────────────────────────

const ETIQUETA_ACTUACION: Record<TipoActuacion, string> = { ACTUACION: 'Actuación', OBSERVACION: 'Observación' };

function ActuacionesSeccion({ expediente, version, onCambio }: Props) {
  const { puede } = useAuth();
  const { datos: actuaciones, error } = useCarga(() => anexosApi.actuaciones(expediente.id), version);
  const [tipo, setTipo] = useState<TipoActuacion>('ACTUACION');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const puedeRegistrar = puede('actuaciones.registrar') && expediente.estado !== 'ARCHIVADO';

  async function registrar(ev: FormEvent) {
    ev.preventDefault();
    setErrorAccion(null);
    setEnviando(true);
    try {
      await anexosApi.registrarActuacion(expediente.id, { tipo, texto });
      setTexto('');
      onCambio();
    } catch (err) {
      setErrorAccion(err instanceof ApiError ? (err.campo('texto') ?? err.message) : 'No se pudo registrar');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Seccion titulo="Actuaciones y observaciones" id="titulo-actuaciones">
      {error && <Alerta texto={error} />}
      {actuaciones && actuaciones.length === 0 && <p className="text-sm text-slate-500">Sin actuaciones registradas.</p>}
      {actuaciones && actuaciones.length > 0 && (
        <ul className="space-y-3" aria-label="Actuaciones del expediente">
          {actuaciones.map((a: Actuacion) => (
            <li key={a.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">
                <span className={a.tipo === 'OBSERVACION' ? 'font-semibold text-amber-700' : 'font-semibold text-marca-700'}>
                  {ETIQUETA_ACTUACION[a.tipo]}
                </span>{' '}
                · {a.autor.nombre} · {fechaHora(a.fecha)}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-800">{a.texto}</p>
            </li>
          ))}
        </ul>
      )}

      {puedeRegistrar && (
        <form onSubmit={registrar} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {errorAccion && <Alerta texto={errorAccion} />}
          <fieldset className="flex gap-4 text-sm">
            <legend className="sr-only">Tipo de registro</legend>
            {(['ACTUACION', 'OBSERVACION'] as const).map((t) => (
              <label key={t} className="flex items-center gap-1.5">
                <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)} />
                {ETIQUETA_ACTUACION[t]}
              </label>
            ))}
          </fieldset>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Texto</span>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              maxLength={5000}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <p className="text-xs text-slate-500">La fecha y el autor se registran automáticamente. Una vez guardado no se puede editar.</p>
          <button
            type="submit"
            disabled={texto.trim().length < 3 || enviando}
            className="rounded-md bg-marca-700 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-50"
          >
            {enviando ? 'Guardando…' : 'Registrar'}
          </button>
        </form>
      )}
    </Seccion>
  );
}

// ── Historial ─────────────────────────────────────────────────────

const ETIQUETA_EVENTO: Record<TipoEvento, string> = {
  CREACION: 'Creación',
  CAMBIO_ESTADO: 'Cambio de estado',
  DOCUMENTO: 'Documento',
  ACTUACION: 'Actuación',
  OBSERVACION: 'Observación',
};

const COLOR_EVENTO: Record<TipoEvento, string> = {
  CREACION: 'bg-slate-500',
  CAMBIO_ESTADO: 'bg-blue-600',
  DOCUMENTO: 'bg-green-600',
  ACTUACION: 'bg-marca-700',
  OBSERVACION: 'bg-amber-500',
};

function HistorialSeccion({ expediente, version }: Omit<Props, 'onCambio'>) {
  const { datos: eventos, error } = useCarga(() => anexosApi.historial(expediente.id), version);
  return (
    <Seccion titulo="Historial" id="titulo-historial">
      {error && <Alerta texto={error} />}
      {eventos && (
        <ol className="relative ml-2 border-l border-slate-200" aria-label="Historial del expediente">
          {eventos.map((ev: EventoHistorial, i) => (
            <li key={`${ev.tipo}-${ev.referenciaId ?? 0}-${i}`} className="mb-4 ml-4 last:mb-0">
              <span className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ${COLOR_EVENTO[ev.tipo]}`} aria-hidden="true" />
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{ETIQUETA_EVENTO[ev.tipo]}</span> · {ev.usuario.nombre} ·{' '}
                <time dateTime={ev.fecha}>{fechaHora(ev.fecha)}</time>
              </p>
              <p className="mt-0.5 whitespace-pre-line text-sm text-slate-800">{ev.descripcion}</p>
            </li>
          ))}
        </ol>
      )}
    </Seccion>
  );
}

interface Props {
  expediente: Pick<Expediente, 'id' | 'estado'>;
  version: number;
  onCambio: () => void;
}

export function AnexosExpediente(props: Props) {
  return (
    <>
      <DocumentosSeccion {...props} />
      <ActuacionesSeccion {...props} />
      <HistorialSeccion expediente={props.expediente} version={props.version} />
    </>
  );
}
