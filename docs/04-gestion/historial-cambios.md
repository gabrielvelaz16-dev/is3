# Historial de cambios del proyecto

**Estado:** Vivo · **Unidad:** 8

Registro cronológico de cambios relevantes en el proyecto, su documentación y su configuración. Los cambios del **software** por versión se registrarán además en `CHANGELOG.md` en la raíz del repositorio a partir del Sprint 1.

| Fecha | Versión / tag | Tipo | Descripción | Referencia |
|---|---|---|---|---|
| 13/10/2026 | — | Gestión | Creación del tablero Trello *IS3 – Expediente Electrónico*: 6 listas, 17 etiquetas, 63 tarjetas con criterios de aceptación. | F0-01, F0-02 |
| 13/10/2026 | — | Configuración | Repositorio `gabrielvelaz16-dev/is3`: creación de las ramas `develop` y `feature/F0-04-estructura-proyecto`; estructura inicial de carpetas. | F0-04, F0-06 |
| 13/10/2026 | — | Documentación | Documentación inicial de `docs/` con los artefactos de los TP de las Unidades 2 a 6 y los planes iniciales de las Unidades 7 a 9. | F0-03, F0-08, F0-09 |
| 13/10/2026 | — | Cambio de alcance | Solicitud CR-00: unificación del backlog del TP (80 SP) con el prototipo (97 SP). | CR-00 |
| 14/10/2026 | — | Configuración | Publicación en GitHub de `develop`, `feature/F0-04-estructura-proyecto` y `feature/F0-documentacion-inicial`. Clon en la PC de desarrollo (`Documents\IS3`). | F0-06 |
| 14/10/2026 | — | Configuración | Entorno verificado y versiones fijadas (ADR-01). Archivos base: `README.md`, `.gitignore`, `.gitattributes`, `.env.example`, `.node-version`, `infra/docker/docker-compose.yml`. | F0-05, F0-07 |
| 14/10/2026 | — | Configuración | PostgreSQL 18 levantado con Docker Compose en la PC de desarrollo; bases `expediente` y `expediente_test` creadas. | F0-07 |
| 14/10/2026 | — | Gestión | CR-00 aprobado y puerta G1 aprobada: cierre de la Fase 0 e inicio del Sprint 1. PR #1 a #3 abiertos hacia `develop`. | CR-00, G1 |
| 14/10/2026 | — | Desarrollo | Sprint 1: backend Express (health, contrato de errores, logs) y frontend React (navegación responsive). Ramas `feature/S1-01-05-backend-base` y `feature/S1-02-04-frontend-base`. | S1-01 a S1-05 |
| 14/10/2026 | — | Cambio de alcance | CR-02 aprobado: se adelanta el Sprint 2 (login y usuarios). | CR-02 |
| 14/10/2026 | — | Desarrollo | Sprint 2: modelo Prisma, sesiones en servidor, roles y permisos, gestión de usuarios, auditoría base, pantallas de login y usuarios. Rama `feature/S2-login-usuarios`. ADR-05, ADR-10, ADR-11. | S2-01 a S2-07 |
| 14/10/2026 | — | Configuración | Pipeline CI en GitHub Actions en verde: backend 50/50 y frontend 20/20 pruebas, cobertura backend 92,99 %, migraciones y seed sobre PostgreSQL de CI. DT-05 registrada. | S1-06 |
| 15/10/2026 | — | Calidad | Corrección del Sprint 3: la CI estaba en rojo (el backend no compilaba y fallaban 4 pruebas del frontend). Defectos D-04 a D-08 corregidos, incluido uno de seguridad (D-06). CI en verde: 76/76 + 20/20. Rama `feature/S3-correcciones`. | D-04 a D-08 |
| 15/10/2026 | — | Desarrollo | Sprint 4: documentos (subida sin multer, ADR-12), actuaciones y observaciones, historial del expediente; tablas de solo inserción. CI en verde: 99/99 + 26/26. Rama `feature/S4-documentos-actuaciones`. | S4-01 a S4-05 |
| 15/10/2026 | — | Cambio de alcance | CR-03 aprobado: S5-06 (notificaciones internas) pasa al Sprint 6. | CR-03 |
| 15/10/2026 | — | Desarrollo | Sprint 5: estado y responsable con rutas propias, tareas con vencimiento, envío y recepción entre dependencias, página de pendientes. CI en verde: 115/115 + 34/34. Rama `feature/S5-tareas-seguimiento`. | S5-01 a S5-05 |
| 15/10/2026 | — | Documentación | TP de las Unidades 8 y 9 (Word y Markdown) en `docs/08-trabajos-practicos/`. Primera medición real del tablero integrado, cuatro decisiones basadas en métricas y lecciones aprendidas. Defecto D-10 registrado. Rama `feature/TP-U8-U9-configuracion-monitoreo`. | TP U8–U9, D-10 |
| 16/10/2026 | — | Cambio de alcance | CR-04 aprobado: orden de recorte del Sprint 6 (S6-03 primero). No fue necesario aplicarlo. | CR-04 |
| 16/10/2026 | — | Desarrollo | Sprint 6: notificaciones internas, dashboard, reportes con filtros, exportación CSV y verificación de indicadores en la CI. D-10 y D-11 corregidos. CI en verde: 130/130 + 45/45. Rama `feature/S6-dashboard-reportes`, PR #14. | S5-06, S6-01 a S6-05 |
| 16/10/2026 | — | Desarrollo | Sprint 7: consulta de auditoría, respaldo y restauración (ADR-13), matriz de permisos de toda la API, medición de rendimiento y guía de usabilidad. CI en verde: 221/221 + 51/51. Rama `feature/S7-calidad-seguridad`, PR #15. | S7-01 a S7-06 |
| 16/10/2026 | — | Cambio de alcance / Desarrollo | CR-05: menú lateral, detalle del expediente en pestañas, componentes `ui/`, avisos flotantes y capturas antes/después en la CI. CI en verde: frontend 51/51. Rama `feature/S8-UI-interfaz`. | CR-05 |
| 19/10/2026 | — | Cambio de alcance / Desarrollo | CR-08: desactivar (con motivo), reactivar y eliminar sin actividad expedientes; sección "Expedientes desactivados"; permiso `expedientes.desactivar`; migración `20261019172842_expedientes_desactivados` (amplía RF-06). Pruebas: 251 + 66. Rama `feature/S8-entrega`. | CR-08 |
| 19/10/2026 | — | Cambio de alcance / Desarrollo | CR-07: adjuntar texto (.txt) e imágenes GIF y WEBP, con verificación del contenido (amplía RF-08 y ADR-12). D-13 corregido (mensaje de expediente en tránsito). Pruebas: 233 + 60. Rama `feature/S8-entrega`. | CR-07, D-13 |
| 19/10/2026 | — | Cambio de alcance / Desarrollo | CR-06: contraseña visible con el ícono del ojo, eliminación de usuarios sin actividad (`DELETE /api/usuarios/:id`, amplía RF-03) y mejoras de navegación (filtros en la dirección, migas de pan, buscador rápido, enlaces en Inicio). Pruebas: 230 + 59. Rama `feature/S8-entrega`. | CR-06 |
| 19/10/2026 | — | Desarrollo / Documentación | Sprint 8 (entrega): datos de demostración por la API (16 expedientes, carga sin duplicar), D-12 corregido (estados legibles), regresión en la CI (225/225 + 51/51), manual de usuario, `sprint-03.md`, CHANGELOG. Rama `feature/S8-entrega`. | S8-01 a S8-05, D-12 |
