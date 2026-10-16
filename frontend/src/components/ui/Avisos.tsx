/**
 * Avisos flotantes de confirmación (CR-05): "Usuario creado", "Respaldo creado", etc.
 * Se anuncian a los lectores de pantalla (role="status") y se cierran solos a los 6 s.
 * Los errores no van acá: se muestran junto al formulario que los causó.
 */
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface Aviso {
  id: number;
  texto: string;
}

const Contexto = createContext<(texto: string) => void>(() => {});

/** Muestra un aviso de confirmación. */
export const useAviso = () => useContext(Contexto);

let siguiente = 1;
const DURACION_MS = 6000;

function AvisoFlotante({ aviso, onCerrar }: { aviso: Aviso; onCerrar: () => void }) {
  useEffect(() => {
    const t = setTimeout(onCerrar, DURACION_MS);
    return () => clearTimeout(t);
  }, [onCerrar]);
  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-lg"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="currentColor">
        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" />
      </svg>
      <span className="flex-1">{aviso.texto}</span>
      <button type="button" onClick={onCerrar} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );
}

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const mostrar = useCallback((texto: string) => setAvisos((a) => [...a.slice(-2), { id: siguiente++, texto }]), []);
  const cerrar = useCallback((id: number) => setAvisos((a) => a.filter((x) => x.id !== id)), []);
  return (
    <Contexto.Provider value={mostrar}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {avisos.map((a) => (
          <AvisoFlotante key={a.id} aviso={a} onCerrar={() => cerrar(a.id)} />
        ))}
      </div>
    </Contexto.Provider>
  );
}
