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
    // Esperar a que la lista termine de cargar (antes solo está la fila "No hay usuarios").
    await within(tabla).findByText('funcionario@institucion.test');

    const filas = within(tabla).getAllByRole('row');
    expect(filas).toHaveLength(3);
    expect(within(filas[1]!).getByText('admin')).toBeInTheDocument();
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
    await user.type(within(dialogo).getByLabelText('Nombre de usuario'), 'ana.perez');
    await user.type(within(dialogo).getByLabelText('Correo'), 'ana@institucion.test');
    await within(dialogo).findByRole('option', { name: 'Mesa de entradas' });
    await user.selectOptions(within(dialogo).getByLabelText('Rol'), 'Mesa de entradas');
    await user.selectOptions(within(dialogo).getByLabelText('Dependencia'), 'Mesa de Entradas');
    await user.type(within(dialogo).getByLabelText('Contraseña inicial'), '12345');
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Usuario ana.perez creado.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(enviado).toEqual({ username: 'ana.perez', email: 'ana@institucion.test', nombre: 'Ana Pérez', password: '12345', rolId: 2, dependenciaId: 2 });
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
              details: [{ field: 'password', message: 'La contraseña debe tener al menos 5 caracteres' }],
            },
          },
        }),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Nuevo usuario' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('La contraseña debe tener al menos 5 caracteres')).toBeInTheDocument();
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
    expect(within(dialogo).getByLabelText('Nombre de usuario')).toBeDisabled();
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

    expect(await screen.findByRole('status')).toHaveTextContent(`Usuario ${FUNCIONARIO.username} actualizado.`);
    expect(enviado).toEqual({ activo: false });
  });

  it('el ojo muestra y oculta la contraseña que se escribe al editar', async () => {
    const user = userEvent.setup();
    renderApp('/administracion', { handlers: handlersBase([sinPermisos(ADMIN), sinPermisos(FUNCIONARIO)]) });

    await user.click(await screen.findByRole('button', { name: `Editar a ${FUNCIONARIO.nombre}` }));
    const dialogo = screen.getByRole('dialog', { name: 'Editar usuario' });
    const campo = within(dialogo).getByLabelText('Nueva contraseña (opcional)');
    await user.type(campo, 'clave9');
    expect(campo).toHaveAttribute('type', 'password');

    await user.click(within(dialogo).getByRole('button', { name: 'Mostrar contraseña' }));
    expect(campo).toHaveAttribute('type', 'text');
    expect(campo).toHaveValue('clave9');

    await user.click(within(dialogo).getByRole('button', { name: 'Ocultar contraseña' }));
    expect(campo).toHaveAttribute('type', 'password');
  });

  it('elimina un usuario después de confirmar y no ofrece eliminarse a uno mismo', async () => {
    const user = userEvent.setup();
    let llamado = false;
    renderApp('/administracion', {
      handlers: {
        ...handlersBase([sinPermisos(ADMIN), sinPermisos(FUNCIONARIO)]),
        'DELETE /api/usuarios/2': () => {
          llamado = true;
          return { status: 204, body: null };
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: `Eliminar a ${FUNCIONARIO.nombre}` }));
    expect(screen.queryByRole('button', { name: `Eliminar a ${ADMIN.nombre}` })).not.toBeInTheDocument();
    const dialogo = screen.getByRole('alertdialog', { name: 'Eliminar usuario' });
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(`Usuario ${FUNCIONARIO.username} eliminado.`);
    expect(llamado).toBe(true);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('si el usuario tiene actividad, muestra el motivo del servidor y no lo borra', async () => {
    const user = userEvent.setup();
    const motivo = 'El usuario tiene actividad registrada y no se puede eliminar; desactívelo para conservar el historial';
    renderApp('/administracion', {
      handlers: {
        ...handlersBase([sinPermisos(ADMIN), sinPermisos(FUNCIONARIO)]),
        'DELETE /api/usuarios/2': () => ({ status: 409, body: { error: { code: 'CONFLICT', message: motivo, requestId: 't' } } }),
      },
    });

    await user.click(await screen.findByRole('button', { name: `Eliminar a ${FUNCIONARIO.nombre}` }));
    const dialogo = screen.getByRole('alertdialog', { name: 'Eliminar usuario' });
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }));

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(motivo);
  });
});
