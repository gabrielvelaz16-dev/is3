import { Route, Routes } from 'react-router';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SectionPage } from './pages/SectionPage';
import { sections } from './routes/navigation';

/** Rutas de la aplicación. El enrutador (Browser/Memory) lo provee quien la monta. */
export function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        {sections.map((s) => (
          <Route key={s.path} path={s.path} element={<SectionPage section={s} />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
