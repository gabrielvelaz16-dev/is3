# Requisitos

**Estado:** Línea base inicial (Fase 0) · **Unidades:** 3 y 7 · **Tarjeta:** F0-03

Los requisitos se escriben de forma verificable. Cada uno tiene prioridad (MoSCoW), la historia o tarea que lo implementa y la prueba que lo verifica. Los cambios a esta lista pasan por [control de cambios](../04-gestion/control-cambios.md).

## 1. Actores y roles

| Rol | Descripción | Permisos principales |
|---|---|---|
| Administrador | Gestiona usuarios, roles, dependencias y respaldos. | Todo lo del sistema, consulta de auditoría, backup/restore. |
| Mesa de entradas | Registra expedientes y los deriva. | Crear, consultar y enviar expedientes de su dependencia. |
| Funcionario / Responsable | Tramita expedientes asignados. | Consultar, registrar actuaciones y documentos, cambiar estados permitidos, gestionar tareas asignadas. |
| Jefe de dependencia | Supervisa y asigna. | Lo del funcionario + asignar responsables, ver reportes de su dependencia. |
| Auditor | Control interno. | Solo lectura de expedientes, reportes y auditoría. |

*Los roles son ficticios y pueden ajustarse en el Sprint 2.*

## 2. Requisitos funcionales

| ID | Requisito | Prioridad | Implementa | Prueba |
|---|---|---|---|---|
| RF-01 | El sistema debe permitir iniciar y cerrar sesión con usuario y contraseña. | Must | S2-02 | PR-01 |
| RF-02 | El sistema debe restringir cada función según el rol del usuario, verificándolo en el servidor. | Must | S2-03 | PR-02 |
| RF-03 | El administrador debe poder crear, editar y desactivar usuarios y asignarles rol y dependencia, y eliminar los que no tienen actividad registrada (CR-06). | Must | S2-05, CR-06 | PR-03 |
| RF-04 | El sistema debe permitir registrar un expediente con carátula, asunto, tipo, iniciador y dependencia. | Must | S3-01 | PR-04 |
| RF-05 | Cada expediente debe recibir un número único con formato `EXP-AAAA-NNNNNN`. | Must | S3-05 | PR-05 |
| RF-06 | El sistema debe permitir consultar y modificar expedientes según permisos. | Must | S3-02, S3-03 | PR-06 |
| RF-07 | El sistema debe listar expedientes con búsqueda por texto, filtros (estado, fecha, dependencia, responsable) y paginación. | Must | S3-04 | PR-07 |
| RF-08 | El sistema debe permitir adjuntar documentos a un expediente, validando tipo y tamaño. | Must | S4-01, S4-02 | PR-08 |
| RF-09 | Solo usuarios autorizados pueden descargar documentos de un expediente. | Must | S4-05 | PR-09 |
| RF-10 | El sistema debe registrar actuaciones y observaciones con fecha y responsable automáticos. | Must | S4-03 | PR-10 |
| RF-11 | El sistema debe mostrar el historial completo del expediente en orden cronológico. | Must | S4-04 | PR-11 |
| RF-12 | El sistema debe permitir asignar un responsable a un expediente. | Must | S5-01 | PR-12 |
| RF-13 | El sistema debe permitir crear tareas con responsable y fecha de vencimiento. | Should | S5-02 | PR-13 |
| RF-14 | El sistema debe aplicar una máquina de estados y rechazar transiciones no válidas. | Must | S5-03 | PR-14 |
| RF-15 | El sistema debe permitir enviar un expediente a otra dependencia y registrar el pase. | Must | S5-04 | PR-15 |
| RF-16 | La dependencia destino debe ver los expedientes recibidos y confirmar su recepción. | Must | S5-05 | PR-16 |
| RF-17 | El sistema debe mostrar pendientes, alertas de vencimiento y notificaciones internas. | Should | S5-06 | PR-17 |
| RF-18 | El sistema debe mostrar estadísticas de expedientes por estado, dependencia y vencimiento. | Should | S6-01 | PR-18 |
| RF-19 | El sistema debe generar reportes filtrables y exportarlos en CSV. | Should | S6-02, S6-03 | PR-19 |
| RF-20 | El sistema debe registrar en auditoría las operaciones importantes (login, altas, modificaciones, cambios de estado, permisos, descargas, backups). | Must | S2-07, S7-03 | PR-20 |
| RF-21 | El administrador debe poder consultar la auditoría con filtros. | Should | S7-03 | PR-21 |
| RF-22 | El sistema debe permitir generar una copia de seguridad y restaurarla. | Must | S7-04 | PR-22 |
| RF-23 | La autenticación debe funcionar a través de un adaptador de identidad intercambiable (simulado). | Should | S2-04 | PR-23 |

