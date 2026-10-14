import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { sections } from '../routes/navigation';

const linkBase = 'block rounded-md px-3 py-2 text-sm font-medium transition-colors';
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'bg-marca-900 text-white' : 'text-marca-100 hover:bg-marca-500 hover:text-white'}`;

/**
 * Barra de navegación responsive (S1-04).
 * En pantallas chicas el menú se despliega con un botón; en pantallas medianas
 * o grandes se muestra en línea.
 */
export function NavBar() {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <header className="bg-marca-700 shadow">
      <nav aria-label="Principal" className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" onClick={cerrar} className="flex items-center gap-2 text-white">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="leading-tight">
              <span className="block text-base font-semibold">Expediente Electrónico</span>
              <span className="block text-xs text-marca-200">Institución pública ficticia</span>
            </span>
          </Link>

          <button
            type="button"
            className="rounded-md p-2 text-marca-100 hover:bg-marca-500 md:hidden"
            aria-controls="menu-principal"
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
          >
            <span className="sr-only">{abierto ? 'Cerrar menú' : 'Abrir menú'}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>

          <ul className="hidden gap-1 md:flex">
            <li>
              <NavLink to="/" end className={linkClass}>
                Inicio
              </NavLink>
            </li>
            {sections.map((s) => (
              <li key={s.path}>
                <NavLink to={s.path} className={linkClass}>
                  {s.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {abierto && (
          <ul id="menu-principal" className="space-y-1 pb-3 md:hidden">
            <li>
              <NavLink to="/" end className={linkClass} onClick={cerrar}>
                Inicio
              </NavLink>
            </li>
            {sections.map((s) => (
              <li key={s.path}>
                <NavLink to={s.path} className={linkClass} onClick={cerrar}>
                  {s.label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}
