# IS3 — Sistema Institucional de Expediente Electrónico

[![CI](https://github.com/gabrielvelaz16-dev/is3/actions/workflows/ci.yml/badge.svg)](https://github.com/gabrielvelaz16-dev/is3/actions/workflows/ci.yml)

Prototipo académico del trabajo práctico integrador de **Ingeniería de Software III** (FPUNA), con enfoque de gestión **híbrido**. Es un sistema web para registrar expedientes electrónicos de una institución pública **ficticia**: documentos, actuaciones, responsables, tareas, estados, historial, usuarios y roles, reportes, auditoría y copias de seguridad.

> Uso exclusivamente académico. Se ejecuta en una sola computadora, con datos ficticios. No se conecta a servicios institucionales reales.

## Estado

| Fase | Estado |
|---|---|
| Fase 0 — Preparación | Cerrada el 14/10/2026 ([acta G1](docs/07-evidencias/fase0/acta-puerta-g1.md)) |
| Sprints 1 a 7 | Terminados con la CI en verde ([sprints](docs/04-gestion/sprints/)) |
| CR-05 — Mejora de la interfaz | Terminado ([detalle](docs/04-gestion/sprints/cr-05-interfaz.md)) |
| Sprint 8 — Entrega | En curso ([sprint-08.md](docs/04-gestion/sprints/sprint-08.md)) · versión v1.0.0 pendiente de integrar los PR |

Funciones: expedientes con número único, búsqueda y filtros · documentos validados con SHA-256 · actuaciones e historial de solo inserción · pases entre dependencias · responsables, tareas y vencimientos · notificaciones · dashboard y reportes CSV · usuarios, roles y permisos verificados en el servidor · auditoría · copia de seguridad y restauración.

## Tecnologías y versiones

| Parte | Tecnología | Versión fijada |
|---|---|---|
| Entorno | Node.js LTS · npm | 24.x (24.20.0) · 11.19.0 |
| Lenguaje | TypeScript | 6.0.3 |
| Frontend | React · Vite · Tailwind CSS | 19.3.0 · 8.3.4 · 4.3.3 |
| Backend | Express · Zod | 5.3.0 · 4.6.7 |
| Base de datos | PostgreSQL (Docker) · Prisma | 18 · 7.10.0 (`@prisma/adapter-pg`) |
| Pruebas | Vitest · Supertest | 5.0.4 · 7.3.1 |

El motivo de cada versión está en [ADR-01](docs/02-arquitectura/decisiones-tecnicas.md#adr-01--stack-tecnológico).

## Requisitos previos

- [Git](https://git-scm.com/), [Node.js 24 LTS](https://nodejs.org/) y [Docker Desktop](https://www.docker.com/products/docker-desktop/) con Docker Compose.
- En Windows, si PowerShell bloquea `npm`, ejecutar una vez:
  `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

## Puesta en marcha

```powershell
git clone https://github.com/gabrielvelaz16-dev/is3.git
cd is3
Copy-Item .env.example .env        # Linux/macOS: cp .env.example .env
# Editar .env: POSTGRES_PASSWORD (y la misma clave en DATABASE_URL y DATABASE_URL_TEST)

# 1. Base de datos (Docker Desktop abierto)
docker compose --env-file .env -f infra/docker/docker-compose.yml up -d

# 2. Backend: tablas, datos iniciales y servidor (http://localhost:3000)
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev

# 3. (Opcional) Datos de demostración, en otra terminal con el backend levantado
cd backend
npm run demo:cargar

# 4. Frontend, en otra terminal (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Ingresar en http://localhost:5173 con usuario **`admin`** y contraseña **`12345`**. El administrador puede crear usuarios y asignarles rol y dependencia desde **Administración**. El seed también crea un usuario de prueba por rol (`mesa`, `funcionario`, `jefe`, `auditor`, todos con `12345`).

Cómo usar el sistema: [manual de usuario](docs/manual-usuario.md). La guía completa de instalación y los problemas frecuentes están en [instalación y ejecución](docs/06-configuracion-devops/instalacion-ejecucion.md).

## Estructura

```
backend/     API Express (capas: api → modules → database; security; integrations)
frontend/    Aplicación React + Vite
infra/       Docker Compose de PostgreSQL
scripts/     Datos de demostración, capturas y utilidades de la CI
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

Avance general: [docs/avance-del-proyecto.md](docs/avance-del-proyecto.md). Versiones: [CHANGELOG.md](CHANGELOG.md). Índice completo en [docs/README.md](docs/README.md): alcance, requisitos, arquitectura, modelo de datos, gestión (Unidades 2 a 9), calidad, pruebas, configuración, evidencias y bitácora de IA.

Responsable: Carlos Gabriel Velázquez Franco.
