/**
 * Responsable y envío a otra dependencia — Sprint 5 (S5-01, S5-04).
 * Solo se muestra lo que el usuario puede hacer; el servidor vuelve a verificar todo.
 */
import { type FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../services/api';
import { seguimientoApi } from '../../services/seguimiento';
import type { Dependencia, Expediente } from '../../services/tipos';
import { usuariosApi } from '../../services/usuarios';

interface Props {
  expediente: Expediente;
  editable: boolean;
  onActualizado: (expediente?: Expediente) => void;
}

const mensaje = (err: unknown, porDefecto: string) =>
  err instanceof ApiError ? (err.details[0]?.message ?? err.message) : porDefecto;

export function AccionesExpediente({ expediente, editable, onActualizado }: Props) {
  const { puede, usuario } = useAuth();
  const puedeAsignar = puede('responsables.asignar') && editable;
  const esDeMiDependencia = usuario?.dependencia.id === expediente.dependenciaActualId;
  const puedeEnviar = puede('expedientes.enviar') && editable && (esDeMiDependencia || puede('expedientes.consultar_todas'));

  if (!puedeAsignar && !puedeEnviar) return null;

  return (
    <section aria-labelledby="titulo-acciones" className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="titulo-acciones" className="mb-4 text-lg font-semibold text-slate-800">
        Responsable y pase
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {puedeAsignar && <AsignarResponsable expediente={expediente} onActualizado={onActualizado} />}
        {puedeEnviar && <EnviarExpediente expediente={expediente} onActualizado={onActualizado} />}
      </div>
    </section>
  );
}

function AsignarResponsable({ expediente, onActualizado }: Omit<Props, 'editable'>) {
  const [usuarios, setUsuarios] = useState<{ id: number; nombre: string }[]>([]);
  const [seleccion, setSeleccion] = useState(String(expediente.responsable?.id ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vigente = true;
    seguimientoApi
      .usuariosDeDependencia(expediente.dependenciaActualId)
      .then((u) => vigente && setUsuarios(u))
      .catch((err) => vigente && setError(mensaje(err, 'No se pudieron cargar los usuarios')));
    return () => {
      vigente = false;
    };
  }, [expediente.dependenciaActualId]);

  async function asignar(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      onActualizado(await seguimientoApi.asignarResponsable(expediente.id, seleccion ? Number(seleccion) : null));
    } catch (err) {
      setError(mensaje(err, 'No se pudo asignar el responsable'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={asignar} className="space-y-2 text-sm">
      <label htmlFor="responsable" className="block font-medium text-slate-700">
        Responsable
      </label>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <select
          id="responsable"
          value={seleccion}
          onChange={(e) => setSeleccion(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-1.5"
        >
          <option value="">Sin responsable</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={enviando || seleccion === String(expediente.responsable?.id ?? '')}
          className="rounded-md border border-marca-700 px-3 py-1.5 font-medium text-marca-700 hover:bg-marca-50 disabled:opacity-50"
        >
          Asignar
        </button>
      </div>
    </form>
  );
}

function EnviarExpediente({ expediente, onActualizado }: Omit<Props, 'editable'>) {
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vigente = true;
    usuariosApi
      .dependencias()
      .then((d) => vigente && setDependencias(d.filter((x) => x.id !== expediente.dependenciaActualId)))
      .catch((err) => vigente && setError(mensaje(err, 'No se pudieron cargar las dependencias')));
    return () => {
      vigente = false;
    };
  }, [expediente.dependenciaActualId]);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await seguimientoApi.enviar(expediente.id, Number(destino), motivo);
      setMotivo('');
      onActualizado();
    } catch (err) {
      setError(mensaje(err, 'No se pudo enviar el expediente'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-2 text-sm">
      <label htmlFor="destino" className="block font-medium text-slate-700">
        Enviar a otra dependencia
      </label>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <select
        id="destino"
        value={destino}
        onChange={(e) => setDestino(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-1.5"
      >
        <option value="">Elegir dependencia…</option>
        {dependencias.map((d) => (
          <option key={d.id} value={d.id}>
            {d.nombre}
          </option>
        ))}
      </select>
      <label htmlFor="motivo-pase" className="sr-only">
        Motivo del pase
      </label>
      <input
        id="motivo-pase"
        type="text"
        placeholder="Motivo del pase"
        maxLength={500}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-1.5"
      />
      <button
        type="submit"
        disabled={!destino || motivo.trim().length < 3 || enviando}
        className="rounded-md bg-marca-700 px-4 py-2 font-medium text-white hover:bg-marca-900 disabled:opacity-50"
      >
        {enviando ? 'Enviando…' : 'Enviar'}
      </button>
      <p className="text-xs text-slate-500">
        El expediente queda en tránsito y no se puede modificar hasta que la dependencia destino confirme la recepción.
      </p>
    </form>
  );
}
