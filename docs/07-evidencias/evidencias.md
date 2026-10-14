# Evidencias por sprint

**Estado:** Vivo · **Unidades:** 2 a 9

Registro de evidencias verificables para la evaluación y la defensa. Cada evidencia apunta a un artefacto que se puede abrir (commit, PR, ejecución de CI, tarjeta, documento). Las capturas se guardan en `docs/07-evidencias/<sprint>/` y siempre acompañan un enlace, nunca lo reemplazan.

## Fase 0 — Preparación

**Fecha de inicio:** 13/10/2026 · **Estado:** en curso

| Evidencia | Unidad | Artefacto | Estado |
|---|---|---|---|
| Tablero Trello con listas de flujo y lista de control formal, 17 etiquetas y 63 tarjetas con criterios de aceptación | 2, 3 | Trello: *IS3 – Expediente Electrónico* (espacio IS3) | Hecho |
| Estructura de carpetas del proyecto | 8 | Commit `F0-04: estructura inicial de carpetas del proyecto` en `feature/F0-04-estructura-proyecto` | Hecho localmente; pendiente de publicar en GitHub (requiere vincular la cuenta) |
| Ramas `develop` y `feature/*` | 8 | Repositorio `gabrielvelaz16-dev/is3` | Pendiente de publicar |
| Documentación inicial (`docs/`) | 2–9 | Rama `feature/F0-documentacion-inicial` | Hecho localmente; pendiente de publicar |
| Solicitud de cambio CR-00 | 2, 3 | [control-cambios.md](../04-gestion/control-cambios.md) | Pendiente de decisión |
| Bitácora de IA iniciada | Transversal | [bitacora-ia.md](../bitacora-ia/bitacora-ia.md) | Hecho |
| Verificación del entorno (F0-05) | 8 | [instalacion-ejecucion.md](../06-configuracion-devops/instalacion-ejecucion.md) | Pendiente |
| PostgreSQL en Docker (F0-07) | 8 | `infra/docker/docker-compose.yml` | Pendiente |
| Puerta G1 aprobada | 7 | Acta de aprobación | Pendiente |

**Observaciones de la Fase 0:**
- El repositorio es público y contiene PDFs con datos personales (riesgo R16). Pendiente de decisión del responsable.
- No fue posible verificar las versiones de las dependencias desde el entorno de la IA (sin acceso al registro de npm); se verifican en la máquina de desarrollo (DT-02).

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
