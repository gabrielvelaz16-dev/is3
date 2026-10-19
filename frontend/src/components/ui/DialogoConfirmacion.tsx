/**
 * Diálogo para confirmar una acción importante (CR-08: desactivar o eliminar expedientes).
 * Con `pedirMotivo` muestra un campo obligatorio y se lo pasa a `onConfirmar`.
 * Si `onConfirmar` falla, muestra el mensaje del servidor sin cerrar el diálogo.
 */
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../services/api';
import { Boton } from './Boton';

interface Props {
  titulo: string;
  children: ReactNode;
  textoConfirmar: string;
  variante?: 'peligro' | 'primario';
  pedirMotivo?: { etiqueta: string; minimo: number };
  onConfirmar: (motivo: string) => Promise<void>;
  onCancelar: () => void;
}

export function DialogoConfirmacion({ titulo, children, textoConfirmar, variante = 'peligro', pedirMotivo, onConfirmar, onCancelar }: Props) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    campo.current?.focus();
    const alTeclado = (e: KeyboardEvent) => e.key === 'Escape' && onCancelar();
    document.addEventListener('keydown', alTeclado);
    return () => document.removeEventListener('keydown', alTeclado);
  }, [onCancelar]);

  const faltaMotivo = pedirMotivo !== undefined && motivo.trim().length < pedirMotivo.minimo;

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (faltaMotivo) return;
    setError(null);
    setEnviando(true);
    try {
      await onConfirmar(motivo.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo completar la acción');
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center">
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-dialogo"
        aria-describedby="texto-dialogo"
        onSubmit={(e) => void confirmar(e)}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id="titulo-dialogo" className="text-lg font-semibold text-marca-900">
          {titulo}
        </h2>
        <div id="texto-dialogo" className="mt-3 text-sm text-slate-700">
          {children}
        </div>
        {pedirMotivo && (
          <div className="mt-4">
            <label htmlFor="motivo-dialogo" className="block text-sm font-medium text-slate-700">
              {pedirMotivo.etiqueta}
            </label>
            <textarea
              id="motivo-dialogo"
              ref={campo}
              rows={3}
              maxLength={500}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              aria-describedby="ayuda-motivo"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-marca-500"
            />
            <p id="ayuda-motivo" className="mt-1 text-xs text-slate-500">
              Obligatorio, al menos {pedirMotivo.minimo} caracteres. Queda en el expediente y en la auditoría.
            </p>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Boton onClick={onCancelar}>Cancelar</Boton>
          <Boton type="submit" variante={variante} disabled={enviando || faltaMotivo}>
            {enviando ? 'Procesando…' : textoConfirmar}
          </Boton>
        </div>
      </form>
    </div>
  );
}
