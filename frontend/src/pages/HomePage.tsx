import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { sections } from '../routes/navigation';

/** Página de inicio: acceso a las secciones del sistema (S1-04). */
export function HomePage() {
  return (
    <>
      <PageHeader
        title="Inicio"
        subtitle="Registro y tramitación de expedientes electrónicos entre dependencias."
      />

      <section aria-labelledby="titulo-secciones">
        <h2 id="titulo-secciones" className="sr-only">
          Secciones del sistema
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {sections.map((s) => (
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
