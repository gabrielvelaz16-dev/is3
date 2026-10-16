/**
 * Secciones del sistema (S1-04). El menú y las rutas se generan desde esta lista,
 * así agregar una sección en un sprint futuro es un cambio en un solo lugar.
 */
export interface Section {
  path: string;
  label: string;
  description: string;
  /** Sprint en el que se implementa la funcionalidad de la sección. */
  sprint: number;
  requisitos: string;
  /** Permiso necesario para ver la sección en el menú (el servidor lo vuelve a verificar). */
  permiso?: string;
  /** true si la sección ya tiene funcionalidad (no muestra "en construcción"). */
  implementada?: boolean;
}

export const sections: Section[] = [
  {
    path: '/expedientes',
    label: 'Expedientes',
    description: 'Registro, consulta, búsqueda y seguimiento de expedientes con sus documentos y actuaciones.',
    sprint: 3,
    requisitos: 'RF-04 a RF-11',
    permiso: 'expedientes.consultar',
    implementada: true,
  },
  {
    path: '/tareas',
    label: 'Tareas y pendientes',
    description: 'Responsables, tareas con vencimiento, pases entre dependencias y alertas.',
    sprint: 5,
    requisitos: 'RF-12 a RF-17',
    implementada: true,
  },
  {
    path: '/reportes',
    label: 'Reportes',
    description: 'Estadísticas de expedientes, reportes con filtros y exportación a CSV.',
    sprint: 6,
    requisitos: 'RF-18 y RF-19',
    permiso: 'reportes.consultar',
    implementada: true,
  },
  {
    path: '/auditoria',
    label: 'Auditoría',
    description: 'Registro de solo lectura de las operaciones importantes, con filtros.',
    sprint: 7,
    requisitos: 'RF-20 y RF-21',
    permiso: 'auditoria.consultar',
    implementada: true,
  },
  {
    path: '/administracion',
    label: 'Administración',
    description: 'Usuarios, roles y permisos, y copias de seguridad.',
    sprint: 2,
    requisitos: 'RF-01 a RF-03, RF-20 a RF-22',
    permiso: 'usuarios.gestionar',
    implementada: true,
  },
];
