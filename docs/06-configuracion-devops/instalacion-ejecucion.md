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
- Volumen `is3_pgdata` para que los datos sobrevivan a `down` y a reinicios.
- Base `expediente` (desarrollo) y `expediente_test` (pruebas), esta última creada por `infra/docker/init/01-crear-bd-pruebas.sql` solo la primera vez.
- Control de salud con `pg_isready`.

Detener: `docker compose --env-file .env -f infra/docker/docker-compose.yml down` · Borrar también los datos: agregar `-v` (irreversible).

Estado: archivo creado y validado con `docker compose config`; **pendiente** de verificar el arranque en la máquina de desarrollo.

## 5. Backend y frontend (Sprint 1)

```bash
# Backend
cd backend
npm install
npx prisma migrate dev      # desde el Sprint 2
npm run dev

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

Verificación esperada: `GET /api/health` responde 200 y el frontend muestra el estado de la API (criterio de S1-03).

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
