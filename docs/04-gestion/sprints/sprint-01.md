# Sprint 1 — Estructura inicial

**Release:** R1 · **Estado:** Terminado (14/10/2026) — pendiente la integración de los PR en `develop` · **Inicio:** 14/10/2026 · **Fin:** a definir con la fecha de entrega
**Compromiso:** 6 ítems (3 SP de historia + 5 tareas técnicas sin SP) · **Velocidad de referencia:** 20 SP (se medirá la real)

## 1. Objetivo del sprint

Tener el **esqueleto funcionando de punta a punta**: un backend Express y un frontend React que arrancan, se comunican por la API con un contrato de respuesta definido, muestran la navegación base y se verifican automáticamente en GitHub Actions. Al final del sprint no hay funciones de negocio todavía, pero cualquier historia de los sprints siguientes se puede construir sobre esta base sin rehacer nada.

## 2. Tareas

| ID | Tarea | SP | Tarjeta Trello | Criterios de aceptación |
|---|---|---|---|---|
| S1-01 | Crear backend Express + TypeScript | — | S1-01 | El servidor arranca con `npm run dev`; `GET /api/health` responde 200 con el estado de la API y de la base de datos. |
| S1-02 | Crear frontend React + Vite + TypeScript + Tailwind | — | S1-02 | El frontend arranca con `npm run dev`; los estilos de Tailwind se aplican. |
| S1-03 | Comunicación frontend ↔ API | — | S1-03 | El frontend muestra el estado de `/api/health`; contrato de respuesta y de error documentado. |
| S1-04 | Navegación y diseño base | 3 | S1-04 | Menú y rutas principales (con páginas "en construcción"); diseño responsive básico. |
| S1-05 | Manejo centralizado de errores y logs | — | S1-05 | Middleware de errores único; los errores no muestran trazas ni detalles internos; logs en JSON con identificador de petición. |
| S1-06 | Pipeline CI en GitHub Actions | — | S1-06 | El workflow se ejecuta en cada *push* / PR a `develop` y `main` (lint, tipos, pruebas, build); badge de estado en el README. |

## 3. Archivos que se crean o modifican

**Backend (`backend/`)**

