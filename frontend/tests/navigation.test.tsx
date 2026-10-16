import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { sections } from '../src/routes/navigation';
import { ADMIN, DASHBOARD_VACIO, FUNCIONARIO, renderApp } from './support';

describe('Navegación y diseño base (S1-04)', () => {
  it('muestra el menú principal con Inicio y todas las secciones para el administrador', async () => {
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Principal' });

    expect(within(nav).getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
    for (const s of sections) {
      expect(within(nav).getByRole('link', { name: s.label })).toBeInTheDocument();
    }
  });

  it('la página de inicio tiene un acceso a cada sección permitida', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument();
    const lista = screen.getByRole('region', { name: 'Secciones del sistema' });
    expect(within(lista).getAllByRole('link')).toHaveLength(sections.length);
  });

  it('al hacer clic en una sección navega a su página y la marca como activa', async () => {
    const user = userEvent.setup();
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Principal' });

    await user.click(within(nav).getByRole('link', { name: 'Expedientes' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Expedientes' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Expedientes' })).toHaveAttribute('aria-current', 'page');
  });

  it('Reportes ya no está "en construcción": la sección abre su página (Sprint 6)', async () => {
    renderApp('/reportes', {
      handlers: {
        'GET /api/reportes/expedientes': () => ({
          body: { data: { resumen: DASHBOARD_VACIO.resumen, items: [], total: 0, pagina: 1, porPagina: 20 } },
        }),
        'GET /api/dependencias': () => ({ body: { data: [] } }),
      },
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Reportes' })).toBeInTheDocument();
    expect(screen.queryByText(/Se implementa en el Sprint/)).not.toBeInTheDocument();
  });

  it('una ruta inexistente muestra la página 404 con enlace al inicio', async () => {
    renderApp('/no-existe');

    expect(await screen.findByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });

  it('el botón de menú (pantallas chicas) abre y cierra el menú desplegable', async () => {
    const user = userEvent.setup();
    renderApp('/');
    const boton = await screen.findByRole('button', { name: 'Abrir menú' });

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    await user.click(boton);
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
    const menu = document.getElementById('menu-principal')!;

    await user.click(within(menu).getByRole('link', { name: 'Tareas y pendientes' }));
    expect(document.getElementById('menu-principal')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Tareas y pendientes' })).toBeInTheDocument();
  });
});

describe('Estado del sistema en el inicio (S1-03)', () => {
  it('muestra el estado de la API y de la base leído de /api/health', async () => {
    const { fetchMock } = renderApp('/');
    const estado = await screen.findByRole('region', { name: 'Estado del sistema' });

    expect(await within(estado).findByText('0.1.0')).toBeInTheDocument();
    expect(within(estado).getAllByText('Disponible')).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.objectContaining({ method: 'GET' }));
  });

  it('si la base no responde (503) muestra "Sin conexión" para la base de datos', async () => {
    renderApp('/', {
      handlers: {
        'GET /api/health': () => ({
          status: 503,
          body: { data: { status: 'degraded', api: 'ok', database: 'down', version: '0.1.0', uptimeSeconds: 1, timestamp: 'x' } },
        }),
      },
    });
    const estado = await screen.findByRole('region', { name: 'Estado del sistema' });

    expect(await within(estado).findByText('Sin conexión')).toBeInTheDocument();
  });
});

describe('Menú según el rol', () => {
  it('un funcionario no ve Administración y, si entra por URL, ve "Acceso denegado"', async () => {
    renderApp('/administracion', { usuario: FUNCIONARIO });

    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
  });

  it('un funcionario sin reportes.consultar no ve Reportes y por URL ve "Acceso denegado"', async () => {
    renderApp('/reportes', { usuario: FUNCIONARIO });

    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).queryByRole('link', { name: 'Reportes' })).not.toBeInTheDocument();
  });

  it('muestra el nombre y el rol del usuario en la barra', async () => {
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Principal' });

    expect(within(nav).getAllByText(ADMIN.nombre).length).toBeGreaterThan(0);
    expect(within(nav).getAllByText(ADMIN.rol.nombre).length).toBeGreaterThan(0);
  });
});
