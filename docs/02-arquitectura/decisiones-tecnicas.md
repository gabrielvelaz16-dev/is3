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
- **Pendiente (F0-05 / Sprint 1):** verificar en la máquina de desarrollo las versiones vigentes con `node -v`, `npm view <paquete> version` y los requisitos de motor (`engines`) de Prisma y Vite antes de instalar. Las versiones fijadas se registran en este documento y en `package-lock.json`.

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

- **Estado:** Propuesta (se decide en el Sprint 2)
- **Opciones:** (a) JWT de corta duración en cookie `httpOnly` + `SameSite=Strict`; (b) sesión en servidor guardada en PostgreSQL.
- **Criterio:** facilidad para invalidar sesiones al cerrar sesión (RF-01) y simplicidad de pruebas.

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
