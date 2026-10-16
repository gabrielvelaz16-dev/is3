/**
 * Menú lateral (CR-05; antes barra superior, S1-04) con el usuario de la sesión (S2-02).
 * Agrupa las secciones por tipo de trabajo y solo muestra las que el rol puede usar;
 * el servidor vuelve a verificar los permisos de todos modos.
 * En pantallas chicas el mismo menú se abre como panel desde la barra superior.
 */
import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { type Section, sections } from '../routes/navigation';

const GRUPOS: Section['grupo'][] = ['Trabajo diario', 'Control', 'Sistema'];

/** Íconos de trazo simple, decorativos (el texto del enlace es el nombre accesible). */
const ICONOS: Record<string, string> = {
  '/': 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  '/expedientes': 'M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z',
  '/tareas': 'M9 11l2 2 4-4M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
  '/reportes': 'M5 20V10m7 10V4m7 16v-7',
  '/auditoria': 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z',
  '/administracion': 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
};

function Icono({ ruta }: { ruta: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <path d={ICONOS[ruta] ?? ICONOS['/']} />
    </svg>
  );
}

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'bg-tinta-claro font-semibold text-white before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-carpeta'
      : 'text-marca-100 hover:bg-tinta-claro/60 hover:text-white'
  }`;

const iniciales = (nombre: string) =>
  nombre
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

export function NavBar({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { usuario, puede, logout } = useAuth();
  const navigate = useNavigate();
  const visibles = sections.filter((s) => !s.permiso || puede(s.permiso));

  // Escape cierra el panel en pantallas chicas.
  useEffect(() => {
    if (!abierto) return;
    const alTeclado = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alTeclado);
    return () => document.removeEventListener('keydown', alTeclado);
  }, [abierto, onCerrar]);

  async function salir() {
    onCerrar();
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      {abierto && <div aria-hidden="true" onClick={onCerrar} className="fixed inset-0 z-30 bg-tinta/40 lg:hidden" />}
      {/* El contenedor pinta el fondo a todo el alto de la página; el menú queda fijo al desplazarse. */}
      <div className="lg:w-64 lg:shrink-0 lg:bg-tinta">
        <nav
          id="menu-principal"
          aria-label="Principal"
          className={`${abierto ? 'fixed inset-y-0 left-0 z-40 flex w-72 shadow-xl' : 'hidden'} flex-col bg-tinta text-white lg:sticky lg:top-0 lg:z-auto lg:flex lg:h-screen lg:w-64 lg:shadow-none`}
        >
          <NavLink to="/" onClick={onCerrar} className="flex items-center gap-3 px-5 pt-6 pb-5">
            <img src="/favicon.svg" alt="" className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold">Expediente Electrónico</span>
              <span className="block text-xs text-marca-200">Institución pública ficticia</span>
            </span>
          </NavLink>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <ul className="mb-4">
              <li>
                <NavLink to="/" end className={claseEnlace} onClick={onCerrar}>
                  <Icono ruta="/" />
                  Inicio
                </NavLink>
              </li>
            </ul>
            {GRUPOS.map((grupo) => {
              const delGrupo = visibles.filter((s) => s.grupo === grupo);
              if (delGrupo.length === 0) return null;
              return (
                <div key={grupo} className="mb-4">
                  <p className="px-3 pb-1.5 text-xs text-marca-200/80">{grupo}</p>
                  <ul className="space-y-0.5">
                    {delGrupo.map((s) => (
                      <li key={s.path}>
                        <NavLink to={s.path} className={claseEnlace} onClick={onCerrar}>
                          <Icono ruta={s.path} />
                          {s.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {usuario && (
            <div className="border-t border-white/10 px-4 py-4">
              <div className="mb-3 flex items-center gap-3">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-carpeta-claro text-sm font-semibold text-tinta">
                  {iniciales(usuario.nombre)}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-medium text-white">{usuario.nombre}</span>
                  <span className="block truncate text-xs text-marca-200">{usuario.rol.nombre}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => void salir()}
                className="w-full rounded-md border border-white/20 px-3 py-1.5 text-sm text-marca-100 hover:bg-tinta-claro hover:text-white"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
