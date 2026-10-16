import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { consulta, validarRango } from '../src/services/reportes';
import type { UsuarioSesion } from '../src/services/tipos';
import { ADMIN, DASHBOARD_VACIO, renderApp } from './support';

const JEFE: UsuarioSesion = {
  ...ADMIN,
  id: 5,
  username: 'jefe',
  nombre: 'Jefa de Administración',
  rol: { id: 4, clave: 'JEFE_DEPENDENCIA', nombre: 'Jefe de dependencia' },
  permisos: ['expedientes.consultar', 'reportes.consultar'],
};

const ADM = { id: 1, codigo: 'ADM', nombre: 'Administración General' };
const resumen = {
  total: 3,
  porEstado: { BORRADOR: 1, EN_TRAMITE: 2, EN_REVISION: 0, RESUELTO: 0, ARCHIVADO: 0 },
  porPrioridad: { BAJA: 0, MEDIA: 1, ALTA: 2 },
  porTipo: [{ tipo: 'NOTA', total: 3 }],
  porDependencia: [{ dependencia: ADM, total: 3 }],
};
const expediente = (id: number, caratula: string) => ({
  id,
  numero: `EXP-2026-00000${id}`,
  caratula,
  asunto: 'Asunto',
  tipo: 'NOTA',
  iniciador: 'Iniciador',
  estado: 'EN_TRAMITE',
  prioridad: 'ALTA',
  descripcion: null,
  fechaVencimiento: null,
  dependenciaActualId: 1,
  creadoPorId: 1,
  responsableId: null,
  creadoEn: '2026-10-16T12:00:00.000Z',
  actualizadoEn: '2026-10-16T12:00:00.000Z',
  dependenciaActual: ADM,
  creadoPor: { id: 1, nombre: 'Admin', username: 'admin' },
  responsable: null,
  paseEnTransito: null,
});
const reporte = { resumen, items: [expediente(1, 'Nota de prueba'), expediente(2, 'Otra nota')], total: 2, pagina: 1, porPagina: 20 };
const ok = (data: unknown) => () => ({ body: { data } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Dashboard en el inicio (S6-01)', () => {
  it('muestra los indicadores y el alcance que devuelve el servidor', async () => {
    renderApp('/', {
      usuario: JEFE,
      handlers: {
        'GET /api/estadisticas/dashboard': ok({
          ...DASHBOARD_VACIO,
          alcance: { tipo: 'DEPENDENCIA', dependencia: ADM },
          resumen,
          seguimiento: { vencidos: 2, porVencer: 1, enTransito: 1, porRecibir: 0, tareasAbiertas: 4, tareasVencidas: 1 },
        }),
      },
    });

    const panel = await screen.findByRole('region', { name: 'Situación de Administración General' });
    const valor = (titulo: string) => within(panel).getByText(titulo).parentElement!.querySelector('dd')!.textContent;
    expect(valor('Expedientes')).toBe('3');
    expect(valor('Vencidos')).toBe('2');
    expect(valor('Por vencer')).toBe('1');
    expect(valor('Tareas vencidas')).toBe('1');
    expect(within(panel).getByText('de 4 tareas abiertas')).toBeInTheDocument();
    // Sin consultar_todas se muestra la distribución por tipo, no por dependencia.
    expect(within(panel).getByRole('region', { name: 'Por tipo' })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Ver reportes' })).toHaveAttribute('href', '/reportes');
  });

  it('si el servidor falla, avisa sin romper la página', async () => {
    renderApp('/', {
      handlers: {
        'GET /api/estadisticas/dashboard': () => ({ status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'Error interno', requestId: 't' } } }),
      },
    });
    expect(await screen.findByText('Error interno')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument();
  });
});

