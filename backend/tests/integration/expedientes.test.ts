import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { crearEntorno, PASSWORD_ADMIN, PASSWORD_USUARIO } from '../support/memoria.js';

type Entorno = Awaited<ReturnType<typeof crearEntorno>>;

async function comoAdmin(e: Entorno) {
  const agente = request.agent(e.app);
  await agente.post('/api/auth/login').send({ usuario: 'admin', password: PASSWORD_ADMIN });
  return agente;
}

async function comoFuncionario(e: Entorno) {
  const agente = request.agent(e.app);
  await agente.post('/api/auth/login').send({ usuario: 'funcionario', password: PASSWORD_USUARIO });
  return agente;
}

const EXPEDIENTE_VALIDO = {
  caratula: 'Solicitud de licencia 2026',
  asunto: 'Pedido de licencia por vacaciones del mes de noviembre',
  tipo: 'SOLICITUD',
  iniciador: 'Juan Pérez',
};

describe('Expedientes (RF-04 a RF-07, S3-01 a S3-06)', () => {
  let e: Entorno;
  beforeEach(async () => {
    e = await crearEntorno();
    // Agregar usuario mesa_entradas para probar permisos
    await e.agregarUsuario('mesa@institucion.test', PASSWORD_USUARIO, 'MESA_ENTRADAS', { dependenciaId: 2 });
  });

  // ── Autorización ────────────────────────────────────────────────

  describe('autorización', () => {
    it('sin sesión, todas las rutas de expedientes responden 401', async () => {
      for (const [metodo, ruta] of [
        ['get', '/api/expedientes'],
        ['post', '/api/expedientes'],
        ['get', '/api/expedientes/1'],
        ['patch', '/api/expedientes/1'],
      ] as const) {
        expect((await request(e.app)[metodo](ruta).send({})).status, `${metodo} ${ruta}`).toBe(401);
      }
    });

    it('un auditor (sin permiso expedientes.crear) recibe 403 al crear', async () => {
      await e.agregarUsuario('auditor@institucion.test', PASSWORD_USUARIO, 'AUDITOR');
      const agente = request.agent(e.app);
      await agente.post('/api/auth/login').send({ usuario: 'auditor', password: PASSWORD_USUARIO });
      const res = await agente.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      expect(res.status).toBe(403);
    });
  });

  // ── Crear expediente (S3-01) ────────────────────────────────────

  describe('crear expediente (S3-01)', () => {
    it('crea un expediente con número único EXP-AAAA-NNNNNN', async () => {
      const admin = await comoAdmin(e);
      const res = await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      expect(res.status).toBe(201);
      expect(res.body.data.numero).toMatch(/^EXP-\d{4}-\d{6}$/);
      expect(res.body.data.caratula).toBe(EXPEDIENTE_VALIDO.caratula);
      expect(res.body.data.estado).toBe('BORRADOR');
      expect(res.body.data.prioridad).toBe('MEDIA');
    });

    it('genera números secuenciales', async () => {
      const admin = await comoAdmin(e);
      const r1 = await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      const r2 = await admin.post('/api/expedientes').send({ ...EXPEDIENTE_VALIDO, caratula: 'Otro expediente' });
      expect(r1.body.data.numero).toMatch(/000001$/);
      expect(r2.body.data.numero).toMatch(/000002$/);
    });

    it('rechaza datos incompletos con 400 (contrato de la API)', async () => {
      const admin = await comoAdmin(e);
      const res = await admin.post('/api/expedientes').send({ caratula: 'AB' }); // caratula muy corta, faltan campos
      expect(res.status).toBe(400);
    });

    it('el estado y el responsable no se cambian por PATCH: tienen rutas propias (400)', async () => {
      const admin = await comoAdmin(e);
      const { body: { data: creado } } = await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      expect((await admin.patch(`/api/expedientes/${creado.id}`).send({ estado: 'EN_TRAMITE' })).status).toBe(400);
      expect((await admin.patch(`/api/expedientes/${creado.id}`).send({ responsableId: 1 })).status).toBe(400);
    });

    it('crea con prioridad y fecha de vencimiento', async () => {
      const admin = await comoAdmin(e);
      const res = await admin.post('/api/expedientes').send({
        ...EXPEDIENTE_VALIDO,
        prioridad: 'ALTA',
        fechaVencimiento: '2026-12-31T23:59:59.000Z',
      });
      expect(res.status).toBe(201);
      expect(res.body.data.prioridad).toBe('ALTA');
      expect(res.body.data.fechaVencimiento).toBeTruthy();
    });

    it('registra la creación en la auditoría', async () => {
      const admin = await comoAdmin(e);
      await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      const evento = e.auditoria.find((a) => a.accion === 'expediente.crear');
      expect(evento).toBeDefined();
      expect(evento!.resultado).toBe('EXITO');
    });

    it('mesa de entradas puede crear expedientes', async () => {
      const mesa = request.agent(e.app);
      await mesa.post('/api/auth/login').send({ usuario: 'mesa', password: PASSWORD_USUARIO });
      const res = await mesa.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      expect(res.status).toBe(201);
    });
  });

  // ── Consultar expediente (S3-02) ────────────────────────────────

  describe('consultar expediente (S3-02)', () => {
    it('obtiene un expediente por id', async () => {
      const admin = await comoAdmin(e);
      const { body: { data: creado } } = await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      const res = await admin.get(`/api/expedientes/${creado.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.numero).toBe(creado.numero);
      expect(res.body.data.dependenciaActual).toBeDefined();
      expect(res.body.data.creadoPor).toBeDefined();
    });

    it('un usuario de otra dependencia no puede ver ni modificar el expediente (403)', async () => {
      const mesa = request.agent(e.app);
      await mesa.post('/api/auth/login').send({ usuario: 'mesa', password: PASSWORD_USUARIO });
      const { body: { data: creado } } = await mesa.post('/api/expedientes').send(EXPEDIENTE_VALIDO); // queda en Mesa de Entradas
      const funcionario = await comoFuncionario(e); // Administración General, sin consultar_todas
      expect((await funcionario.get(`/api/expedientes/${creado.id}`)).status).toBe(403);
      expect((await funcionario.patch(`/api/expedientes/${creado.id}`).send({ caratula: 'Intrusión' })).status).toBe(403);
      const lista = await funcionario.get('/api/expedientes');
      expect(lista.body.data).toHaveLength(0);
    });

    it('responde 404 para un id inexistente', async () => {
      const admin = await comoAdmin(e);
      const res = await admin.get('/api/expedientes/9999');
      expect(res.status).toBe(404);
    });
  });

  // ── Modificar expediente (S3-03) ────────────────────────────────

  describe('modificar expediente (S3-03)', () => {
    it('modifica la carátula y el asunto', async () => {
      const admin = await comoAdmin(e);
      const { body: { data: creado } } = await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      const res = await admin.patch(`/api/expedientes/${creado.id}`).send({ caratula: 'Carátula modificada' });
      expect(res.status).toBe(200);
      expect(res.body.data.caratula).toBe('Carátula modificada');
    });

    it('permite transición BORRADOR → EN_TRAMITE', async () => {
      const admin = await comoAdmin(e);
      const { body: { data: creado } } = await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      const res = await admin.post(`/api/expedientes/${creado.id}/estado`).send({ estado: 'EN_TRAMITE' });
      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('EN_TRAMITE');
    });

    it('rechaza transición inválida BORRADOR → ARCHIVADO', async () => {
      const admin = await comoAdmin(e);
      const { body: { data: creado } } = await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      const res = await admin.post(`/api/expedientes/${creado.id}/estado`).send({ estado: 'ARCHIVADO' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('no se puede modificar un expediente archivado', async () => {
      const admin = await comoAdmin(e);
      const { body: { data: creado } } = await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      // BORRADOR → EN_TRAMITE → RESUELTO → ARCHIVADO
      await admin.post(`/api/expedientes/${creado.id}/estado`).send({ estado: 'EN_TRAMITE' });
      await admin.post(`/api/expedientes/${creado.id}/estado`).send({ estado: 'RESUELTO' });
      await admin.post(`/api/expedientes/${creado.id}/estado`).send({ estado: 'ARCHIVADO' });
      const res = await admin.patch(`/api/expedientes/${creado.id}`).send({ caratula: 'Intento' });
      expect(res.status).toBe(409);
    });

    it('registra la modificación en la auditoría', async () => {
      const admin = await comoAdmin(e);
      const { body: { data: creado } } = await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      await admin.patch(`/api/expedientes/${creado.id}`).send({ caratula: 'Cambio' });
      const evento = e.auditoria.find((a) => a.accion === 'expediente.modificar');
      expect(evento).toBeDefined();
    });
  });

  // ── Listado con búsqueda, filtros y paginación (S3-04) ─────────

  describe('listado con búsqueda, filtros y paginación (S3-04)', () => {
    async function crearVarios(admin: Awaited<ReturnType<typeof comoAdmin>>) {
      await admin.post('/api/expedientes').send({ ...EXPEDIENTE_VALIDO, caratula: 'Licencia anual', tipo: 'SOLICITUD' });
      await admin.post('/api/expedientes').send({ ...EXPEDIENTE_VALIDO, caratula: 'Nota interna', tipo: 'NOTA', iniciador: 'María López' });
      await admin.post('/api/expedientes').send({ ...EXPEDIENTE_VALIDO, caratula: 'Resolución 123', tipo: 'RESOLUCION', iniciador: 'Director General' });
    }

    it('lista todos los expedientes con paginación', async () => {
      const admin = await comoAdmin(e);
      await crearVarios(admin);
      const res = await admin.get('/api/expedientes');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.paginacion.total).toBe(3);
      expect(res.body.paginacion.pagina).toBe(1);
    });

    it('busca por texto en carátula', async () => {
      const admin = await comoAdmin(e);
      await crearVarios(admin);
      // "anual" solo aparece en una carátula ("licencia" también está en el asunto de los tres).
      const res = await admin.get('/api/expedientes?q=ANUAL');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].caratula).toBe('Licencia anual');
    });

    it('filtra por estado', async () => {
      const admin = await comoAdmin(e);
      await crearVarios(admin);
      // Cambiar uno a EN_TRAMITE
      const { body: { data: todos } } = await admin.get('/api/expedientes');
      await admin.post(`/api/expedientes/${todos[0].id}/estado`).send({ estado: 'EN_TRAMITE' });
      const res = await admin.get('/api/expedientes?estado=EN_TRAMITE');
      expect(res.body.data).toHaveLength(1);
    });

    it('filtra por prioridad', async () => {
      const admin = await comoAdmin(e);
      await admin.post('/api/expedientes').send({ ...EXPEDIENTE_VALIDO, prioridad: 'ALTA' });
      await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      const res = await admin.get('/api/expedientes?prioridad=ALTA');
      expect(res.body.data).toHaveLength(1);
    });

    it('pagina correctamente (porPagina=2)', async () => {
      const admin = await comoAdmin(e);
      await crearVarios(admin);
      const p1 = await admin.get('/api/expedientes?pagina=1&porPagina=2');
      expect(p1.body.data).toHaveLength(2);
      expect(p1.body.paginacion.totalPaginas).toBe(2);
      const p2 = await admin.get('/api/expedientes?pagina=2&porPagina=2');
      expect(p2.body.data).toHaveLength(1);
    });
  });

  // ── Número único (S3-05) ────────────────────────────────────────

  describe('número único (S3-05)', () => {
    it('todos los expedientes tienen número con formato EXP-AAAA-NNNNNN', async () => {
      const admin = await comoAdmin(e);
      await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      await admin.post('/api/expedientes').send({ ...EXPEDIENTE_VALIDO, caratula: 'Segundo' });
      const { body: { data: todos } } = await admin.get('/api/expedientes');
      for (const exp of todos) {
        expect(exp.numero).toMatch(/^EXP-\d{4}-\d{6}$/);
      }
      // Todos distintos
      const numeros = todos.map((e: { numero: string }) => e.numero);
      expect(new Set(numeros).size).toBe(numeros.length);
    });
  });

  // ── Validaciones compartidas (S3-06) ────────────────────────────

  describe('validaciones compartidas (S3-06)', () => {
    it('rechaza tipo de expediente inválido', async () => {
      const admin = await comoAdmin(e);
      const res = await admin.post('/api/expedientes').send({ ...EXPEDIENTE_VALIDO, tipo: 'INVALIDO' });
      expect(res.status).toBe(400);
    });

    it('rechaza prioridad inválida', async () => {
      const admin = await comoAdmin(e);
      const res = await admin.post('/api/expedientes').send({ ...EXPEDIENTE_VALIDO, prioridad: 'URGENTE' });
      expect(res.status).toBe(400);
    });

    it('rechaza campos extra en la modificación (.strict())', async () => {
      const admin = await comoAdmin(e);
      const { body: { data: creado } } = await admin.post('/api/expedientes').send(EXPEDIENTE_VALIDO);
      const res = await admin.patch(`/api/expedientes/${creado.id}`).send({ campoInventado: 'valor' });
      expect(res.status).toBe(400);
    });
  });
});
