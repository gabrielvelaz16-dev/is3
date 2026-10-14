import type {
  CambiosExpediente,
  DependenciaRecord,
  EventoAuditoria,
  ExpedienteRecord,
  FiltrosExpediente,
  NuevoExpediente,
  Repos,
  RolRecord,
  SesionRecord,
  UsuarioRecord,
} from '../../src/database/repositories.js';
import { createApp } from '../../src/app.js';
import type { ApiDeps } from '../../src/api/routes/index.js';
import { LocalIdentityProvider } from '../../src/integrations/identity/identity-provider.js';
import { hashPassword } from '../../src/security/password.js';
import { ROLES } from '../../src/security/permissions.js';

/**
 * Repositorios en memoria: misma interfaz que los de Prisma, para probar reglas
 * de negocio, permisos y rutas sin base de datos.
 */
export function crearReposEnMemoria() {
  const dependencias: DependenciaRecord[] = [
    { id: 1, codigo: 'ADM', nombre: 'Administración General', activa: true },
    { id: 2, codigo: 'MESA', nombre: 'Mesa de Entradas', activa: true },
    { id: 3, codigo: 'VIEJA', nombre: 'Dependencia inactiva', activa: false },
  ];
  const roles: RolRecord[] = Object.entries(ROLES).map(([clave, r], i) => ({
    id: i + 1,
    clave,
    nombre: r.nombre,
    descripcion: r.descripcion,
    permisos: [...r.permisos].sort(),
  }));
  type Fila = Omit<UsuarioRecord, 'rol' | 'dependencia'> & { rolId: number; dependenciaId: number };
  const usuarios: Fila[] = [];
  const sesiones = new Map<string, SesionRecord>();
  const auditoria: EventoAuditoria[] = [];

  // Sprint 3: expedientes en memoria
  type FilaExp = Omit<ExpedienteRecord, 'dependenciaActual' | 'creadoPor' | 'responsable'>;
  const expedientes: FilaExp[] = [];
  const secuencias = new Map<number, number>();

  const completarExp = (f: FilaExp): ExpedienteRecord => {
    const dep = dependencias.find((d) => d.id === f.dependenciaActualId)!;
    const creador = usuarios.find((u) => u.id === f.creadoPorId)!;
    const resp = f.responsableId ? usuarios.find((u) => u.id === f.responsableId) : null;
    return {
      ...f,
      dependenciaActual: dep,
      creadoPor: creador ? { id: creador.id, nombre: creador.nombre, username: creador.username } : { id: f.creadoPorId, nombre: '', username: '' },
      responsable: resp ? { id: resp.id, nombre: resp.nombre, username: resp.username } : null,
    };
  };

  const completar = (f: Fila): UsuarioRecord => {
    const { rolId, dependenciaId, ...resto } = f;
    return { ...resto, rol: roles.find((r) => r.id === rolId)!, dependencia: dependencias.find((d) => d.id === dependenciaId)! };
  };

  const repos: Repos = {
    usuarios: {
      findByUsername: async (username) => {
        const f = usuarios.find((u) => u.username === username);
        return f ? completar(f) : null;
      },
      findByEmail: async (email) => {
        const f = usuarios.find((u) => u.email === email);
        return f ? completar(f) : null;
      },
      findById: async (id) => {
        const f = usuarios.find((u) => u.id === id);
        return f ? completar(f) : null;
      },
      list: async ({ q, skip, take }) => {
        const filtrados = usuarios
          .filter((u) => !q || `${u.nombre} ${u.username} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        return { items: filtrados.slice(skip, skip + take).map(completar), total: filtrados.length };
      },
      create: async (data) => {
        const fila: Fila = { id: usuarios.length + 1, activo: true, ultimoAcceso: null, creadoEn: new Date(), ...data };
        usuarios.push(fila);
        return completar(fila);
      },
      update: async (id, data) => {
        const fila = usuarios.find((u) => u.id === id);
        if (!fila) throw new Error('no existe');
        Object.assign(fila, data);
        return completar(fila);
      },
      countActivosConRol: async (clave, excluirId) =>
        usuarios.filter((u) => u.activo && u.id !== excluirId && roles.find((r) => r.id === u.rolId)?.clave === clave).length,
    },
    roles: {
      list: async () => roles,
      findById: async (id) => roles.find((r) => r.id === id) ?? null,
    },
    dependencias: {
      list: async () => dependencias,
      findById: async (id) => dependencias.find((d) => d.id === id) ?? null,
    },
    sesiones: {
      create: async ({ id, usuarioId, expiraEn }) => {
        sesiones.set(id, { id, usuarioId, expiraEn });
      },
      findById: async (id) => sesiones.get(id) ?? null,
      delete: async (id) => {
        sesiones.delete(id);
      },
      deleteByUsuario: async (usuarioId) => {
        for (const [k, s] of sesiones) if (s.usuarioId === usuarioId) sesiones.delete(k);
      },
    },
    auditoria: {
      insert: async (e) => {
        auditoria.push(e);
      },
    },

    expedientes: {
      findById: async (id) => {
        const f = expedientes.find((e) => e.id === id);
        return f ? completarExp(f) : null;
      },
      findByNumero: async (numero) => {
        const f = expedientes.find((e) => e.numero === numero);
        return f ? completarExp(f) : null;
      },
      list: async (filtros: FiltrosExpediente) => {
        let filtrados = [...expedientes];
        if (filtros.q) {
          const q = filtros.q.toLowerCase();
          filtrados = filtrados.filter(
            (e) =>
              e.caratula.toLowerCase().includes(q) ||
              e.asunto.toLowerCase().includes(q) ||
              e.numero.toLowerCase().includes(q) ||
              e.iniciador.toLowerCase().includes(q),
          );
        }
        if (filtros.estado) filtrados = filtrados.filter((e) => e.estado === filtros.estado);
        if (filtros.prioridad) filtrados = filtrados.filter((e) => e.prioridad === filtros.prioridad);
        if (filtros.dependenciaId) filtrados = filtrados.filter((e) => e.dependenciaActualId === filtros.dependenciaId);
        filtrados.sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime());
        return { items: filtrados.slice(filtros.skip, filtros.skip + filtros.take).map(completarExp), total: filtrados.length };
      },
      create: async (data: NuevoExpediente) => {
        const now = new Date();
        const fila: FilaExp = {
          id: expedientes.length + 1,
          numero: data.numero,
          caratula: data.caratula,
          asunto: data.asunto,
          tipo: data.tipo,
          iniciador: data.iniciador,
          estado: data.estado ?? 'BORRADOR',
          prioridad: data.prioridad ?? 'MEDIA',
          dependenciaActualId: data.dependenciaActualId,
          creadoPorId: data.creadoPorId,
          responsableId: data.responsableId ?? null,
          fechaVencimiento: data.fechaVencimiento ?? null,
          descripcion: data.descripcion ?? null,
          creadoEn: now,
          actualizadoEn: now,
        };
        expedientes.push(fila);
        return completarExp(fila);
      },
      update: async (id, data: CambiosExpediente) => {
        const fila = expedientes.find((e) => e.id === id);
        if (!fila) throw new Error('expediente no existe');
        Object.assign(fila, data, { actualizadoEn: new Date() });
        return completarExp(fila);
      },
    },

    secuencia: {
      siguienteNumero: async (anio: number) => {
        const actual = secuencias.get(anio) ?? 0;
        const siguiente = actual + 1;
        secuencias.set(anio, siguiente);
        return siguiente;
      },
    },
  };

  const rolId = (clave: string) => roles.find((r) => r.clave === clave)!.id;

  async function agregarUsuario(email: string, password: string, rolClave: string, extra: Partial<Fila> = {}) {
    // El nombre de usuario es la parte del correo antes de la arroba (admin, funcionario...).
    const username = email.split('@')[0]!;
    return repos.usuarios.create({ username, email, nombre: username, passwordHash: await hashPassword(password), rolId: rolId(rolClave), dependenciaId: 1, ...extra });
  }

  return { repos, auditoria, sesiones, rolId, agregarUsuario };
}

export const PASSWORD_ADMIN = '12345';
export const PASSWORD_USUARIO = 'clave1';

/** App de prueba con repos en memoria, un administrador y un funcionario. */
export async function crearEntorno(overrides: Partial<ApiDeps> = {}) {
  const mem = crearReposEnMemoria();
  const admin = await mem.agregarUsuario('admin@institucion.test', PASSWORD_ADMIN, 'ADMINISTRADOR');
  const funcionario = await mem.agregarUsuario('funcionario@institucion.test', PASSWORD_USUARIO, 'FUNCIONARIO');
  const app = createApp({
    dbCheck: async () => true,
    version: '0.1.0',
    repos: mem.repos,
    identity: new LocalIdentityProvider(mem.repos.usuarios),
    ...overrides,
  });
  return { app, ...mem, admin, funcionario };
}
