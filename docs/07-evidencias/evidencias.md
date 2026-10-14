# Evidencias por sprint

**Estado:** Vivo · **Unidades:** 2 a 9

Registro de evidencias verificables para la evaluación y la defensa. Cada evidencia apunta a un artefacto que se puede abrir (commit, PR, ejecución de CI, tarjeta, documento). Las capturas se guardan en `docs/07-evidencias/<sprint>/` y siempre acompañan un enlace, nunca lo reemplazan.

## Fase 0 — Preparación

**Fecha de inicio:** 13/10/2026 · **Estado:** en curso

| Evidencia | Unidad | Artefacto | Estado |
|---|---|---|---|
| Tablero Trello con listas de flujo y lista de control formal, 17 etiquetas y 63 tarjetas con criterios de aceptación | 2, 3 | Trello: *IS3 – Expediente Electrónico* (espacio IS3) | Hecho |
| Estructura de carpetas del proyecto | 8 | Commit `F0-04: estructura inicial de carpetas del proyecto` en `feature/F0-04-estructura-proyecto` | Publicado en GitHub (14/10/2026) |
| Ramas `develop` y `feature/*` | 8 | Repositorio `gabrielvelaz16-dev/is3` | Publicado en GitHub (14/10/2026) |
| Documentación inicial (`docs/`) | 2–9 | Rama `feature/F0-documentacion-inicial` | Publicado en GitHub (14/10/2026) |
| Configuración base: `README.md`, `.gitignore`, `.gitattributes`, `.env.example`, `.node-version` | 8 | Rama `feature/F0-05-07-entorno-y-base-de-datos` | Hecho |
| Versiones de herramientas y librerías fijadas | 8 | [ADR-01](../02-arquitectura/decisiones-tecnicas.md#adr-01--stack-tecnológico) | Hecho |
| Solicitud de cambio CR-00 | 2, 3 | [control-cambios.md](../04-gestion/control-cambios.md) | Pendiente de decisión |
| Bitácora de IA iniciada | Transversal | [bitacora-ia.md](../bitacora-ia/bitacora-ia.md) | Hecho |
| Verificación del entorno (F0-05): Git 2.55.0, Node 24.20.0, npm 11.19.0, Docker 29.8.2, Compose v5.6.0 | 8 | [instalacion-ejecucion.md](../06-configuracion-devops/instalacion-ejecucion.md) · salida de consola del 14/10/2026 | Hecho |
| PostgreSQL en Docker (F0-07) | 8 | `infra/docker/docker-compose.yml` | Archivo creado y validado (`docker compose config`); pendiente arranque en la PC |
| Puerta G1 aprobada | 7 | Acta de aprobación | Pendiente |

**Observaciones de la Fase 0:**
- El repositorio es público y contiene PDFs con datos personales (riesgo R16). Pendiente de decisión del responsable.
- No fue posible verificar las versiones de las dependencias desde el entorno de la IA (sin acceso al registro de npm); se verificaron en la máquina de desarrollo el 14/10/2026 (ADR-01).
- 14/10/2026: la PC de desarrollo no tenía Git, Node ni Docker; se instalaron con `winget`. PowerShell bloqueaba `npm` por la directiva de ejecución; se resolvió con `RemoteSigned` para el usuario actual.
- 14/10/2026: los commits de la Fase 0 hechos el 13/10 no llegaron a publicarse; se recuperaron del registro de la conversación anterior y se publicaron sin cambios de contenido.
- Decisiones de versiones: TypeScript 6.0.3 en lugar de 7.0.2 (compatibilidad con `typescript-eslint`) y Prisma 7.10.0 en lugar de 8.0.0-rc.22 (versión candidata, no estable).

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
