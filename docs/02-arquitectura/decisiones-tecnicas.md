# Decisiones técnicas (ADR)

**Estado:** Inicial (Fase 0) · **Unidad:** 8

Registro breve de decisiones de arquitectura (*Architecture Decision Records*). Cada decisión indica contexto, decisión, alternativas y consecuencias. Una decisión aceptada solo se reemplaza con una nueva ADR que la sustituya.

---

## ADR-01 · Stack tecnológico

- **Estado:** Aceptada (Fase 0)
- **Contexto:** Las instrucciones del proyecto proponen un stack definido. Se necesita un único lenguaje en frontend y backend para reducir la carga de aprendizaje y compartir validaciones.
- **Decisión:** React + Vite + TypeScript (frontend), Node.js + Express + TypeScript (backend), PostgreSQL con Prisma, Tailwind CSS, Zod, Vitest + Supertest, Docker Compose para la base de datos, Git y GitHub.
- **Alternativas:** NestJS (más estructura pero mayor curva de aprendizaje); SQLite (más simple pero no representa el entorno institucional).
- **Consecuencias:** TypeScript en todo el proyecto; contratos tipados compartidos.
- **Versiones fijadas (F0-05, 14/10/2026):** consultadas en la máquina de desarrollo con `npm view <paquete> version`, `npm view <paquete> dist-tags` y `npm view <paquete> peerDependencies`. Se instalarán con versión exacta y quedarán registradas en `package-lock.json`.

| Herramienta | Versión fijada | Última publicada | Motivo |
|---|---|---|---|
| Node.js | 24.20.0 (LTS) | — | Versión LTS instalada; cumple con lo que exigen Vitest (`@types/node >=24`) y Vite 8. Fijada en `.node-version`. |
| npm | 11.19.0 | 12.2.0 | La que trae Node 24. No se actualiza a npm 12 para no mezclar versiones. |
| TypeScript | **6.0.3** | 7.0.2 | `typescript-eslint` solo admite `typescript >=4.8.4 <6.1.0`. TypeScript 7 (compilador reescrito) se reevalúa cuando el linter lo soporte. |
| React | 19.3.0 | 19.3.0 | — |
| Vite | 8.3.4 | 8.3.4 | `@vitejs/plugin-react` exige `vite ^8.0.0`. |
| Tailwind CSS | 4.3.3 | 4.3.3 | — |
| Express | 5.3.0 | 5.3.0 | — |
| Zod | 4.6.7 | 4.6.7 | — |
| Prisma | **7.10.0** | 8.0.0-rc.22 | La etiqueta `latest` apunta a una versión candidata (`rc`), no estable. Se usa la última estable (`prev`). |
| Vitest | 5.0.4 | 5.0.4 | Compatible con `vite ^8.0.0`. |
| Supertest | 7.3.1 | 7.3.1 | Instalada en S1-01 (14/10/2026). |
| Herramientas del backend (S1-01) | `pg` 8.23.1 · `tsx` 4.23.15 · ESLint 10.12.0 · `typescript-eslint` 8.71.2 · `@types/node` 24.19.2 · `@types/express` 5.0.6 | — | Versión exacta (`npm install -E`) registrada en `backend/package.json` y `package-lock.json`. |
| PostgreSQL | 18 (`postgres:18-alpine`) | — | Imagen oficial; contenedor verificado el 14/10/2026 (F0-07). |
| Git · Docker · Compose | 2.55.0 · 29.8.2 · v5.6.0 | — | Instalados en la máquina de desarrollo (Windows). |
| Frontend (S1-02) | React Router 8.4.0 · `@vitejs/plugin-react` 6.1.2 · `@tailwindcss/vite` 4.3.3 · jsdom 30.1.2 · Testing Library (react 16.3.3, dom 10.4.2, user-event 14.6.8, jest-dom 7.0.1) · `eslint-plugin-react-hooks` 7.1.1 | — | Versión exacta registrada en `frontend/package.json` y `package-lock.json`. |

- **Consecuencias de las versiones:** Prisma 7 trabaja con archivo `prisma.config.ts` y adaptador de conexión para PostgreSQL; se configura en el Sprint 2 siguiendo su documentación oficial.

## ADR-02 · Monorepo con dos aplicaciones

- **Estado:** Aceptada
- **Contexto:** Un solo equipo, un solo repositorio para evidencias y trazabilidad.
- **Decisión:** Un repositorio con carpetas `backend/` y `frontend/`, cada una con su propio `package.json`.
- **Alternativas:** Dos repositorios (más complejo para trazabilidad); workspaces de npm (se puede adoptar más adelante para compartir esquemas).
- **Consecuencias:** El pipeline CI ejecuta trabajos separados por carpeta.

## ADR-03 · Arquitectura en capas por módulos

- **Estado:** Aceptada
- **Decisión:** Rutas → validación → controlador → servicio → repositorio. Cada módulo de negocio en `backend/src/modules/<modulo>`.
- **Consecuencias:** Los servicios se prueban sin levantar HTTP (pruebas unitarias); las rutas se prueban con Supertest (integración).

## ADR-04 · Base de datos en Docker Compose

- **Estado:** Aceptada
- **Decisión:** PostgreSQL corre en un contenedor definido en `infra/docker/docker-compose.yml`; credenciales por variables de entorno.
- **Consecuencias:** Requiere Docker Desktop. Riesgo de incompatibilidad en equipos con poca memoria (ver R05 adaptado al prototipo).

