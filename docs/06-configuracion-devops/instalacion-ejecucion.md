# Instalación y ejecución local

**Estado:** Preliminar — los comandos de la aplicación se verifican al cerrar el Sprint 1 · **Unidad:** 8

> En la Fase 0 todavía no existe código de la aplicación. Esta guía describe los requisitos y el procedimiento previsto; cada paso se marca como **verificado** cuando se ejecute realmente.

## 1. Requisitos previos

| Herramienta | Versión | Para qué | Cómo verificar | Estado |
|---|---|---|---|---|
| Node.js | LTS vigente | Ejecutar backend, frontend y pruebas | `node -v` y `npm -v` | Pendiente (F0-05) |
| Git | Reciente | Control de versiones | `git --version` | Pendiente (F0-05) |
| Docker Desktop | Reciente, con Docker Compose | Base de datos PostgreSQL | `docker --version` y `docker compose version` | Pendiente (F0-05) |
| Editor (VS Code recomendado) | — | Desarrollo | — | Pendiente (F0-05) |

Registrar en esta tabla las versiones exactas instaladas al completar F0-05.

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

Completar `.env` con valores locales. **Nunca** subir `.env` a Git. Variables previstas:

| Variable | Descripción |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales del contenedor de PostgreSQL |
| `DATABASE_URL` | Cadena de conexión de Prisma para desarrollo |
| `DATABASE_URL_TEST` | Base separada para pruebas |
| `PORT` | Puerto del backend |
| `SESSION_SECRET` o `JWT_SECRET` | Secreto de sesión (valor aleatorio largo) |
| `STORAGE_PATH` | Carpeta de documentos (`./storage/documentos`) |
| `MAX_UPLOAD_MB` | Tamaño máximo de documento |
| `VITE_API_URL` | URL de la API para el frontend |

## 4. Levantar la base de datos (F0-07)

```bash
docker compose -f infra/docker/docker-compose.yml up -d
docker compose -f infra/docker/docker-compose.yml ps
```

Estado: pendiente de crear el archivo y verificar.

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
| Puerto ocupado | Cambiar `PORT` o el puerto mapeado en `docker-compose.yml`. |
