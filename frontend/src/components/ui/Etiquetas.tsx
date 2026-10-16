/**
 * Etiquetas de estado y prioridad del expediente (CR-05): mismos colores y textos en
 * todas las pantallas. El color nunca es la única señal: siempre va el texto.
 */
import type { EstadoExpediente, Prioridad } from '../../services/tipos';
import { ESTADOS_EXPEDIENTE, PRIORIDADES } from '../../services/tipos';

const ESTADO: Record<EstadoExpediente, string> = {
  BORRADOR: 'border-slate-300 bg-white text-slate-700',
  EN_TRAMITE: 'border-blue-300 bg-blue-50 text-blue-900',
  EN_REVISION: 'border-amber-300 bg-amber-50 text-amber-900',
  RESUELTO: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  ARCHIVADO: 'border-slate-300 bg-slate-100 text-slate-600',
};

const PRIORIDAD: Record<Prioridad, { punto: string; texto: string }> = {
  BAJA: { punto: 'bg-slate-400', texto: 'text-slate-600' },
  MEDIA: { punto: 'bg-amber-500', texto: 'text-slate-700' },
  ALTA: { punto: 'bg-sello', texto: 'font-semibold text-sello' },
};

export const etiquetaEstado = (e: EstadoExpediente) => ESTADOS_EXPEDIENTE.find((x) => x.valor === e)?.etiqueta ?? e;
export const etiquetaPrioridad = (p: Prioridad) => PRIORIDADES.find((x) => x.valor === p)?.etiqueta ?? p;

export function EtiquetaEstado({ estado, grande = false }: { estado: EstadoExpediente; grande?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium whitespace-nowrap ${ESTADO[estado]} ${
        grande ? 'border-2 px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
      }`}
    >
      {etiquetaEstado(estado)}
    </span>
  );
}

export function EtiquetaPrioridad({ prioridad }: { prioridad: Prioridad }) {
  const c = PRIORIDAD[prioridad];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm whitespace-nowrap ${c.texto}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${c.punto}`} />
      {etiquetaPrioridad(prioridad)}
    </span>
  );
}
