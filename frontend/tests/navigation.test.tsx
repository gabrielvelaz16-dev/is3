import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { sections } from '../src/routes/navigation';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Navegación y diseño base (S1-04)', () => {
  it('muestra el menú principal con Inicio y todas las secciones', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Principal' });

    expect(within(nav).getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
    for (const s of sections) {
      expect(within(nav).getByRole('link', { name: s.label })).toBeInTheDocument();
    }
  });

  it('la página de inicio tiene un acceso a cada sección', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument();
    const lista = screen.getByRole('region', { name: 'Secciones del sistema' });
    expect(within(lista).getAllByRole('link')).toHaveLength(sections.length);
  });

  it('al hacer clic en una sección navega a su página y la marca como activa', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Principal' });

    await user.click(within(nav).getByRole('link', { name: 'Expedientes' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Expedientes' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Expedientes' })).toHaveAttribute('aria-current', 'page');
  });

  it('las secciones todavía no implementadas indican en qué sprint se construyen', () => {
    renderAt('/reportes');

    expect(screen.getByRole('status')).toHaveTextContent('Se implementa en el Sprint 6');
  });

  it('una ruta inexistente muestra la página 404 con enlace al inicio', () => {
    renderAt('/no-existe');

    expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });

  it('el botón de menú (pantallas chicas) abre y cierra el menú desplegable', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const boton = screen.getByRole('button', { name: 'Abrir menú' });

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    await user.click(boton);
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('menu-principal')).toBeInTheDocument();

    await user.click(within(document.getElementById('menu-principal')!).getByRole('link', { name: 'Tareas y pendientes' }));
    expect(document.getElementById('menu-principal')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Tareas y pendientes' })).toBeInTheDocument();
  });
});
