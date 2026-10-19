import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ADMIN, renderApp } from './support';

describe('Inicio y cierre de sesión (RF-01, S2-02)', () => {
  it('sin sesión, cualquier página redirige al login', async () => {
    renderApp('/expedientes', { usuario: null });

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument();
  });

  it('con credenciales correctas entra por Inicio, aunque se hubiera pedido otra página', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/expedientes', {
      usuario: null,
      handlers: { 'POST /api/auth/login': () => ({ body: { data: { usuario: ADMIN } } }) },
    });

    await user.type(await screen.findByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), '12345');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument();
    const login = fetchMock.mock.calls.find(([url]) => url === '/api/auth/login');
    expect(JSON.parse(String(login?.[1]?.body))).toEqual({ usuario: 'admin', password: '12345' });
  });

  it('con credenciales incorrectas muestra el mensaje del servidor y limpia la contraseña', async () => {
    const user = userEvent.setup();
    renderApp('/', {
      usuario: null,
      handlers: {
        'POST /api/auth/login': () => ({ status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'Usuario o contraseña incorrectos', requestId: 'r1' } } }),
      },
    });

    await user.type(await screen.findByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'mala');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  });

  it('si el backend no responde, lo informa en lugar de fallar en silencio', async () => {
    const user = userEvent.setup();
    renderApp('/', { usuario: null });
    // Sin handler para el login: el mock responde 404 genérico. Simulamos caída de red:
    globalThis.fetch = (async () => {
      throw new TypeError('Failed to fetch');
    }) as typeof fetch;

    await user.type(await screen.findByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), '12345');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor');
  });

  it('cerrar sesión llama a la API y vuelve al login', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Principal' });

    await user.click(within(nav).getAllByRole('button', { name: 'Cerrar sesión' })[0]!);

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
  });
});
