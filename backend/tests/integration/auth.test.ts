import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearEntorno, PASSWORD_ADMIN, PASSWORD_USUARIO } from '../support/memoria.js';

describe('Inicio y cierre de sesión (RF-01, S2-02)', () => {
  it('con credenciales correctas inicia sesión, devuelve el usuario sin el hash y una cookie httpOnly', async () => {
    const { app } = await crearEntorno();
    const res = await request(app).post('/api/auth/login').send({ usuario: ' Admin ', password: PASSWORD_ADMIN });

    expect(res.status).toBe(200);
    expect(res.body.data.usuario).toMatchObject({ username: 'admin', email: 'admin@institucion.test', rol: { clave: 'ADMINISTRADOR' } });
    expect(res.body.data.usuario.permisos).toContain('usuarios.gestionar');
    expect(JSON.stringify(res.body)).not.toContain('scrypt');
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toMatch(/^is3_sid=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api/);
  });

  it('el administrador entra con usuario "admin" y contraseña "12345", y también con su correo', async () => {
    const { app } = await crearEntorno();
    const porUsuario = await request(app).post('/api/auth/login').send({ usuario: 'admin', password: '12345' });
    const porCorreo = await request(app).post('/api/auth/login').send({ usuario: 'admin@institucion.test', password: '12345' });

    expect(porUsuario.status).toBe(200);
    expect(porCorreo.status).toBe(200);
  });

  it('con contraseña incorrecta o usuario inexistente responde 401 con el mismo mensaje', async () => {
    const { app } = await crearEntorno();
    const mal = await request(app).post('/api/auth/login').send({ usuario: 'admin', password: 'otra-cosa-1' });
    const noExiste = await request(app).post('/api/auth/login').send({ usuario: 'nadie', password: 'x' });

    expect(mal.status).toBe(401);
    expect(noExiste.status).toBe(401);
    expect(mal.body.error.message).toBe('Usuario o contraseña incorrectos');
    expect(noExiste.body.error.message).toBe(mal.body.error.message);
    expect(mal.headers['set-cookie']).toBeUndefined();
  });

  it('registra en auditoría el login exitoso y el fallido, sin guardar la contraseña', async () => {
    const { app, auditoria } = await crearEntorno();
    await request(app).post('/api/auth/login').send({ usuario: 'admin', password: 'Incorrecta123' });
    await request(app).post('/api/auth/login').send({ usuario: 'admin', password: PASSWORD_ADMIN });

    expect(auditoria.map((e) => `${e.accion}:${e.resultado}`)).toEqual(['LOGIN:FALLO', 'LOGIN:EXITO']);
    expect(JSON.stringify(auditoria)).not.toContain('Incorrecta123');
    expect(JSON.stringify(auditoria)).not.toContain(PASSWORD_ADMIN);
  });

  it('un usuario desactivado no puede iniciar sesión', async () => {
    const { app, repos, funcionario } = await crearEntorno();
    await repos.usuarios.update(funcionario.id, { activo: false });
    const res = await request(app).post('/api/auth/login').send({ usuario: 'funcionario', password: PASSWORD_USUARIO });

    expect(res.status).toBe(401);
  });

  it('bloquea el correo después de 5 intentos fallidos (429)', async () => {
    const { app } = await crearEntorno();
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ usuario: 'admin', password: 'Incorrecta123' });
    }
    const res = await request(app).post('/api/auth/login').send({ usuario: 'admin', password: PASSWORD_ADMIN });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('GET /api/auth/me devuelve el usuario con sesión y 401 sin sesión', async () => {
    const { app } = await crearEntorno();
    const agente = request.agent(app);

    expect((await agente.get('/api/auth/me')).status).toBe(401);
    await agente.post('/api/auth/login').send({ usuario: 'admin', password: PASSWORD_ADMIN });
    const me = await agente.get('/api/auth/me');

    expect(me.status).toBe(200);
    expect(me.body.data.usuario.email).toBe('admin@institucion.test');
  });

  it('al cerrar sesión, la sesión queda invalidada en el servidor (no solo se borra la cookie)', async () => {
    const { app, sesiones, auditoria } = await crearEntorno();
    const login = await request(app).post('/api/auth/login').send({ usuario: 'admin', password: PASSWORD_ADMIN });
    const cookie = login.headers['set-cookie']![0]!.split(';')[0]!;

    expect(sesiones.size).toBe(1);
    const logout = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(logout.status).toBe(200);
    expect(sesiones.size).toBe(0);
    expect(auditoria.at(-1)).toMatchObject({ accion: 'LOGOUT', resultado: 'EXITO' });

    // Reutilizar la cookie vieja ya no sirve.
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
  });

  it('una sesión vencida no es válida', async () => {
    let ahora = new Date('2026-10-14T10:00:00Z');
    const { app } = await crearEntorno({ sesionHoras: 8, now: () => ahora });
    const login = await request(app).post('/api/auth/login').send({ usuario: 'admin', password: PASSWORD_ADMIN });
    const cookie = login.headers['set-cookie']![0]!.split(';')[0]!;
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(200);

    ahora = new Date('2026-10-14T18:00:01Z');
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
  });

  it('la base guarda el hash del token, no el token de la cookie', async () => {
    const { app, sesiones } = await crearEntorno();
    const login = await request(app).post('/api/auth/login').send({ usuario: 'admin', password: PASSWORD_ADMIN });
    const token = login.headers['set-cookie']![0]!.split(';')[0]!.split('=')[1]!;

    expect([...sesiones.keys()][0]).toMatch(/^[a-f0-9]{64}$/);
    expect(sesiones.has(token)).toBe(false);
  });
});
