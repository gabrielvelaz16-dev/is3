# Sprint 6 — Dashboard, reportes y notificaciones

**Release:** R3 · **Estado:** Desarrollo terminado con CI en verde; pendiente la prueba manual en la PC y la integración de los PR #1 a #14 · **Fecha:** 16/10/2026
**Compromiso:** 21 SP:
- S5-06: 8 SP. Viene del Sprint 5 por [CR-03](../control-cambios.md#cr-03--mover-las-notificaciones-internas-al-sprint-6).
- S6-01: 5 SP.
- S6-02: 5 SP.
- S6-03: 3 SP. Es lo primero que se recorta si el sprint se atrasa, según [CR-04](../control-cambios.md#cr-04--orden-de-recorte-del-sprint-6).

## 1. Objetivo

Que cada usuario vea estadísticas y reportes confiables de los expedientes que le corresponden, y que el sistema le avise cuando le asignan algo o le llega un expediente.

## 2. Tareas y criterios de aceptación

| ID | Tarea | SP | Criterios de aceptación | Resultado |
|---|---|---|---|---|
| S6-00 | Preparación | — | Integrar los PR #1 a #13, crear etiquetas y corregir D-10 | D-10 corregido (`predev`). ⏳ La integración de los PR la hace el responsable: la herramienta de IA no puede fusionar PR sin una revisión humana. Las etiquetas se crean después |
| S5-06 | Notificaciones internas | 8 | Se avisa al asignar un responsable, al crear una tarea y al enviar un pase (a quienes pueden recibir en la dependencia destino). La campana muestra cuántos avisos hay sin leer. Solo el destinatario ve y marca sus avisos | ✅ Quien hace la acción no se avisa a sí mismo. Un aviso que falla no revierte la operación |
| S6-01 | Dashboard | 5 | Totales por estado, prioridad y dependencia; vencidos, por vencer, en tránsito y tareas vencidas. El alcance depende del permiso | ✅ Se agregó "por recibir" y la distribución por tipo |
| S6-02 | Reportes con filtros | 5 | Filtros de fechas, estado, dependencia, tipo y prioridad. Listado y resumen con totales. Validación en el frontend y el backend | ✅ Pedir otra dependencia sin permiso da 403; un rango de fechas invertido da 400 |
| S6-03 | Exportar reportes | 3 | CSV con los mismos filtros que abre en Excel con tildes. Cada exportación queda en la auditoría | ✅ Protección contra fórmulas (`=`, `+`, `-`, `@`); máximo de 5000 filas |
| S6-04 | Verificar indicadores | — | Cada número del dashboard se compara con un conteo directo en la base, en la CI | ✅ Paso "Verificar indicadores del dashboard contra la base". Falla si un número difiere o si no hay datos |
| S6-05 | Tablero de métricas del proyecto | — | Completar las métricas que faltaban (lead time) y actualizar la medición | ✅ Lead time medido desde el historial de Trello, con sus limitaciones ([monitoreo §6](../monitoreo-metricas.md#6-medición-al-15102026-después-del-sprint-5)) |

## 3. Decisiones

- **El alcance lo decide el servidor:** el dashboard y los reportes aplican la misma regla que el listado. Sin `expedientes.consultar_todas`, el usuario solo ve su dependencia.
- **Avisos sin tiempo real:** el frontend consulta cada 60 segundos. Para un prototipo local no hace falta WebSockets.
- **Un aviso no es auditoría:** si guardar un aviso falla, la operación principal sigue y el error queda en el log. La auditoría, en cambio, sigue siendo obligatoria (ADR-07).
- **CSV y no PDF:** el CSV se abre en Excel y no necesita librerías nuevas. Usa BOM UTF-8 y separador `;`, que es la configuración regional en español.
- **Fechas de los reportes:** el filtro es por fecha de creación, en la hora local del servidor, y ambos extremos son inclusivos.

## 4. Archivos principales

| Capa | Archivos |
|---|---|
| Persistencia | `prisma/schema.prisma`, migración `20261016120000_notificaciones`, `src/database/repositories.ts` (`NotificacionesRepo`, `EstadisticasRepo`, filtros de reporte), `src/database/prisma/repos.ts` |
| Negocio | `src/modules/notificaciones/`, `src/modules/estadisticas/`, `src/modules/reportes/`, avisos en `expedientes`, `tareas` y `pases`, `src/shared/fechas.ts` |
| API | `src/api/routes/reportes.routes.ts`, `src/api/schemas/reportes.schemas.ts` |
| Frontend | `src/components/Dashboard.tsx`, `src/components/NotificacionesCampana.tsx`, `src/pages/ReportesPage.tsx`, `src/services/reportes.ts` |
| Verificación | `prisma/verificar-indicadores.ts` y su paso en `.github/workflows/ci.yml` |
| Pruebas | Backend `tests/integration/reportes.test.ts` (15 casos) · Frontend `tests/reportes.test.tsx` (10 casos) y `navigation.test.tsx` |

## 5. Riesgos

| Riesgo | Qué pasó |
|---|---|
| Sobrecarga (R13): 21 SP contra una velocidad de 16 | Se completaron los 21 SP y no hizo falta aplicar el CR-04 |
| Indicadores que no coinciden con los datos | S6-04 los compara contra la base en cada ejecución de la CI |
| Pruebas que dependen de la fecha | **D-11:** las pruebas del Sprint 5 fallaron al día siguiente. La cookie de sesión vencía según el reloj real del agente de pruebas, mientras el reloj de la prueba estaba fijo en el 15/10. Se corrigió la prueba, no el sistema |
| Integración pendiente de 14 PR | Sigue abierta: ver S6-00 |

## 6. Resultado del sprint

| Métrica | Valor |
|---|---|
| SP terminados | 21 de 21 |
| Velocidad promedio (últimos 3 sprints) | (11 + 21 + 21) / 3 = **17,7 SP**. Quedan 13 SP (Sprint 7), así que el pronóstico es **1 sprint**, igual que lo disponible |
| Pruebas | Backend 130/130 · Frontend 45/45 ([run 38901767797](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38901767797)) |
| Cobertura backend | Líneas 93,89 % · sentencias 92,07 % · funciones 94,52 % · ramas 86,4 % |
| Ejecuciones de CI del sprint (hasta el código) | 6: 4 fallidas, 1 cancelada y 1 en verde. Fallos: lint del script nuevo (1) y D-11 (3: la detección y dos ejecuciones de diagnóstico). De rojo a verde en 10 minutos |
| Defectos | D-10 corregido · D-11 corregido (de prueba, no del sistema) |

### Cómo probarlo en la PC

```bash
git fetch origin
git checkout feature/S6-dashboard-reportes
cd backend
npm install
npm run db:migrate     # crea la tabla notificaciones
npm run db:seed        # los expedientes de demo nuevos traen vencimientos
npm run dev            # ahora regenera el cliente de Prisma solo (D-10)
# otra terminal
cd frontend && npm install && npm run dev
```

Recorrido sugerido. La contraseña es `12345` para todos los usuarios.

1. Entrá como `admin`. En *Inicio* vas a ver las estadísticas de toda la institución.
2. Entrá como `jefe` (Asesoría Jurídica):
   - asigná a `funcionario` como responsable de un expediente;
   - creale una tarea.
3. Entrá como `funcionario`. La campana muestra 2 avisos; al abrir uno, te lleva al expediente.
4. Entrá como `mesa` y enviá un expediente a Asesoría Jurídica. Después, como `jefe`, la campana avisa que llegó.
5. Entrá como `auditor` y abrí *Reportes*:
   - filtrá por estado y dependencia;
   - exportá a CSV y abrí el archivo en Excel.

Si en la base ya había expedientes de demostración de antes, no tienen fechas de vencimiento: el seed no modifica expedientes que ya existen. Para ver vencidos y por vencer, cargá un vencimiento a mano en un expediente.

### Pendiente para el cierre formal

- Integración de los PR #1 a #14 por el responsable y creación de las etiquetas `baseline-v1`, `v0.1.0` y `v0.2.0`.
- Prueba manual en la PC y registro en las [evidencias](../../07-evidencias/evidencias.md).
- **DT-05:** la auditoría de la CI sugiere actualizar a `prisma@7.10.1` para resolver las vulnerabilidades de la CLI. Se evalúa en el Sprint 7.
