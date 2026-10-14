import { describe, expect, it } from 'vitest';
import { AuditoriaService } from '../../src/modules/auditoria/auditoria.service.js';
import { UsuariosService } from '../../src/modules/usuarios/usuarios.service.js';
import { ConflictError } from '../../src/shared/errors.js';
import { crearReposEnMemoria } from '../support/memoria.js';

describe('Regla: siempre debe quedar un administrador activo', () => {
  it('impide desactivar o cambiar de rol al último administrador activo, aunque lo pida otro usuario', async () => {
    const mem = crearReposEnMemoria();
    const admin = await mem.agregarUsuario('unico@institucion.test', '12345', 'ADMINISTRADOR');
    const service = new UsuariosService(mem.repos, new AuditoriaService(mem.repos.auditoria));
    const otroActor = { usuarioId: 999 };

    await expect(service.modificar(admin.id, { activo: false }, otroActor)).rejects.toBeInstanceOf(ConflictError);
    await expect(service.modificar(admin.id, { rolId: mem.rolId('AUDITOR') }, otroActor)).rejects.toThrow(/al menos un administrador/);
    expect(mem.auditoria).toHaveLength(0);
  });

  it('con dos administradores activos sí permite desactivar uno', async () => {
    const mem = crearReposEnMemoria();
    const a = await mem.agregarUsuario('a@institucion.test', '12345', 'ADMINISTRADOR');
    await mem.agregarUsuario('b@institucion.test', '12345', 'ADMINISTRADOR');
    const service = new UsuariosService(mem.repos, new AuditoriaService(mem.repos.auditoria));

    const res = await service.modificar(a.id, { activo: false }, { usuarioId: 999 });
    expect(res.activo).toBe(false);
  });
});
