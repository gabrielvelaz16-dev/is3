import { api, apiRaw } from './api';
import type { Dependencia, Rol, Usuario, UsuarioSesion } from './tipos';

export const authApi = {
  me: () => api<{ usuario: UsuarioSesion }>('/auth/me').then((r) => r.usuario),
  login: (email: string, password: string) =>
    api<{ usuario: UsuarioSesion }>('/auth/login', { method: 'POST', body: { email, password } }).then((r) => r.usuario),
  logout: () => api<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
};

export interface CrearUsuario {
  email: string;
  nombre: string;
  password: string;
  rolId: number;
  dependenciaId: number;
}

export type ModificarUsuario = Partial<Omit<CrearUsuario, 'email'> & { activo: boolean }>;

export const usuariosApi = {
  listar: async (params: { q?: string; page: number; pageSize: number }) => {
    const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.q) query.set('q', params.q);
    const res = await apiRaw<Usuario[]>(`/usuarios?${query.toString()}`);
    return { items: res.data, total: res.meta?.total ?? res.data.length };
  },
  crear: (datos: CrearUsuario) => api<Usuario>('/usuarios', { method: 'POST', body: datos }),
  modificar: (id: number, datos: ModificarUsuario) => api<Usuario>(`/usuarios/${id}`, { method: 'PATCH', body: datos }),
  roles: () => api<Rol[]>('/roles'),
  dependencias: () => api<Dependencia[]>('/dependencias'),
};
