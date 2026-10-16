import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { Dashboard } from '../components/Dashboard';
import { PageHeader } from '../components/PageHeader';
import { SystemStatus } from '../components/SystemStatus';
import { sections } from '../routes/navigation';

/** Página de inicio: estadísticas (S6-01), accesos a las secciones (S1-04) y estado del sistema (S1-03). */
export function HomePage() {
  const { usuario, puede } = useAuth();
  const visibles = sections.filter((s) => !s.permiso || puede(s.permiso));
  const nombre = usuario?.nombre.replace(/\s*\(.*?\)\s*/g, '').split(' ')[0];

  return (
    <>
      <PageHeader title="Inicio" subtitle={usuario ? `Hola, ${nombre}. Esto es lo que pasa hoy en ${usuario.dependencia.nombre}.` : undefined} />

      {puede('expedientes.consultar') && <Dashboard />}

      <section aria-labelledby="titulo-secciones" className="mb-8">
        <h2 id="titulo-secciones" className="mb-3 text-base font-semibold text-tinta">
          Secciones del sistema
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((s) => (
            <li key={s.path}>
              <Link
                to={s.path}
                className="group block h-full rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-marca-500"
              >
                <span className="font-medium text-marca-700 group-hover:text-marca-900">{s.label}</span>
                <span className="mt-1 block text-sm text-slate-600">{s.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SystemStatus />
    </>
  );
}
