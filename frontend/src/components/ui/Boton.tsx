/**
 * Botón con las variantes del sistema (CR-05). Un solo lugar para los estilos de acción.
 * - primario: la acción principal de la pantalla (una por zona)
 * - secundario: acciones alternativas
 * - peligro: acciones que no se pueden deshacer
 * - fantasma: acciones menores dentro de listas
 */
import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';
type Tamano = 'normal' | 'chico';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const VARIANTES: Record<Variante, string> = {
  primario: 'bg-marca-700 text-white shadow-sm hover:bg-marca-900',
  secundario: 'border border-slate-300 bg-white text-slate-800 hover:border-marca-500 hover:text-marca-900',
  peligro: 'bg-sello text-white shadow-sm hover:bg-red-900',
  fantasma: 'text-marca-700 hover:bg-marca-50',
};
const TAMANOS: Record<Tamano, string> = { normal: 'px-4 py-2 text-sm', chico: 'px-2.5 py-1 text-sm' };

export const claseBoton = (variante: Variante = 'secundario', tamano: Tamano = 'normal') =>
  `${BASE} ${VARIANTES[variante]} ${TAMANOS[tamano]}`;

export function Boton({
  variante = 'secundario',
  tamano = 'normal',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamano?: Tamano }) {
  return <button type={type} className={`${claseBoton(variante, tamano)} ${className}`} {...props} />;
}

export function BotonEnlace({ variante = 'secundario', tamano = 'normal', className = '', ...props }: LinkProps & { variante?: Variante; tamano?: Tamano }) {
  return <Link className={`${claseBoton(variante, tamano)} ${className}`} {...props} />;
}
