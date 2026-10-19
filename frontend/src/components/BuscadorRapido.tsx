/**
 * Buscador de la barra superior: desde cualquier pantalla lleva a la lista de expedientes
 * filtrada por número, carátula, asunto o iniciador. Atajo: tecla "/".
 */
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

export function BuscadorRapido() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      const destino = e.target as HTMLElement;
      const escribiendo = destino.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName);
      if (e.key === '/' && !escribiendo && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        campo.current?.focus();
      }
    };
    document.addEventListener('keydown', alTeclado);
    return () => document.removeEventListener('keydown', alTeclado);
  }, []);

  function buscar(e: FormEvent) {
    e.preventDefault();
    const q = texto.trim();
    navigate(q ? `/expedientes?${new URLSearchParams({ q }).toString()}` : '/expedientes');
    setTexto('');
    campo.current?.blur();
  }

  return (
    <form role="search" aria-label="Búsqueda rápida" onSubmit={buscar} className="hidden w-full max-w-xs sm:block">
      <label htmlFor="buscador-rapido" className="sr-only">
        Búsqueda rápida de expedientes
      </label>
      <div className="relative">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          ref={campo}
          id="buscador-rapido"
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar expediente…"
          title="Atajo: tecla /"
          className="block w-full rounded-md border border-slate-300 bg-white py-1.5 pr-8 pl-8 text-sm focus:border-marca-500"
        />
        <kbd aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-slate-200 px-1.5 text-xs text-slate-400">
          /
        </kbd>
      </div>
    </form>
  );
}
