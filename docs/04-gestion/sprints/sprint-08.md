# Sprint 8 — Entrega

**Release:** R4 · **Estado:** en curso
**Fecha de inicio:** 19/10/2026 · **Rama:** `feature/S8-entrega` (sale de `feature/S8-UI-interfaz`)
**Compromiso:** solo tareas técnicas y de documentación (no quedan SP en el backlog).

## 1. Objetivo

Dejar una versión estable v1.0.0, probada y documentada, con las evidencias listas para la presentación.

## 2. Tareas y criterios de aceptación

| ID | Tarea | Criterios de aceptación | Resultado |
|---|---|---|---|
| S8-01 | Pruebas de regresión | La CI completa en verde (pruebas, permisos, solo inserción, indicadores, respaldo, rendimiento) sobre los datos de demostración, sin bajar la cobertura | ✅ [run 39252901587](https://github.com/gabrielvelaz16-dev/is3/actions/runs/39252901587): backend 225/225 (líneas 94,01 %), frontend 51/51, 97 indicadores sin diferencias, restauración de 225 filas y 4 documentos |
| S8-02 | Datos de demostración | Se cargan por la API (con historial y auditoría reales), cubren todos los estados, vencidos y por vencer, y no se duplican si se ejecuta de nuevo | ✅ 16 expedientes: Borrador 3, En trámite 7, En revisión 3, Resuelto 2, Archivado 1. La CI lo ejecuta dos veces y verifica que no duplica |
| S8-03 | Documentación final y README | El README permite instalar desde cero; manual de usuario; `sprint-03.md` (faltaba) y este documento | ✅ [README](../../../README.md), [manual de usuario](../../manual-usuario.md), [sprint-03.md](sprint-03.md) |
| S8-04 | Versión estable v1.0.0 | CHANGELOG; etiqueta `v1.0.0` sobre un commit integrado en `main` con la CI en verde | ⏳ [CHANGELOG](../../../CHANGELOG.md) listo y versión `1.0.0` en los `package.json` (la muestra el estado del sistema). La etiqueta espera la integración de los PR (la hace el responsable) |
| S8-05 | Evidencias para la presentación | Tabla final de evidencias con enlaces, capturas con los datos de demostración, métricas y lecciones aprendidas | ✅ [evidencias.md](../../07-evidencias/evidencias.md#sprint-8--entrega) y 16 capturas finales con los datos de demostración ([capturas/feature-S8-entrega-3195401](https://github.com/gabrielvelaz16-dev/is3/tree/capturas/feature-S8-entrega-3195401)) |
| S8-06 | Informe final (máximo 28 páginas) | Informe en Word con el formato de los TP anteriores | ✅ Borrador para revisión: [Informe_Final_TP6_Expediente_Electronico.docx](../../08-trabajos-practicos/Informe_Final_TP6_Expediente_Electronico.docx), 17 páginas, Unidades 2 a 9, evento de cambio y Anexos A a D. Falta la revisión del responsable |

Además se corrigió **D-12**: el historial y los mensajes de error mostraban los nombres internos de los estados (`EN_TRAMITE`). Ahora dicen "En trámite" y los textos están en un solo lugar (`backend/src/shared/etiquetas.ts`).

## 3. Archivos principales

| Parte | Archivos |
|---|---|
| Datos de demostración | `scripts/demo/cargar-demo.mjs` (antes `scripts/capturas/preparar-demo.mjs`), script `demo:cargar` en `backend/package.json`, paso de la CI "Datos de demostración por la API, dos veces" |
| D-12 | `backend/src/shared/etiquetas.ts`, `historial.service.ts`, `expedientes.service.ts`, `tareas.service.ts`, `reportes.service.ts`; pruebas `tests/unit/etiquetas.test.ts` (4) y aserción nueva en `expedientes.test.ts` |
| Documentación | `README.md`, `CHANGELOG.md`, `docs/manual-usuario.md`, `docs/04-gestion/sprints/sprint-03.md`, este documento |
| Capturas | El flujo de capturas también corre en `feature/S8-entrega`, con los datos de demostración |

## 4. Pendientes que no puede cerrar la IA

| Pendiente | Responsable | Por qué |
|---|---|---|
| Integrar los PR #1 a #17 y crear `v1.0.0` | Responsable del proyecto | GitHub exige revisión humana para integrar |
| Prueba de usabilidad con 3 personas (PR-27) | Responsable del proyecto | Necesita personas reales; sus resultados no se pueden inventar |
| Prueba manual completa en la PC | Responsable del proyecto | La IA no tiene acceso a la PC para ejecutar el sistema |
| DT-05 (prisma 7.10.1) | Responsable del proyecto | El entorno de la IA no llega al registro de npm |
