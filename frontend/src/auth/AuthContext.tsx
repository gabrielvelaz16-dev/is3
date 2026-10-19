import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { olvidarListaExpedientes } from '../routes/navegacion';
import type { UsuarioSesion } from '../services/tipos';
import { authApi } from '../services/usuarios';

type Estado = 'cargando' | 'anonimo' | 'autenticado';

interface AuthValue {
  estado: Estado;
  usuario: UsuarioSesion | null;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Solo para mostrar u ocultar opciones; el servidor vuelve a verificar cada permiso. */
  puede: (permiso: string) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Mantiene el usuario de la sesión (la sesión vive en una cookie httpOnly del servidor). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [estado, setEstado] = useState<Estado>('cargando');

  useEffect(() => {
    let vigente = true;
    authApi
      .me()
      .then((u) => {
        if (!vigente) return;
        setUsuario(u);
        setEstado('autenticado');
      })
      .catch(() => {
        // 401 (sin sesión) o sin conexión: se muestra el login, que informa si el servidor no responde.
        if (!vigente) return;
        setUsuario(null);
        setEstado('anonimo');
      });
    return () => {
      vigente = false;
    };
  }, []);

  const login = useCallback(async (identificador: string, password: string) => {
    const u = await authApi.login(identificador, password);
    setUsuario(u);
    setEstado('autenticado');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      olvidarListaExpedientes();
      setUsuario(null);
      setEstado('anonimo');
    }
  }, []);

  const valor = useMemo<AuthValue>(
    () => ({ estado, usuario, login, logout, puede: (p) => usuario?.permisos.includes(p) ?? false }),
    [estado, usuario, login, logout],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
