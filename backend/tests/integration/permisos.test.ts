/**
 * Matriz de permisos — Sprint 7 (S7-01, S7-02; RF-02, RNF-02).
 * Cada ruta de la API se prueba sin sesión y con cada rol: sin sesión → 401, sin el permiso → 403,
 * con el permiso → cualquier otra respuesta (400, 404, 200…). Si se agrega una ruta y no se
 * suma a esta matriz, la prueba "la matriz cubre todas las rutas" falla.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISOS, ROLES } from '../../src/security/permissions.js';
import { crearEntorno, PASSWORD_ADMIN, PASSWORD_USUARIO } from '../support/memoria.js';

type Metodo = 'get' | 'post' | 'patch' | 'delete';
/** 'publico': no exige sesión · 'sesion': cualquier usuario · un permiso · o una lista (alcanza con uno). */
type Requisito = 'publico' | 'sesion' | keyof typeof PERMISOS | (keyof typeof PERMISOS)[];

const E = '/api/expedientes/999';
const MATRIZ: [Metodo, string, Requisito][] = [
  // Públicas y de sesión
  ['get', '/api/health', 'publico'],
  ['post', '/api/auth/login', 'publico'],
  ['post', '/api/auth/logout', 'publico'],
  ['get', '/api/auth/me', 'sesion'],
  ['get', '/api/dependencias', 'sesion'],
  ['get', '/api/pendientes', 'sesion'],
  ['get', '/api/notificaciones', 'sesion'],
  ['post', '/api/notificaciones/leidas', 'sesion'],
  ['post', '/api/notificaciones/999/leida', 'sesion'],
  ['get', '/api/dependencias/1/usuarios', ['tareas.gestionar', 'responsables.asignar']],
  // Usuarios (Sprint 2)
  ['get', '/api/usuarios', 'usuarios.gestionar'],
  ['get', '/api/usuarios/999', 'usuarios.gestionar'],
  ['post', '/api/usuarios', 'usuarios.gestionar'],
  ['patch', '/api/usuarios/999', 'usuarios.gestionar'],
  ['delete', '/api/usuarios/999', 'usuarios.gestionar'],
  ['get', '/api/roles', 'usuarios.gestionar'],
  // Expedientes (Sprint 3)
  ['post', '/api/expedientes', 'expedientes.crear'],
  ['get', '/api/expedientes', 'expedientes.consultar'],
  ['get', E, 'expedientes.consultar'],
  ['patch', E, 'expedientes.modificar'],
  // Bajas de expedientes (CR-08)
  ['get', '/api/expedientes/desactivados', 'expedientes.desactivar'],
  ['post', `${E}/desactivar`, 'expedientes.desactivar'],
  ['post', `${E}/reactivar`, 'expedientes.desactivar'],
  ['delete', E, 'expedientes.desactivar'],
  // Documentos, actuaciones e historial (Sprint 4)
  ['get', `${E}/documentos`, 'expedientes.consultar'],
  ['post', `${E}/documentos`, 'documentos.adjuntar'],
  ['get', `${E}/documentos/1/descarga`, 'documentos.descargar'],
  ['get', `${E}/actuaciones`, 'expedientes.consultar'],
  ['post', `${E}/actuaciones`, 'actuaciones.registrar'],
  ['get', `${E}/historial`, 'expedientes.consultar'],
  // Seguimiento (Sprint 5)
  ['post', `${E}/estado`, 'estados.cambiar'],
  ['post', `${E}/responsable`, 'responsables.asignar'],
  ['post', `${E}/pases`, 'expedientes.enviar'],
  ['get', `${E}/tareas`, 'expedientes.consultar'],
  ['post', `${E}/tareas`, 'tareas.gestionar'],
  ['get', '/api/pases/recibidos', 'expedientes.recibir'],
  ['post', '/api/pases/999/recepcion', 'expedientes.recibir'],
  ['patch', '/api/tareas/999', 'tareas.gestionar'],
  // Dashboard y reportes (Sprint 6)
  ['get', '/api/estadisticas/dashboard', 'expedientes.consultar'],
  ['get', '/api/reportes/expedientes', 'reportes.consultar'],
  ['get', '/api/reportes/expedientes/exportar', 'reportes.consultar'],
  // Auditoría y respaldos (Sprint 7)
  ['get', '/api/auditoria', 'auditoria.consultar'],
  ['get', '/api/auditoria/acciones', 'auditoria.consultar'],
  ['get', '/api/respaldos', 'respaldo.gestionar'],
  ['post', '/api/respaldos', 'respaldo.gestionar'],
];

