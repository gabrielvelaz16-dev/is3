/**
 * Pestañas accesibles (CR-05, patrón WAI-ARIA "tabs"): flechas izquierda/derecha, Inicio y Fin
 * mueven entre pestañas; solo el panel activo se muestra.
 */
import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react';

export interface Pestana {
  clave: string;
  titulo: string;
  /** Número opcional que se muestra junto al título (por ejemplo, cantidad de documentos). */
  cantidad?: number;
}

export function Pestanas({
  pestanas,
  activa,
  onCambiar,
  etiqueta,
  children,
}: {
  pestanas: Pestana[];
  activa: string;
  onCambiar: (clave: string) => void;
  etiqueta: string;
  children: ReactNode;
}) {
  const base = useId();
  const botones = useRef<(HTMLButtonElement | null)[]>([]);
  const indice = Math.max(0, pestanas.findIndex((p) => p.clave === activa));

  function teclado(e: KeyboardEvent) {
    const destino =
      e.key === 'ArrowRight' ? (indice + 1) % pestanas.length
      : e.key === 'ArrowLeft' ? (indice - 1 + pestanas.length) % pestanas.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? pestanas.length - 1
      : null;
    if (destino === null) return;
    e.preventDefault();
    onCambiar(pestanas[destino]!.clave);
    botones.current[destino]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label={etiqueta} onKeyDown={teclado} className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {pestanas.map((p, i) => {
          const seleccionada = i === indice;
          return (
            <button
              key={p.clave}
              ref={(el) => {
                botones.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${p.clave}`}
              aria-selected={seleccionada}
              aria-controls={`${base}-panel-${p.clave}`}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => onCambiar(p.clave)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                seleccionada ? 'border-carpeta font-semibold text-tinta' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-tinta'
              }`}
            >
              {p.titulo}
              {p.cantidad !== undefined && (
                <span className={`ml-2 rounded-full px-1.5 text-xs ${seleccionada ? 'bg-carpeta-claro text-tinta' : 'bg-slate-100 text-slate-600'}`}>
                  {p.cantidad}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${base}-panel-${pestanas[indice]!.clave}`} aria-labelledby={`${base}-tab-${pestanas[indice]!.clave}`} className="pt-6">
        {children}
      </div>
    </div>
  );
}
