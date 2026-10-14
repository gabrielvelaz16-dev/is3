import { Outlet } from 'react-router';
import { NavBar } from '../components/NavBar';

/** Diseño base de todas las páginas: menú, contenido y pie (S1-04). */
export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <NavBar />
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500">
          Prototipo académico — Ingeniería de Software III · FPUNA. Uso exclusivo con datos ficticios.
        </p>
      </footer>
    </div>
  );
}
