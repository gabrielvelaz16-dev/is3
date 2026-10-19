/**
 * Migas de pan: muestran dónde está el usuario y permiten subir de nivel
 * (Expedientes › EXP-2026-000017 › Editar). El último elemento es la página actual.
 */
import { Link } from 'react-router';

export interface Miga {
  etiqueta: string;
  to?: string;
}

export function MigasDePan({ items }: { items: Miga[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        {items.map((m, i) => {
          const ultima = i === items.length - 1;
          return (
            <li key={`${m.etiqueta}-${i}`} className="flex items-center gap-1.5">
              {m.to && !ultima ? (
                <Link to={m.to} className="text-marca-700 hover:underline">
                  {m.etiqueta}
                </Link>
              ) : (
                <span aria-current={ultima ? 'page' : undefined} className={ultima ? 'font-medium text-slate-700' : undefined}>
                  {m.etiqueta}
                </span>
              )}
              {!ultima && (
                <span aria-hidden="true" className="text-slate-400">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
