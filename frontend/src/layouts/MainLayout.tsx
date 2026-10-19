import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { BuscadorRapido } from '../components/BuscadorRapido';
import { NavBar } from '../components/NavBar';
import { NotificacionesCampana } from '../components/NotificacionesCampana';
import { AvisosProvider } from '../components/ui/Avisos';

/**
 * Diseño base de todas las páginas (S1-04, rediseñado en CR-05): menú lateral, barra superior
 * con los avisos del usuario, contenido y pie.
 */
export function MainLayout() {
  const { usuario, puede } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);
  const { pathname } = useLocation();
  const contenido = useRef<HTMLElement>(null);
  const primeraVez = useRef(true);

  // Al cambiar de página (no de pestaña ni de filtro): volver arriba y llevar el foco al
  // contenido, para que el teclado y los lectores de pantalla empiecen por la página nueva.
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    document.documentElement.scrollTop = 0;
    contenido.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <AvisosProvider>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Saltar al contenido
      </a>
      <div className="flex min-h-screen">
        <NavBar abierto={menuAbierto} onCerrar={cerrarMenu} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
            <button
              type="button"
              className="-ml-1 rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-controls="menu-principal"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto((v) => !v)}
            >
              <span className="sr-only">{menuAbierto ? 'Cerrar menú' : 'Abrir menú'}</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                {menuAbierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-2 lg:hidden" aria-label="Inicio — Expediente Electrónico">
              <img src="/favicon.svg" alt="" className="h-7 w-7" />
              <span className="text-sm font-semibold text-tinta">Expediente Electrónico</span>
            </Link>
            <p className="hidden truncate text-sm text-slate-500 lg:block">
              {usuario ? `${usuario.dependencia.nombre}` : ''}
            </p>
            <div className="ml-auto flex flex-1 items-center justify-end gap-2">
              {puede('expedientes.consultar') && <BuscadorRapido />}
              {usuario && <NotificacionesCampana />}
            </div>
          </header>

          <main id="contenido" ref={contenido} tabIndex={-1} className="mx-auto outline-none w-full max-w-6xl flex-1 px-4 py-8 lg:px-8">
            <Outlet />
          </main>

          <footer className="border-t border-slate-200">
            <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500 lg:px-8">
              Prototipo académico de Ingeniería de Software III, FPUNA. Uso exclusivo con datos ficticios.
            </p>
          </footer>
        </div>
      </div>
    </AvisosProvider>
  );
}
