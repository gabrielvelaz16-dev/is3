import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { crearEntorno, PASSWORD_ADMIN, PASSWORD_USUARIO } from '../support/memoria.js';

type Entorno = Awaited<ReturnType<typeof crearEntorno>>;

async function comoAdmin(e: Entorno) {
  const agente = request.agent(e.app);
  await agente.post('/api/auth/login').send({ usuario: 'admin', password: PASSWORD_ADMIN });
  return agente;
}

describe('Gestión de usuarios y roles (RF-02, RF-03, S2-03, S2-05)', () => {
  let e: Entorno;
  beforeEach(async () => {
    e = await crearEntorno();
  });

  describe('autorización en el servidor', () => {
    it('sin sesión, todas las rutas de usuarios responden 401', async () => {
      for (const [metodo, ruta] of [['get', '/api/usuarios'], ['post', '/api/usuarios'], ['patch', '/api/usuarios/1'], ['delete', '/api/usuarios/1'], ['get', '/api/roles']] as const) {
        expect((await request(e.app)[metodo](ruta)).status, `${metodo} ${ruta}`).toBe(401);
      }
    });

    it('un funcionario (sin permiso usuarios.gestionar) recibe 403 en todas las rutas de usuarios', async () => {
      const agente = request.agent(e.app);
      await agente.post('/api/auth/login').send({ usuario: 'funcionario', password: PASSWORD_USUARIO });

      for (const [metodo, ruta] of [['get', '/api/usuarios'], ['post', '/api/usuarios'], ['patch', '/api/usuarios/1'], ['delete', '/api/usuarios/1'], ['get', '/api/roles']] as const) {
        const res = await agente[metodo](ruta).send({});
        expect(res.status, `${metodo} ${ruta}`).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
      }
    });

    it('el administrador tiene todos los permisos del catálogo', async () => {
      const admin = await comoAdmin(e);
      const me = await admin.get('/api/auth/me');
      const roles = await admin.get('/api/roles');
      const rolAdmin = roles.body.data.find((r: { clave: string }) => r.clave === 'ADMINISTRADOR');

      expect(me.body.data.usuario.permisos).toEqual(rolAdmin.permisos);
      expect(rolAdmin.permisos.length).toBeGreaterThanOrEqual(17);
    });
  });

  describe('crear usuarios', () => {
    it('el administrador crea un usuario con rol y dependencia, y queda auditado', async () => {
      const admin = await comoAdmin(e);
      const res = await admin.post('/api/usuarios').send({
        username: 'Ana.Perez',
        email: 'Nuevo@Institucion.test',
        nombre: 'Ana Pérez',
        password: 'Segura12345',
        rolId: e.rolId('MESA_ENTRADAS'),
        dependenciaId: 2,
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ username: 'ana.perez', email: 'nuevo@institucion.test', rol: { clave: 'MESA_ENTRADAS' }, dependencia: { codigo: 'MESA' }, activo: true });
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(e.auditoria.at(-1)).toMatchObject({ accion: 'USUARIO_CREADO', usuarioId: e.admin.id, entidadId: String(res.body.data.id) });
      expect(JSON.stringify(e.auditoria)).not.toContain('Segura12345');

      // El usuario nuevo puede iniciar sesión con su rol.
      const login = await request(e.app).post('/api/auth/login').send({ usuario: 'ana.perez', password: 'Segura12345' });
      expect(login.body.data.usuario.permisos).toContain('expedientes.crear');
      expect(login.body.data.usuario.permisos).not.toContain('usuarios.gestionar');
    });

    it('rechaza un nombre de usuario o un correo repetido (409)', async () => {
      const admin = await comoAdmin(e);
      const base = { nombre: 'Otro Usuario', password: '12345', rolId: 1, dependenciaId: 1 };
      const usuarioRepetido = await admin.post('/api/usuarios').send({ ...base, username: 'funcionario', email: 'otro@institucion.test' });
      const correoRepetido = await admin.post('/api/usuarios').send({ ...base, username: 'otro', email: 'funcionario@institucion.test' });

      expect(usuarioRepetido.status).toBe(409);
      expect(usuarioRepetido.body.error.message).toMatch(/nombre de usuario/);
      expect(correoRepetido.status).toBe(409);
    });

    it('valida datos: usuario, correo, contraseña corta, rol o dependencia inexistente o inactiva (400)', async () => {
      const admin = await comoAdmin(e);
      const base = { username: 'usuariox', email: 'x@institucion.test', nombre: 'Usuario X', password: '12345', rolId: 1, dependenciaId: 1 };
      const casos: [Record<string, unknown>, string][] = [
        [{ ...base, username: 'ab' }, 'username'],
        [{ ...base, username: 'con espacios' }, 'username'],
        [{ ...base, email: 'no-es-correo' }, 'email'],
        [{ ...base, password: '1234' }, 'password'],
        [{ ...base, rolId: 999 }, 'rolId'],
        [{ ...base, dependenciaId: 3 }, 'dependenciaId'],
        [{ ...base, nombre: 'A' }, 'nombre'],
      ];
      for (const [cuerpo, campo] of casos) {
        const res = await admin.post('/api/usuarios').send(cuerpo);
        expect(res.status, campo).toBe(400);
        expect(res.body.error.details.map((d: { field: string }) => d.field), campo).toContain(campo);
      }
    });
  });

  describe('listar y modificar', () => {
    it('lista con búsqueda y paginación', async () => {
      const admin = await comoAdmin(e);
      const todos = await admin.get('/api/usuarios');
      const filtrados = await admin.get('/api/usuarios').query({ q: 'funcio', page: 1, pageSize: 1 });

      expect(todos.body.meta.total).toBe(2);
      expect(filtrados.body.data).toHaveLength(1);
      expect(filtrados.body.data[0].email).toBe('funcionario@institucion.test');
      expect(filtrados.body.meta).toEqual({ page: 1, pageSize: 1, total: 1 });
    });

    it('cambia el rol de un usuario y el cambio se aplica en su próxima petición', async () => {
      const admin = await comoAdmin(e);
      const funcionario = request.agent(e.app);
      await funcionario.post('/api/auth/login').send({ usuario: 'funcionario', password: PASSWORD_USUARIO });
      expect((await funcionario.get('/api/usuarios')).status).toBe(403);

      const res = await admin.patch(`/api/usuarios/${e.funcionario.id}`).send({ rolId: e.rolId('ADMINISTRADOR') });
      expect(res.status).toBe(200);
      expect(e.auditoria.at(-1)?.detalle).toMatchObject({ rol: { antes: 'FUNCIONARIO', despues: 'ADMINISTRADOR' } });

      expect((await funcionario.get('/api/usuarios')).status).toBe(200);
    });

    it('al desactivar un usuario se cierran sus sesiones', async () => {
      const admin = await comoAdmin(e);
      const funcionario = request.agent(e.app);
      await funcionario.post('/api/auth/login').send({ usuario: 'funcionario', password: PASSWORD_USUARIO });

      await admin.patch(`/api/usuarios/${e.funcionario.id}`).send({ activo: false });

      expect((await funcionario.get('/api/auth/me')).status).toBe(401);
    });

    it('al cambiar la contraseña se cierran las sesiones y la nueva contraseña funciona', async () => {
      const admin = await comoAdmin(e);
      await admin.patch(`/api/usuarios/${e.funcionario.id}`).send({ password: '54321' });

      const vieja = await request(e.app).post('/api/auth/login').send({ usuario: 'funcionario', password: PASSWORD_USUARIO });
      const nueva = await request(e.app).post('/api/auth/login').send({ usuario: 'funcionario', password: '54321' });
      expect(vieja.status).toBe(401);
      expect(nueva.status).toBe(200);
      expect(e.auditoria.find((a) => a.accion === 'USUARIO_MODIFICADO')?.detalle).toEqual({ passwordCambiada: true });
    });

    it('el administrador no puede desactivarse ni quitarse su propio rol', async () => {
      const admin = await comoAdmin(e);

      expect((await admin.patch(`/api/usuarios/${e.admin.id}`).send({ activo: false })).status).toBe(409);
      expect((await admin.patch(`/api/usuarios/${e.admin.id}`).send({ rolId: e.rolId('AUDITOR') })).status).toBe(409);
    });

    it('un administrador puede desactivar a otro, pero no quitarse su propio rol', async () => {
      const otroAdmin = await e.agregarUsuario('admin2@institucion.test', 'Admin2Clave99', 'ADMINISTRADOR');
      const agente = request.agent(e.app);
      await agente.post('/api/auth/login').send({ usuario: 'admin2', password: 'Admin2Clave99' });

      // admin2 desactiva al admin original: queda admin2 activo, se permite.
      expect((await agente.patch(`/api/usuarios/${e.admin.id}`).send({ activo: false })).status).toBe(200);
      // admin2 intentaría sacarse el rol a sí mismo: bloqueado.
      expect((await agente.patch(`/api/usuarios/${otroAdmin.id}`).send({ rolId: e.rolId('AUDITOR') })).status).toBe(409);
    });

    it('rechaza campos desconocidos, cuerpos vacíos e ids inexistentes', async () => {
      const admin = await comoAdmin(e);

      expect((await admin.patch(`/api/usuarios/${e.funcionario.id}`).send({ email: 'cambio@x.test' })).status).toBe(400);
      expect((await admin.patch(`/api/usuarios/${e.funcionario.id}`).send({})).status).toBe(400);
      expect((await admin.patch('/api/usuarios/999').send({ nombre: 'Nadie Nadie' })).status).toBe(404);
    });
  });

  describe('eliminar', () => {
    it('elimina un usuario sin actividad, cierra sus sesiones y queda auditado', async () => {
      const admin = await comoAdmin(e);
      const creado = await admin.post('/api/usuarios').send({
        username: 'por.error',
        email: 'error@institucion.test',
        nombre: 'Creado Por Error',
        password: '12345',
        rolId: e.rolId('FUNCIONARIO'),
        dependenciaId: 1,
      });

      const res = await admin.delete(`/api/usuarios/${creado.body.data.id}`);

      expect(res.status).toBe(204);
      expect((await admin.get(`/api/usuarios/${creado.body.data.id}`)).status).toBe(404);
      expect(e.auditoria.at(-1)).toMatchObject({
        accion: 'USUARIO_ELIMINADO',
        resultado: 'EXITO',
        entidadId: String(creado.body.data.id),
        detalle: { username: 'por.error', email: 'error@institucion.test', rol: 'FUNCIONARIO' },
      });
    });

    it('no elimina un usuario con actividad registrada (409): hay que desactivarlo', async () => {
      const admin = await comoAdmin(e);
      // Al iniciar sesión, el funcionario ya figura en la auditoría.
      await request(e.app).post('/api/auth/login').send({ usuario: 'funcionario', password: PASSWORD_USUARIO });

      const res = await admin.delete(`/api/usuarios/${e.funcionario.id}`);

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/desactívelo/);
      expect((await admin.get(`/api/usuarios/${e.funcionario.id}`)).status).toBe(200);
    });

    it('el administrador no puede eliminarse a sí mismo y un id inexistente da 404', async () => {
      const admin = await comoAdmin(e);

      expect((await admin.delete(`/api/usuarios/${e.admin.id}`)).status).toBe(409);
      expect((await admin.delete('/api/usuarios/999')).status).toBe(404);
    });
  });

  it('GET /api/dependencias requiere sesión y solo lista las activas', async () => {
    expect((await request(e.app).get('/api/dependencias')).status).toBe(401);
    const admin = await comoAdmin(e);
    const res = await admin.get('/api/dependencias');

    expect(res.body.data.map((d: { codigo: string }) => d.codigo)).toEqual(['ADM', 'MESA']);
  });
});
