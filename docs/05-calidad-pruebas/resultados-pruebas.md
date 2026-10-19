# Resultados de pruebas

**Estado:** Con ejecuciones reales desde el 14/10/2026 (GitHub Actions) · **Unidad:** 7

Este documento registra **solo resultados reales** obtenidos de la ejecución de las pruebas (localmente o en GitHub Actions). No se completa con valores supuestos.

## 1. Resumen por sprint

| Sprint | Fecha | Pruebas ejecutadas | Aprobadas | Fallidas | Cobertura `modules/` + `security/` | Ejecución CI (enlace) |
|---|---|---|---|---|---|---|
| Fase 0 | 13/10/2026 | 0 | — | — | — | No hay código todavía |
| S1 + S2 (CR-02) | 14/10/2026 | Backend 50 · Frontend 20 | 70 (50 + 20) | 0 | Backend total: líneas 92,99 %, sentencias 92,28 %, funciones 92,13 %, ramas 89,09 % (meta RNF-10: ≥ 70 %) | [Run 38596214215](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38596214215) · commit `49f0933` |
| S3 | 14/10/2026 | — | — | Falló la verificación de tipos (backend) y 4 pruebas (frontend) | — | [Run 38609784288](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38609784288) · defectos D-04 a D-07 |
| S3 corregido | 15/10/2026 | Backend 76 · Frontend 20 | 96 (76 + 20) | 0 | Backend total: líneas 93,92 %, sentencias 91,85 %, funciones 93,39 %, ramas 86,57 % | [Run 38739999945](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38739999945) · commit `bd4cc9f` |
| S4 | 15/10/2026 | Backend 99 · Frontend 26 | 125 (99 + 26) | 0 | Backend total: líneas 92,14 %, sentencias 90,43 %, funciones 92,95 %, ramas 84,56 % | [Run 38742104807](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38742104807) · commit `cbfd2ea` |
| S5 | 15/10/2026 | Backend 115 · Frontend 34 | 149 (115 + 34) | 0 | Backend total: líneas 93,46 %, sentencias 91,37 %, funciones 93,64 %, ramas 85,46 % | [Run 38745648399](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38745648399) · commit `5f2a500` |
| S6 | 16/10/2026 | Backend 130 · Frontend 45 | 175 (130 + 45) | 0 | Backend total: líneas 93,89 %, sentencias 92,07 %, funciones 94,52 %, ramas 86,4 % | [run 38901767797](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38901767797) · verificación de indicadores (S6-04) en verde |
| S7 | 16/10/2026 | Backend 221 · Frontend 51 | 272 (221 + 51) | 0 | Backend total: líneas 94 %, sentencias 92,33 %, funciones 95,57 %, ramas 87,23 % | [run 38909943384](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38909943384) · restauración verificada (99 filas, 1 documento) · rendimiento p95 ≤ 34 ms |
| S8 (regresión) | 19/10/2026 | Backend 225 · Frontend 51 | 276 (225 + 51) | 0 | Backend total: líneas 94,01 %, sentencias 92,35 %, funciones 95,59 %, ramas 87,42 % | [run 39252901587](https://github.com/gabrielvelaz16-dev/is3/actions/runs/39252901587) · 16 expedientes de demostración (carga doble sin duplicar) · 97 indicadores sin diferencias · restauración de 225 filas y 4 documentos · p95 ≤ 32 ms |

## 2. Detalle por caso

| ID | Fecha | Resultado | Observaciones / defecto asociado |
|---|---|---|---|
| PR-01 | 14/10/2026 | Aprobada | `backend/tests/integration/auth.test.ts`: login correcto con cookie httpOnly, logout invalida la sesión en el servidor, 401 con mensaje único, contraseña ausente de la auditoría. |
| PR-02 | 14/10/2026 | Aprobada | `usuarios.test.ts`: 401 sin sesión y 403 sin permiso en todas las rutas de usuarios. |
| PR-03 | 14/10/2026 | Aprobada | `usuarios.test.ts`: crear, editar rol, desactivar, cambiar contraseña; 409 por usuario o correo repetido. |
| PR-20 | 14/10/2026 | Aprobada (parcial) | Login, logout y cambios de usuarios quedan auditados; en CI la base rechazó `DELETE FROM auditoria` (trigger ADR-07). La consulta de auditoría (RF-21) se prueba en el Sprint 7. |
| PR-23 | 14/10/2026 | Aprobada | Login a través de `LocalIdentityProvider` (por usuario y por correo). |
| S1-01/S1-05 | 14/10/2026 | Aprobada | `health.test.ts`, `errors.test.ts`: `/api/health` 200/503, contrato de error, 500 sin trazas ni credenciales, 413, JSON inválido. |
| S1-03/S1-04 | 14/10/2026 | Aprobada | Frontend `navigation.test.tsx`: menú, rutas, 404, menú responsive, estado de `/api/health`. |
| PR-04 a PR-07 | 15/10/2026 | Aprobada | `expedientes.test.ts` (26 casos): alta con número único, 400 de validación y responsable inexistente, 403 entre dependencias al consultar y modificar, 409 por transición inválida o expediente archivado, búsqueda, filtros y paginación. |
| PR-08 | 15/10/2026 | Aprobada | `anexos.test.ts`: PDF y PNG aceptados con hash SHA-256 y nombre interno UUID oculto; 400 para tipo no permitido, ejecutable renombrado como `.pdf`, extensión distinta del tipo, archivo vacío o sin nombre; 413 por tamaño; rutas quitadas del nombre. |
| PR-09 | 15/10/2026 | Aprobada | Descarga íntegra con `Content-Disposition` y `nosniff`; 403 para otra dependencia; 404 con id de otro expediente; archivo alterado → 500 genérico y auditoría `FALLO`. |
| PR-10 | 15/10/2026 | Aprobada | Actuaciones y observaciones con fecha y autor del servidor; 400 para texto vacío, tipo inválido o `autorId` enviado por el cliente; sin rutas de edición ni borrado; 409 en expediente archivado. |
| PR-11 | 15/10/2026 | Aprobada | Historial: creación, cambios de estado, documentos y observaciones en orden cronológico; una modificación sin cambio de estado no agrega eventos. Frontend `anexos.test.tsx` (6 casos). |
| PR-12 | 15/10/2026 | Aprobada | `seguimiento.test.ts`: el jefe asigna y quita responsable (queda en el historial); 403 sin `responsables.asignar`; 400 para usuario de otra dependencia o inexistente. |
| PR-13 | 15/10/2026 | Aprobada | Tarea con responsable y vencimiento; 400 sin vencimiento, con vencimiento pasado o asignada a otra dependencia; avance hasta completada con fecha de cierre; 409 al cambiar una tarea cerrada; 403 para usuarios ajenos. |
| PR-14 | 15/10/2026 | Aprobada | Cambio de estado por ruta propia con motivo en el historial; 403 sin `estados.cambiar`; 409 transición inválida; el PATCH general rechaza `estado` y `responsableId` (400). |
| PR-15 | 15/10/2026 | Aprobada | Envío: el borrador pasa a en trámite, el expediente queda en tránsito y no admite cambios ni actuaciones (409) ni un segundo envío; 400 destino igual, inactivo o inexistente y sin motivo; 403 desde otra dependencia. |
| PR-16 | 15/10/2026 | Aprobada | Bandeja de la dependencia destino, consulta antes de recibir, 403 si recibe el origen, 409 al recibir dos veces; al recibir cambia la dependencia y se quita el responsable; historial con pase enviado y recibido. |
| PR-17 | 15/10/2026 | Aprobada (parcial, CR-03) | Pendientes: tareas abiertas con alerta `POR_VENCER` que pasa a `VENCIDA` al avanzar el reloj, recibidos sin confirmar y expedientes por vencer. Las notificaciones internas quedan para el Sprint 6. Frontend `seguimiento.test.tsx` (8 casos). |
| PR-17 | 16/10/2026 | Aprobada | Completa el caso del Sprint 5 con las notificaciones (S5-06). `reportes.test.ts`: aviso al responsable asignado y no a quien asigna; aviso de tarea nueva; un pase avisa a quienes pueden recibir en la dependencia destino y a nadie de otras; 404 al marcar un aviso ajeno o inexistente; marcar uno y todos. Frontend: campana con contador, abrir un aviso lo marca y navega, marcar todas |
| PR-18 | 16/10/2026 | Aprobada | Dashboard: alcance institución con `consultar_todas` y dependencia sin él; totales por estado, prioridad, tipo y dependencia; vencidos, por vencer, en tránsito, por recibir, tareas abiertas y vencidas; un resuelto no cuenta como vencido. **S6-04:** en la CI, cada indicador coincide con un conteo SQL directo para la institución y para cada dependencia: 91 comparaciones, 0 diferencias ([run 38902405048](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38902405048)) ([run 38901767797](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38901767797)) |
| PR-19 | 16/10/2026 | Aprobada | Reportes: 403 sin `reportes.consultar` y para otra dependencia; filtros por prioridad, tipo, dependencia y fechas; resumen igual al total del listado; paginación; 400 para fecha inválida, estado inválido y rango invertido. Exportación CSV con BOM, encabezados, separador `;`, protección contra fórmulas y evento `reporte.exportar` en la auditoría. Frontend: filtros, validación del rango, exportación y descarga |
| PR-02 (Sprint 7) | 16/10/2026 | Aprobada | `permisos.test.ts`: las 40 rutas sin sesión → 401 y con los 5 roles → 403 exactamente cuando el rol no tiene el permiso (75 casos). La prueba cuenta las rutas registradas en Express y falla si hay alguna fuera de la matriz |
| PR-21 | 16/10/2026 | Aprobada | `administracion.test.ts`: 401 sin sesión y 403 para el funcionario; el auditor ve los eventos más recientes primero con el usuario; filtros por resultado, acción, usuario y fechas; paginación; 400 por rango invertido o resultado inválido; sin contraseñas ni hashes en la respuesta; PUT, PATCH y DELETE sobre la auditoría → 404. Frontend: tabla, filtros y validación del rango |
| PR-22 | 16/10/2026 | Aprobada | `respaldo.service.test.ts` (8 casos): respaldo y restauración con datos y documentos; datos.json alterado → no restaura; documento modificado o faltante; sin manifiesto, otro formato u otras migraciones → rechazo; base con datos → rechazo; documentos sin archivo anotados en el manifiesto. **En la CI** ([run 38909943384](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38909943384)): respaldo de la base de CI, restauración en una base nueva con 99 filas y 1 documento verificados, las 15 tablas iguales al origen, rechazo de una segunda restauración y de un respaldo alterado |
| PR-25 (Sprint 7) | 16/10/2026 | Aprobada | Revisión de errores: los 500 siguen siendo genéricos (`errors.test.ts`); la consulta de auditoría no expone contraseñas ni hashes; los errores del respaldo se informan por consola, no por la API |
| PR-26 | 16/10/2026 | Aprobada | `prisma/medir-rendimiento.ts` con 1000 expedientes y 30 peticiones por consulta. p95: listado 12 ms, búsqueda 14 ms, dashboard 13 ms, reporte 11 ms, exportar CSV 34 ms (umbral 1 s). Medido en GitHub Actions, sin red de por medio |
| PR-27 | — | Pendiente | Prueba de usabilidad con 3 personas: [guia-usabilidad.md](guia-usabilidad.md). No se registra ningún resultado hasta que se haga |
| PR-20 (Sprint 5) | 15/10/2026 | Aprobada | En CI, `asignaciones` y `pases` rechazaron `DELETE`, `UPDATE` y `TRUNCATE`; `pases` rechazó modificar el motivo. |
| PR-20 (Sprint 4) | 15/10/2026 | Aprobada | En CI, con una fila en cada tabla, `auditoria`, `documentos`, `actuaciones` y `cambios_estado` rechazaron `DELETE`, `UPDATE` y `TRUNCATE`. |

**Defectos detectados por la CI:**

| Defecto | Detectado | Causa | Corrección |
|---|---|---|---|
| D-01 | Ejecución 1 de CI (14/10/2026) | La prueba del listado de usuarios contaba las filas antes de que terminara la carga | Esperar a que aparezcan los datos (commit `51b12b5`) |
| D-02 | Ejecución 1 de CI | `npm audit` encontró 4 vulnerabilidades altas | Están en la CLI de Prisma (solo desarrollo); registradas como DT-05, la CI las informa como advertencia (commit `b3637d2`) |
| D-03 | Prueba manual en la PC | `admin` / `12345` rechazado: el seed no restablecía usuarios ya existentes | El seed restablece los usuarios iniciales en cada ejecución (commit `609568b`) |
| D-04 | CI del Sprint 3 ([run 38609784288](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38609784288), 14/10/2026) | El backend no compilaba: uso de `usuario.dependenciaId` (no existe), estados como `string` en lugar de los enums de Prisma, auditoría llamada con 1 argumento en vez de 2, tipo de agente de Supertest inexistente | Tipos `EstadoExpediente`/`Prioridad` en los contratos, `usuario.dependencia.id`, firma correcta de auditoría (rama `feature/S3-correcciones`) |
| D-05 | Misma ejecución | 4 pruebas del frontend fallaban: el administrador de prueba no tenía `expedientes.consultar` y la API simulada no respondía `/api/expedientes` | Permisos completos para el administrador de prueba y respuesta simulada del listado |
| D-06 | Revisión de código (15/10/2026) | **Seguridad:** `PATCH /api/expedientes/:id` permitía modificar expedientes de otra dependencia | Misma verificación de visibilidad que la consulta (`expedienteVisible`) y prueba de 403 |
| D-07 | Revisión de código | Las reglas de negocio lanzaban `Error` con `statusCode`, que el manejador central no reconoce: respondían 500. Las pruebas esperaban 422 para validaciones, distinto del contrato (400) | Errores tipados: 400 validación, 404 inexistente, 409 transición no permitida o expediente archivado (contrato de la API) |
| D-09 | CI del Sprint 4 (run 38741786708) | La nueva verificación de solo inserción informó que `documentos` "permitió" un `DELETE`: la tabla estaba vacía y los triggers por fila no se disparan sin filas (falso resultado del paso de CI, no del sistema) | El paso inserta una fila en cada tabla antes de verificar y falla si alguna está vacía (commit `cbfd2ea`) |
| — | CI del Sprint 5 (runs con 114/115 y 33/34) | Dos pruebas nuevas estaban mal escritas: un texto de actuación de 2 letras (la validación respondía 400 antes que la regla de tránsito) y una búsqueda ambigua de una opción en la pantalla. No eran defectos del sistema | Datos y consultas de las pruebas corregidos |
| D-08 | CI de la corrección ([run 38739773468](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38739773468)) | La prueba "busca por texto en carátula" buscaba "licencia", palabra presente en el asunto de los 3 expedientes de prueba: el sistema devolvía 3 (correcto) y la prueba esperaba 1 | La prueba busca "ANUAL", que solo está en una carátula (y verifica que la búsqueda no distingue mayúsculas) |
| D-10 | Prueba manual en la PC (15/10/2026) | **Corregido el 16/10/2026** (script `predev` con `prisma generate`). Al cambiar a la rama del Sprint 5, `db:migrate` aplicó las migraciones pero no regeneró el cliente de Prisma: el seed falló con `Cannot read properties of undefined (reading 'findUnique')` y el backend en ejecución no conocía las tablas nuevas | Solución inmediata: `npm run db:generate` y reiniciar el backend. Corrección propuesta: script `predev` que ejecute `prisma generate` |
| D-11 | CI del Sprint 6 (run 38901065290, 16/10/2026) | Las 16 pruebas del Sprint 5 fallaron al día siguiente de escribirlas: el reloj de la prueba estaba fijo en el 15/10, la cookie de sesión vencía 8 h después según ese reloj, y el agente de pruebas descarta las cookies vencidas según la hora real. Era un defecto de las pruebas, no del sistema | El reloj de prueba parte de la hora real (`Date.now()`). La CI ahora muestra las líneas de la pila de cada prueba fallida, lo que permitió encontrarlo |
| D-12 | Revisión de capturas (CR-05, 16/10/2026) | El historial y los mensajes de error mostraban los nombres internos de los estados (`EN_TRAMITE`, `BORRADOR → ARCHIVADO`) | Textos legibles en `src/shared/etiquetas.ts`, usados por historial, errores de transición (expedientes y tareas) y reportes. Pruebas: `etiquetas.test.ts` (4) y aserción del mensaje 409 (Sprint 8) |

## 3. Pruebas manuales

Pasos y resultados esperados: [guia-prueba-manual.md](guia-prueba-manual.md).

| Prueba | Fecha | Participantes | Resultado | Evidencia |
|---|---|---|---|---|
| Backup y restauración (PR-22) | | | | |
| Usabilidad (PR-27) | | | | |
| Instalación desde cero (PR-24) | | | | |
| Login `admin` / `12345` y navegación | 14/10/2026 | Responsable | Aprobada después de corregir D-03 | Ingreso exitoso informado por el responsable |
