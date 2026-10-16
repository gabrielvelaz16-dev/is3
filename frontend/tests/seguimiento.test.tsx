import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { UsuarioSesion } from '../src/services/tipos';
import { ADMIN, renderApp } from './support';

const JEFE: UsuarioSesion = {
  ...ADMIN,
  id: 5,
  username: 'jefe',
  nombre: 'Jefa de Administración',
  rol: { id: 4, clave: 'JEFE_DEPENDENCIA', nombre: 'Jefe de dependencia' },
  permisos: [
    'expedientes.consultar',
    'expedientes.modificar',
    'expedientes.enviar',
    'expedientes.recibir',
    'estados.cambiar',
    'responsables.asignar',
    'tareas.gestionar',
  ],
};

const persona = { id: 2, nombre: 'Funcionaria Prueba', username: 'funcionario' };
const ADM = { id: 1, codigo: 'ADM', nombre: 'Administración General', activa: true };

const EXPEDIENTE = {
  id: 7,
  numero: 'EXP-2026-000007',
  caratula: 'Solicitud de equipamiento',
  asunto: 'Compra de equipos',
  tipo: 'SOLICITUD',
  iniciador: 'Informática',
  estado: 'EN_TRAMITE',
  prioridad: 'MEDIA',
  dependenciaActualId: 1,
  creadoPorId: 1,
  responsableId: null,
  fechaVencimiento: null,
  descripcion: null,
  creadoEn: '2026-10-15T10:00:00.000Z',
  actualizadoEn: '2026-10-15T10:00:00.000Z',
  dependenciaActual: ADM,
  creadoPor: persona,
  responsable: null,
  paseEnTransito: null,
};

const ok = (data: unknown, status = 200) => () => ({ status, body: { data } });

function detalle(extra: Record<string, (body: unknown) => { status?: number; body: unknown }> = {}) {
  return {
    'GET /api/expedientes/7': ok(EXPEDIENTE),
    'GET /api/expedientes/7/documentos': ok([]),
    'GET /api/expedientes/7/actuaciones': ok([]),
    'GET /api/expedientes/7/historial': ok([]),
    'GET /api/expedientes/7/tareas': ok([]),
    'GET /api/dependencias': ok([ADM, { id: 2, codigo: 'MESA', nombre: 'Mesa de Entradas', activa: true }]),
    'GET /api/dependencias/1/usuarios': ok([persona, { id: 5, nombre: 'Jefa de Administración', username: 'jefe' }]),
    ...extra,
  };
}

const llamada = (fetchMock: ReturnType<typeof renderApp>['fetchMock'], url: string, metodo: string) =>
  fetchMock.mock.calls.find(([u, init]) => u === url && init?.method === metodo);

describe('Detalle del expediente: seguimiento (Sprint 5)', () => {
  it('cambia el estado con un motivo usando la ruta propia', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/expedientes/7', {
      usuario: JEFE,
      handlers: detalle({ 'POST /api/expedientes/7/estado': ok({ ...EXPEDIENTE, estado: 'EN_REVISION' }) }),
    });

    await user.type(await screen.findByLabelText('Motivo del cambio de estado'), 'Falta un informe');
    await user.click(screen.getByRole('button', { name: 'En revisión' }));

    const post = llamada(fetchMock, '/api/expedientes/7/estado', 'POST')!;
    expect(JSON.parse(String(post[1]!.body))).toEqual({ estado: 'EN_REVISION', motivo: 'Falta un informe' });
  });

  it('asigna un responsable de la dependencia', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/expedientes/7', {
      usuario: JEFE,
      handlers: detalle({ 'POST /api/expedientes/7/responsable': ok({ ...EXPEDIENTE, responsable: persona, responsableId: 2 }) }),
    });

    const select = await screen.findByLabelText('Responsable');
    await within(select).findByRole('option', { name: 'Funcionaria Prueba' });
    await user.selectOptions(select, 'Funcionaria Prueba');
    await user.click(screen.getByRole('button', { name: 'Asignar' }));

    const post = llamada(fetchMock, '/api/expedientes/7/responsable', 'POST')!;
    expect(JSON.parse(String(post[1]!.body))).toEqual({ responsableId: 2 });
  });

  it('envía el expediente a otra dependencia (sin ofrecer la propia) con un motivo', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/expedientes/7', {
      usuario: JEFE,
      handlers: detalle({ 'POST /api/expedientes/7/pases': ok({ id: 1 }, 201) }),
    });

    const destino = await screen.findByLabelText('Enviar a otra dependencia');
    await screen.findByRole('option', { name: 'Mesa de Entradas' });
    expect(within(destino).queryByRole('option', { name: 'Administración General' })).not.toBeInTheDocument();
    await user.selectOptions(destino, 'Mesa de Entradas');
    await user.type(screen.getByLabelText('Motivo del pase'), 'Para su registro');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    const post = llamada(fetchMock, '/api/expedientes/7/pases', 'POST')!;
    expect(JSON.parse(String(post[1]!.body))).toEqual({ destinoId: 2, motivo: 'Para su registro' });
  });

  it('en tránsito muestra el aviso y no ofrece acciones ni formularios', async () => {
    const enTransito = { ...EXPEDIENTE, paseEnTransito: { id: 1, destino: { id: 2, codigo: 'MESA', nombre: 'Mesa de Entradas' }, enviadoEn: '2026-10-15T11:00:00.000Z' } };
    renderApp('/expedientes/7', { usuario: JEFE, handlers: detalle({ 'GET /api/expedientes/7': ok(enTransito) }) });

    expect(await screen.findByText(/En tránsito hacia/)).toHaveTextContent('Mesa de Entradas');
    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Asignar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Motivo del cambio de estado')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Tareas' }));
    expect(await screen.findByRole('heading', { name: 'Tareas' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crear tarea' })).not.toBeInTheDocument();
  });

  it('crea una tarea con vencimiento al final del día elegido', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/expedientes/7?pestana=tareas', {
      usuario: JEFE,
      handlers: detalle({ 'POST /api/expedientes/7/tareas': ok({ id: 1 }, 201) }),
    });

    await user.type(await screen.findByLabelText('Nueva tarea'), 'Pedir presupuestos');
    await screen.findAllByRole('option', { name: 'Funcionaria Prueba' });
    await user.selectOptions(screen.getByLabelText('Asignar a'), 'Funcionaria Prueba');
    fireEvent.change(screen.getByLabelText('Vence'), { target: { value: '2026-10-20' } });
    await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

    const body = JSON.parse(String(llamada(fetchMock, '/api/expedientes/7/tareas', 'POST')![1]!.body));
    expect(body).toMatchObject({ titulo: 'Pedir presupuestos', asignadoAId: 2 });
    const vence = new Date(body.vencimiento);
    expect([vence.getFullYear(), vence.getMonth() + 1, vence.getDate(), vence.getHours()]).toEqual([2026, 10, 20, 23]);
  });
});

