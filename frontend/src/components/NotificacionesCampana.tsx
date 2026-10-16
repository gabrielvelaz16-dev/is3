/**
 * Campana de notificaciones — Sprint 6 (S5-06, RF-17).
 * Consulta los avisos al cargar y cada 60 segundos (sin WebSockets: prototipo local).
 * Abrir un aviso lo marca como leído y lleva al expediente.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { type Notificacion, notificacionesApi } from '../services/reportes';

export const INTERVALO_MS = 60_000;

const cuando = (iso: string) => new Date(iso).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' });

export function NotificacionesCampana() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      const datos = await notificacionesApi.listar();
      setItems(datos.items);
      setNoLeidas(datos.noLeidas);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const id = setInterval(() => void cargar(), INTERVALO_MS);
    return () => clearInterval(id);
  }, [cargar]);

  // Cerrar con Escape o con un clic afuera.
  useEffect(() => {
    if (!abierto) return;
    const alTeclado = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    const alClic = (e: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('keydown', alTeclado);
    document.addEventListener('mousedown', alClic);
    return () => {
      document.removeEventListener('keydown', alTeclado);
      document.removeEventListener('mousedown', alClic);
    };
  }, [abierto]);

  async function abrirAviso(n: Notificacion) {
    setAbierto(false);
    if (!n.leidaEn) {
      try {
        await notificacionesApi.marcarLeida(n.id);
      } catch {
        // Si falla, el aviso sigue sin leer y se reintenta en la próxima consulta.
      }
      await cargar();
    }
    if (n.expediente) navigate(`/expedientes/${n.expediente.id}`);
  }

  async function marcarTodas() {
    try {
      await notificacionesApi.marcarTodas();
    } finally {
      await cargar();
    }
  }

  const etiqueta = noLeidas === 0 ? 'Notificaciones' : `Notificaciones: ${noLeidas} sin leer`;

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        aria-label={etiqueta}
        aria-expanded={abierto}
        aria-controls="panel-notificaciones"
        onClick={() => setAbierto((v) => !v)}
        className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-tinta"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {noLeidas > 0 && (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 min-w-5 rounded-full bg-sello px-1 text-center text-xs font-semibold text-white ring-2 ring-white">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          id="panel-notificaciones"
          role="region"
          aria-label="Notificaciones"
          className="absolute right-0 z-30 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white text-slate-800 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <span className="text-sm font-semibold">Notificaciones</span>
            {noLeidas > 0 && (
              <button type="button" onClick={() => void marcarTodas()} className="text-xs font-medium text-marca-700 hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>
          {error && <p className="px-4 py-3 text-sm text-red-700">No se pudieron cargar las notificaciones.</p>}
          {!error && items.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">No tiene notificaciones.</p>}
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void abrirAviso(n)}
                  className={`relative block w-full py-3 pr-4 pl-7 text-left text-sm hover:bg-slate-50 ${n.leidaEn ? 'text-slate-500' : 'font-medium text-slate-900'}`}
                >
                  {!n.leidaEn && <span aria-hidden="true" className="absolute top-4.5 left-3 h-2 w-2 rounded-full bg-carpeta" />}
                  {!n.leidaEn && <span className="sr-only">Sin leer: </span>}
                  {n.mensaje}
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">{cuando(n.creadaEn)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