## 3. Requisitos no funcionales

Asociados a las características de ISO/IEC 25010 seleccionadas en el [plan de calidad](../05-calidad-pruebas/plan-calidad.md).

| ID | Característica | Requisito | Criterio medible |
|---|---|---|---|
| RNF-01 | Seguridad — confidencialidad | Las contraseñas se almacenan con un algoritmo de hash seguro (scrypt, bcrypt o argon2; se usa scrypt, ver ADR-10). | Ninguna contraseña en texto plano en BD ni en logs. |
| RNF-02 | Seguridad — autorización | Toda ruta protegida verifica el permiso en el backend. | 100 % de rutas protegidas cubiertas por pruebas de acceso denegado (403). |
| RNF-03 | Seguridad — no repudio / responsabilidad | La auditoría no se puede modificar ni borrar por operaciones ordinarias. | Prueba que intenta modificar un registro y falla. |
| RNF-04 | Seguridad — integridad | Los documentos se guardan fuera de la carpeta pública, con nombre interno aleatorio y hash. | Verificación de hash al descargar. |
| RNF-05 | Seguridad — confidencialidad | Los errores no muestran trazas, consultas SQL ni credenciales al usuario. | Revisión de respuestas de error en pruebas. |
| RNF-06 | Seguridad | Secretos solo en variables de entorno; `.env` fuera de Git. | `.env.example` sin valores reales; revisión del historial. |
| RNF-07 | Fiabilidad — recuperabilidad | Los datos pueden restaurarse desde una copia de seguridad. | Restauración probada con evidencia en el Sprint 7. |
| RNF-08 | Adecuación funcional — corrección | Los indicadores del dashboard coinciden con los datos almacenados. | Prueba automática dashboard vs consulta directa. |
| RNF-09 | Eficiencia de desempeño | Las consultas de listado responden en tiempo aceptable con datos de demostración. | p95 < 1 s con 1.000 expedientes en equipo local. |
| RNF-10 | Mantenibilidad — modularidad y capacidad de prueba | Reglas de negocio separadas de los controladores; funciones críticas con pruebas. | Cobertura ≥ 70 % en módulos de negocio y seguridad. |
| RNF-11 | Usabilidad | Interfaz en español, formularios con validación y mensajes claros. | Prueba de usabilidad con al menos 3 usuarios: tareas básicas sin ayuda. |
| RNF-12 | Portabilidad — instalabilidad | El sistema se instala siguiendo el README. | Instalación desde cero en una máquina limpia sin pasos no documentados. |
| RNF-13 | Integridad de datos | Relaciones y restricciones en la base (FK, únicos, NOT NULL). | Revisión del esquema y pruebas de restricción. |

*Los umbrales numéricos (RNF-09, RNF-10) eran supuestos iniciales. Se revisaron en el Sprint 7 y se mantienen: el p95 medido con 1000 expedientes fue de 34 ms como máximo, y la cobertura del backend, del 94 % ([resultados-pruebas.md](../05-calidad-pruebas/resultados-pruebas.md)).*

## 4. Requisitos de gestión derivados del caso

| ID | Requisito | Origen |
|---|---|---|
| RG-01 | Mantener trazabilidad paquete → épica → historia → requisito → prueba → release. | TP 6, Unidad 3 |
| RG-02 | Todo cambio que afecte la línea base pasa por control integrado de cambios. | TP 6, Unidad 2 y evento de cambio |
| RG-03 | Registrar el uso de IA en una bitácora (Anexo D). | Guía del TP, regla 4 |
| RG-04 | El repositorio conserva historial, etiquetas y evidencias de revisión. | Guía del TP, regla 3 |

## 5. Cambios incorporados en la Fase 0

Al unificar el backlog del TP con las funciones definidas para el sistema (tarjeta F0-01) se agregaron **RF-13, RF-15, RF-16, RF-17, RF-22 y RF-23**. Ver [CR-00 en control de cambios](../04-gestion/control-cambios.md).
