import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { celdaCsv } from '../../src/modules/reportes/reportes.service.js';
import { crearEntorno, PASSWORD_ADMIN, PASSWORD_USUARIO } from '../support/memoria.js';

type Entorno = Awaited<ReturnType<typeof crearEntorno>>;
type Agente = ReturnType<typeof request.agent>;

const DIA = 24 * 60 * 60 * 1000;
const base = {
  asunto: 'Asunto de prueba para el Sprint 6',
  iniciador: 'Dirección de pruebas',
};
const dos = (n: number) => String(n).padStart(2, '0');
/** AAAA-MM-DD en hora local, como lo envía el formulario de reportes. */
const fechaLocal = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

describe('Sprint 6: notificaciones, dashboard y reportes (RF-17 a RF-19)', () => {
  let e: Entorno;
  let reloj: number;
  let admin: Agente;
  let funcionario: Agente; // Administración General (dependencia 1)
  let jefe: Agente; // Administración General
  let mesa: Agente; // Mesa de Entradas (dependencia 2)
  let auditor: Agente; // Administración General, ve todas las dependencias
  let ids: Record<string, number>;

  async function sesion(usuario: string, password = PASSWORD_USUARIO) {
    const agente = request.agent(e.app);
    expect((await agente.post('/api/auth/login').send({ usuario, password })).status, `login ${usuario}`).toBe(200);
    return agente;
  }
  const enDias = (dias: number) => new Date(reloj + dias * DIA).toISOString();
  const usuarioId = async (username: string) => (await e.repos.usuarios.findByUsername(username))!.id;

  beforeEach(async () => {
    reloj = Date.parse('2026-10-16T12:00:00.000Z');
    e = await crearEntorno({ now: () => new Date(reloj) });
    await e.agregarUsuario('jefe@institucion.test', PASSWORD_USUARIO, 'JEFE_DEPENDENCIA');
    await e.agregarUsuario('mesa@institucion.test', PASSWORD_USUARIO, 'MESA_ENTRADAS', { dependenciaId: 2 });
    await e.agregarUsuario('func2@institucion.test', PASSWORD_USUARIO, 'FUNCIONARIO', { dependenciaId: 2 });
    await e.agregarUsuario('auditor@institucion.test', PASSWORD_USUARIO, 'AUDITOR');
    admin = await sesion('admin', PASSWORD_ADMIN);
    funcionario = await sesion('funcionario');
    jefe = await sesion('jefe');
    mesa = await sesion('mesa');
    auditor = await sesion('auditor');

    // Datos: 3 expedientes en Administración (1) y 2 en Mesa de Entradas (2).
    const crear = async (agente: Agente, datos: object) => (await agente.post('/api/expedientes').send({ ...base, ...datos })).body.data.id as number;
    ids = {
      vencido: await crear(admin, { caratula: 'Nota vencida', tipo: 'NOTA', prioridad: 'ALTA', fechaVencimiento: enDias(-2) }),
      porVencer: await crear(admin, { caratula: 'Informe por vencer', tipo: 'INFORME', fechaVencimiento: enDias(1) }),
      lejano: await crear(admin, { caratula: 'Solicitud sin apuro', tipo: 'SOLICITUD', prioridad: 'BAJA', fechaVencimiento: enDias(30) }),
      mesa1: await crear(mesa, { caratula: 'Reclamo de mesa', tipo: 'RECLAMO', prioridad: 'ALTA' }),
      mesa2: await crear(mesa, { caratula: '=SUMA(A1:A2) carátula con fórmula', tipo: 'NOTA' }),
    };
  });

  it('sin sesión, las rutas nuevas responden 401', async () => {
    for (const [metodo, ruta] of [
      ['get', '/api/estadisticas/dashboard'],
      ['get', '/api/reportes/expedientes'],
      ['get', '/api/reportes/expedientes/exportar'],
      ['get', '/api/notificaciones'],
      ['post', '/api/notificaciones/leidas'],
      ['post', '/api/notificaciones/1/leida'],
    ] as const) {
      expect((await request(e.app)[metodo](ruta)).status, `${metodo} ${ruta}`).toBe(401);
    }
  });

  // ── S5-06: notificaciones ───────────────────────────────────────

  describe('notificaciones internas (S5-06, RF-17)', () => {
    it('avisa al responsable asignado, pero no a quien hizo la acción', async () => {
      await jefe.post(`/api/expedientes/${ids.vencido}/responsable`).send({ responsableId: e.funcionario.id });
      const res = await funcionario.get('/api/notificaciones');
      expect(res.status).toBe(200);
      expect(res.body.data.noLeidas).toBe(1);
      expect(res.body.data.items[0]).toMatchObject({
        tipo: 'EXPEDIENTE_ASIGNADO',
        expediente: { id: ids.vencido },
        leidaEn: null,
      });
      expect(res.body.data.items[0].mensaje).toContain('Nota vencida');
      expect((await jefe.get('/api/notificaciones')).body.data.noLeidas).toBe(0);
    });

    it('avisa la tarea nueva a quien se le asigna', async () => {
      await jefe.post(`/api/expedientes/${ids.lejano}/tareas`).send({ titulo: 'Revisar anexos', asignadoAId: e.funcionario.id, vencimiento: enDias(3) });
      const { items } = (await funcionario.get('/api/notificaciones')).body.data;
      expect(items).toHaveLength(1);
      expect(items[0].tipo).toBe('TAREA_ASIGNADA');
      expect(items[0].mensaje).toMatch(/Revisar anexos \(vence el \d{2}\/\d{2}\/\d{4}\)/);
    });

    it('un pase avisa a quienes pueden recibir en la dependencia destino', async () => {
      await jefe.post(`/api/expedientes/${ids.lejano}/pases`).send({ destinoId: 2, motivo: 'Para registro' });
      const paraMesa = (await mesa.get('/api/notificaciones')).body.data.items;
      expect(paraMesa).toHaveLength(1);
      expect(paraMesa[0]).toMatchObject({ tipo: 'PASE_ENTRANTE', expediente: { id: ids.lejano } });
      expect(paraMesa[0].mensaje).toContain('Administración General');
      const func2 = await sesion('func2');
      expect((await func2.get('/api/notificaciones')).body.data.noLeidas).toBe(1);
      // Usuarios de otra dependencia no reciben el aviso.
      expect((await funcionario.get('/api/notificaciones')).body.data.noLeidas).toBe(0);
      expect((await auditor.get('/api/notificaciones')).body.data.noLeidas).toBe(0);
    });

    it('cada uno marca solo sus avisos: el de otro usuario responde 404', async () => {
      await jefe.post(`/api/expedientes/${ids.vencido}/responsable`).send({ responsableId: e.funcionario.id });
      await jefe.post(`/api/expedientes/${ids.lejano}/tareas`).send({ titulo: 'Tarea dos', asignadoAId: e.funcionario.id, vencimiento: enDias(3) });
      const { items } = (await funcionario.get('/api/notificaciones')).body.data;
      expect(items).toHaveLength(2);

      expect((await jefe.post(`/api/notificaciones/${items[0].id}/leida`)).status).toBe(404);
      expect((await funcionario.post('/api/notificaciones/999/leida')).status).toBe(404);

      expect((await funcionario.post(`/api/notificaciones/${items[0].id}/leida`)).status).toBe(200);
      const despues = (await funcionario.get('/api/notificaciones')).body.data;
      expect(despues.noLeidas).toBe(1);
      expect((await funcionario.get('/api/notificaciones?soloNoLeidas=true')).body.data.items).toHaveLength(1);

      expect((await funcionario.post('/api/notificaciones/leidas')).body.data.marcadas).toBe(1);
      expect((await funcionario.get('/api/notificaciones')).body.data.noLeidas).toBe(0);
    });
  });

  // ── S6-01: dashboard ────────────────────────────────────────────

  describe('dashboard (S6-01, RF-18)', () => {
    it('quien puede ver todas las dependencias ve los números de la institución', async () => {
      const res = await auditor.get('/api/estadisticas/dashboard');
      expect(res.status).toBe(200);
      const d = res.body.data;
      expect(d.alcance).toEqual({ tipo: 'INSTITUCION' });
      expect(d.resumen.total).toBe(5);
      expect(d.resumen.porEstado.BORRADOR).toBe(5);
      expect(d.resumen.porPrioridad).toEqual({ BAJA: 1, MEDIA: 2, ALTA: 2 });
      expect(d.resumen.porDependencia).toEqual([
        { dependencia: { id: 1, codigo: 'ADM', nombre: 'Administración General' }, total: 3 },
        { dependencia: { id: 2, codigo: 'MESA', nombre: 'Mesa de Entradas' }, total: 2 },
      ]);
      expect(d.resumen.porTipo[0]).toEqual({ tipo: 'NOTA', total: 2 });
      expect(d.seguimiento).toMatchObject({ vencidos: 1, porVencer: 1, enTransito: 0, porRecibir: 0 });
    });

    it('un funcionario solo ve su dependencia', async () => {
      const d = (await mesa.get('/api/estadisticas/dashboard')).body.data;
      expect(d.alcance).toEqual({ tipo: 'DEPENDENCIA', dependencia: { id: 2, codigo: 'MESA', nombre: 'Mesa de Entradas' } });
      expect(d.resumen.total).toBe(2);
      expect(d.resumen.porDependencia).toHaveLength(1);
      expect(d.seguimiento.vencidos).toBe(0);
    });

    it('cuenta tránsitos, pases por recibir y tareas vencidas', async () => {
      await jefe.post(`/api/expedientes/${ids.lejano}/pases`).send({ destinoId: 2, motivo: 'Para registro' });
      await jefe.post(`/api/expedientes/${ids.porVencer}/tareas`).send({ titulo: 'Tarea a vencer', asignadoAId: e.funcionario.id, vencimiento: enDias(1) });
      await jefe.post(`/api/expedientes/${ids.porVencer}/tareas`).send({ titulo: 'Tarea al día', asignadoAId: e.funcionario.id, vencimiento: enDias(5) });
      e.tareas[0]!.vencimiento = new Date(reloj - DIA); // la primera ya venció

      const adm = (await jefe.get('/api/estadisticas/dashboard')).body.data.seguimiento;
      expect(adm).toMatchObject({ enTransito: 1, porRecibir: 0, tareasAbiertas: 2, tareasVencidas: 1 });
      const deMesa = (await mesa.get('/api/estadisticas/dashboard')).body.data.seguimiento;
      expect(deMesa).toMatchObject({ enTransito: 0, porRecibir: 1, tareasAbiertas: 0 });
    });

    it('un resuelto o archivado no cuenta como vencido', async () => {
      await jefe.post(`/api/expedientes/${ids.vencido}/estado`).send({ estado: 'EN_TRAMITE' });
      await jefe.post(`/api/expedientes/${ids.vencido}/estado`).send({ estado: 'RESUELTO' });
      const d = (await jefe.get('/api/estadisticas/dashboard')).body.data;
      expect(d.seguimiento.vencidos).toBe(0);
      expect(d.resumen.porEstado).toMatchObject({ RESUELTO: 1, BORRADOR: 2 });
    });
  });

  // ── S6-02: reportes ─────────────────────────────────────────────

  describe('reportes con filtros (S6-02, RF-19)', () => {
    it('sin reportes.consultar responde 403', async () => {
      expect((await funcionario.get('/api/reportes/expedientes')).status).toBe(403);
      expect((await mesa.get('/api/reportes/expedientes/exportar')).status).toBe(403);
    });

    it('el jefe ve el reporte de su dependencia con resumen y listado coherentes', async () => {
      const res = await jefe.get('/api/reportes/expedientes?prioridad=ALTA');
      expect(res.status).toBe(200);
      const r = res.body.data;
      expect(r.total).toBe(1);
      expect(r.resumen.total).toBe(r.total);
      expect(r.items.map((x: { caratula: string }) => x.caratula)).toEqual(['Nota vencida']);
      // Otra dependencia: 403.
      expect((await jefe.get('/api/reportes/expedientes?dependenciaId=2')).status).toBe(403);
    });

    it('el auditor elige la dependencia; filtra por tipo y pagina', async () => {
      const r = (await auditor.get('/api/reportes/expedientes?dependenciaId=2&tipo=NOTA')).body.data;
      expect(r.total).toBe(1);
      expect(r.items[0].id).toBe(ids.mesa2);
      const pagina = (await auditor.get('/api/reportes/expedientes?porPagina=2&pagina=2')).body.data;
      expect(pagina).toMatchObject({ total: 5, pagina: 2, porPagina: 2 });
      expect(pagina.items).toHaveLength(2);
      expect(pagina.resumen.total).toBe(5);
    });

    it('filtra por fecha de creación y valida el rango', async () => {
      const hoy = fechaLocal(new Date());
      const manana = fechaLocal(new Date(Date.now() + DIA));
      expect((await auditor.get(`/api/reportes/expedientes?desde=${hoy}&hasta=${hoy}`)).body.data.total).toBe(5);
      expect((await auditor.get(`/api/reportes/expedientes?desde=${manana}`)).body.data.total).toBe(0);
      const invertido = await auditor.get(`/api/reportes/expedientes?desde=${manana}&hasta=${hoy}`);
      expect(invertido.status).toBe(400);
      expect(invertido.body.error.details[0].field).toBe('hasta');
      expect((await auditor.get('/api/reportes/expedientes?desde=16/10/2026')).status).toBe(400);
      expect((await auditor.get('/api/reportes/expedientes?estado=CUALQUIERA')).status).toBe(400);
    });
  });

  // ── S6-03: exportar ─────────────────────────────────────────────

  describe('exportar reportes (S6-03)', () => {
    it('descarga un CSV para Excel con los mismos filtros y lo registra en la auditoría', async () => {
      const res = await auditor.get('/api/reportes/expedientes/exportar?dependenciaId=2');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toMatch(/attachment; filename="reporte-expedientes-\d{8}\.csv"/);
      const texto = res.text;
      expect(texto.charCodeAt(0)).toBe(0xfeff);
      const lineas = texto.slice(1).trim().split('\r\n');
      expect(lineas[0]).toBe('Número;Carátula;Tipo;Iniciador;Estado;Prioridad;Dependencia actual;Responsable;Creado;Vencimiento;En tránsito hacia');
      expect(lineas).toHaveLength(3);
      // La carátula que empieza con "=" no se exporta como fórmula.
      expect(texto).toContain(";'=SUMA(A1:A2) carátula con fórmula;");
      const evento = e.auditoria.find((a) => a.accion === 'reporte.exportar');
      expect(evento).toMatchObject({ usuarioId: await usuarioId('auditor'), resultado: 'EXITO' });
      expect(evento!.detalle).toMatchObject({ dependenciaId: 2, filas: 2, formato: 'CSV' });
    });

    it('escapa comillas, punto y coma y saltos de línea', () => {
      expect(celdaCsv('Texto simple')).toBe('Texto simple');
      expect(celdaCsv('Uno; dos')).toBe('"Uno; dos"');
      expect(celdaCsv('Dijo "hola"')).toBe('"Dijo ""hola"""');
      expect(celdaCsv('-10')).toBe("'-10");
      expect(celdaCsv(null)).toBe('');
    });
  });
});