describe('Tareas y pendientes (Sprint 5)', () => {
  const PASE = {
    id: 9,
    expedienteId: 7,
    origen: { id: 2, codigo: 'MESA', nombre: 'Mesa de Entradas' },
    destino: { id: 1, codigo: 'ADM', nombre: 'Administración General' },
    motivo: 'Para su intervención',
    enviadoEn: '2026-10-15T11:00:00.000Z',
    enviadoPor: persona,
    recibidoEn: null,
    recibidoPor: null,
    expediente: { id: 7, numero: 'EXP-2026-000007', caratula: 'Solicitud de equipamiento' },
  };
  const tarea = (id: number, titulo: string, alerta: string | null) => ({
    id,
    expedienteId: 7,
    titulo,
    descripcion: null,
    vencimiento: '2026-10-16T23:59:00.000Z',
    estado: 'PENDIENTE',
    creadaEn: '2026-10-15T10:00:00.000Z',
    cerradaEn: null,
    asignadoA: persona,
    creadoPor: persona,
    expediente: PASE.expediente,
    alerta,
  });

  it('muestra recibidos, tareas con su alerta y expedientes por vencer', async () => {
    renderApp('/tareas', {
      usuario: JEFE,
      handlers: {
        'GET /api/pendientes': ok({
          recibidos: [PASE],
          tareas: [tarea(1, 'Revisar informe', 'VENCIDA'), tarea(2, 'Pedir presupuestos', 'POR_VENCER')],
          expedientesPorVencer: [{ ...EXPEDIENTE, fechaVencimiento: '2026-10-17T00:00:00.000Z', alerta: 'POR_VENCER' }],
        }),
      },
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Tareas y pendientes' })).toBeInTheDocument();
    const recibidos = await screen.findByRole('list', { name: 'Expedientes recibidos' });
    expect(within(recibidos).getByText(/De Mesa de Entradas/)).toBeInTheDocument();
    const tareas = screen.getByRole('list', { name: 'Mis tareas' });
    expect(within(tareas).getAllByRole('listitem')[0]).toHaveTextContent('Vencida');
    expect(within(tareas).getAllByRole('listitem')[1]).toHaveTextContent('Por vencer');
    expect(within(screen.getByRole('list', { name: 'Expedientes por vencer' })).getByText('EXP-2026-000007')).toBeInTheDocument();
  });

  it('confirma la recepción y completa una tarea, recargando la lista', async () => {
    const user = userEvent.setup();
    let recibidos = [PASE];
    let tareas = [tarea(1, 'Revisar informe', null)];
    const { fetchMock } = renderApp('/tareas', {
      usuario: JEFE,
      handlers: {
        'GET /api/pendientes': () => ({ body: { data: { recibidos, tareas, expedientesPorVencer: [] } } }),
        'POST /api/pases/9/recepcion': () => {
          recibidos = [];
          return { body: { data: { ...PASE, recibidoEn: '2026-10-15T12:00:00.000Z' } } };
        },
        'PATCH /api/tareas/1': () => {
          tareas = [];
          return { body: { data: { ...tarea(1, 'Revisar informe', null), estado: 'COMPLETADA' } } };
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));
    expect(await screen.findByText('Expediente EXP-2026-000007 recibido')).toBeInTheDocument();
    expect(screen.getByText('No hay expedientes pendientes de recepción.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Completar Revisar informe' }));
    expect(await screen.findByText('No tenés tareas abiertas.')).toBeInTheDocument();
    expect(JSON.parse(String(llamada(fetchMock, '/api/tareas/1', 'PATCH')![1]!.body))).toEqual({ estado: 'COMPLETADA' });
  });

  it('sin permiso de recepción no muestra la bandeja', async () => {
    renderApp('/tareas', { usuario: { ...JEFE, permisos: ['expedientes.consultar'] } });
    expect(await screen.findByText('No tenés tareas abiertas.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Expedientes recibidos' })).not.toBeInTheDocument();
  });
});
