# Evidencias por sprint

**Estado:** Vivo · **Unidades:** 2 a 9

Registro de evidencias verificables para la evaluación y la defensa. Cada evidencia apunta a un artefacto que se puede abrir (commit, PR, ejecución de CI, tarjeta, documento). Las capturas se guardan en `docs/07-evidencias/<sprint>/` y siempre acompañan un enlace, nunca lo reemplazan.

## Fase 0 — Preparación

**Fecha de inicio:** 13/10/2026 · **Fecha de cierre:** 14/10/2026 · **Estado:** cerrada (puerta G1 aprobada)

| Evidencia | Unidad | Artefacto | Estado |
|---|---|---|---|
| Tablero Trello con listas de flujo y lista de control formal, 17 etiquetas y 63 tarjetas con criterios de aceptación | 2, 3 | Trello: *IS3 – Expediente Electrónico* (espacio IS3) | Hecho |
| Estructura de carpetas del proyecto | 8 | Commit `F0-04: estructura inicial de carpetas del proyecto` en `feature/F0-04-estructura-proyecto` | Publicado en GitHub (14/10/2026) |
| Ramas `develop` y `feature/*` | 8 | Repositorio `gabrielvelaz16-dev/is3` | Publicado en GitHub (14/10/2026) |
| Documentación inicial (`docs/`) | 2–9 | Rama `feature/F0-documentacion-inicial` | Publicado en GitHub (14/10/2026) |
| Configuración base: `README.md`, `.gitignore`, `.gitattributes`, `.env.example`, `.node-version` | 8 | Rama `feature/F0-05-07-entorno-y-base-de-datos` | Hecho |
| Versiones de herramientas y librerías fijadas | 8 | [ADR-01](../02-arquitectura/decisiones-tecnicas.md#adr-01--stack-tecnológico) | Hecho |
| Solicitud de cambio CR-00 | 2, 3 | [control-cambios.md](../04-gestion/control-cambios.md) | Aprobada 14/10/2026 |
| Bitácora de IA iniciada | Transversal | [bitacora-ia.md](../bitacora-ia/bitacora-ia.md) | Hecho |
| Verificación del entorno (F0-05): Git 2.55.0, Node 24.20.0, npm 11.19.0, Docker 29.8.2, Compose v5.6.0 | 8 | [instalacion-ejecucion.md](../06-configuracion-devops/instalacion-ejecucion.md) · salida de consola del 14/10/2026 | Hecho |
| PostgreSQL en Docker (F0-07): contenedor `is3-postgres` iniciado y bases `expediente` y `expediente_test` creadas | 8 | `infra/docker/docker-compose.yml` · salida de `docker compose up/ps` y `psql \l` del 14/10/2026 | Hecho |
| Pull requests de la Fase 0 hacia `develop` (#1 estructura, #2 documentación, #3 entorno y base de datos, #4 cierre) | 8 | https://github.com/gabrielvelaz16-dev/is3/pulls | Abiertos; integración por el revisor |
| Puerta G1 aprobada | 7 | [Acta de la puerta G1](fase0/acta-puerta-g1.md) | Hecho 14/10/2026 |

**Observaciones de la Fase 0:**
- El repositorio es público y contiene PDFs con datos personales (riesgo R16). Pendiente de decisión del responsable.
- No fue posible verificar las versiones de las dependencias desde el entorno de la IA (sin acceso al registro de npm); se verificaron en la máquina de desarrollo el 14/10/2026 (ADR-01).
- 14/10/2026: la PC de desarrollo no tenía Git, Node ni Docker; se instalaron con `winget`. PowerShell bloqueaba `npm` por la directiva de ejecución; se resolvió con `RemoteSigned` para el usuario actual.
- 14/10/2026: los commits de la Fase 0 hechos el 13/10 no llegaron a publicarse; se recuperaron del registro de la conversación anterior y se publicaron sin cambios de contenido.
- Decisiones de versiones: TypeScript 6.0.3 en lugar de 7.0.2 (compatibilidad con `typescript-eslint`) y Prisma 7.10.0 en lugar de 8.0.0-rc.22 (versión candidata, no estable).

## Sprints 1 y 2 — Estructura inicial · Base de datos y usuarios

Fechas: 14/10/2026 · Release: R1 · Sprint 2 adelantado por CR-02

| Evidencia | Unidad | Artefacto | Estado |
|---|---|---|---|
| Backend Express con `/api/health`, contrato de errores y logs | 8 | Rama `feature/S1-01-05-backend-base` | Hecho |
| Frontend React con navegación responsive | 8 | Rama `feature/S1-02-04-frontend-base` | Hecho |
| Login, roles, permisos, usuarios y auditoría | 3, 7 | Rama `feature/S2-login-usuarios` | Hecho |
| Pipeline CI en verde (tipos, lint, pruebas, migraciones, seed, auditoría inmutable, build, `npm audit`) | 8 | [Ejecución de CI](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38596214215) | Hecho |
| Resultados reales de pruebas: 70/70, cobertura backend 92,99 % | 7 | [resultados-pruebas.md](../05-calidad-pruebas/resultados-pruebas.md) | Hecho |
| Control de cambios CR-02 | 2, 3 | [control-cambios.md](../04-gestion/control-cambios.md) | Aprobado |
| Deuda técnica DT-05 (vulnerabilidades en la CLI de Prisma) | 7, 8 | [plan-calidad.md](../05-calidad-pruebas/plan-calidad.md) | Registrada |
| Pull requests hacia `develop` | 8 | https://github.com/gabrielvelaz16-dev/is3/pulls | Pendiente de integración |

## Corrección del Sprint 3

Fecha: 15/10/2026 · Release: R2

| Evidencia | Unidad | Artefacto | Estado |
|---|---|---|---|
| CI del Sprint 3 en rojo (el backend no compilaba, 4 pruebas del frontend fallaban) | 7, 9 | [Run 38609784288](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38609784288) | Detectado |
| Defectos D-04 a D-08 (incluida una falla de acceso entre dependencias, D-06) | 7 | [resultados-pruebas.md](../05-calidad-pruebas/resultados-pruebas.md) | Corregidos |
| CI en verde después de la corrección: 76/76 + 20/20 | 7, 8 | [Run 38739999945](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38739999945) · rama `feature/S3-correcciones` | Hecho |
| La CI publica cada prueba fallida como anotación con su motivo | 8, 9 | `scripts/ci/resumen-pruebas.mjs` | Hecho |

## Sprint 4 — Documentos y actuaciones

Fecha: 15/10/2026 · Release: R2 · Detalle: [sprint-04.md](../04-gestion/sprints/sprint-04.md)

| Evidencia | Unidad | Artefacto | Estado |
|---|---|---|---|
| Migración con tablas de solo inserción (`documentos`, `actuaciones`, `cambios_estado`) aplicada en PostgreSQL de CI | 3, 8 | `backend/prisma/migrations/20261015120000_documentos_actuaciones` · [Run 38742104807](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38742104807) | Hecho |
| CI en verde: backend 99/99, frontend 26/26, cobertura 92,14 % | 7, 8 | [Run 38742104807](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38742104807) | Hecho |
| Verificación automática de solo inserción en 4 tablas | 7, 8 | Paso "Verificar tablas de solo inserción" en [Run 38742104807](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38742104807) | Hecho |
| Decisión de subir archivos sin multer | 8 | [ADR-12](../02-arquitectura/decisiones-tecnicas.md#adr-12--subida-de-documentos-sin-multer) | Aprobada por el PO |
| Prueba manual en la PC (adjuntar, descargar, registrar, ver historial) | 7 | — | Pendiente (requiere `npm run db:migrate`) |

## Sprint 5 — Tareas y seguimiento

Fecha: 15/10/2026 · Release: R3 · Detalle: [sprint-05.md](../04-gestion/sprints/sprint-05.md)

| Evidencia | Unidad | Artefacto | Estado |
|---|---|---|---|
| Cambio CR-03 (S5-06 al Sprint 6) aprobado por el PO | 2, 3, 4 | [control-cambios.md](../04-gestion/control-cambios.md) | Hecho |
| Migración de tareas, pases y asignaciones aplicada en PostgreSQL de CI | 3, 8 | `backend/prisma/migrations/20261015150000_tareas_pases` · [run 38745648399](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38745648399) | Hecho |
| CI en verde: backend 115/115, frontend 34/34, cobertura 93,46 % | 7, 8 | [run 38745648399](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38745648399) | Hecho |
| Protección de pases y asignaciones verificada en la base | 7, 8 | Paso "Verificar tablas de solo inserción" en [run 38745648399](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38745648399) | Hecho |
| Velocidad y pronóstico actualizados | 4, 9 | [estimacion-calendario.md](../04-gestion/estimacion-calendario.md) | Hecho |
| Prueba manual en la PC (enviar, recibir, tareas, pendientes) | 7 | — | Pendiente (requiere `npm run db:migrate`) |

## TP de las Unidades 8 y 9

Fecha: 15/10/2026

| Evidencia | Unidad | Artefacto | Estado |
|---|---|---|---|
| Documento del TP (Word y Markdown) | 8, 9 | [tp-unidades-8-9.md](../08-trabajos-practicos/tp-unidades-8-9.md) | Hecho; revisión del responsable pendiente |
| Tablero integrado con datos reales (pruebas, cobertura, velocidad, fallos del pipeline, recuperación, PR integrados) | 9 | [monitoreo-metricas.md §6](../04-gestion/monitoreo-metricas.md#6-medición-al-15102026-después-del-sprint-5) | Hecho |
| Cuatro decisiones basadas en métricas y lecciones aprendidas | 9 | [monitoreo-metricas.md §4 y §5](../04-gestion/monitoreo-metricas.md) | Hecho |
| Defecto D-10 detectado en la prueba manual | 7, 8 | [resultados-pruebas.md](../05-calidad-pruebas/resultados-pruebas.md) | Abierto |

## Plantilla por sprint

```
## Sprint N — <nombre>
Fechas: inicio – fin · Release: Rx · Objetivo:
| Evidencia | Unidad | Artefacto (enlace) | Estado |
Sprint review: historias aceptadas / rechazadas
Retrospectiva: qué funcionó, qué mejorar, acciones (responsable)
Métricas: SP comprometidos / terminados, lead time, pruebas, defectos
Riesgos revisados: cambios en el registro
```
