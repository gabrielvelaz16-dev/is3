# Product Backlog

**Estado:** Vivo · **Unidades:** 2, 3 y 4 · **Herramienta:** tablero Trello *IS3 – Expediente Electrónico* (espacio de trabajo IS3)

El backlog es una lista ordenada y viva de necesidades, funcionalidades, mejoras, defectos y tareas técnicas. Su prioridad considera valor, urgencia y riesgo. La fuente de verdad del **estado** de cada ítem es Trello; este documento registra el **contenido acordado** y su relación con el TP.

## 1. Organización en Trello

| Lista | Uso |
|---|---|
| Control formal (predictivo) | Línea base, control de cambios, riesgos estratégicos, puertas de calidad y planes. |
| Backlog | Ítems de sprints futuros. |
| Sprint actual | Compromiso del sprint activo (hoy: Fase 0). |
| En progreso | En desarrollo. |
| En revisión / pruebas | Esperando pruebas o revisión del PR. |
| Hecho | Cumple la Definition of Done. |

Etiquetas: `Fase 0`, `Sprint 1`…`Sprint 8` · `Predictivo`, `Adaptativo`, `Compartido` · `Historia`, `Tarea técnica`, `Documentación`, `Riesgo`, `Defecto`.
Cada tarjeta tiene código, descripción y checklist **Criterios de aceptación**. Las historias llevan sus Story Points en el título (`[5 SP] S3-01 · Crear expediente`).

## 2. Ítems de control formal

| Código | Ítem |
|---|---|
| CF-01 | Línea base de alcance, cronograma y costo |
| CF-02 | Procedimiento de control integrado de cambios |
| CF-03 | Evento de cambio: nuevo control documental + retraso del proveedor de identidad |
| CF-04 | Revisión mensual de riesgos estratégicos |
| CF-05 | Puertas de calidad por release (R1–R4) |
| CF-06 | Plan maestro de calidad (QA/QC, ISO/IEC 25010) |
| CF-07 | Plan de configuración y DevOps |

## 3. Backlog por sprint

SP = Story Points (escala 1-2-3-5-8-13). Las tareas técnicas y de documentación no llevan SP: su esfuerzo se registra en horas (ver [estimación](estimacion-calendario.md)). **Origen**: *TP* = historia del backlog del TP Nro 6; *Nueva* = incorporada en la Fase 0 desde las instrucciones del prototipo.

### Fase 0 — Preparación (Sprint actual)

| Código | Ítem | Tipo |
|---|---|---|
| F0-01 | Unificar backlog del TP con las funciones del sistema | Documentación |
| F0-02 | Relacionar los 4 releases del TP con los sprints | Documentación |
| F0-03 | Definir requisitos funcionales y no funcionales | Documentación |
| F0-04 | Definir arquitectura y estructura de carpetas | Tarea técnica |
| F0-05 | Verificar entorno (Node LTS, Git, Docker, VS Code) | Tarea técnica |
| F0-06 | Crear repositorio en GitHub | Tarea técnica |
| F0-07 | Levantar PostgreSQL con Docker Compose | Tarea técnica |
| F0-08 | Iniciar bitácora de uso de IA (Anexo D) | Documentación |
| F0-09 | Definir Definition of Ready y Definition of Done | Documentación |

### Sprint 1 — Estructura inicial (E1) · 3 SP

| Código | Ítem | SP | Origen |
|---|---|---|---|
| S1-01 | Crear backend Express + TypeScript | — | Nueva |
| S1-02 | Crear frontend React + Vite + TypeScript + Tailwind | — | Nueva |
| S1-03 | Comunicación frontend ↔ API | — | Nueva |
| S1-04 | Navegación y diseño base | 3 | Nueva |
| S1-05 | Manejo centralizado de errores y logs | — | Nueva |
| S1-06 | Pipeline CI en GitHub Actions | — | Nueva (Unidad 8) |

### Sprint 2 — Base de datos y usuarios (E2) · 12 SP

| Código | Ítem | SP | Origen |
|---|---|---|---|
| S2-01 | Modelo de datos y migraciones con Prisma | — | Nueva |
| S2-02 | Iniciar y cerrar sesión | 2 | TP (Iniciar sesión) |
| S2-03 | Roles y autorización en el servidor | 5 | TP (Gestionar permisos) |
| S2-04 | Adaptador de identidad simulado (contingencia R01) | — | Nueva (riesgo R01) |
| S2-05 | Gestionar usuarios | 5 | TP |
| S2-06 | Usuarios ficticios de prueba (seed) | — | Nueva |
| S2-07 | Auditoría base (registro append-only) | — | Nueva |

### Sprint 3 — Expedientes (E3) · 16 SP

| Código | Ítem | SP | Origen |
|---|---|---|---|
| S3-01 | Crear expediente | 5 | TP |
| S3-02 | Consultar expediente | 3 | TP |
| S3-03 | Modificar expediente | 3 | Nueva |
| S3-04 | Listado con búsqueda, filtros y paginación | 5 | Nueva |
| S3-05 | Número único de expediente | — | Nueva |
| S3-06 | Validaciones compartidas con Zod | — | Nueva |

