# Documentación del proyecto IS3 — Sistema de Expediente Electrónico

Trabajo práctico integrador de **Ingeniería de Software III (LCIK)** — TP 6, enfoque **Híbrido**.
Responsable: Carlos Gabriel Velázquez Franco.

Esta carpeta reúne los artefactos de gestión y técnicos del proyecto. Cada documento indica su **estado** y la **unidad** del programa a la que aporta evidencia.

## Índice

| Carpeta | Documento | Unidad | Estado |
|---|---|---|---|
| 01-alcance-requisitos | [alcance.md](01-alcance-requisitos/alcance.md) | 3 | Línea base inicial |
| 01-alcance-requisitos | [requisitos.md](01-alcance-requisitos/requisitos.md) | 3 · 7 | Línea base inicial |
| 01-alcance-requisitos | [resumen-alcance-requisitos.md](01-alcance-requisitos/resumen-alcance-requisitos.md) | 3 · 7 | Aprobado (G1) |
| 02-arquitectura | [arquitectura.md](02-arquitectura/arquitectura.md) | 8 | Inicial |
| 02-arquitectura | [decisiones-tecnicas.md](02-arquitectura/decisiones-tecnicas.md) | 8 | Inicial |
| 02-arquitectura | [contrato-api.md](02-arquitectura/contrato-api.md) | 8 | Vigente (Sprint 1) |
| 03-modelo-datos | [modelo-datos.md](03-modelo-datos/modelo-datos.md) | 3 | Borrador (se refina en Sprint 2) |
| 04-gestion | [enfoque-gobernanza.md](04-gestion/enfoque-gobernanza.md) | 2 | Completo (TP Unidad 2) |
| 04-gestion | [planificacion.md](04-gestion/planificacion.md) | 3 | Completo (TP Unidad 3) |
| 04-gestion | [estimacion-calendario.md](04-gestion/estimacion-calendario.md) | 4 | Completo (TP Unidad 4) + actualización |
| 04-gestion | [backlog.md](04-gestion/backlog.md) | 2 · 3 · 4 | Vivo |
| 04-gestion | [personas-comunicacion.md](04-gestion/personas-comunicacion.md) | 5 | Completo (TP Unidad 5) |
| 04-gestion | [riesgos.md](04-gestion/riesgos.md) | 6 | Completo (TP Unidad 6) — registro vivo |
| 04-gestion | [control-cambios.md](04-gestion/control-cambios.md) | 2 · 3 · 8 | Vivo |
| 04-gestion | [trazabilidad.md](04-gestion/trazabilidad.md) | 2–9 (Anexo A) | Vivo |
| 04-gestion | [monitoreo-metricas.md](04-gestion/monitoreo-metricas.md) | 9 | Vivo (mediciones reales 15 y 16/10/2026) |
| 04-gestion | [historial-cambios.md](04-gestion/historial-cambios.md) | 8 | Vivo |
| 04-gestion/sprints | [sprint-01.md](04-gestion/sprints/sprint-01.md) | 3 · 9 | En curso |
| 04-gestion/sprints | [sprint-02.md](04-gestion/sprints/sprint-02.md) | 3 · 9 | En curso (CR-02) |
| 04-gestion/sprints | [sprint-04.md](04-gestion/sprints/sprint-04.md) · [sprint-05.md](04-gestion/sprints/sprint-05.md) · [sprint-06.md](04-gestion/sprints/sprint-06.md) | 3 · 9 | Terminados con CI en verde; prueba manual pendiente |
| 05-calidad-pruebas | [plan-calidad.md](05-calidad-pruebas/plan-calidad.md) | 7 | Plan inicial |
| 05-calidad-pruebas | [plan-pruebas.md](05-calidad-pruebas/plan-pruebas.md) | 7 | Plan inicial |
| 05-calidad-pruebas | [resultados-pruebas.md](05-calidad-pruebas/resultados-pruebas.md) | 7 | Sin ejecuciones todavía |
| 06-configuracion-devops | [plan-configuracion.md](06-configuracion-devops/plan-configuracion.md) | 8 | Vigente |
| 06-configuracion-devops | [instalacion-ejecucion.md](06-configuracion-devops/instalacion-ejecucion.md) | 8 | Se verifica en Sprint 1 |
| 07-evidencias | [evidencias.md](07-evidencias/evidencias.md) | 2–9 | Vivo |
| 07-evidencias/fase0 | [acta-puerta-g1.md](07-evidencias/fase0/acta-puerta-g1.md) | 7 | Aprobada |
| 08-trabajos-practicos | [tp-unidades-8-9.md](08-trabajos-practicos/tp-unidades-8-9.md) · [versión Word](08-trabajos-practicos/TP_Unidades_8_y_9_Expediente_Electronico.docx) | 8 · 9 | Entregable (15/10/2026) |
| bitacora-ia | [bitacora-ia.md](bitacora-ia/bitacora-ia.md) | Transversal (Anexo D) | Vivo |

## Convenciones

- **Códigos de trabajo:** `CF-xx` (control formal), `F0-xx` (Fase 0), `Sx-yy` (Sprint x). Son los mismos códigos de las tarjetas del tablero de Trello *IS3 – Expediente Electrónico* y se usan en ramas y mensajes de commit.
- **Requisitos:** `RF-xx` funcionales, `RNF-xx` no funcionales.
- **Riesgos:** `Rxx` amenazas, `Oxx` oportunidades.
- **Estados de documento:** *Línea base* (aprobado; solo cambia por control de cambios), *Vivo* (se actualiza en cada sprint), *Plan inicial* (se completa con evidencia real), *Borrador*.
- Ningún documento contiene resultados inventados: lo que todavía no se ejecutó se marca como **pendiente**.
