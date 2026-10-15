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
| S5 | | | | | | |
| S6 | | | | | | |
| S7 | | | | | | |
| S8 (regresión) | | | | | | |

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
| D-08 | CI de la corrección ([run 38739773468](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38739773468)) | La prueba "busca por texto en carátula" buscaba "licencia", palabra presente en el asunto de los 3 expedientes de prueba: el sistema devolvía 3 (correcto) y la prueba esperaba 1 | La prueba busca "ANUAL", que solo está en una carátula (y verifica que la búsqueda no distingue mayúsculas) |

## 3. Pruebas manuales

| Prueba | Fecha | Participantes | Resultado | Evidencia |
|---|---|---|---|---|
| Backup y restauración (PR-22) | | | | |
| Usabilidad (PR-27) | | | | |
| Instalación desde cero (PR-24) | | | | |
| Login `admin` / `12345` y navegación | 14/10/2026 | Responsable | Aprobada después de corregir D-03 | Ingreso exitoso informado por el responsable |
