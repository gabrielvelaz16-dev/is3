import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { App } from '../src/App';
import { AuthProvider } from '../src/auth/AuthContext';
import type { Usuario, UsuarioSesion } from '../src/services/tipos';

type Respuesta = { status?: number; body: unknown };
type Handler = (body: unknown, url: string) => Respuesta;

/**
 * Simula la API con fetch: cada clave es "MÉTODO /api/ruta" (sin query).
 * Lo no definido responde 404 con el contrato de error.
 */
export function mockApi(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const ruta = url.split('?')[0];
    const handler = handlers[`${init?.method ?? 'GET'} ${ruta}`];
    const r: Respuesta = handler
      ? handler(typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body, url)
      : { status: 404, body: { error: { code: 'NOT_FOUND', message: 'No existe', requestId: 't' } } };
    const status = r.status ?? 200;
    return { ok: status < 400, status, json: async () => r.body } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const base = {
  activo: true,
  ultimoAcceso: null,
  creadoEn: '2026-10-14T10:00:00.000Z',
  dependencia: { id: 1, codigo: 'ADM', nombre: 'Administración General' },
};

export const ADMIN: UsuarioSesion = {
  ...base,
  id: 1,
  username: 'admin',
  email: 'admin@institucion.test',
  nombre: 'Administrador del sistema',
  rol: { id: 1, clave: 'ADMINISTRADOR', nombre: 'Administrador' },
  permisos: [
    'usuarios.gestionar',
    'auditoria.consultar',
    'expedientes.crear',
    'expedientes.consultar',
    'expedientes.consultar_todas',
    'expedientes.modificar',
    'documentos.adjuntar',
    'documentos.descargar',
    'actuaciones.registrar',
    'reportes.consultar',
  ],
};

export const FUNCIONARIO: UsuarioSesion = {
  ...base,
  id: 2,
  username: 'funcionario',
  email: 'funcionario@institucion.test',
  nombre: 'Funcionaria Prueba',
  rol: { id: 3, clave: 'FUNCIONARIO', nombre: 'Funcionario / Responsable' },
  permisos: ['expedientes.consultar'],
};

export const sinPermisos = (u: UsuarioSesion): Usuario => {
  const copia: Partial<UsuarioSesion> = { ...u };
  delete copia.permisos;
  return copia as Usuario;
};

const resumenVacio = {
  total: 0,
  porEstado: { BORRADOR: 0, EN_TRAMITE: 0, EN_REVISION: 0, RESUELTO: 0, ARCHIVADO: 0 },
  porPrioridad: { BAJA: 0, MEDIA: 0, ALTA: 0 },
  porTipo: [],
  porDependencia: [],
};

/** Dashboard vacío de la institución (Sprint 6). */
export const DASHBOARD_VACIO = {
  alcance: { tipo: 'INSTITUCION' },
  generadoEn: '2026-10-16T12:00:00.000Z',
  diasAviso: 3,
  resumen: resumenVacio,
  seguimiento: { vencidos: 0, porVencer: 0, enTransito: 0, porRecibir: 0, tareasAbiertas: 0, tareasVencidas: 0 },
};

const health = { data: { status: 'ok', api: 'ok', database: 'ok', version: '0.1.0', uptimeSeconds: 1, timestamp: '2026-10-14T10:00:00Z' } };

/** Monta la app completa en una ruta, con o sin sesión. Agrega handlers propios de cada prueba. */
export function renderApp(path: string, opciones: { usuario?: UsuarioSesion | null; handlers?: Record<string, Handler> } = {}) {
  const usuario = opciones.usuario === undefined ? ADMIN : opciones.usuario;
  const fetchMock = mockApi({
    'GET /api/auth/me': () =>
      usuario ? { body: { data: { usuario } } } : { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'Debe iniciar sesión', requestId: 't' } } },
    'GET /api/health': () => ({ body: health }),
    'POST /api/auth/logout': () => ({ body: { data: { ok: true } } }),
    'GET /api/pendientes': () => ({ body: { data: { tareas: [], recibidos: [], expedientesPorVencer: [] } } }),
    'GET /api/notificaciones': () => ({ body: { data: { items: [], noLeidas: 0 } } }),
    'GET /api/estadisticas/dashboard': () => ({ body: { data: DASHBOARD_VACIO } }),
    'GET /api/expedientes': () => ({ body: { data: [], paginacion: { total: 0, pagina: 1, porPagina: 20, totalPaginas: 0 } } }),
    ...opciones.handlers,
  });
  const vista = render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
  return { ...vista, fetchMock };
}