interface Capa {
  route?: { methods: Record<string, boolean> };
  handle?: { stack?: Capa[] };
}

/** Cuenta las rutas (método + camino) registradas en la app, recorriendo los routers anidados. */
function contarRutas(capas: Capa[]): number {
  let total = 0;
  for (const capa of capas) {
    if (capa.route) total += Object.keys(capa.route.methods).filter((m) => m !== '_all').length;
    else if (capa.handle?.stack) total += contarRutas(capa.handle.stack);
  }
  return total;
}

const permite = (permisos: readonly string[], req: Requisito) =>
  req === 'publico' || req === 'sesion' || (Array.isArray(req) ? req.some((p) => permisos.includes(p)) : permisos.includes(req));

describe('Matriz de permisos de toda la API (S7-02, RNF-02)', () => {
  let app: Express;
  let carpeta: string;
  const agentes = new Map<string, ReturnType<typeof request.agent>>();

  beforeAll(async () => {
    carpeta = await mkdtemp(join(tmpdir(), 'is3-permisos-'));
    const e = await crearEntorno({ carpetaRespaldos: carpeta });
    app = e.app;
    await e.agregarUsuario('mesa@institucion.test', PASSWORD_USUARIO, 'MESA_ENTRADAS', { dependenciaId: 2 });
    await e.agregarUsuario('jefe@institucion.test', PASSWORD_USUARIO, 'JEFE_DEPENDENCIA');
    await e.agregarUsuario('auditor@institucion.test', PASSWORD_USUARIO, 'AUDITOR');
    const usuarioDe: Record<string, [string, string]> = {
      ADMINISTRADOR: ['admin', PASSWORD_ADMIN],
      MESA_ENTRADAS: ['mesa', PASSWORD_USUARIO],
      FUNCIONARIO: ['funcionario', PASSWORD_USUARIO],
      JEFE_DEPENDENCIA: ['jefe', PASSWORD_USUARIO],
      AUDITOR: ['auditor', PASSWORD_USUARIO],
    };
    for (const rol of Object.keys(ROLES)) {
      const [usuario, password] = usuarioDe[rol]!;
      const agente = request.agent(app);
      expect((await agente.post('/api/auth/login').send({ usuario, password })).status, `login ${usuario}`).toBe(200);
      agentes.set(rol, agente);
    }
  });

  afterAll(async () => {
    await rm(carpeta, { recursive: true, force: true });
  });

  it('la matriz cubre todas las rutas registradas en la API y usa permisos que existen', () => {
    const stack = (app as unknown as { router: { stack: Capa[] } }).router.stack;
    expect(contarRutas(stack), 'Hay rutas nuevas sin agregar a la matriz de permisos').toBe(MATRIZ.length);
    for (const [, , req] of MATRIZ) {
      for (const p of Array.isArray(req) ? req : [req]) {
        if (p !== 'publico' && p !== 'sesion') expect(Object.keys(PERMISOS)).toContain(p);
      }
    }
  });

  it.each(MATRIZ.filter(([, , req]) => req !== 'publico'))('%s %s sin sesión → 401', async (metodo, ruta) => {
    expect((await request(app)[metodo](ruta).send({})).status).toBe(401);
  });

  it.each(MATRIZ.filter(([, , req]) => req !== 'publico'))('%s %s responde según el rol (%s)', async (metodo, ruta, req) => {
    for (const [rol, { permisos }] of Object.entries(ROLES)) {
      const { status } = await agentes.get(rol)![metodo](ruta).send({});
      if (permite(permisos, req)) {
        expect([401, 403], `${rol} tiene el permiso y recibió ${status}`).not.toContain(status);
      } else {
        expect(status, `${rol} no tiene el permiso`).toBe(403);
      }
    }
  });
});
