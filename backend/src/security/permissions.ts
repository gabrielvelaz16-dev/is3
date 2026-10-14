/**
 * Catálogo de permisos y roles (RF-02, S2-03).
 * Es la fuente única: el seed lo copia a la base y la autorización del servidor
 * verifica contra los permisos del rol guardados en la base.
 */

export const PERMISOS = {
  'usuarios.gestionar': 'Crear, modificar y desactivar usuarios; asignar roles y dependencias',
  'dependencias.gestionar': 'Administrar dependencias de la institución',
  'auditoria.consultar': 'Consultar el registro de auditoría',
  'respaldo.gestionar': 'Generar y restaurar copias de seguridad',
  'expedientes.crear': 'Registrar expedientes',
  'expedientes.consultar': 'Consultar expedientes de su dependencia',
  'expedientes.consultar_todas': 'Consultar expedientes de todas las dependencias',
  'expedientes.modificar': 'Modificar datos de expedientes',
  'expedientes.enviar': 'Enviar expedientes a otra dependencia',
  'expedientes.recibir': 'Confirmar la recepción de expedientes',
  'documentos.adjuntar': 'Adjuntar documentos a expedientes',
  'documentos.descargar': 'Descargar documentos de expedientes',
  'actuaciones.registrar': 'Registrar actuaciones y observaciones',
  'estados.cambiar': 'Cambiar el estado de expedientes',
  'responsables.asignar': 'Asignar responsables a expedientes',
  'tareas.gestionar': 'Crear y actualizar tareas',
  'reportes.consultar': 'Consultar estadísticas y reportes',
} as const;

export type Permiso = keyof typeof PERMISOS;
export const TODOS_LOS_PERMISOS = Object.keys(PERMISOS) as Permiso[];

export const ROL_ADMINISTRADOR = 'ADMINISTRADOR';

const FUNCIONARIO: Permiso[] = [
  'expedientes.consultar',
  'expedientes.modificar',
  'expedientes.enviar',
  'expedientes.recibir',
  'documentos.adjuntar',
  'documentos.descargar',
  'actuaciones.registrar',
  'estados.cambiar',
  'tareas.gestionar',
];

export const ROLES: Record<string, { nombre: string; descripcion: string; permisos: Permiso[] }> = {
  [ROL_ADMINISTRADOR]: {
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema: usuarios, roles, auditoría, respaldos y todas las funciones.',
    permisos: TODOS_LOS_PERMISOS,
  },
  MESA_ENTRADAS: {
    nombre: 'Mesa de entradas',
    descripcion: 'Registra expedientes y los deriva a otras dependencias.',
    permisos: ['expedientes.crear', 'expedientes.consultar', 'expedientes.enviar', 'expedientes.recibir', 'documentos.adjuntar', 'documentos.descargar'],
  },
  FUNCIONARIO: {
    nombre: 'Funcionario / Responsable',
    descripcion: 'Tramita los expedientes asignados.',
    permisos: FUNCIONARIO,
  },
  JEFE_DEPENDENCIA: {
    nombre: 'Jefe de dependencia',
    descripcion: 'Supervisa la dependencia, asigna responsables y consulta reportes.',
    permisos: [...FUNCIONARIO, 'responsables.asignar', 'reportes.consultar'],
  },
  AUDITOR: {
    nombre: 'Auditor',
    descripcion: 'Control interno: solo lectura de expedientes, reportes y auditoría.',
    permisos: ['expedientes.consultar', 'expedientes.consultar_todas', 'documentos.descargar', 'reportes.consultar', 'auditoria.consultar'],
  },
};
