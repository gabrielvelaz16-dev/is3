import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { MigasDePan } from '../components/ui/MigasDePan';
import { rutaListaExpedientes } from '../routes/navegacion';
import { ApiError } from '../services/api';
import { expedientesApi } from '../services/expedientes';
import type { Expediente, Prioridad } from '../services/tipos';
import { ETIQUETA_TIPO, PRIORIDADES, TIPOS_EXPEDIENTE } from '../services/tipos';

const inputClass = 'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 disabled:bg-slate-100';

export function ExpedienteFormPage() {
  const { id } = useParams<{ id: string }>();
  const esNuevo = !id;
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(!esNuevo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [original, setOriginal] = useState<Expediente | null>(null);

  // Campos del formulario
  const [caratula, setCaratula] = useState('');
  const [asunto, setAsunto] = useState('');
  const [tipo, setTipo] = useState<string>('SOLICITUD');
  const [iniciador, setIniciador] = useState('');
  const [prioridad, setPrioridad] = useState<Prioridad>('MEDIA');
  const [descripcion, setDescripcion] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  useEffect(() => {
    if (esNuevo) return;
    let vigente = true;
    expedientesApi.obtener(Number(id)).then((exp) => {
      if (!vigente) return;
      setOriginal(exp);
      setCaratula(exp.caratula);
      setAsunto(exp.asunto);
      setTipo(exp.tipo);
      setIniciador(exp.iniciador);
      setPrioridad(exp.prioridad);
      setDescripcion(exp.descripcion ?? '');
      setFechaVencimiento(exp.fechaVencimiento ? exp.fechaVencimiento.slice(0, 16) : '');
      setCargando(false);
    }).catch(() => {
      if (!vigente) return;
      navigate('/expedientes', { replace: true });
    });
    return () => { vigente = false; };
  }, [id, esNuevo, navigate]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const datos = {
        caratula: caratula.trim(),
        asunto: asunto.trim(),
        tipo,
        iniciador: iniciador.trim(),
        prioridad,
        descripcion: descripcion.trim() || null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento).toISOString() : null,
      };

      if (esNuevo) {
        const creado = await expedientesApi.crear(datos);
        navigate(`/expedientes/${creado.id}`, { replace: true });
      } else {
        // Solo enviar los campos que cambiaron
        const cambios: Record<string, unknown> = {};
        if (datos.caratula !== original?.caratula) cambios.caratula = datos.caratula;
        if (datos.asunto !== original?.asunto) cambios.asunto = datos.asunto;
        if (datos.tipo !== original?.tipo) cambios.tipo = datos.tipo;
        if (datos.iniciador !== original?.iniciador) cambios.iniciador = datos.iniciador;
        if (datos.prioridad !== original?.prioridad) cambios.prioridad = datos.prioridad;
        if (datos.descripcion !== (original?.descripcion ?? null)) cambios.descripcion = datos.descripcion;
        const fvOriginal = original?.fechaVencimiento ? new Date(original.fechaVencimiento).toISOString() : null;
        if (datos.fechaVencimiento !== fvOriginal) cambios.fechaVencimiento = datos.fechaVencimiento;

        if (Object.keys(cambios).length === 0) {
          setError(new ApiError(0, 'SIN_CAMBIOS', 'No hay cambios para guardar.'));
          setGuardando(false);
          return;
        }
        await expedientesApi.modificar(Number(id), cambios);
        navigate(`/expedientes/${id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'ERROR', 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  }

  const errorCampo = (campo: string) =>
    error?.campo(campo) && (
      <p className="mt-1 text-xs text-red-700">{error.campo(campo)}</p>
    );

  if (cargando) {
    return <p className="py-8 text-center text-slate-500">Cargando expediente…</p>;
  }

  const lista = rutaListaExpedientes();

  return (
    <>
      <MigasDePan
        items={
          esNuevo
            ? [{ etiqueta: 'Expedientes', to: lista }, { etiqueta: 'Nuevo expediente' }]
            : [{ etiqueta: 'Expedientes', to: lista }, { etiqueta: original?.numero ?? 'Expediente', to: `/expedientes/${id}` }, { etiqueta: 'Editar' }]
        }
      />
      <PageHeader
        title={esNuevo ? 'Nuevo expediente' : `Editar expediente`}
        subtitle={esNuevo ? 'Complete los datos para registrar un nuevo expediente.' : `Editando ${original?.numero}`}
      />

      <form onSubmit={guardar} noValidate className="max-w-2xl space-y-5">
        {error && !error.details.some((d) => d.field) && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error.message}
          </p>
        )}

        <div>
          <label htmlFor="f-caratula" className="block text-sm font-medium text-slate-700">Carátula</label>
          <input id="f-caratula" value={caratula} onChange={(e) => setCaratula(e.target.value)} className={inputClass} required maxLength={255} />
          {errorCampo('caratula')}
        </div>

        <div>
          <label htmlFor="f-asunto" className="block text-sm font-medium text-slate-700">Asunto</label>
          <textarea id="f-asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} className={inputClass} rows={3} required maxLength={2000} />
          {errorCampo('asunto')}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-tipo" className="block text-sm font-medium text-slate-700">Tipo</label>
            <select id="f-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}>
              {TIPOS_EXPEDIENTE.map((t) => (
                <option key={t} value={t}>{ETIQUETA_TIPO[t]}</option>
              ))}
            </select>
            {errorCampo('tipo')}
          </div>
          <div>
            <label htmlFor="f-prioridad" className="block text-sm font-medium text-slate-700">Prioridad</label>
            <select id="f-prioridad" value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)} className={inputClass}>
              {PRIORIDADES.map((p) => (
                <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
              ))}
            </select>
            {errorCampo('prioridad')}
          </div>
        </div>

        <div>
          <label htmlFor="f-iniciador" className="block text-sm font-medium text-slate-700">Iniciador</label>
          <input id="f-iniciador" value={iniciador} onChange={(e) => setIniciador(e.target.value)} className={inputClass} required maxLength={160}
            placeholder="Nombre de la persona u organización que inicia el trámite"
          />
          {errorCampo('iniciador')}
        </div>

        <div>
          <label htmlFor="f-descripcion" className="block text-sm font-medium text-slate-700">Descripción (opcional)</label>
          <textarea id="f-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClass} rows={3} maxLength={5000} />
          {errorCampo('descripcion')}
        </div>

        <div>
          <label htmlFor="f-vencimiento" className="block text-sm font-medium text-slate-700">Fecha de vencimiento (opcional)</label>
          <input id="f-vencimiento" type="datetime-local" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className={`${inputClass} max-w-xs`} />
          {errorCampo('fechaVencimiento')}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={guardando} className="rounded-md bg-marca-700 px-5 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-60">
            {guardando ? 'Guardando…' : esNuevo ? 'Crear expediente' : 'Guardar cambios'}
          </button>
          <button type="button" onClick={() => navigate(esNuevo ? lista : `/expedientes/${id}`)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </>
  );
}
