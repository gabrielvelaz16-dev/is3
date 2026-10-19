import type { ReactNode } from 'react';
import { useTituloPagina } from '../routes/navegacion';

interface Props {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/** Título de cada página con su descripción y las acciones principales a la derecha. También titula la pestaña del navegador. */
export function PageHeader({ title, subtitle, children }: Props) {
  useTituloPagina(title);
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-tinta">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-slate-600">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  );
}
