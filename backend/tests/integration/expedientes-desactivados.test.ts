/**
 * Bajas de expedientes — CR-08.
 * El administrador desactiva (con motivo), reactiva o elimina expedientes. Un desactivado sale de
 * listas, indicadores, reportes y pendientes, y queda en solo lectura. Solo se elimina un
 * expediente sin actividad, porque el historial es de solo inserción (ADR-07).
 */
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
const MOTIVO = 'Duplicado de otro expediente';

describe('Bajas de expedientes (CR-08)', () => {
  let e: Entorno;
  let admin: Agente;
  let jefe: Agente; // Administración General (dependencia 1), sin expedientes.desactivar
  let expedienteId: number;

  async function sesion(usuario: string, password = PASSWORD_USUARIO) {
    const agente = request.agent(e.app);
    expect((await agente.post('/api/auth/login').send({ usuario, password })).status, `login ${usuario}`).toBe(200);
    return agente;
  }
  const ids = (res: request.Response) => res.body.data.map((x: { id: number }) => x.id);

  beforeEach(async () => {
    e = await crearEntorno();
    await e.agregarUsuario('jefe@institucion.test', PASSWORD_USUARIO, 'JEFE_DEPENDENCIA');
    admin = await sesion('admin', PASSWORD_ADMIN);
    jefe = await sesion('jefe');
    expedienteId = (await admin.post('/api/expedientes').send({ ...EXPEDIENTE, fechaVencimiento: new Date(Date.now() + DIA).toISOString() })).body.data.id;
  });

  describe('desactivar', () => {
    it('el administrador lo desactiva con motivo: sale de la lista y del dashboard y pasa a "desactivados"', async () => {
      const otro = (await admin.post('/api/expedientes').send(EXPEDIENTE)).body.data.id;

      const res = await admin.post(`/api/expedientes/${expedienteId}/desactivar`).send({ motivo: MOTIVO });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ activo: false, motivoDesactivacion: MOTIVO, desactivadoPor: { username: 'admin' } });
      expect(res.body.data.desactivadoEn).toBeTruthy();
      expect(ids(await admin.get('/api/expedientes'))).toEqual([otro]);
      expect(ids(await admin.get('/api/expedientes/desactivados'))).toEqual([expedienteId]);
      const dashboard = (await admin.get('/api/estadisticas/dashboard')).body.data;
      expect(dashboard.resumen.total).toBe(1);
      expect(dashboard.seguimiento.porVencer).toBe(0);
      expect(e.auditoria.at(-1)).toMatchObject({ accion: 'EXPEDIENTE_DESACTIVADO', entidadId: String(expedienteId), detalle: { motivo: MOTIVO } });
    });

    it('queda en solo lectura: se consulta, pero no se modifica ni se le agregan actuaciones (409)', async () => {
      await admin.post(`/api/expedientes/${expedienteId}/desactivar`).send({ motivo: MOTIVO });

      expect((await admin.get(`/api/expedientes/${expedienteId}`)).status).toBe(200);
      const cambio = await admin.patch(`/api/expedientes/${expedienteId}`).send({ caratula: 'Cambio' });
      expect(cambio.status).toBe(409);
      expect(cambio.body.error.message).toBe('No se puede modificar un expediente desactivado; primero hay que reactivarlo');
      expect((await admin.post(`/api/expedientes/${expedienteId}/actuaciones`).send({ tipo: 'ACTUACION', texto: 'Intento' })).status).toBe(409);
      expect((await admin.post(`/api/expedientes/${expedienteId}/estado`).send({ estado: 'EN_TRAMITE' })).status).toBe(409);
    });

    it('sus tareas abiertas no aparecen en los pendientes ni en el dashboard', async () => {
      const tarea = await admin
        .post(`/api/expedientes/${expedienteId}/tareas`)
        .send({ titulo: 'Revisar pedido', asignadoAId: e.funcionario.id, vencimiento: new Date(Date.now() + 2 * DIA).toISOString() });
      expect(tarea.status).toBe(201);
      const funcionario = await sesion('funcionario');
      expect((await funcionario.get('/api/pendientes')).body.data.tareas).toHaveLength(1);

      await admin.post(`/api/expedientes/${expedienteId}/desactivar`).send({ motivo: MOTIVO });

      const pendientes = (await funcionario.get('/api/pendientes')).body.data;
      expect(pendientes.tareas).toHaveLength(0);
      expect(pendientes.expedientesPorVencer).toHaveLength(0);
      expect((await admin.get('/api/estadisticas/dashboard')).body.data.seguimiento).toMatchObject({ tareasAbiertas: 0, tareasVencidas: 0 });
    });

    it('exige motivo (400), no se desactiva dos veces (409) ni en tránsito (409)', async () => {
      expect((await admin.post(`/api/expedientes/${expedienteId}/desactivar`).send({})).status).toBe(400);
      expect((await admin.post(`/api/expedientes/${expedienteId}/desactivar`).send({ motivo: 'no' })).status).toBe(400);

      await admin.post(`/api/expedientes/${expedienteId}/desactivar`).send({ motivo: MOTIVO });
      expect((await admin.post(`/api/expedientes/${expedienteId}/desactivar`).send({ motivo: MOTIVO })).status).toBe(409);

      const otro = (await admin.post('/api/expedientes').send(EXPEDIENTE)).body.data.id;
      expect((await admin.post(`/api/expedientes/${otro}/pases`).send({ destinoId: 2, motivo: 'Para su intervención' })).status).toBe(201);
      const enTransito = await admin.post(`/api/expedientes/${otro}/desactivar`).send({ motivo: MOTIVO });
      expect(enTransito.status).toBe(409);
      expect(enTransito.body.error.message).toContain('en tránsito');
    });

    it('sin el permiso expedientes.desactivar, un jefe recibe 403 en todas las rutas de bajas', async () => {
      expect((await jefe.get('/api/expedientes/desactivados')).status).toBe(403);
      expect((await jefe.post(`/api/expedientes/${expedienteId}/desactivar`).send({ motivo: MOTIVO })).status).toBe(403);
      expect((await jefe.post(`/api/expedientes/${expedienteId}/reactivar`)).status).toBe(403);
      expect((await jefe.delete(`/api/expedientes/${expedienteId}`)).status).toBe(403);
    });
  });

  describe('reactivar', () => {
    it('vuelve a la lista con sus datos de baja limpios, y queda auditado con el motivo anterior', async () => {
      await admin.post(`/api/expedientes/${expedienteId}/desactivar`).send({ motivo: MOTIVO });

      const res = await admin.post(`/api/expedientes/${expedienteId}/reactivar`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ activo: true, desactivadoEn: null, desactivadoPor: null, motivoDesactivacion: null });
      expect(ids(await admin.get('/api/expedientes'))).toContain(expedienteId);
      expect(ids(await admin.get('/api/expedientes/desactivados'))).toEqual([]);
      expect(e.auditoria.at(-1)).toMatchObject({ accion: 'EXPEDIENTE_REACTIVADO', detalle: { motivoDesactivacion: MOTIVO } });
      expect((await admin.patch(`/api/expedientes/${expedienteId}`).send({ caratula: 'Ya se puede modificar' })).status).toBe(200);
    });

    it('un expediente activo no se reactiva (409)', async () => {
      expect((await admin.post(`/api/expedientes/${expedienteId}/reactivar`)).status).toBe(409);
    });
  });

  describe('eliminar', () => {
    it('elimina un expediente sin actividad (activo o desactivado) y queda auditado', async () => {
      const res = await admin.delete(`/api/expedientes/${expedienteId}`);

      expect(res.status).toBe(204);
      expect((await admin.get(`/api/expedientes/${expedienteId}`)).status).toBe(404);
      expect(e.auditoria.at(-1)).toMatchObject({
        accion: 'EXPEDIENTE_ELIMINADO',
        entidadId: String(expedienteId),
        detalle: { caratula: EXPEDIENTE.caratula, estado: 'BORRADOR', activo: true },
      });

      const otro = (await admin.post('/api/expedientes').send(EXPEDIENTE)).body.data.id;
      await admin.post(`/api/expedientes/${otro}/desactivar`).send({ motivo: MOTIVO });
      expect((await admin.delete(`/api/expedientes/${otro}`)).status).toBe(204);
      expect(ids(await admin.get('/api/expedientes/desactivados'))).toEqual([]);
    });

    it('con actividad registrada no se elimina (409): hay que desactivarlo', async () => {
      await admin.post(`/api/expedientes/${expedienteId}/actuaciones`).send({ tipo: 'OBSERVACION', texto: 'Falta el presupuesto' });

      const res = await admin.delete(`/api/expedientes/${expedienteId}`);

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/desactívelo/);
      expect((await admin.get(`/api/expedientes/${expedienteId}`)).status).toBe(200);
    });

    it('un id inexistente responde 404', async () => {
      expect((await admin.delete('/api/expedientes/999')).status).toBe(404);
      expect((await admin.post('/api/expedientes/999/desactivar').send({ motivo: MOTIVO })).status).toBe(404);
    });
  });
});
