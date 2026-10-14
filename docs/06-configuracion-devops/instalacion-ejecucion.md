# Instalación y ejecución local

**Estado:** Entorno verificado (Fase 0) — los comandos de la aplicación se verifican al cerrar el Sprint 1 · **Unidad:** 8

> En la Fase 0 todavía no existe código de la aplicación. Esta guía describe los requisitos y el procedimiento previsto; cada paso se marca como **verificado** cuando se ejecute realmente. El [README](../../README.md) de la raíz resume la puesta en marcha.

## 1. Requisitos previos

| Herramienta | Versión | Para qué | Cómo verificar | Estado |
|---|---|---|---|---|
| Node.js | 24.20.0 (LTS) | Ejecutar backend, frontend y pruebas | `node -v` | Verificado 14/10/2026 |
| npm | 11.19.0 | Instalar dependencias | `npm -v` | Verificado 14/10/2026 |
| Git | 2.55.0 | Control de versiones | `git --version` | Verificado 14/10/2026 |
| Docker Desktop | Docker 29.8.2 · Compose v5.6.0 | Base de datos PostgreSQL | `docker --version` y `docker compose version` | Verificado 14/10/2026 |
| Editor (VS Code recomendado) | — | Desarrollo | — | Opcional |

Instalación en Windows realizada con `winget` (`Git.Git`, `OpenJS.NodeJS.LTS`, `Docker.DockerDesktop`) más `wsl --install`, seguida de un reinicio. Las versiones de las librerías están en [ADR-01](../02-arquitectura/decisiones-tecnicas.md#adr-01--stack-tecnológico).

**Windows / PowerShell:** si `npm` muestra *"la ejecución de scripts está deshabilitada"*, ejecutar una vez `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

## 2. Obtener el código

```bash
git clone https://github.com/gabrielvelaz16-dev/is3.git
cd is3
git checkout develop
```

Configurar la identidad de Git solo para este repositorio:

```bash
git config user.name "Carlos Gabriel Velázquez Franco"
git config user.email "gabrielvelaz16@fpuna.edu.py"
```

## 3. Variables de entorno

```bash
cp .env.example .env          # Windows (PowerShell): Copy-Item .env.example .env
```

Completar `.env` con valores locales. **Nunca** subir `.env` a Git. Las variables están explicadas en [`.env.example`](../../.env.example):

| Variable | Descripción |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales del contenedor de PostgreSQL |
| `POSTGRES_PORT` | Puerto de la PC donde se publica PostgreSQL (5432 por defecto) |
| `DATABASE_URL` | Cadena de conexión de Prisma para desarrollo |
| `DATABASE_URL_TEST` | Base separada para pruebas (`expediente_test`) |
| `NODE_ENV`, `PORT`, `CORS_ORIGIN` | Modo, puerto del backend y origen permitido del frontend |
| `SESSION_SECRET` | Secreto de sesión (valor aleatorio largo; mecanismo final en ADR-05) |
| `STORAGE_PATH` | Carpeta de documentos (`./storage/documentos`) |
| `MAX_UPLOAD_MB` | Tamaño máximo de documento |
| `VITE_API_URL` | URL de la API para el frontend |

## 4. Levantar la base de datos (F0-07)

Ejecutar desde la **raíz** del repositorio, con el `.env` ya creado:

```bash
docker compose --env-file .env -f infra/docker/docker-compose.yml up -d
docker compose --env-file .env -f infra/docker/docker-compose.yml ps        # STATUS: healthy
docker exec is3-postgres psql -U is3_app -d expediente -c "select version();"
docker exec is3-postgres psql -U is3_app -d expediente -c "\l"             # deben figurar expediente y expediente_test
```

Qué crea el archivo [`infra/docker/docker-compose.yml`](../../infra/docker/docker-compose.yml):
- Contenedor `is3-postgres` con PostgreSQL 18, publicado solo en `127.0.0.1:${POSTGRES_PORT}`.
- Volumen `is3_pgdata` (Docker lo muestra como `is3_is3_pgdata`, con el nombre del proyecto adelante) para que los datos sobrevivan a `down` y a reinicios.
- Base `expediente` (desarrollo) y `expediente_test` (pruebas), esta última creada por `infra/docker/init/01-crear-bd-pruebas.sql` solo la primera vez.
- Control de salud con `pg_isready`.

Detener: `docker compose --env-file .env -f infra/docker/docker-compose.yml down` · Borrar también los datos: agregar `-v` (irreversible).

Estado: **verificado el 14/10/2026** en la máquina de desarrollo (Windows, Docker Desktop 29.8.2): imagen `postgres:18-alpine` descargada, contenedor `is3-postgres` iniciado en `127.0.0.1:5432`, bases `expediente` y `expediente_test` creadas con dueño `is3_app` y codificación UTF8.

## 5. Backend y frontend

```bash
# Backend (lee el .env de la raíz del repositorio)
cd backend
npm install
npm run db:migrate          # aplica las migraciones de Prisma (crea las tablas)
npm run db:seed             # dependencias, roles, permisos y administrador inicial
npm run dev                 # http://localhost:3000/api/health

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

Verificación esperada: `GET /api/health` responde 200 y el frontend muestra el estado de la API (criterio de S1-03). Abrir http://localhost:5173 e iniciar sesión con usuario `admin` y contraseña `12345`.

**Usuarios iniciales (Sprint 2):** `npm run db:seed` crea estos usuarios si no existen (prototipo académico, contraseñas simples por decisión del PO, ADR-10):

| Usuario | Contraseña | Rol | Dependencia |
|---|---|---|---|
| `admin` | `12345` | Administrador (todos los permisos) | Administración General |
| `mesa` | `12345` | Mesa de entradas | Mesa de Entradas |
| `funcionario` | `12345` | Funcionario / Responsable | Asesoría Jurídica |
| `jefe` | `12345` | Jefe de dependencia | Asesoría Jurídica |
| `auditor` | `12345` | Auditor | Administración General |

El usuario y la contraseña del administrador se pueden cambiar con `ADMIN_USERNAME` y `ADMIN_PASSWORD` en el `.env` antes del primer seed. Los de prueba se omiten con `SEED_USUARIOS_DEMO=false`. Formato de respuestas y errores: [contrato de la API](../02-arquitectura/contrato-api.md).

Scripts del backend:

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga automática (`tsx watch`) |
| `npm run build` / `npm start` | Compila a `dist/` y ejecuta la versión compilada |
| `npm run typecheck` | Verificación de tipos de TypeScript |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:coverage` | Pruebas con Vitest y Supertest (con cobertura) |
| `npm run db:migrate` | `prisma migrate dev`: aplica migraciones y regenera el cliente |
| `npm run db:seed` | Datos iniciales (idempotente) |
| `npm run db:generate` | Regenera el cliente de Prisma (`src/generated/`, fuera de Git) |
| `npm run db:studio` | Explorador visual de la base (Prisma Studio) |

Las pruebas del Sprint 1 no necesitan la base de datos: la comprobación de la base se reemplaza por una función simulada.

## 6. Pruebas

```bash
cd backend && npm test
cd frontend && npm test
```

## 7. Copia de seguridad y restauración (Sprint 7)

Se documentará con el script de `scripts/backup/` (S7-04).

## 8. Problemas frecuentes

| Problema | Solución |
|---|---|
| Docker no inicia o PostgreSQL no levanta (riesgo R14) | Verificar que Docker Desktop esté abierto; alternativa: PostgreSQL instalado localmente con las mismas variables de `.env`. |
| Puerto ocupado (por ejemplo, otro PostgreSQL en 5432) | Cambiar `POSTGRES_PORT` en `.env` y el mismo puerto en `DATABASE_URL` y `DATABASE_URL_TEST`. Para el backend, cambiar `PORT`. |
| `Falta POSTGRES_USER en .env` al levantar Docker | No se creó `.env` o no se pasó `--env-file .env`; ejecutar desde la raíz del repositorio. |
| Se cambió la clave en `.env` y ya no conecta | La clave solo se aplica al crear el volumen. En desarrollo: `down -v` y volver a levantar (borra los datos). |
| `npm` bloqueado en PowerShell | Ver la nota de la sección 1 (`Set-ExecutionPolicy`). |
| `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine` | Docker Desktop no está abierto. Abrirlo, esperar *Engine running* y comprobar con `docker info`. |
| `.env` editado con `Set-Content -Encoding utf8` en Windows PowerShell | Ese comando agrega una marca BOM al inicio. Quitarla con `[IO.File]::WriteAllLines("$PWD\.env", (Get-Content .env), (New-Object Text.UTF8Encoding $false))`. |
