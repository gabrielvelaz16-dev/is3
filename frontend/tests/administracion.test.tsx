import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { tamano } from '../src/services/administracion';
import type { UsuarioSesion } from '../src/services/tipos';
import { ADMIN, FUNCIONARIO, renderApp, sinPermisos } from './support';

const ok = (data: unknown, status = 200) => () => ({ status, body: { data } });

const eventos = {
  items: [
    { id: 3, fecha: '2026-10-16T13:00:00.000Z', usuario: { id: 1, nombre: 'Admin', username: 'admin' }, accion: 'expediente.crear', resultado: 'EXITO', entidad: 'Expediente', entidadId: '7', detalle: { numero: 'EXP-2026-000007' }, ip: '127.0.0.1', requestId: 'a' },
    { id: 2, fecha: '2026-10-16T12:59:00.000Z', usuario: null, accion: 'LOGIN', resultado: 'FALLO', entidad: null, entidadId: null, detalle: null, ip: '127.0.0.1', requestId: 'b' },
  ],
  total: 2,
  pagina: 1,
  porPagina: 25,
};

const handlersAuditoria = {
  'GET /api/auditoria': ok(eventos),
  'GET /api/auditoria/acciones': ok(['LOGIN', 'expediente.crear']),
};

describe('Auditoría (S7-03, RF-21)', () => {
  it('muestra los eventos con usuario, acción, resultado y detalle', async () => {
    renderApp('/auditoria', { handlers: handlersAuditoria });
    const tabla = await screen.findByRole('table', { name: 'Eventos de auditoría' });
    await within(tabla).findByText('expediente.crear');
    const filas = within(tabla).getAllByRole('row');
    expect(filas).toHaveLength(3);
    expect(within(filas[1]!).getByText('admin')).toBeInTheDocument();
    expect(within(filas[1]!).getByText('Éxito')).toBeInTheDocument();
    expect(within(filas[1]!).getByText('{"numero":"EXP-2026-000007"}')).toBeInTheDocument();
    expect(within(filas[2]!).getByText('Sistema')).toBeInTheDocument();
    expect(within(filas[2]!).getByText('Fallo')).toBeInTheDocument();
    expect(screen.getByText(/2 eventos · página 1 de 1/)).toBeInTheDocument();
  });

  it('filtra por acción y resultado, y valida el rango de fechas', async () => {
    const user = userEvent.setup();
    const { fetchMock } = renderApp('/auditoria', { handlers: handlersAuditoria });
    await screen.findByRole('option', { name: 'LOGIN' });

    await user.selectOptions(screen.getByLabelText('Acción'), 'LOGIN');
    await user.selectOptions(screen.getByLabelText('Resultado'), 'FALLO');
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/auditoria?accion=LOGIN&resultado=FALLO&pagina=1&porPagina=25', expect.anything()),
    );

    const llamadas = fetchMock.mock.calls.length;
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-16' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-01' } });
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));
    expect(screen.getByText('La fecha "hasta" no puede ser anterior a "desde"')).toBeInTheDocument();
    expect(fetchMock.mock.calls.length).toBe(llamadas);
  });

  it('un funcionario no ve Auditoría en el menú y por URL ve "Acceso denegado"', async () => {
    renderApp('/auditoria', { usuario: FUNCIONARIO });
    expect(await screen.findByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).queryByRole('link', { name: 'Auditoría' })).not.toBeInTheDocument();
  });
});

describe('Copias de seguridad (S7-04, RF-22)', () => {
  const CON_RESPALDOS: UsuarioSesion = { ...ADMIN, permisos: [...ADMIN.permisos, 'respaldo.gestionar'] };
  const respaldo = { nombre: 'respaldo-20261016-100000', creadoEn: '2026-10-16T13:00:00.000Z', totalFilas: 120, documentos: 3, documentosConProblemas: 0, bytes: 20480 };
  const base = {
    'GET /api/usuarios': () => ({ body: { data: [sinPermisos(ADMIN)], meta: { page: 1, pageSize: 10, total: 1 } } }),
    'GET /api/roles': ok([]),
    'GET /api/dependencias': ok([]),
  };

  it('lista los respaldos y crea uno nuevo; no ofrece restaurar desde la pantalla', async () => {
    const user = userEvent.setup();
    let lista = [respaldo];
    const { fetchMock } = renderApp('/administracion', {
      usuario: CON_RESPALDOS,
      handlers: {
        ...base,
        'GET /api/respaldos': () => ({ body: { data: lista } }),
        'POST /api/respaldos': () => {
          const nuevo = { ...respaldo, nombre: 'respaldo-20261016-110000', documentosConProblemas: 1 };
          lista = [nuevo, respaldo];
          return { status: 201, body: { data: nuevo } };
        },
      },
    });

    const panel = await screen.findByRole('region', { name: 'Copias de seguridad' });
    expect(await within(panel).findByText('respaldo-20261016-100000')).toBeInTheDocument();
    expect(within(panel).getByText('20.0 KB')).toBeInTheDocument();

    await user.click(within(panel).getByRole('button', { name: 'Crear respaldo ahora' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Respaldo respaldo-20261016-110000 creado: 120 filas y 3 documentos. Atención: 1 documento(s)');
    expect(await within(panel).findByText('respaldo-20261016-110000')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/respaldos', expect.objectContaining({ method: 'POST' }));
    expect(within(panel).queryByRole('button', { name: /restaurar/i })).not.toBeInTheDocument();
  });

  it('sin respaldo.gestionar el panel no aparece', async () => {
    renderApp('/administracion', { handlers: base });
    await screen.findByRole('table', { name: 'Usuarios del sistema' });
    expect(screen.queryByRole('region', { name: 'Copias de seguridad' })).not.toBeInTheDocument();
  });

  it('muestra los tamaños en B, KB y MB', () => {
    expect(tamano(512)).toBe('512 B');
    expect(tamano(2048)).toBe('2.0 KB');
    expect(tamano(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});
