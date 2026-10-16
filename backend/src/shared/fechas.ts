/** Utilidades de fechas en hora local del servidor (Sprint 6: reportes y avisos). */

const dos = (n: number) => String(n).padStart(2, '0');

/** Fecha AAAA-MM-DD en hora local; `finDelDia` la lleva a las 23:59:59.999. */
export function fechaLocal(texto: string, finDelDia = false): Date {
  const [a, m, d] = texto.split('-').map(Number) as [number, number, number];
  return finDelDia ? new Date(a, m - 1, d, 23, 59, 59, 999) : new Date(a, m - 1, d, 0, 0, 0, 0);
}

/** dd/mm/aaaa, o vacío si no hay fecha. */
export function formatoFecha(d: Date | null): string {
  return d ? `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}` : '';
}

/** aaaammdd, para nombres de archivo. */
export function fechaCompacta(d: Date): string {
  return `${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}`;
}
