import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from './AuthContext';

function Cargando() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center text-sm text-slate-500">
      Cargando…
    </div>
  );
}

/** Rutas que requieren sesión: sin sesión, redirige al login y recuerda a dónde iba. */
export function RequiereSesion({ children }: { children: ReactNode }) {
  const { estado } = useAuth();
  const location = useLocation();
  if (estado === 'cargando') return <Cargando />;
  if (estado === 'anonimo') return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  return <>{children}</>;
}

/**
 * Oculta una página si el rol no tiene el permiso. Es solo comodidad de interfaz:
 * la API devuelve 403 de todos modos (RNF-02).
 */
export function RequierePermiso({ permiso, children }: { permiso: string; children: ReactNode }) {
  const { puede } = useAuth();
  if (!puede(permiso)) {
    return (
      <>
        <PageHeader title="Acceso denegado" subtitle="Su rol no tiene permiso para ver esta sección." />
      </>
    );
  }
  return <>{children}</>;
}
