import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from './support';

const EXPEDIENTE = {
  id: 7,
  numero: 'EXP-2026-000007',
  caratula: 'Pedido de informe técnico',
  asunto: 'Informe sobre el edificio',
  tipo: 'SOLICITUD',
  iniciador: 'Mantenimiento',
  estado: 'EN_TRAMITE',
  prioridad: 'MEDIA',
  dependenciaActualId: 1,
  creadoPorId: 1,
  responsableId: null,
  fechaVencimiento: null,
  descripcion: null,
  creadoEn: '2026-10-15T10:00:00.000Z',
  actualizadoEn: '2026-10-15T10:00:00.000Z',
  dependenciaActual: { id: 1, codigo: 'ADM', nombre: 'Administración General', activa: true },
  creadoPor: { id: 1, nombre: 'Administrador del sistema', username: 'admin' },
  responsable: null,
  paseEnTransito: null,
  activo: true,
  desactivadoEn: null,
  desactivadoPor: null,
  motivoDesactivacion: null,
};

const lista = (items: unknown[]) => () => ({
  body: { data: items, paginacion: { total: items.length, pagina: 1, porPagina: 10, totalPaginas: 1 } },
});

/** Parámetros de la última consulta a GET /api/expedientes. */
function ultimaConsulta(fetchMock: ReturnType<typeof renderApp>['fetchMock']) {
  const urls = fetchMock.mock.calls.map(([url]) => String(url)).filter((u) => u.startsWith('/api/expedientes?'));
  return new URL(urls.at(-1)!, 'http://x').searchParams;
}

describe('Navegación entre la lista y el expediente', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('la lista toma la búsqueda, los filtros y la página de la dirección', async () => {
    const { fetchMock } = renderApp('/expedientes?q=informe&estado=EN_TRAMITE&pagina=2', {
      handlers: { 'GET /api/expedientes': lista([EXPEDIENTE]) },
    });

    expect(await screen.findByRole('link', { name: 'EXP-2026-000007' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar expedientes' })).toHaveValue('informe');
    expect(screen.getByRole('combobox', { name: 'Filtrar por estado' })).toHaveValue('EN_TRAMITE');
    const q = ultimaConsulta(fetchMock);
    expect(q.get('q')).toBe('informe');
    expect(q.get('estado')).toBe('EN_TRAMITE');
    expect(q.get('pagina')).toBe('2');
    expect(document.title).toBe('Expedientes · Expediente Electrónico');
  });

  it('cambiar un filtro vuelve a la primera página y "Limpiar filtros" quita todo', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/expedientes?estado=EN_TRAMITE&pagina=3', { handlers: { 'GET /api/expedientes': lista([EXPEDIENTE]) } });
    await screen.findByRole('link', { name: 'EXP-2026-000007' });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filtrar por prioridad' }), 'ALTA');
    await waitFor(() => expect(ultimaConsulta(fetchMock).get('prioridad')).toBe('ALTA'));
    expect(ultimaConsulta(fetchMock).get('pagina')).toBe('1');
    expect(ultimaConsulta(fetchMock).get('estado')).toBe('EN_TRAMITE');

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await waitFor(() => expect(ultimaConsulta(fetchMock).get('estado')).toBeNull());
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument();
  });

  it('el expediente muestra migas de pan que vuelven a la lista con los mismos filtros', async () => {
    const user = userEvent.setup();
    renderApp('/expedientes?estado=EN_TRAMITE', {
      handlers: {
        'GET /api/expedientes': lista([EXPEDIENTE]),
        'GET /api/expedientes/7': () => ({ body: { data: EXPEDIENTE } }),
      },
    });

    await user.click(await screen.findByRole('link', { name: 'EXP-2026-000007' }));

    const migas = await screen.findByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(migas).getByRole('link', { name: 'Expedientes' })).toHaveAttribute('href', '/expedientes?estado=EN_TRAMITE');
    expect(within(migas).getByText('EXP-2026-000007')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Volver a la lista' })).toHaveAttribute('href', '/expedientes?estado=EN_TRAMITE');
    expect(document.title).toBe('EXP-2026-000007 · Expediente Electrónico');
  });

  it('al cerrar sesión se olvidan los filtros de la lista: el próximo usuario empieza de cero', async () => {
    const user = userEvent.setup();
    renderApp('/expedientes?estado=EN_TRAMITE', { handlers: { 'GET /api/expedientes': lista([EXPEDIENTE]) } });
    await screen.findByRole('link', { name: 'EXP-2026-000007' });
    expect(sessionStorage.getItem('is3:lista-expedientes')).toBe('?estado=EN_TRAMITE');

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(sessionStorage.getItem('is3:lista-expedientes')).toBeNull();
  });

  it('el buscador de la barra superior lleva a la lista filtrada desde cualquier página', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/tareas', { handlers: { 'GET /api/expedientes': lista([EXPEDIENTE]) } });

    const buscador = await screen.findByRole('search', { name: 'Búsqueda rápida' });
    await user.type(within(buscador).getByRole('searchbox'), 'EXP-2026-000007{Enter}');

    expect(await screen.findByRole('heading', { level: 1, name: 'Expedientes' })).toBeInTheDocument();
    await waitFor(() => expect(ultimaConsulta(fetchMock).get('q')).toBe('EXP-2026-000007'));
  });

  it('la tecla "/" lleva el foco al buscador', async () => {
    const user = userEvent.setup();
    renderApp('/');
    const campo = within(await screen.findByRole('search', { name: 'Búsqueda rápida' })).getByRole('searchbox');

    await user.keyboard('/');

    expect(campo).toHaveFocus();
  });
});
