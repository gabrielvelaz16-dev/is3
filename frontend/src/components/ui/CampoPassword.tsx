/**
 * Campo de contraseña con el botón del ojo para mostrar u ocultar lo que se escribe.
 * Se usa en el inicio de sesión y en el formulario de usuarios.
 */
import { type InputHTMLAttributes, useState } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { id: string };

export function CampoPassword({ className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative mt-1">
      {/* El margen superior lo lleva el contenedor, para que el ojo quede centrado en el campo. */}
      <input {...props} type={visible ? 'text' : 'password'} className={`${className.replace(/\bmt-\S+/g, '')} pr-10`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        aria-controls={props.id}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-marca-700"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  );
}
