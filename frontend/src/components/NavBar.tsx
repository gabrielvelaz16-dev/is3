import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { sections } from '../routes/navigation';
import { NotificacionesCampana } from './NotificacionesCampana';

const linkBase = 'block rounded-md px-3 py-2 text-sm font-medium transition-colors';
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'bg-marca-900 text-white' : 'text-marca-100 hover:bg-marca-500 hover:text-white'}`;

/**
 * Barra de navegación responsive (S1-04) con el usuario de la sesión (S2-02).
 * Solo muestra las secciones que el rol puede usar; el servidor verifica igual.
 */
export function NavBar() {
  const { usuario, puede, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);
  const visibles = sections.filter((s) => !s.permiso || puede(s.permiso));

  async function salir() {
    cerrar();
    await logout();
    navigate('/login', { replace: true });
  }

  const enlaces = (alClic?: () => void) => (
    <>
      <li>
        <NavLink to="/" end className={linkClass} onClick={alClic}>
          Inicio
        </NavLink>
      </li>
      {visibles.map((s) => (
        <li key={s.path}>
          <NavLink to={s.path} className={linkClass} onClick={alClic}>
            {s.label}
          </NavLink>
        </li>
      ))}
    </>
  );

  const usuarioYSalir = usuario && (
    <div className="flex items-center gap-3">
      <span className="text-right leading-tight">
        <span className="block text-sm font-medium text-white">{usuario.nombre}</span>
        <span className="block text-xs text-marca-200">{usuario.rol.nombre}</span>
      </span>
      <button type="button" onClick={salir} className="rounded-md border border-marca-200 px-3 py-1.5 text-sm text-white hover:bg-marca-500">
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <header className="bg-marca-700 shadow">
      <nav aria-label="Principal" className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" onClick={cerrar} className="flex shrink-0 items-center gap-2 text-white">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="leading-tight">
              <span className="block text-base font-semibold">Expediente Electrónico</span>
              <span className="block text-xs text-marca-200">Institución pública ficticia</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 lg:gap-6">
            <div className="hidden items-center gap-6 lg:flex">
              <ul className="flex gap-1">{enlaces()}</ul>
              {usuarioYSalir}
            </div>
            {usuario && <NotificacionesCampana />}
            <button
              type="button"
              className="rounded-md p-2 text-marca-100 hover:bg-marca-500 lg:hidden"
              aria-controls="menu-principal"
              aria-expanded={abierto}
              onClick={() => setAbierto((v) => !v)}
            >
              <span className="sr-only">{abierto ? 'Cerrar menú' : 'Abrir menú'}</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {abierto && (
          <div id="menu-principal" className="space-y-3 pb-3 lg:hidden">
            <ul className="space-y-1">{enlaces(cerrar)}</ul>
            {usuarioYSalir}
          </div>
        )}
      </nav>
    </header>
  );
}