| Archivo | Para qué |
|---|---|
| `package.json`, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts` | Proyecto, compilación, lint y pruebas |
| `src/server.ts` | Arranca el servidor HTTP (separado de `app.ts` para poder probar sin abrir puertos) |
| `src/app.ts` | Crea la app Express y monta middlewares y rutas |
| `src/config/env.ts` | Lee y valida variables de entorno con Zod (falla al arrancar si falta alguna) |
| `src/shared/errors.ts` | Clases de error tipadas (`AppError`, `NotFoundError`, …) |
| `src/shared/logger.ts` | Logger JSON sin datos sensibles |
| `src/api/middlewares/request-id.ts`, `error-handler.ts`, `not-found.ts` | Identificador de petición, manejo central de errores, ruta inexistente |
| `src/api/routes/health.routes.ts` | Ruta `/api/health` |
| `src/modules/health/health.service.ts` | Comprueba la base de datos (la regla no va en el controlador) |
| `tests/integration/health.test.ts`, `tests/integration/errors.test.ts` | Pruebas con Supertest |

**Frontend (`frontend/`)**

| Archivo | Para qué |
|---|---|
| `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html` | Proyecto y herramientas |
| `src/main.tsx`, `src/App.tsx`, `src/styles/index.css` | Entrada, rutas y Tailwind |
| `src/layouts/MainLayout.tsx`, `src/components/NavBar.tsx` | Diseño base y menú responsive |
| `src/pages/*.tsx` | Inicio (estado del sistema), Expedientes, Tareas, Reportes, Administración ("en construcción"), 404 |
| `src/services/api.ts` | Cliente HTTP que aplica el contrato de respuesta |
| `tests/*.test.tsx` | Pruebas de componentes con Vitest |

**Raíz y documentación**

| Archivo | Cambio |
|---|---|
| `.github/workflows/ci.yml` | Pipeline CI (S1-06) |
| `README.md` | Comandos de arranque y badge de CI |
| `docs/02-arquitectura/contrato-api.md` | Contrato de respuesta y de error (S1-03) |
| `docs/06-configuracion-devops/instalacion-ejecucion.md`, `docs/05-calidad-pruebas/resultados-pruebas.md`, `docs/07-evidencias/evidencias.md`, `docs/bitacora-ia/bitacora-ia.md` | Resultados y evidencias reales del sprint |

## 4. Contrato de respuesta propuesto (S1-03)

```jsonc
// Éxito
{ "data": { ... } }
// Error (mismo formato en toda la API)
{ "error": { "code": "NOT_FOUND", "message": "Recurso no encontrado", "requestId": "…" } }
```

El `requestId` permite buscar el error en los logs sin mostrarle al usuario detalles internos.

## 5. Ramas y orden de trabajo

Ramas desde `develop` (después de integrar los PR de la Fase 0):

1. `feature/S1-01-05-backend-base` → S1-01 y S1-05 (el manejo de errores se hace junto con el backend).
2. `feature/S1-02-04-frontend-base` → S1-02 y S1-04.
3. `feature/S1-03-comunicacion-api` → S1-03.
4. `feature/S1-06-ci` → S1-06.

Cada rama termina en un *pull request* hacia `develop` que cumple la DoD.

## 6. Riesgos y dependencias

| Riesgo / dependencia | Impacto | Respuesta |
|---|---|---|
| El entorno de la IA no tiene acceso al registro de npm: no puede instalar dependencias ni ejecutar pruebas | No se pueden presentar resultados de pruebas generados por la IA | Las dependencias se instalan y las pruebas se ejecutan en la PC de desarrollo y en GitHub Actions; solo se registran resultados reales (regla del proyecto). |
| `package-lock.json` solo se genera con `npm install` en la PC | Sin él, CI no puede usar `npm ci` | El primer `npm install` se hace en la PC y el lockfile se sube en la misma rama. |
| Versiones nuevas (Vite 8, Express 5, Tailwind 4, ESLint 10) con cambios respecto a guías antiguas | Configuración que no arranca | Seguir la documentación oficial de cada versión; ADR-01 fija las versiones. |
| R14: Docker apagado al correr pruebas que usan la base | `/api/health` informa base caída | El health check informa el estado de la base sin romper la API; guía de problemas frecuentes. |
| Depende de integrar los PR #1 a #4 en `develop` | Las ramas del sprint partirían de una base desactualizada | Integrar los PR antes de crear la primera rama del sprint. |

## 7. Definición de terminado (aplicada a este sprint)

Ver [DoD](../../05-calidad-pruebas/plan-calidad.md#4-definition-of-done-dod). En particular: código revisado en un PR, pruebas en verde en la PC y en CI, sin secretos en el repositorio, documentación actualizada y tarjeta de Trello con evidencia.

## 8. Resultado del sprint

**Cierre:** 14/10/2026.

| Tarea | Criterios de aceptación | Resultado | Evidencia |
|---|---|---|---|
| S1-01 | Servidor arranca; `/api/health` 200 | ✅ | Ejecución manual en la PC (`status: ok`, base conectada) y pruebas de CI |
| S1-02 | Frontend arranca; Tailwind aplicado | ✅ | `npm run dev` en la PC; build de CI |
| S1-03 | Frontend muestra `/api/health`; contrato definido | ✅ | Tarjeta "Estado del sistema" en Inicio; [contrato-api.md](../../02-arquitectura/contrato-api.md) |
| S1-04 | Menú y rutas; responsive | ✅ | Pruebas de navegación (frontend) |
| S1-05 | Middleware de errores; sin detalles internos | ✅ | `errors.test.ts` (500 sin trazas ni credenciales) |
| S1-06 | Workflow ejecutándose; badge en README | ✅ | [CI en verde](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38596214215); badge en el README |

- **Pruebas (reales, CI):** backend 50/50, frontend 20/20; cobertura backend 92,99 % de líneas. Ver [resultados-pruebas.md](../../05-calidad-pruebas/resultados-pruebas.md).
- **Defectos:** D-01 y D-02, detectados por la propia CI y corregidos el mismo día.
- **Velocidad:** 3 SP de historias (S1-04) + 5 tareas técnicas. Se mide junto con el Sprint 2 por el solapamiento de CR-02.
- **Retrospectiva:**
  - *Funcionó:* la CI detectó problemas que no se veían en la PC; trabajar por ramas con el código de la tarjeta mantuvo la trazabilidad.
  - *A mejorar:* las versiones nuevas (React Router 8, jest-dom 7) obligaron a verificar importaciones; los resultados de pruebas locales no siempre se registraron.
  - *Acción:* la CI es la fuente oficial de resultados de pruebas (resumen publicado en cada ejecución).
