/**
 * Ayudas de navegación: título de la pestaña del navegador y regreso a la lista de
 * expedientes con la búsqueda, los filtros y la página que tenía.
 */
import { useEffect } from 'react';

const NOMBRE_SISTEMA = 'Expediente Electrónico';

/** Pone el título de la pestaña del navegador ("Expedientes · Expediente Electrónico"). */
export function useTituloPagina(titulo: string | undefined) {
  useEffect(() => {
    if (titulo) document.title = `${titulo} · ${NOMBRE_SISTEMA}`;
  }, [titulo]);
}

const CLAVE_LISTA = 'is3:lista-expedientes';

/** La lista de expedientes guarda su búsqueda ("?q=...&estado=...") para poder volver a ella. */
export function recordarListaExpedientes(search: string) {
  try {
    sessionStorage.setItem(CLAVE_LISTA, search);
  } catch {
    // Sin almacenamiento (modo privado): se vuelve a la lista sin filtros.
  }
}

/** Al cerrar sesión: el próximo usuario empieza con la lista sin filtros. */
export function olvidarListaExpedientes() {
  try {
    sessionStorage.removeItem(CLAVE_LISTA);
  } catch {
    // Sin almacenamiento: no hay nada que borrar.
  }
}

/** Ruta de la lista de expedientes tal como se dejó. */
export function rutaListaExpedientes(): string {
  try {
    return `/expedientes${sessionStorage.getItem(CLAVE_LISTA) ?? ''}`;
  } catch {
    return '/expedientes';
  }
}
