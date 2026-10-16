import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { RespaldosPanel } from '../components/RespaldosPanel';
import { ApiError } from '../services/api';
import type { Dependencia, Rol, Usuario } from '../services/tipos';
import { usuariosApi } from '../services/usuarios';
import { useAviso } from '../components/ui/Avisos';

const POR_PAGINA = 10;
const inputClass = 'mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 disabled:bg-slate-100';
const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' }) : '—');

/** Administración de usuarios y roles (RF-03, S2-05). */
export function UsuariosPage() {
  const { usuario: yo, puede } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [roles, setRoles] = useState<Rol[]>([]);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const avisar = useAviso();
  const [editando, setEditando] = useState<Usuario | 'nuevo' | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await usuariosApi.listar({ q: busqueda || undefined, page: pagina, pageSize: POR_PAGINA });
      setUsuarios(res.items);
      setTotal(res.total);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de usuarios');
    }
  }, [busqueda, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    Promise.all([usuariosApi.roles(), usuariosApi.dependencias()])
      .then(([r, d]) => {
        setRoles(r);
        setDependencias(d);
      })
      .catch(() => setError('No se pudieron cargar los roles y dependencias'));
  }, []);

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  function alGuardar(mensaje: string) {
    setEditando(null);
    avisar(mensaje);
    void cargar();
  }

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Cree usuarios, asigne su rol y dependencia, o desactívelos.">
        <button
          type="button"
          onClick={() => {
            setEditando('nuevo');
          }}
          className="rounded-md bg-marca-700 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900"
        >
          Nuevo usuario
        </button>
      </PageHeader>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mb-4">
        <label htmlFor="buscar" className="sr-only">
          Buscar usuarios
        </label>
        <input
          id="buscar"
          type="search"
          placeholder="Buscar por nombre, usuario o correo"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1);
          }}
          className={`${inputClass} max-w-sm`}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">Usuarios del sistema</caption>
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">Nombre</th>
              <th scope="col" className="px-4 py-3">Usuario</th>
              <th scope="col" className="px-4 py-3">Correo</th>
              <th scope="col" className="px-4 py-3">Rol</th>
              <th scope="col" className="px-4 py-3">Dependencia</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">Último acceso</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {u.nombre}
                  {u.id === yo?.id && <span className="ml-2 text-xs text-slate-500">(usted)</span>}
                </td>
                <td className="px-4 py-3 font-mono text-slate-700">{u.username}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">{u.rol.nombre}</td>
                <td className="px-4 py-3">{u.dependencia.nombre}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.activo ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{fecha(u.ultimoAcceso)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(u);
                    }}
                    className="text-sm font-medium text-marca-700 hover:underline"
                    aria-label={`Editar a ${u.nombre}`}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && !error && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  No hay usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          {total} usuario{total === 1 ? '' : 's'} · página {pagina} de {paginas}
        </span>
        <div className="flex gap-2">
          <button type="button" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50">
            Anterior
          </button>
          <button type="button" disabled={pagina >= paginas} onClick={() => setPagina((p) => p + 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50">
            Siguiente
          </button>
        </div>
      </div>

      {editando && (
        <FormularioUsuario
          usuario={editando === 'nuevo' ? null : editando}
          esUnoMismo={editando !== 'nuevo' && editando.id === yo?.id}
          roles={roles}
          dependencias={dependencias}
          onCancelar={() => setEditando(null)}
          onGuardado={alGuardar}
        />
      )}

      {puede('respaldo.gestionar') && <RespaldosPanel />}
    </>
  );
}

interface FormProps {
  usuario: Usuario | null;
  esUnoMismo: boolean;
  roles: Rol[];
  dependencias: Dependencia[];
  onCancelar: () => void;
  onGuardado: (mensaje: string) => void;
}

