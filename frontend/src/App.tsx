import { Route, Routes } from 'react-router';
import { RequierePermiso, RequiereSesion } from './auth/guards';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
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