## ADR-05 · Mecanismo de sesión

- **Estado:** Aceptada (Sprint 2, 14/10/2026)
- **Opciones:** (a) JWT de corta duración en cookie `httpOnly` + `SameSite=Strict`; (b) sesión en servidor guardada en PostgreSQL.
- **Criterio:** facilidad para invalidar sesiones al cerrar sesión (RF-01) y simplicidad de pruebas.
- **Decisión:** (b) sesión en el servidor. Token aleatorio de 256 bits en la cookie `is3_sid` (`httpOnly`, `SameSite=Strict`, `Path=/api`, `Secure` con HTTPS); en la tabla `sesiones` se guarda solo su hash SHA-256 y la fecha de vencimiento (`SESSION_HOURS`, 8 h por defecto). Los permisos se leen de la base en cada petición.
- **Motivo:** cerrar sesión, desactivar un usuario o cambiarle la contraseña invalida sus sesiones de inmediato; con JWT el token seguiría siendo válido hasta vencer. Un cambio de rol se aplica en la siguiente petición.
- **Consecuencias:** una consulta extra por petición (aceptable para el volumen del prototipo). El frontend usa el proxy de Vite para compartir origen con la API: no se necesita CORS. Límite de 5 intentos fallidos de login por correo cada 15 minutos (en memoria).

## ADR-06 · Proveedor de identidad mediante adaptador

- **Estado:** Aceptada
- **Contexto:** Riesgo R01 (la API de identidad podría entregarse tarde) y evento de cambio obligatorio del TP.
- **Decisión:** Definir una interfaz `IdentityProvider` en `backend/src/integrations`; la primera implementación es local y simulada. Una integración real futura solo reemplaza el adaptador.
- **Consecuencias:** El retraso del proveedor no bloquea el desarrollo; demuestra en código la contingencia del registro de riesgos.

## ADR-07 · Auditoría de solo inserción

- **Estado:** Aceptada
- **Decisión:** Tabla `AuditLog` sin operaciones de actualización ni borrado en el código; además, restricción a nivel de base (trigger o permisos) que impida `UPDATE`/`DELETE` ordinarios.
- **Consecuencias:** Corregir un error de auditoría requiere un nuevo registro compensatorio, nunca editar.

## ADR-08 · Almacenamiento de documentos en disco local

- **Estado:** Aceptada
- **Decisión:** Archivos en `storage/documentos/` (fuera de Git y de la carpeta pública), con nombre UUID, metadatos y hash SHA-256 en la base. Acceso solo mediante endpoint autorizado.
- **Alternativas:** Guardar binarios en PostgreSQL (simplifica backup pero agranda la base).
- **Consecuencias:** El backup debe incluir la base **y** la carpeta `storage/`.

## ADR-09 · Estrategia de ramas

- **Estado:** Aceptada
- **Decisión:** `main` (versiones estables etiquetadas) · `develop` (integración) · `feature/<codigo-tarjeta>-<descripcion>` (trabajo). Integración por *pull request* con CI en verde. Detalle en el [plan de configuración](../06-configuracion-devops/plan-configuracion.md).

## ADR-10 · Hash de contraseñas con scrypt

- **Estado:** Aceptada (Sprint 2, 14/10/2026)
- **Contexto:** RNF-01 exige un algoritmo de hash seguro. bcrypt y argon2 requieren módulos nativos que suelen fallar al instalarse en Windows.
- **Decisión:** `scrypt` del módulo `crypto` de Node (N = 2^15, r = 8, p = 1, sal aleatoria de 16 bytes, clave de 64 bytes). Formato guardado: `scrypt$N$r$p$sal$hash`, que permite subir los parámetros más adelante sin invalidar contraseñas existentes. Comparación en tiempo constante (`timingSafeEqual`).
- **Política de contraseñas (decisión del PO, 14/10/2026):** mínimo 5 caracteres. El prototipo es académico, local y con datos ficticios, y se necesitan credenciales fáciles para la demostración (`admin` / `12345` y un usuario de prueba por rol con `12345`). El hash con scrypt se mantiene, así que RNF-01 se cumple igual: ninguna contraseña queda en texto plano.
- **Inicio de sesión con nombre de usuario:** se agrega el campo `username` (único, 3 a 30 caracteres: letras, números, `.`, `-`, `_`). El login acepta el nombre de usuario o el correo.
- **Riesgo aceptado:** contraseñas débiles y conocidas. Es aceptable porque el sistema no se publica ni maneja datos reales; si algún día se usara fuera del aula, habría que volver a una política fuerte (es un cambio de una constante, `PASSWORD_MIN`).
- **Alternativas:** argon2id (recomendado por OWASP, pero dependencia nativa); bcrypt (límite de 72 bytes, dependencia nativa o versión JS lenta).
- **Consecuencias:** sin dependencias externas. scrypt está entre los algoritmos recomendados por OWASP para contraseñas.

## ADR-11 · Repositorios como interfaces

- **Estado:** Aceptada (Sprint 2)
- **Decisión:** los servicios dependen de interfaces (`database/repositories.ts`); la implementación real usa Prisma (`database/prisma/repos.ts`) y las pruebas usan repositorios en memoria.
- **Consecuencias:** `npm test` no necesita base de datos y corre en segundos. Las consultas de Prisma se verifican con la ejecución manual y, en el Sprint 7, con pruebas contra la base `expediente_test`.
