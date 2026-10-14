import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Página no encontrada" subtitle="La dirección ingresada no existe en el sistema." />
      <Link to="/" className="inline-block rounded-md bg-marca-700 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900">
        Volver al inicio
      </Link>
    </>
  );
}
