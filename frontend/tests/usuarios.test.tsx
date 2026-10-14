import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Usuario } from '../src/services/tipos';
import { ADMIN, FUNCIONARIO, renderApp, sinPermisos } from './support';

const roles = [
  { id: 1, clave: 'ADMINISTRADOR', nombre: 'Administrador', descripcion: 'Acceso total', permisos: [] },
  { id: 2, clave: 'MESA_ENTRADAS', nombre: 'Mesa de entradas', descripcion: 'Registra expedientes', permisos: [] },
];
const dependencias = [
  { id: 1, codigo: 'ADM', nombre: 'Administración General', activa: true },
  { id: 2, codigo: 'MESA', nombre: 'Mesa de Entradas', activa: true },
];

function handlersBase(lista: Usuario[]) {
  return {
    'GET /api/usuarios': () => ({ body: { data: lista, meta: { page: 1, pageSize: 10, total: lista.length } } }),
    'GET /api/roles': () => ({ body: { data: roles } }),
    'GET /api/dependencias': () => ({ body: { data: dependencias } }),
  };
}

describe('Administración de usuarios (RF-03, S2-05)', () => {
  it('lista los usuarios con rol, dependencia y estado, y marca al usuario actual', async () => {
    renderApp('/administracion', { handlers: handlersBase([sinPermisos(ADMIN), { ...sinPermisos(FUNCIONARIO), activo: false }]) });
    const tabla = await screen.findByRole('table', { name: 'Usuarios del sistema' });

    const filas = await within(tabla).findAllByRole('row');
    expect(filas).toHaveLength(3);
    expect(within(filas[1]!).getByText('(usted)')).toBeInTheDocument();
    expect(within(filas[2]!).getByText('Funcionario / Responsable')).toBeInTheDocument();
    expect(within(filas[2]!).getByText('Inactivo')).toBeInTheDocument();
    expect(screen.getByText(/2 usuarios · página 1 de 1/)).toBeInTheDocument();
  });

  it('crea un usuario con rol y dependencia y muestra la confirmación', async () => {
    const user = userEvent.setup();
    let enviado: unknown;
    renderApp('/administracion', {
      handlers: {
        ...handlersBase([sinPermisos(ADMIN)]),
        'POST /api/usuarios': (body) => {
          enviado = body;
          return { status: 201, body: { data: { ...sinPermisos(FUNCIONARIO), id: 9 } } };
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Nuevo usuario' }));
    const dialogo = screen.getByRole('dialog', { name: 'Nuevo usuario' });
    await user.type(within(dialogo).getByLabelText('Nombre completo'), 'Ana Pérez');
    await user.type(within(dialogo).getByLabelText('Correo'), 'ana@institucion.test');
    await within(dialogo).findByRole('option', { name: 'Mesa de entradas' });
    await user.selectOptions(within(dialogo).getByLabelText('Rol'), 'Mesa de entradas');
    await user.selectOptions(within(dialogo).getByLabelText('Dependencia'), 'Mesa de Entradas');
    await user.type(within(dialogo).getByLabelText('Contraseña inicial'), 'Segura12345');
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Usuario ana@institucion.test creado.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(enviado).toEqual({ email: 'ana@institucion.test', nombre: 'Ana Pérez', password: 'Segura12345', rolId: 2, dependenciaId: 2 });
  });

  it('muestra los errores de validación del servidor junto a cada campo', async () => {
    const user = userEvent.setup();
    renderApp('/administracion', {
      handlers: {
        ...handlersBase([]),
        'POST /api/usuarios': () => ({
          status: 400,
          body: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Los datos enviados no son válidos',
              requestId: 'r',
              details: [{ field: 'password', message: 'La contraseña debe combinar letras y números' }],
            },
          },
        }),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Nuevo usuario' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('La contraseña debe combinar letras y números')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('al editarse a sí mismo no puede cambiar su rol ni desactivarse', async () => {
    const user = userEvent.setup();
    renderApp('/administracion', { handlers: handlersBase([sinPermisos(ADMIN)]) });

    await user.click(await screen.findByRole('button', { name: `Editar a ${ADMIN.nombre}` }));
    const dialogo = screen.getByRole('dialog', { name: 'Editar usuario' });

    expect(within(dialogo).getByLabelText('Rol')).toBeDisabled();
    expect(within(dialogo).getByLabelText('Usuario activo')).toBeDisabled();
    expect(within(dialogo).getByLabelText('Correo')).toBeDisabled();
  });

  it('al desactivar a otro usuario envía solo el cambio realizado', async () => {
    const user = userEvent.setup();
    let enviado: unknown;
    renderApp('/administracion', {
      handlers: {
        ...handlersBase([sinPermisos(ADMIN), sinPermisos(FUNCIONARIO)]),
        'PATCH /api/usuarios/2': (body) => {
          enviado = body;
          return { body: { data: { ...sinPermisos(FUNCIONARIO), activo: false } } };
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: `Editar a ${FUNCIONARIO.nombre}` }));
    const dialogo = screen.getByRole('dialog', { name: 'Editar usuario' });
    await user.click(within(dialogo).getByLabelText('Usuario activo'));
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(`Usuario ${FUNCIONARIO.email} actualizado.`);
    expect(enviado).toEqual({ activo: false });
  });
});
