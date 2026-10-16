import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { Dashboard } from '../components/Dashboard';
import { PageHeader } from '../components/PageHeader';
import { SystemStatus } from '../components/SystemStatus';
import { sections } from '../routes/navigation';

/** Página de inicio: estado del sistema, estadísticas (S6-01) y acceso a las secciones permitidas (S1-03, S1-04). */
export function HomePage() {
  const { usuario, puede } = useAuth();
  const visibles = sections.filter((s) => !s.permiso || puede(s.permiso));

  return (
    <>
      <PageHeader
        title="Inicio"
        subtitle={usuario ? `Bienvenido/a, ${usuario.nombre} · ${usuario.dependencia.nombre}` : undefined}
      />

      <SystemStatus />

      {puede('expedientes.consultar') && <Dashboard />}

      <section aria-labelledby="titulo-secciones">
        <h2 id="titulo-secciones" className="sr-only">
          Secciones del sistema
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {visibles.map((s) => (
            <li key={s.path}>
              <Link
                to={s.path}
                className="block h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-marca-500 hover:shadow"
              >
                <span className="text-lg font-semibold text-marca-700">{s.label}</span>
                <span className="mt-2 block text-sm text-slate-600">{s.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
