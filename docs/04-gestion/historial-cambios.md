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