describe('Reportes (S6-02, S6-03)', () => {
  const handlers = {
    'GET /api/reportes/expedientes': ok(reporte),
    'GET /api/dependencias': ok([{ ...ADM, activa: true }, { id: 2, codigo: 'MESA', nombre: 'Mesa de Entradas', activa: true }]),
  };

  it('muestra el resumen y el listado, y aplica los filtros en la consulta', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/reportes', { handlers });

    expect(await screen.findByText('Nota de prueba')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Resumen por estado' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Estado'), 'EN_TRAMITE');
    await screen.findByRole('option', { name: 'Mesa de Entradas' });
    await user.selectOptions(screen.getByLabelText('Dependencia'), '2');
    await user.click(screen.getByRole('button', { name: 'Generar reporte' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/reportes/expedientes?estado=EN_TRAMITE&dependenciaId=2&pagina=1&porPagina=20', expect.anything()),
    );
  });

  it('valida el rango de fechas antes de consultar', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/reportes', { handlers });
    await screen.findByText('Nota de prueba');
    const llamadas = fetchMock.mock.calls.length;

    fireEvent.change(screen.getByLabelText('Creados desde'), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText('Creados hasta'), { target: { value: '2026-10-01' } });
    await user.click(screen.getByRole('button', { name: 'Generar reporte' }));

    expect(screen.getByText('La fecha "hasta" no puede ser anterior a "desde"')).toBeInTheDocument();
    expect(screen.getByLabelText('Creados hasta')).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock.mock.calls.length).toBe(llamadas);
  });

  it('el jefe no ve el filtro de dependencia (el servidor usa la suya)', async () => {
    renderApp('/reportes', { usuario: JEFE, handlers });
    await screen.findByText('Nota de prueba');
    expect(screen.queryByLabelText('Dependencia')).not.toBeInTheDocument();
  });

  it('exporta a CSV con los filtros aplicados y descarga el archivo', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/reportes', { handlers });
    await screen.findByText('Nota de prueba');

    const original = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
      url.startsWith('/api/reportes/expedientes/exportar')
        ? ({
            ok: true,
            status: 200,
            headers: new Headers({ 'Content-Disposition': 'attachment; filename="reporte-expedientes-20261016.csv"' }),
            blob: async () => new Blob(['﻿Número;Carátula\r\n'], { type: 'text/csv' }),
          } as Response)
        : original(url, init),
    );
    const crearUrl = vi.fn(() => 'blob:reporte');
    Object.assign(URL, { createObjectURL: crearUrl, revokeObjectURL: vi.fn() });
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await user.selectOptions(screen.getByLabelText('Prioridad'), 'ALTA');
    await user.click(screen.getByRole('button', { name: 'Generar reporte' }));
    await user.click(screen.getByRole('button', { name: 'Exportar a CSV' }));

    expect(await screen.findByText('Se descargó reporte-expedientes-20261016.csv')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/reportes/expedientes/exportar?prioridad=ALTA', expect.anything());
    expect(crearUrl).toHaveBeenCalled();
    expect(clic).toHaveBeenCalled();
    clic.mockRestore();
  });

  it('arma la consulta sin filtros vacíos y valida el rango', () => {
    expect(consulta({ estado: undefined, tipo: '', desde: '2026-10-01', pagina: 2 })).toBe('?desde=2026-10-01&pagina=2');
    expect(consulta({})).toBe('');
    expect(validarRango('2026-10-02', '2026-10-01')).not.toBeNull();
    expect(validarRango('2026-10-01', '2026-10-01')).toBeNull();
  });
});

describe('Notificaciones (S5-06)', () => {
  const avisos = {
    items: [
      { id: 5, tipo: 'TAREA_ASIGNADA', mensaje: 'Nueva tarea en EXP-2026-000001: Revisar', expediente: { id: 1, numero: 'EXP-2026-000001', caratula: 'Nota' }, creadaEn: '2026-10-16T12:00:00.000Z', leidaEn: null },
      { id: 4, tipo: 'EXPEDIENTE_ASIGNADO', mensaje: 'Le asignaron el expediente EXP-2026-000002', expediente: { id: 2, numero: 'EXP-2026-000002', caratula: 'Otra' }, creadaEn: '2026-10-15T12:00:00.000Z', leidaEn: '2026-10-15T13:00:00.000Z' },
    ],
    noLeidas: 1,
  };

  it('la campana muestra cuántos avisos hay sin leer y los lista', async () => {
    const user = userEvent.setup();
    renderApp('/', { handlers: { 'GET /api/notificaciones': ok(avisos) } });

    const campana = await screen.findByRole('button', { name: 'Notificaciones: 1 sin leer' });
    await user.click(campana);
    const panel = screen.getByRole('region', { name: 'Notificaciones' });
    expect(within(panel).getAllByRole('listitem')).toHaveLength(2);
    expect(within(panel).getByText('Sin leer:', { exact: false })).toBeInTheDocument();
  });

  it('abrir un aviso lo marca como leído y lleva al expediente', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/', {
      handlers: {
        'GET /api/notificaciones': ok(avisos),
        'POST /api/notificaciones/5/leida': ok({ id: 5, leida: true }),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Notificaciones: 1 sin leer' }));
    await user.click(screen.getByRole('button', { name: /Nueva tarea en EXP-2026-000001/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/notificaciones/5/leida', expect.objectContaining({ method: 'POST' })));
    expect(screen.queryByRole('region', { name: 'Notificaciones' })).not.toBeInTheDocument();
    // Un aviso ya leído no se vuelve a marcar.
    expect(fetchMock).not.toHaveBeenCalledWith('/api/notificaciones/4/leida', expect.anything());
  });

  it('"Marcar todas como leídas" llama al servidor', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/', {
      handlers: {
        'GET /api/notificaciones': ok(avisos),
        'POST /api/notificaciones/leidas': ok({ marcadas: 1 }),
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Notificaciones: 1 sin leer' }));
    await user.click(screen.getByRole('button', { name: 'Marcar todas como leídas' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/notificaciones/leidas', expect.objectContaining({ method: 'POST' })));
  });
});
