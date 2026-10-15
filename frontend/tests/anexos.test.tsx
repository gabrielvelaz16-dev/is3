import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FUNCIONARIO, renderApp } from './support';

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
};

const persona = { id: 1, nombre: 'Administrador del sistema', username: 'admin' };

const DOCUMENTO = {
  id: 3,
  expedienteId: 7,
  nombreOriginal: 'informe.pdf',
  tipoMime: 'application/pdf',
  tamanoBytes: 2048,
  hashSha256: 'a'.repeat(64),
  descripcion: 'Informe inicial',
  subidoEn: '2026-10-15T11:00:00.000Z',
  subidoPor: persona,
};

const HISTORIAL = [
  { tipo: 'CREACION', fecha: '2026-10-15T10:00:00.000Z', usuario: persona, descripcion: 'Expediente EXP-2026-000007 registrado en Administración General' },
  { tipo: 'CAMBIO_ESTADO', fecha: '2026-10-15T10:30:00.000Z', usuario: persona, descripcion: 'Estado: BORRADOR → EN_TRAMITE' },
  { tipo: 'DOCUMENTO', fecha: '2026-10-15T11:00:00.000Z', usuario: persona, descripcion: 'Documento adjuntado: informe.pdf' },
];

const ok = (data: unknown, status = 200) => () => ({ status, body: { data } });

function handlers(extra: Record<string, (body: unknown) => { status?: number; body: unknown }> = {}) {
  return {
    'GET /api/expedientes/7': ok(EXPEDIENTE),
    'GET /api/expedientes/7/documentos': ok([DOCUMENTO]),
    'GET /api/expedientes/7/actuaciones': ok([]),
    'GET /api/expedientes/7/historial': ok(HISTORIAL),
    ...extra,
  };
}

describe('Detalle del expediente: documentos, actuaciones e historial (Sprint 4)', () => {
  it('muestra los documentos con tamaño y autor, y el historial en orden', async () => {
    renderApp('/expedientes/7', { handlers: handlers() });

    const docs = await screen.findByRole('list', { name: 'Documentos del expediente' });
    expect(within(docs).getByText('informe.pdf')).toBeInTheDocument();
    expect(within(docs).getByText(/2\.0 KB/)).toBeInTheDocument();
    expect(within(docs).getByRole('button', { name: 'Descargar informe.pdf' })).toBeInTheDocument();

    const historial = await screen.findByRole('list', { name: 'Historial del expediente' });
    const items = within(historial).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Creación');
    expect(items[1]).toHaveTextContent('BORRADOR → EN_TRAMITE');
    expect(items[2]).toHaveTextContent('Documento adjuntado: informe.pdf');
  });

  it('adjunta un archivo enviándolo como cuerpo con su nombre codificado en el encabezado', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/expedientes/7', {
      handlers: handlers({ 'POST /api/expedientes/7/documentos': ok({ ...DOCUMENTO, id: 4, nombreOriginal: 'Acta Nº 1.pdf' }, 201) }),
    });

    const archivo = new File(['%PDF-1.7 prueba'], 'Acta Nº 1.pdf', { type: 'application/pdf' });
    await user.upload(await screen.findByLabelText('Archivo'), archivo);
    await user.type(screen.getByLabelText('Descripción (opcional)'), 'Acta de inicio');
    await user.click(screen.getByRole('button', { name: 'Adjuntar' }));

    expect(await screen.findByText('Documento "Acta Nº 1.pdf" adjuntado')).toBeInTheDocument();
    const llamada = fetchMock.mock.calls.find(([url, init]) => url === '/api/expedientes/7/documentos' && init?.method === 'POST')!;
    const init = llamada[1]!;
    expect(init.body).toBe(archivo);
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/pdf',
      'X-Nombre-Archivo': encodeURIComponent('Acta Nº 1.pdf'),
      'X-Descripcion': encodeURIComponent('Acta de inicio'),
    });
  });

  it('muestra el motivo cuando el servidor rechaza el tipo de archivo', async () => {
    const user = userEvent.setup();
    renderApp('/expedientes/7', {
      handlers: handlers({
        'POST /api/expedientes/7/documentos': () => ({
          status: 400,
          body: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Tipo de archivo no permitido',
              requestId: 't',
              details: [{ field: 'archivo', message: 'Tipo de archivo no permitido. Se aceptan: PDF, PNG' }],
            },
          },
        }),
      }),
    });

    await user.upload(await screen.findByLabelText('Archivo'), new File(['x'], 'nota.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: 'Adjuntar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tipo de archivo no permitido. Se aceptan: PDF, PNG');
  });

  it('registra una observación y recarga las actuaciones y el historial', async () => {
    const user = userEvent.setup();
    const registradas: unknown[] = [];
    const { fetchMock } = renderApp('/expedientes/7', {
      handlers: handlers({
        'GET /api/expedientes/7/actuaciones': () => ({ body: { data: registradas } }),
        'POST /api/expedientes/7/actuaciones': (body) => {
          const a = { id: 1, expedienteId: 7, ...(body as object), fecha: '2026-10-15T12:00:00.000Z', autor: persona };
          registradas.push(a);
          return { status: 201, body: { data: a } };
        },
      }),
    });

    expect(await screen.findByText('Sin actuaciones registradas.')).toBeInTheDocument();
    const boton = screen.getByRole('button', { name: 'Registrar' });
    expect(boton).toBeDisabled();

    await user.click(screen.getByLabelText('Observación'));
    await user.type(screen.getByLabelText('Texto'), 'Falta la firma del director');
    await user.click(boton);

    const lista = await screen.findByRole('list', { name: 'Actuaciones del expediente' });
    expect(within(lista).getByText('Falta la firma del director')).toBeInTheDocument();
    expect(within(lista).getByText('Observación')).toBeInTheDocument();
    const post = fetchMock.mock.calls.find(([url, init]) => url === '/api/expedientes/7/actuaciones' && init?.method === 'POST')!;
    expect(JSON.parse(String(post[1]!.body))).toEqual({ tipo: 'OBSERVACION', texto: 'Falta la firma del director' });
    // El historial se volvió a pedir después del registro.
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/expedientes/7/historial').length).toBeGreaterThan(1);
  });

  it('sin permisos de carga no muestra los formularios de adjuntar ni de registrar', async () => {
    renderApp('/expedientes/7', { usuario: FUNCIONARIO, handlers: handlers() });

    expect(await screen.findByRole('list', { name: 'Documentos del expediente' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Adjuntar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Descargar/ })).not.toBeInTheDocument();
  });

  it('un expediente archivado no muestra los formularios aunque el usuario tenga permisos', async () => {
    renderApp('/expedientes/7', { handlers: handlers({ 'GET /api/expedientes/7': ok({ ...EXPEDIENTE, estado: 'ARCHIVADO' }) }) });

    expect(await screen.findByRole('list', { name: 'Documentos del expediente' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Adjuntar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument();
  });
});
