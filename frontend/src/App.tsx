import { Route, Routes } from 'react-router';
import { RequierePermiso, RequiereSesion } from './auth/guards';
import { MainLayout } from './layouts/MainLayout';
import { AuditoriaPage } from './pages/AuditoriaPage';
import { ExpedienteDetallePage } from './pages/ExpedienteDetallePage';
import { ExpedienteFormPage } from './pages/ExpedienteFormPage';
import { ExpedientesPage } from './pages/ExpedientesPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PendientesPage } from './pages/PendientesPage';
import { ReportesPage } from './pages/ReportesPage';
import { SectionPage } from './pages/SectionPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { sections } from './routes/navigation';

/**
 * Rutas de la aplicación. Todo, salvo el login, requiere sesión.
 * El enrutador (Browser/Memory) y el AuthProvider los provee quien monta la app.
 */
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequiereSesion>
            <MainLayout />
          </RequiereSesion>
        }
      >
        <Route index element={<HomePage />} />
        {sections
          .filter((s) => !s.implementada)
          .map((s) => (
            <Route key={s.path} path={s.path} element={<SectionPage section={s} />} />
          ))}
        <Route
          path="/expedientes"
          element={
            <RequierePermiso permiso="expedientes.consultar">
              <ExpedientesPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/expedientes/nuevo"
          element={
            <RequierePermiso permiso="expedientes.crear">
              <ExpedienteFormPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/expedientes/:id"
          element={
            <RequierePermiso permiso="expedientes.consultar">
              <ExpedienteDetallePage />
            </RequierePermiso>
          }
        />
        <Route
          path="/expedientes/:id/editar"
          element={
            <RequierePermiso permiso="expedientes.modificar">
              <ExpedienteFormPage />
            </RequierePermiso>
          }
        />
        <Route path="/tareas" element={<PendientesPage />} />
        <Route
          path="/reportes"
          element={
            <RequierePermiso permiso="reportes.consultar">
              <ReportesPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/auditoria"
          element={
            <RequierePermiso permiso="auditoria.consultar">
              <AuditoriaPage />
            </RequierePermiso>
          }
        />
        <Route
          path="/administracion"
          element={
            <RequierePermiso permiso="usuarios.gestionar">
              <UsuariosPage />
            </RequierePermiso>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
