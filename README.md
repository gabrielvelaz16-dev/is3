# IS3 — Sistema Institucional de Expediente Electrónico

Prototipo académico del trabajo práctico integrador de **Ingeniería de Software III** (FPUNA), con enfoque de gestión **híbrido**. Es un sistema web para registrar expedientes electrónicos de una institución pública **ficticia**: documentos, actuaciones, responsables, tareas, estados, historial, usuarios y roles, reportes, auditoría y copias de seguridad.

> Uso exclusivamente académico. Se ejecuta en una sola computadora, con datos ficticios. No se conecta a servicios institucionales reales.

## Estado

| Fase | Estado |
|---|---|
| Fase 0 — Preparación | En curso: documentación, estructura y base de datos local |
| Sprints 1 a 8 | Pendientes ([backlog](docs/04-gestion/backlog.md)) |

## Tecnologías y versiones

| Parte | Tecnología | Versión fijada |
|---|---|---|
| Entorno | Node.js LTS · npm | 24.x (24.20.0) · 11.19.0 |
| Lenguaje | TypeScript | 6.0.3 |
| Frontend | React · Vite · Tailwind CSS | 19.3.0 · 8.3.4 · 4.3.3 |
| Backend | Express · Zod | 5.3.0 · 4.6.7 |
| Base de datos | PostgreSQL (Docker) · Prisma | 18 · 7.10.0 |
| Pruebas | Vitest · Supertest | 5.0.4 · a fijar en el Sprint 1 |

El motivo de cada versión está en [ADR-01](docs/02-arquitectura/decisiones-tecnicas.md#adr-01--stack-tecnológico).

## Requisitos previos

- [Git](https://git-scm.com/), [Node.js 24 LTS](https://nodejs.org/) y [Docker Desktop](https://www.docker.com/products/docker-desktop/) con Docker Compose.
- En Windows, si PowerShell bloquea `npm`, ejecutar una vez:
  `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

## Puesta en marcha (Fase 0: base de datos)

```powershell
git clone https://github.com/gabrielvelaz16-dev/is3.git
cd is3
Copy-Item .env.example .env        # Linux/macOS: cp .env.example .env
# Editar .env y cambiar POSTGRES_PASSWORD (y la misma clave dentro de DATABASE_URL y DATABASE_URL_TEST)

docker compose --env-file .env -f infra/docker/docker-compose.yml up -d
docker compose --env-file .env -f infra/docker/docker-compose.yml ps
```

La columna `STATUS` debe decir `healthy`. Para detener la base: `... down` (los datos se conservan en el volumen `is3_pgdata`).

Backend y frontend se agregan en el Sprint 1. La guía completa y los problemas frecuentes están en [instalación y ejecución](docs/06-configuracion-devops/instalacion-ejecucion.md).

## Estructura

```
backend/     API Express (capas: api → modules → database; security; integrations)
frontend/    Aplicación React + Vite
infra/       Docker Compose de PostgreSQL
scripts/     Copias de seguridad y restauración
docs/        Gestión del proyecto y documentación técnica (ver docs/README.md)
```

## Forma de trabajo

- Ramas: `main` (versiones estables) · `develop` (integración) · `feature/<código-tarjeta>-<descripción>`.
- Cada commit empieza con el código de la tarjeta de Trello (`F0-07: ...`, `S3-01: ...`) para mantener la trazabilidad.
- Detalle en el [plan de configuración](docs/06-configuracion-devops/plan-configuracion.md).

## Seguridad

- `.env` y cualquier secreto quedan fuera de Git (`.gitignore`). Solo se versiona `.env.example`, sin claves reales.
- PostgreSQL se publica solo en `127.0.0.1` (no es accesible desde la red local).

## Documentación

Índice completo en [docs/README.md](docs/README.md): alcance, requisitos, arquitectura, modelo de datos, gestión (Unidades 2 a 9), calidad, pruebas, configuración, evidencias y bitácora de IA.

Responsable: Carlos Gabriel Velázquez Franco.
