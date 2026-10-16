# Matriz de trazabilidad

**Estado:** Vivo · **Unidades:** 2 a 9 · **Referencia:** Anexo A de la guía de TP

## 1. Trazabilidad cruzada (paquete → release)

Cadena: **Paquete de trabajo → Épica → Historia → Requisito → Prueba → Release → Versión/commit**. Las columnas *Commit / PR* se completan cuando el trabajo se integra.

| Paquete EDT | Épica | Historia (Trello) | Requisito | Prueba | Release | Commit / PR |
|---|---|---|---|---|---|---|
| 1.5.1 Control de acceso | E2 Gestión de acceso | S2-02 Iniciar y cerrar sesión | RF-01, RNF-01 | PR-01 | R1 | pendiente |
| 1.5.1 Control de acceso | E2 | S2-03 Roles y autorización | RF-02, RNF-02 | PR-02 | R1 | pendiente |
| 1.2.1 Definición de roles | E2 | S2-05 Gestionar usuarios | RF-03 | PR-03 | R1 | pendiente |
| 1.5.1 / riesgo R01 | E2 | S2-04 Adaptador de identidad | RF-23 | PR-23 | R1 | pendiente |
| 1.5.2 Validaciones de seguridad | E2 | S2-07 Auditoría base | RF-20, RNF-03 | PR-20 | R1 | pendiente |
| 1.7 Desarrollo | E3 Expedientes | S3-01 Crear expediente | RF-04 | PR-04 | R2 | PR #9 + correcciones PR #10 |
| 1.7 Desarrollo | E3 | S3-05 Número único | RF-05 | PR-05 | R2 | PR #9 + correcciones PR #10 |
| 1.7 Desarrollo | E3 | S3-02 / S3-03 Consultar y modificar | RF-06 | PR-06 | R2 | PR #9 + correcciones PR #10 |
| 1.7 Desarrollo | E3 | S3-04 Listado con filtros | RF-07, RNF-09 | PR-07 | R2 | PR #9 + correcciones PR #10 |
| 1.7 Desarrollo | E4 Documentos | S4-01 / S4-02 Registrar documento | RF-08, RNF-04 | PR-08 | R2 | PR #11 (`feature/S4-documentos-actuaciones`) |
| 1.5.1 / riesgo R06 | E4 | S4-05 Control de acceso a documentos | RF-09 | PR-09 | R2 | PR #11 (`feature/S4-documentos-actuaciones`) |
| 1.7 Desarrollo | E4 | S4-03 Actuaciones | RF-10 | PR-10 | R2 | PR #11 (`feature/S4-documentos-actuaciones`) |
| 1.7 Desarrollo | E4 | S4-04 Historial | RF-11 | PR-11 | R2 | PR #11 (`feature/S4-documentos-actuaciones`) |
| 1.7 Desarrollo | E5 Flujo documental | S5-01 Asignar responsables | RF-12 | PR-12 | R3 | PR #12 (`feature/S5-tareas-seguimiento`) |
| 1.7 Desarrollo | E5 | S5-02 Tareas y vencimientos | RF-13 | PR-13 | R3 | PR #12 (`feature/S5-tareas-seguimiento`) |
| 1.7 Desarrollo / CR-01 | E5 | S5-03 Cambiar estado | RF-14 | PR-14 | R3 | PR #12 (`feature/S5-tareas-seguimiento`) |
| 1.6.2 Despliegue por dependencias | E5 | S5-04 Enviar expediente | RF-15 | PR-15 | R3 | PR #12 (`feature/S5-tareas-seguimiento`) |
| 1.6.2 Despliegue por dependencias | E5 | S5-05 Recibir expediente | RF-16 | PR-16 | R3 | PR #12 (`feature/S5-tareas-seguimiento`) |
| 1.7 Desarrollo | E5 | S5-06 Notificaciones | RF-17 | PR-17 | R3 | PR #14 (`feature/S6-dashboard-reportes`, CR-03) |
| 1.7 Desarrollo | E6 Reportes | S6-01 Dashboard (+ S6-04 verificación) | RF-18, RNF-08 | PR-18 | R3 | PR #14 (`feature/S6-dashboard-reportes`) |
| 1.7 Desarrollo | E6 | S6-02 / S6-03 Reportes | RF-19 | PR-19 | R3 | PR #14 (`feature/S6-dashboard-reportes`) |
| 1.5.2 Validaciones de seguridad | E7 Calidad | S7-03 Auditoría | RF-21, RNF-03 | PR-21 | R4 | pendiente |
| 1.4 Migración (preservación) | E7 | S7-04 Backup y restauración | RF-22, RNF-07 | PR-22 | R4 | pendiente |
| 1.6 Despliegue | E8 Entrega | S8-04 Versión v1.0.0 | RNF-12 | PR-24 (regresión) | R4 | pendiente |

Ejemplos originales del TP (Unidad 3):

| Paquete | Épica | Historia | Requisito | Prueba | Release |
|---|---|---|---|---|---|
| Seguridad | Gestión de acceso | Iniciar sesión | Acceso autorizado | Prueba de login | R1 |
| Migración | Migración de expedientes | Migrar datos | Conservación de información | Prueba de migración | R2 |
| Despliegue | Implementación | Usar sistema en dependencia | Sistema operativo | Prueba de aceptación | R3 |

## 2. Anexo A — Trazabilidad por unidad

| Unidad | Decisión / actividad | Artefacto o enlace | Criterio de aceptación |
|---|---|---|---|
| 2 | Selección del enfoque híbrido y matriz predictivo/adaptativo/compartido | [enfoque-gobernanza.md](enfoque-gobernanza.md); listas y etiquetas de Trello | Cada componente clasificado y justificado; reflejado en Trello |
| 3 | EDT, backlog, dependencias, releases ↔ sprints | [planificacion.md](planificacion.md), [backlog.md](backlog.md), Trello | Toda historia pertenece a una épica, un paquete y un release |
| 4 | Estimación macro + SP + velocidad | [estimacion-calendario.md](estimacion-calendario.md) | Técnica, entradas, cálculo y supuestos explícitos; velocidad real registrada por sprint |
| 5 | Roles, RACI, comunicación, capacitación, conflicto | [personas-comunicacion.md](personas-comunicacion.md) | Cada actividad con un único "A" |
| 6 | Registro de riesgos con responsables en dos niveles | [riesgos.md](riesgos.md) | ≥ 15 riesgos/oportunidades; revisión registrada por sprint |
| 7 | Plan de calidad, DoD, pruebas | [plan-calidad.md](../05-calidad-pruebas/plan-calidad.md), [plan-pruebas.md](../05-calidad-pruebas/plan-pruebas.md) | Matriz de calidad con métrica y evidencia; pruebas en CI |
| 8 | Ramas, etiquetas, CI, ambientes | [plan-configuracion.md](../06-configuracion-devops/plan-configuracion.md), [TP Unidades 8 y 9](../08-trabajos-practicos/tp-unidades-8-9.md), GitHub | Cambio trazable desde tarjeta → commit → PR → tag |
| 9 | Tablero integrado y revisiones | [monitoreo-metricas.md](monitoreo-metricas.md), [TP Unidades 8 y 9](../08-trabajos-practicos/tp-unidades-8-9.md) | Métricas con línea base, umbral y una decisión tomada |
