import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { CampoPassword } from '../components/ui/CampoPassword';
import { ApiError } from '../services/api';

/**
 * Pantalla de inicio de sesión (RF-01). Todos los usuarios entran por Inicio, aunque antes
 * hubieran pedido otra página: así nadie aparece en una pantalla de otro usuario o sin permiso.
 */
export function LoginPage() {
  const { estado, login } = useAuth();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (estado === 'autenticado') return <Navigate to="/" replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(usuario, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
      setPassword('');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-marca-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/favicon.svg" alt="" className="h-12 w-12" />
          <h1 className="mt-3 text-xl font-semibold text-marca-900">Expediente Electrónico</h1>
          <p className="text-sm text-slate-600">Institución pública ficticia</p>
        </div>

        <form onSubmit={enviar} noValidate className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="titulo-login">
          <h2 id="titulo-login" className="text-lg font-medium text-slate-800">
            Iniciar sesión
          </h2>

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="usuario" className="block text-sm font-medium text-slate-700">
              Usuario
            </label>
            <input
              id="usuario"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-marca-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <CampoPassword
              id="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-marca-500"
            />
          </div>

          <button
            type="submit"
            disabled={enviando || !usuario || !password}
            className="w-full rounded-md bg-marca-700 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">Prototipo académico — uso exclusivo con datos ficticios.</p>
      </div>
    </main>
  );
}
