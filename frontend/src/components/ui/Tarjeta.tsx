/**
 * Contenedor de una sección de la pantalla (CR-05). Si tiene título, es una región con nombre
 * para lectores de pantalla.
 */
import { type ReactNode, useId } from 'react';

export function Tarjeta({
  titulo,
  acciones,
  children,
  className = '',
  relleno = true,
}: {
  titulo?: string;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
  relleno?: boolean;
}) {
  const id = useId();
  const Contenedor = titulo ? 'section' : 'div';
  return (
    <Contenedor
      aria-labelledby={titulo ? id : undefined}
      className={`rounded-lg border border-slate-200 bg-white ${relleno ? 'p-5' : ''} ${className}`}
    >
      {titulo && (
        <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 ${relleno ? '' : 'px-5 pt-5'}`}>
          <h2 id={id} className="text-base font-semibold text-tinta">
            {titulo}
          </h2>
          {acciones}
        </div>
      )}
      {children}
    </Contenedor>
  );
}
