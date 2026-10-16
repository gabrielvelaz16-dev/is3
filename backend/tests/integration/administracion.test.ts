import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearEntorno, PASSWORD_ADMIN, PASSWORD_USUARIO } from '../support/memoria.js';

type Entorno = Awaited<ReturnType<typeof crearEntorno>>;
type Agente = ReturnType<typeof request.agent>;

const dos = (n: number) => String(n).padStart(2, '0');
const fechaLocal = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

describe('Sprint 7: auditoría y respaldos (RF-21, RF-22)', () => {
  let e: Entorno;
  let carpeta: string;
  let admin: Agente;
  let auditor: Agente;
  let funcionario: Agente;

  async function sesion(usuario: string, password = PASSWORD_USUARIO) {
    const agente = request.agent(e.app);
    expect((await agente.post('/api/auth/login').send({ usuario, password })).status, `login ${usuario}`).toBe(200);
    return agente;
  }

  beforeEach(async () => {
    carpeta = await mkdtemp(join(tmpdir(), 'is3-api-respaldos-'));
    e = await crearEntorno({ carpetaRespaldos: carpeta });
    await e.agregarUsuario('auditor@institucion.test', PASSWORD_USUARIO, 'AUDITOR');
    admin = await sesion('admin', PASSWORD_ADMIN);
    auditor = await sesion('auditor');
    funcionario = await sesion('funcionario');
    // Un intento fallido para tener un evento FALLO.
    await request(e.app).post('/api/auth/login').send({ usuario: 'admin', password: 'mala1' });
    await admin.post('/api/expedientes').send({ caratula: 'Expediente auditado', asunto: 'Asunto de prueba', tipo: 'NOTA', iniciador: 'Pruebas' });
  });

  afterEach(async () => {
    await rm(carpeta, { recursive: true, force: true });
  });

  it('sin sesión responde 401 y sin permiso 403', async () => {
    for (const ruta of ['/api/auditoria', '/api/auditoria/acciones', '/api/respaldos']) {
      expect((await request(e.app).get(ruta)).status, ruta).toBe(401);
      expect((await funcionario.get(ruta)).status, ruta).toBe(403);
    }
    expect((await request(e.app).post('/api/respaldos')).status).toBe(401);
    // El auditor consulta la auditoría pero no gestiona respaldos.
    expect((await auditor.post('/api/respaldos')).status).toBe(403);
  });

  // ── S7-03: consulta de auditoría ────────────────────────────────

  describe('consultar la auditoría (S7-03, RF-21)', () => {
    it('el auditor ve los eventos más recientes primero, con el usuario y sin contraseñas', async () => {
      const res = await auditor.get('/api/auditoria');
      expect(res.status).toBe(200);
      const { items, total, pagina, porPagina } = res.body.data;
      expect(total).toBe(e.auditoria.length);
      expect({ pagina, porPagina }).toEqual({ pagina: 1, porPagina: 25 });
      expect(items[0]).toMatchObject({ accion: 'expediente.crear', resultado: 'EXITO', usuario: { username: 'admin' } });
      expect(JSON.stringify(res.body)).not.toMatch(/mala1|clave1|passwordHash/);
    });

    it('filtra por acción, resultado y usuario, y pagina', async () => {
      const fallos = (await auditor.get('/api/auditoria?resultado=FALLO')).body.data;
      expect(fallos.items.length).toBeGreaterThan(0);
      expect(fallos.items.every((x: { resultado: string }) => x.resultado === 'FALLO')).toBe(true);

      const logins = (await auditor.get('/api/auditoria?accion=LOGIN')).body.data;
      expect(logins.items.every((x: { accion: string }) => x.accion === 'LOGIN')).toBe(true);

      const delAdmin = (await auditor.get(`/api/auditoria?usuarioId=${e.admin.id}`)).body.data;
      expect(delAdmin.items.every((x: { usuario: { id: number } | null }) => x.usuario?.id === e.admin.id)).toBe(true);

      const pagina2 = (await auditor.get('/api/auditoria?porPagina=2&pagina=2')).body.data;
      expect(pagina2.items).toHaveLength(2);
    });

    it('filtra por fechas y valida el rango', async () => {
      const hoy = fechaLocal(new Date());
      const manana = fechaLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));
      expect((await auditor.get(`/api/auditoria?desde=${hoy}&hasta=${hoy}`)).body.data.total).toBe(e.auditoria.length);
      expect((await auditor.get(`/api/auditoria?desde=${manana}`)).body.data.total).toBe(0);
      const invertido = await auditor.get(`/api/auditoria?desde=${manana}&hasta=${hoy}`);
      expect(invertido.status).toBe(400);
      expect(invertido.body.error.details[0].field).toBe('hasta');
      expect((await auditor.get('/api/auditoria?resultado=QUIZAS')).status).toBe(400);
    });

    it('lista las acciones registradas para el filtro', async () => {
      const acciones = (await admin.get('/api/auditoria/acciones')).body.data;
      expect(acciones).toEqual([...acciones].sort());
      expect(acciones).toEqual(expect.arrayContaining(['LOGIN', 'expediente.crear']));
    });

    it('no existe ninguna ruta para modificar o borrar la auditoría', async () => {
      for (const metodo of ['put', 'patch', 'delete'] as const) {
        expect((await admin[metodo]('/api/auditoria/1')).status).toBe(404);
      }
    });
  });

  // ── S7-04: respaldos desde la API ───────────────────────────────

  describe('respaldos (S7-04, RF-22)', () => {
    it('el administrador genera un respaldo, queda en la auditoría y aparece en la lista', async () => {
      const res = await admin.post('/api/respaldos');
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ documentos: 0, documentosConProblemas: 0 });
      expect(res.body.data.nombre).toMatch(/^respaldo-\d{8}-\d{6}$/);
      expect(res.body.data).not.toHaveProperty('ruta');
      expect(res.body.data.totalFilas).toBeGreaterThan(0);

      expect(await readdir(join(carpeta, res.body.data.nombre))).toEqual(expect.arrayContaining(['datos.json', 'manifiesto.json', 'documentos']));
      expect(e.auditoria.at(-1)).toMatchObject({ accion: 'respaldo.crear', resultado: 'EXITO', entidadId: res.body.data.nombre, usuarioId: e.admin.id });

      const lista = (await admin.get('/api/respaldos')).body.data;
      expect(lista).toHaveLength(1);
      expect(lista[0].nombre).toBe(res.body.data.nombre);
    });

    it('no hay ruta para restaurar: se hace solo por línea de comandos (ADR-13)', async () => {
      expect((await admin.post('/api/respaldos/respaldo-20261016-100000/restaurar')).status).toBe(404);
    });
  });
});
