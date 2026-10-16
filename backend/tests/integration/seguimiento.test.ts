import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { crearEntorno, PASSWORD_ADMIN, PASSWORD_USUARIO } from '../support/memoria.js';

type Entorno = Awaited<ReturnType<typeof crearEntorno>>;
type Agente = ReturnType<typeof request.agent>;

const DIA = 24 * 60 * 60 * 1000;
const EXPEDIENTE = {
  caratula: 'Solicitud de equipamiento',
  asunto: 'Compra de equipos informáticos para la oficina',
  tipo: 'SOLICITUD',
  iniciador: 'Departamento de Informática',
};

describe('Tareas y seguimiento (Sprint 5: RF-12 a RF-17)', () => {
  let e: Entorno;
  let reloj: number;
  let admin: Agente;
  let funcionario: Agente; // Administración General (dependencia 1)
  let jefe: Agente; // Administración General
  let mesa: Agente; // Mesa de Entradas (dependencia 2)
  let expedienteId: number;

  async function sesion(usuario: string, password = PASSWORD_USUARIO) {
    const agente = request.agent(e.app);
    expect((await agente.post('/api/auth/login').send({ usuario, password })).status, `login ${usuario}`).toBe(200);
    return agente;
  }
  const enDias = (dias: number) => new Date(reloj + dias * DIA).toISOString();

  beforeEach(async () => {
    // El reloj parte de la hora real: la cookie de sesión vence según el reloj real del agente
    // de pruebas, y con una fecha fija pasada las pruebas fallarían al día siguiente (D-11).
    reloj = Date.now();
    e = await crearEntorno({ now: () => new Date(reloj) });
    await e.agregarUsuario('jefe@institucion.test', PASSWORD_USUARIO, 'JEFE_DEPENDENCIA');
    await e.agregarUsuario('mesa@institucion.test', PASSWORD_USUARIO, 'MESA_ENTRADAS', { dependenciaId: 2 });
    await e.agregarUsuario('func2@institucion.test', PASSWORD_USUARIO, 'FUNCIONARIO', { dependenciaId: 2 });
    await e.agregarUsuario('auditor@institucion.test', PASSWORD_USUARIO, 'AUDITOR');
    admin = await sesion('admin', PASSWORD_ADMIN);
    funcionario = await sesion('funcionario');
    jefe = await sesion('jefe');
    mesa = await sesion('mesa');
    const creado = await admin.post('/api/expedientes').send(EXPEDIENTE);
    expect(creado.status, JSON.stringify(creado.body)).toBe(201);
    expedienteId = creado.body.data.id; // queda en la dependencia 1
  });

  it('sin sesión, las rutas nuevas responden 401', async () => {
    for (const [metodo, ruta] of [
      ['post', `/api/expedientes/${expedienteId}/estado`],
      ['post', `/api/expedientes/${expedienteId}/responsable`],
      ['post', `/api/expedientes/${expedienteId}/pases`],
      ['get', `/api/expedientes/${expedienteId}/tareas`],
      ['post', `/api/expedientes/${expedienteId}/tareas`],
      ['get', '/api/pendientes'],
      ['get', '/api/pases/recibidos'],
      ['post', '/api/pases/1/recepcion'],
      ['patch', '/api/tareas/1'],
      ['get', '/api/dependencias/1/usuarios'],
    ] as const) {
      expect((await request(e.app)[metodo](ruta).send({})).status, `${metodo} ${ruta}`).toBe(401);
    }
  });

  // ── S5-03: cambiar estado ───────────────────────────────────────

  describe('cambiar estado (S5-03, RF-14)', () => {
    it('cambia el estado con motivo y lo muestra en el historial', async () => {
      const res = await funcionario.post(`/api/expedientes/${expedienteId}/estado`).send({ estado: 'EN_TRAMITE', motivo: 'Documentación completa' });
      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('EN_TRAMITE');
      const historial = (await funcionario.get(`/api/expedientes/${expedienteId}/historial`)).body.data;
      expect(historial[1]).toMatchObject({ tipo: 'CAMBIO_ESTADO', descripcion: 'Estado: BORRADOR → EN_TRAMITE (Documentación completa)' });
      expect(e.auditoria.some((a) => a.accion === 'expediente.cambiar_estado')).toBe(true);
    });

    it('sin el permiso estados.cambiar responde 403 y una transición inválida 409', async () => {
      const auditor = await sesion('auditor');
      expect((await auditor.post(`/api/expedientes/${expedienteId}/estado`).send({ estado: 'EN_TRAMITE' })).status).toBe(403);
      const res = await funcionario.post(`/api/expedientes/${expedienteId}/estado`).send({ estado: 'RESUELTO' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  // ── S5-01: responsable ──────────────────────────────────────────

  describe('asignar responsable (S5-01, RF-12)', () => {
    it('el jefe asigna un responsable de la dependencia y queda en el historial; null lo quita', async () => {
      const res = await jefe.post(`/api/expedientes/${expedienteId}/responsable`).send({ responsableId: e.funcionario.id });
      expect(res.status).toBe(200);
      expect(res.body.data.responsable.username).toBe('funcionario');
      const quitar = await jefe.post(`/api/expedientes/${expedienteId}/responsable`).send({ responsableId: null });
      expect(quitar.body.data.responsable).toBeNull();
      const tipos = (await jefe.get(`/api/expedientes/${expedienteId}/historial`)).body.data.map((ev: { descripcion: string; tipo: string }) => ev.descripcion);
      expect(tipos).toContain('Responsable asignado: funcionario');
      expect(tipos).toContain('Se quitó el responsable');
    });

    it('sin responsables.asignar responde 403; un usuario de otra dependencia o inexistente da 400', async () => {
      expect((await funcionario.post(`/api/expedientes/${expedienteId}/responsable`).send({ responsableId: e.funcionario.id })).status).toBe(403);
      const otraDependencia = (await e.repos.usuarios.findByUsername('func2'))!.id;
      const res = await jefe.post(`/api/expedientes/${expedienteId}/responsable`).send({ responsableId: otraDependencia });
      expect(res.status).toBe(400);
      expect(res.body.error.details[0].field).toBe('responsableId');
      expect((await jefe.post(`/api/expedientes/${expedienteId}/responsable`).send({ responsableId: 999 })).status).toBe(400);
    });
  });

  // ── S5-02: tareas ───────────────────────────────────────────────

  describe('tareas y vencimientos (S5-02, RF-13)', () => {
    const tarea = (extra: object = {}) => ({ titulo: 'Pedir presupuestos', asignadoAId: 0, vencimiento: '', ...extra });

    it('crea una tarea con responsable y vencimiento, la lista y registra auditoría', async () => {
      const res = await funcionario
        .post(`/api/expedientes/${expedienteId}/tareas`)
        .send(tarea({ asignadoAId: e.funcionario.id, vencimiento: enDias(5), descripcion: 'Tres proveedores' }));
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ titulo: 'Pedir presupuestos', estado: 'PENDIENTE', asignadoA: { username: 'funcionario' }, cerradaEn: null });
      expect((await funcionario.get(`/api/expedientes/${expedienteId}/tareas`)).body.data).toHaveLength(1);
      expect(e.auditoria.some((a) => a.accion === 'tarea.crear')).toBe(true);
    });

    it('rechaza una tarea sin vencimiento, con vencimiento pasado o asignada a otra dependencia (400)', async () => {
      const ruta = `/api/expedientes/${expedienteId}/tareas`;
      expect((await funcionario.post(ruta).send({ titulo: 'Sin fecha', asignadoAId: e.funcionario.id })).status).toBe(400);
      const pasada = await funcionario.post(ruta).send(tarea({ asignadoAId: e.funcionario.id, vencimiento: enDias(-1) }));
      expect(pasada.status).toBe(400);
      expect(pasada.body.error.details[0].field).toBe('vencimiento');
      const otra = (await e.repos.usuarios.findByUsername('func2'))!.id;
      expect((await funcionario.post(ruta).send(tarea({ asignadoAId: otra, vencimiento: enDias(2) }))).status).toBe(400);
    });

    it('quien la tiene avanza la tarea hasta completarla; una tarea cerrada no cambia más (409)', async () => {
      const { body } = await jefe
        .post(`/api/expedientes/${expedienteId}/tareas`)
        .send(tarea({ asignadoAId: e.funcionario.id, vencimiento: enDias(2) }));
      const id = body.data.id;
      expect((await funcionario.patch(`/api/tareas/${id}`).send({ estado: 'EN_CURSO' })).body.data.estado).toBe('EN_CURSO');
      const completada = await funcionario.patch(`/api/tareas/${id}`).send({ estado: 'COMPLETADA' });
      expect(completada.body.data.estado).toBe('COMPLETADA');
      expect(completada.body.data.cerradaEn).toBeTruthy();
      expect((await funcionario.patch(`/api/tareas/${id}`).send({ estado: 'PENDIENTE' })).status).toBe(409);
    });

    it('un usuario ajeno a la tarea no puede cambiarla (403)', async () => {
      const { body } = await jefe
        .post(`/api/expedientes/${expedienteId}/tareas`)
        .send(tarea({ asignadoAId: e.funcionario.id, vencimiento: enDias(2) }));
      const ajeno = await sesion('func2');
      expect((await ajeno.patch(`/api/tareas/${body.data.id}`).send({ estado: 'COMPLETADA' })).status).toBe(403);
      expect((await mesa.patch(`/api/tareas/${body.data.id}`).send({ estado: 'COMPLETADA' })).status).toBe(403); // sin tareas.gestionar
    });

    it('lista los usuarios de una dependencia para asignar (requiere tareas.gestionar o responsables.asignar)', async () => {
      const res = await jefe.get('/api/dependencias/1/usuarios');
      expect(res.status).toBe(200);
      expect(res.body.data.map((u: { username: string }) => u.username)).toEqual(expect.arrayContaining(['admin', 'funcionario', 'jefe']));
      expect(res.body.data[0].passwordHash).toBeUndefined();
      expect((await (await sesion('auditor')).get('/api/dependencias/1/usuarios')).status).toBe(403);
    });
  });

  // ── S5-04 / S5-05: pases ────────────────────────────────────────

  describe('enviar y recibir expedientes (S5-04, S5-05, RF-15, RF-16)', () => {
    async function enviar(agente: Agente = funcionario, destinoId = 2) {
      return agente.post(`/api/expedientes/${expedienteId}/pases`).send({ destinoId, motivo: 'Para su intervención' });
    }

    it('envía: el borrador queda en trámite y el expediente en tránsito, sin poder modificarse', async () => {
      const res = await enviar();
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ origen: { codigo: 'ADM' }, destino: { codigo: 'MESA' }, recibidoEn: null });

      const exp = (await funcionario.get(`/api/expedientes/${expedienteId}`)).body.data;
      expect(exp.estado).toBe('EN_TRAMITE');
      expect(exp.paseEnTransito.destino.nombre).toBe('Mesa de Entradas');
      expect(exp.dependenciaActualId).toBe(1);

      const bloqueado = await funcionario.patch(`/api/expedientes/${expedienteId}`).send({ caratula: 'Cambio' });
      expect(bloqueado.status).toBe(409);
      expect(bloqueado.body.error.message).toContain('en tránsito');
      expect((await funcionario.post(`/api/expedientes/${expedienteId}/actuaciones`).send({ tipo: 'ACTUACION', texto: 'Intento en tránsito' })).status).toBe(409);
      expect((await enviar()).status).toBe(409); // ya está en tránsito
    });

    it('valida el destino (400) y que envíe la dependencia que lo tiene (403)', async () => {
      expect((await enviar(funcionario, 1)).status).toBe(400); // misma dependencia
      expect((await enviar(funcionario, 3)).status).toBe(400); // dependencia inactiva
      expect((await enviar(funcionario, 99)).status).toBe(400);
      const sinMotivo = await funcionario.post(`/api/expedientes/${expedienteId}/pases`).send({ destinoId: 2 });
      expect(sinMotivo.status).toBe(400);
      const otra = await sesion('func2'); // otra dependencia: ni siquiera lo ve
      expect((await enviar(otra, 1)).status).toBe(403);
    });

    it('la dependencia destino lo ve en su bandeja, lo consulta y confirma la recepción', async () => {
      await enviar();
      const bandeja = await mesa.get('/api/pases/recibidos');
      expect(bandeja.body.data).toHaveLength(1);
      expect(bandeja.body.data[0].expediente.id).toBe(expedienteId);
      expect((await mesa.get(`/api/expedientes/${expedienteId}`)).status).toBe(200); // lo ve antes de recibirlo

      const paseId = bandeja.body.data[0].id;
      expect((await funcionario.post(`/api/pases/${paseId}/recepcion`)).status).toBe(403); // el origen no puede recibir
      const recibido = await mesa.post(`/api/pases/${paseId}/recepcion`);
      expect(recibido.status).toBe(200);
      expect(recibido.body.data.recibidoPor.username).toBe('mesa');
      expect((await mesa.post(`/api/pases/${paseId}/recepcion`)).status).toBe(409); // no se recibe dos veces

      const exp = (await mesa.get(`/api/expedientes/${expedienteId}`)).body.data;
      expect(exp).toMatchObject({ dependenciaActualId: 2, paseEnTransito: null, responsable: null });
      expect((await funcionario.get(`/api/expedientes/${expedienteId}`)).status).toBe(403); // ya no es de su dependencia
      expect((await mesa.get('/api/pases/recibidos')).body.data).toHaveLength(0);

      const historial = (await mesa.get(`/api/expedientes/${expedienteId}/historial`)).body.data as { tipo: string; descripcion: string }[];
      expect(historial.map((ev) => ev.tipo)).toEqual(['CREACION', 'PASE_ENVIADO', 'CAMBIO_ESTADO', 'PASE_RECIBIDO']);
      expect(historial[0]!.descripcion).toContain('Administración General');
      expect(e.auditoria.filter((a) => ['expediente.enviar', 'expediente.recibir'].includes(a.accion))).toHaveLength(2);
    });

    it('al recibirlo se quita el responsable anterior (la nueva dependencia asigna el suyo)', async () => {
      await jefe.post(`/api/expedientes/${expedienteId}/responsable`).send({ responsableId: e.funcionario.id });
      await enviar();
      const paseId = (await mesa.get('/api/pases/recibidos')).body.data[0].id;
      await mesa.post(`/api/pases/${paseId}/recepcion`);
      expect((await mesa.get(`/api/expedientes/${expedienteId}`)).body.data.responsable).toBeNull();
    });
  });

  // ── Pendientes y alertas ────────────────────────────────────────

  describe('pendientes y alertas (RF-17)', () => {
    it('muestra mis tareas abiertas con su alerta y la cambia al pasar el tiempo', async () => {
      await jefe.post(`/api/expedientes/${expedienteId}/tareas`).send({ titulo: 'Urgente', asignadoAId: e.funcionario.id, vencimiento: enDias(1) });
      await jefe.post(`/api/expedientes/${expedienteId}/tareas`).send({ titulo: 'Con tiempo', asignadoAId: e.funcionario.id, vencimiento: enDias(10) });

      let tareas = (await funcionario.get('/api/pendientes')).body.data.tareas as { titulo: string; alerta: string | null }[];
      expect(tareas.map((t) => [t.titulo, t.alerta])).toEqual([['Urgente', 'POR_VENCER'], ['Con tiempo', null]]);

      reloj += 2 * DIA;
      funcionario = await sesion('funcionario'); // la sesión anterior (8 h) venció al adelantar el reloj
      tareas = (await funcionario.get('/api/pendientes')).body.data.tareas;
      expect(tareas[0]).toMatchObject({ titulo: 'Urgente', alerta: 'VENCIDA' });
    });

    it('incluye los expedientes recibidos sin confirmar y los de la dependencia por vencer', async () => {
      await admin.patch(`/api/expedientes/${expedienteId}`).send({ fechaVencimiento: enDias(2) });
      expect((await funcionario.get('/api/pendientes')).body.data.expedientesPorVencer[0]).toMatchObject({ id: expedienteId, alerta: 'POR_VENCER' });

      await funcionario.post(`/api/expedientes/${expedienteId}/pases`).send({ destinoId: 2, motivo: 'Para su intervención' });
      const pendientesMesa = (await mesa.get('/api/pendientes')).body.data;
      expect(pendientesMesa.recibidos).toHaveLength(1);
      expect(pendientesMesa.tareas).toEqual([]);
    });
  });
});
