import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FUNCIONARIO, renderApp } from './support';

const ACTIVO = {
  id: 7,
  numero: 'EXP-2026-000007',
  caratula: 'Pedido de informe técnico',
  asunto: 'Informe sobre el edificio',
  tipo: 'SOLICITUD',
  iniciador: 'Mantenimiento',
  estado: 'BORRADOR',
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
const MOTIVO = 'Duplicado de EXP-2026-000006';
const DESACTIVADO = {
  ...ACTIVO,
  activo: false,
  desactivadoEn: '2026-10-19T12:00:00.000Z',
  desactivadoPor: { id: 1, nombre: 'Administrador del sistema', username: 'admin' },
  motivoDesactivacion: MOTIVO,
};

const ok = (data: unknown, status = 200) => () => ({ status, body: { data } });
const anexos = {
  'GET /api/expedientes/7/documentos': ok([]),
  'GET /api/expedientes/7/actuaciones': ok([]),
  'GET /api/expedientes/7/historial': ok([]),
  'GET /api/expedientes/7/tareas': ok([]),
};
const listaDesactivados = (items: unknown[]) => () => ({
  body: { data: items, paginacion: { total: items.length, pagina: 1, porPagina: 10, totalPaginas: 1 } },
});

describe('Expedientes desactivados (CR-08)', () => {
  it('el administrador ve la sección en el menú; un funcionario no, y por URL ve "Acceso denegado"', async () => {
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Principal' });
    expect(within(nav).getByRole('link', { name: 'Expedientes desactivados' })).toHaveAttribute('href', '/expedientes-desactivados');
  });

  it('un funcionario no tiene la sección', async () => {
    renderApp('/expedientes-desactivados', { usuario: FUNCIONARIO });
    expect(await screen.findByText(/Acceso denegado/)).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).queryByRole('link', { name: 'Expedientes desactivados' })).not.toBeInTheDocument();
  });

  it('lista los desactivados con quién, cuándo y por qué, y permite reactivarlos', async () => {
    const user = userEvent.setup();
    let reactivado = false;
    renderApp('/expedientes-desactivados', {
      handlers: {
        'GET /api/expedientes/desactivados': listaDesactivados(reactivado ? [] : [DESACTIVADO]),
        'POST /api/expedientes/7/reactivar': () => {
          reactivado = true;
          return { body: { data: ACTIVO } };
        },
      },
    });

    const tabla = await screen.findByRole('table', { name: 'Expedientes desactivados' });
    const fila = (await within(tabla).findByRole('link', { name: 'EXP-2026-000007' })).closest('tr')!;
    expect(within(fila).getByText(MOTIVO)).toBeInTheDocument();
    expect(within(fila).getByText('por Administrador del sistema')).toBeInTheDocument();

    await user.click(within(fila).getByRole('button', { name: 'Reactivar EXP-2026-000007' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Expediente EXP-2026-000007 reactivado');
    expect(reactivado).toBe(true);
  });

  it('eliminar pide confirmación y, si el servidor lo rechaza por tener actividad, muestra el motivo', async () => {
    const user = userEvent.setup();
    const motivo409 = 'El expediente tiene documentos, actuaciones, tareas, pases o cambios registrados y no se puede eliminar; desactívelo para conservar el historial';
    renderApp('/expedientes-desactivados', {
      handlers: {
        'GET /api/expedientes/desactivados': listaDesactivados([DESACTIVADO]),
        'DELETE /api/expedientes/7': () => ({ status: 409, body: { error: { code: 'CONFLICT', message: motivo409, requestId: 't' } } }),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Eliminar EXP-2026-000007' }));
    const dialogo = screen.getByRole('alertdialog', { name: 'Eliminar expediente' });
    await user.click(within(dialogo).getByRole('button', { name: 'Eliminar' }));

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(motivo409);
  });

  it('en el detalle, desactivar exige un motivo y deja el expediente con el aviso de baja', async () => {
    const user = userEvent.setup();
    let enviado: unknown;
    renderApp('/expedientes/7', {
      handlers: {
        ...anexos,
        // Después de la baja, la página vuelve a pedir el expediente: ya viene desactivado.
        'GET /api/expedientes/7': () => ({ body: { data: enviado ? DESACTIVADO : ACTIVO } }),
        'POST /api/expedientes/7/desactivar': (body) => {
          enviado = body;
          return { body: { data: DESACTIVADO } };
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Desactivar' }));
    const dialogo = screen.getByRole('alertdialog', { name: 'Desactivar expediente' });
    const confirmar = within(dialogo).getByRole('button', { name: 'Desactivar' });
    expect(confirmar).toBeDisabled();
    await user.type(within(dialogo).getByLabelText('Motivo de la baja'), MOTIVO);
    await user.click(confirmar);

    expect(enviado).toEqual({ motivo: MOTIVO });
    expect(await screen.findByText('Expediente desactivado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reactivar' })).toBeInTheDocument();
  });

  it('un expediente desactivado muestra el motivo, no se edita y sus migas llevan a "Expedientes desactivados"', async () => {
    renderApp('/expedientes/7', { handlers: { ...anexos, 'GET /api/expedientes/7': ok(DESACTIVADO) } });

    expect(await screen.findByText(new RegExp(`Motivo: ${MOTIVO}`))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument();
    const migas = screen.getByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(migas).getByRole('link', { name: 'Expedientes desactivados' })).toHaveAttribute('href', '/expedientes-desactivados');
  });
});