function FormularioUsuario({ usuario, esUnoMismo, roles, dependencias, onCancelar, onGuardado }: FormProps) {
  const nuevo = usuario === null;
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [username, setUsername] = useState(usuario?.username ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [rolId, setRolId] = useState(usuario?.rol.id ?? 0);
  const [dependenciaId, setDependenciaId] = useState(usuario?.dependencia.id ?? 0);
  const [activo, setActivo] = useState(usuario?.activo ?? true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [guardando, setGuardando] = useState(false);
  const rolElegido = roles.find((r) => r.id === rolId);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      if (nuevo) {
        await usuariosApi.crear({ username, email, nombre, password, rolId, dependenciaId });
        onGuardado(`Usuario ${username.trim().toLowerCase()} creado.`);
      } else {
        const cambios = {
          ...(nombre !== usuario.nombre && { nombre }),
          ...(rolId !== usuario.rol.id && { rolId }),
          ...(dependenciaId !== usuario.dependencia.id && { dependenciaId }),
          ...(activo !== usuario.activo && { activo }),
          ...(password && { password }),
        };
        if (Object.keys(cambios).length === 0) {
          setError(new ApiError(0, 'SIN_CAMBIOS', 'No hay cambios para guardar.'));
          return;
        }
        await usuariosApi.modificar(usuario.id, cambios);
        onGuardado(`Usuario ${usuario.username} actualizado.`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'ERROR', 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  }

  const errorCampo = (campo: string) =>
    error?.campo(campo) && (
      <p id={`error-${campo}`} className="mt-1 text-xs text-red-700">
        {error.campo(campo)}
      </p>
    );

  return (
    <div className="fixed inset-0 z-10 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="titulo-form" className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 id="titulo-form" className="text-lg font-semibold text-marca-900">
          {nuevo ? 'Nuevo usuario' : `Editar usuario`}
        </h2>

        <form onSubmit={guardar} noValidate className="mt-4 space-y-4">
          {error && !error.details.some((d) => d.field) && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error.message}
            </p>
          )}

          <div>
            <label htmlFor="f-nombre" className="block text-sm font-medium text-slate-700">Nombre completo</label>
            <input id="f-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} required />
            {errorCampo('nombre')}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="f-username" className="block text-sm font-medium text-slate-700">Nombre de usuario</label>
              <input id="f-username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} disabled={!nuevo} autoCapitalize="none" spellCheck={false} required />
              {errorCampo('username')}
            </div>
            <div>
            <label htmlFor="f-email" className="block text-sm font-medium text-slate-700">Correo</label>
            <input id="f-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} disabled={!nuevo} required />
            {errorCampo('email')}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="f-rol" className="block text-sm font-medium text-slate-700">Rol</label>
              <select id="f-rol" value={rolId} onChange={(e) => setRolId(Number(e.target.value))} className={inputClass} disabled={esUnoMismo}>
                <option value={0} disabled>Seleccione…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
              {errorCampo('rolId')}
            </div>
            <div>
              <label htmlFor="f-dependencia" className="block text-sm font-medium text-slate-700">Dependencia</label>
              <select id="f-dependencia" value={dependenciaId} onChange={(e) => setDependenciaId(Number(e.target.value))} className={inputClass}>
                <option value={0} disabled>Seleccione…</option>
                {dependencias.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
              {errorCampo('dependenciaId')}
            </div>
          </div>
          {rolElegido && <p className="-mt-2 text-xs text-slate-500">{rolElegido.descripcion}</p>}

          <div>
            <label htmlFor="f-password" className="block text-sm font-medium text-slate-700">
              {nuevo ? 'Contraseña inicial' : 'Nueva contraseña (opcional)'}
            </label>
            <input
              id="f-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              aria-describedby="ayuda-password"
            />
            <p id="ayuda-password" className="mt-1 text-xs text-slate-500">Mínimo 5 caracteres.</p>
            {errorCampo('password')}
          </div>

          {!nuevo && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} disabled={esUnoMismo} />
              Usuario activo
            </label>
          )}
          {esUnoMismo && <p className="text-xs text-slate-500">No puede cambiar su propio rol ni desactivarse.</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancelar} className="rounded-md border border-slate-300 px-4 py-2 text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="rounded-md bg-marca-700 px-4 py-2 text-sm font-medium text-white hover:bg-marca-900 disabled:opacity-60">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