### Sprint 4 — Documentos y actuaciones (E4) · 11 SP

| Código | Ítem | SP | Origen |
|---|---|---|---|
| S4-01 | Registrar documento en un expediente | 5 | TP |
| S4-02 | Almacenamiento seguro de archivos | — | Nueva |
| S4-03 | Registrar actuaciones y observaciones | 3 | Nueva |
| S4-04 | Consultar historial del expediente | 3 | TP |
| S4-05 | Control de acceso a documentos | — | Nueva (riesgo R06) |

### Sprint 5 — Tareas y seguimiento (E5) · 21 SP (29 antes de CR-03)

| Código | Ítem | SP | Origen |
|---|---|---|---|
| S5-01 | Asignar responsables | 3 | Nueva |
| S5-02 | Registrar tareas y vencimientos | 5 | Nueva |
| S5-03 | Cambiar estado con transiciones válidas | 3 | TP |
| S5-04 | Enviar expediente a otra dependencia | 5 | TP |
| S5-05 | Recibir expediente | 5 | TP |
| S5-06 | Notificaciones internas — **movida al Sprint 6 por CR-03** (los pendientes y alertas de vencimiento quedaron en el Sprint 5) | 8 | TP (Notificaciones) |

### Sprint 6 — Dashboard y reportes (E6) · 21 SP (13 + S5-06 por CR-03) · terminado el 16/10/2026 ([sprint-06.md](sprints/sprint-06.md))

| Código | Ítem | SP | Origen |
|---|---|---|---|
| S6-01 | Dashboard de estadísticas de expedientes | 5 | Nueva |
| S6-02 | Consultar reportes con filtros | 5 | TP |
| S6-03 | Exportar reportes | 3 | Nueva |
| S6-04 | Verificar indicadores contra la base de datos | — | Nueva |
| S6-05 | Tablero de métricas del proyecto (Unidad 9) | — | Nueva (Unidad 9) |

### Sprint 7 — Calidad y seguridad (E7) · 13 SP · terminado el 16/10/2026 ([sprint-07.md](sprints/sprint-07.md))

| Código | Ítem | SP | Origen |
|---|---|---|---|
| S7-01 | Pruebas automatizadas de funciones críticas | — | Nueva |
| S7-02 | Pruebas de permisos y seguridad | — | Nueva |
| S7-03 | Revisar errores, logs y auditoría | 8 | TP (Auditoría de acciones) |
| S7-04 | Copia de seguridad y restauración | 5 | Nueva |
| S7-05 | Pruebas de rendimiento y usabilidad básicas | — | Nueva |
| S7-06 | Corrección de defectos | — | Nueva |

### Sprint 8 — Entrega (E8)

| Código | Ítem | Tipo |
|---|---|---|
| S8-01 | Pruebas de regresión | Tarea técnica |
| S8-02 | Datos de demostración | Tarea técnica |
| S8-03 | Documentación final y README | Documentación |
| S8-04 | Versión estable v1.0.0 | Tarea técnica |
| S8-05 | Evidencias para la presentación y defensa | Documentación |
| S8-06 | Informe final (máximo 28 páginas) | Documentación |

## 4. Conciliación con el backlog del TP (80 SP → 97 SP)

| Concepto | SP |
|---|---|
| Total estimado en el TP Nro 6 (4 releases) | 80 |
| − Historias institucionales del Release 4 que el prototipo **no** implementa: *Configuración para dependencia* (5), *Validación de migración* (8), *Capacitación y soporte inicial* (5) | −18 |
| = Historias del TP implementadas en el prototipo | 62 |
| + Historias nuevas incorporadas en la Fase 0: S1-04 (3), S3-03 (3), S3-04 (5), S4-03 (3), S5-01 (3), S5-02 (5), S6-01 (5), S6-03 (3), S7-04 (5) | +35 |
| **= Total del backlog del prototipo** | **97** |

Las 3 historias del Release 4 siguen en el plan del proyecto institucional (EDT 1.3, 1.4 y 1.6), pero se gestionan como actividades simuladas fuera del prototipo. El aumento de alcance está registrado en **CR-00** ([control-cambios.md](control-cambios.md)).

## 5. Alertas de planificación

- ~~Sprint 5 con 29 SP~~ → resuelto por **CR-03** (15/10/2026): S5-06 Notificaciones (8 SP) pasa al Sprint 6. Quedan S5 = 21 SP y S6 = 21 SP.
- Los Story Points de las historias **nuevas** son estimaciones iniciales y deben validarse con Planning Poker antes de cada sprint.
- La velocidad del TP (20 SP/sprint) fue supuesta para un equipo institucional de 6 personas; la velocidad del equipo del TP académico se medirá desde el Sprint 1.
