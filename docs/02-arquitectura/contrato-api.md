# Contrato de la API

**Estado:** Vigente desde el Sprint 1; endpoints de sesión y usuarios desde el Sprint 2 · **Unidad:** 8 · **Tarjetas:** S1-03, S1-05, S2-02, S2-03, S2-05

Todas las respuestas de la API (`/api/*`) usan el mismo formato, así el frontend procesa éxito y error de una sola manera.

## 1. Respuesta exitosa

```json
{ "data": { } }
```

`data` contiene el recurso o la lista pedida. Las listas paginadas (Sprint 3) agregan `meta` con `page`, `pageSize` y `total`.

## 2. Respuesta de error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos",
    "requestId": "3f2c9a0e-…",
    "details": [{ "field": "asunto", "message": "Too small: expected string to have >=3 characters" }]
  }
}
```

| Campo | Descripción |
|---|---|
| `code` | Código estable para que el frontend decida qué hacer (no cambia aunque cambie el texto). |
| `message` | Mensaje en español pensado para el usuario. Nunca incluye trazas, SQL ni credenciales (RNF-05). |
| `requestId` | Identificador de la petición; también va en el encabezado `X-Request-Id` y en el log. Permite encontrar el error en los logs. |
| `details` | Solo en errores de validación: lista de campos con problema. |

## 3. Códigos de error

| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Datos que no cumplen el esquema (Zod). |
| 400 | `INVALID_JSON` | El cuerpo no es un JSON válido. |
| 401 | `UNAUTHORIZED` | Falta iniciar sesión (Sprint 2). |
| 403 | `FORBIDDEN` | El rol no tiene permiso (Sprint 2). |
| 404 | `NOT_FOUND` | Ruta o recurso inexistente. |
| 409 | `CONFLICT` | Conflicto con el estado actual (por ejemplo, transición de estado no válida, Sprint 5). |
| 413 | `PAYLOAD_TOO_LARGE` | Cuerpo JSON mayor a 1 MB. |
| 429 | `TOO_MANY_REQUESTS` | 5 intentos fallidos de login con el mismo usuario en 15 minutos. |
| 503 | — | `/api/health` cuando la base de datos no responde (ver §4). |
| 500 | `INTERNAL_ERROR` | Error no previsto. El mensaje es genérico e incluye el `requestId`; el detalle queda solo en el log. |

## 4. `GET /api/health`

Estado de la API y de la base de datos. No requiere sesión.

| Situación | HTTP | `data.status` | `data.database` |
|---|---|---|---|
| Todo funciona | 200 | `ok` | `ok` |
| La base no responde (por ejemplo, Docker apagado) | 503 | `degraded` | `down` |

```json
{
  "data": {
    "status": "ok",
    "api": "ok",
    "database": "ok",
    "version": "0.1.0",
    "uptimeSeconds": 12,
    "timestamp": "2026-10-14T15:00:00.000Z"
  }
}
```

## 5. Sesión y usuarios (Sprint 2)

La sesión viaja en la cookie `is3_sid` (`httpOnly`, `SameSite=Strict`, `Path=/api`). El frontend la recibe sola; no la lee ni la guarda.

| Método y ruta | Requiere | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| `POST /api/auth/login` | — | `{ usuario, password }` (`usuario` = nombre de usuario o correo) | 200 `{ data: { usuario } }` + cookie · 401 credenciales incorrectas (mismo mensaje si el usuario no existe) · 429 bloqueo |
| `POST /api/auth/logout` | — | — | 200 `{ data: { ok: true } }`; borra la sesión en el servidor y la cookie |
| `GET /api/auth/me` | sesión | — | 200 `{ data: { usuario } }` · 401 |
| `GET /api/usuarios` | `usuarios.gestionar` | `?q=&page=1&pageSize=20` (máx. 100) | 200 `{ data: [usuario], meta: { page, pageSize, total } }` |
| `GET /api/usuarios/:id` | `usuarios.gestionar` | — | 200 `{ data: usuario }` · 404 |
| `POST /api/usuarios` | `usuarios.gestionar` | `{ username, email, nombre, password, rolId, dependenciaId }` | 201 `{ data: usuario }` · 400 · 409 nombre de usuario o correo repetido |
| `PATCH /api/usuarios/:id` | `usuarios.gestionar` | Al menos uno de `{ nombre, rolId, dependenciaId, activo, password }` | 200 `{ data: usuario }` · 400 · 404 · 409 (desactivarse o cambiarse el rol a uno mismo, o dejar el sistema sin administradores activos) |
| `GET /api/roles` | `usuarios.gestionar` | — | 200 `{ data: [rol con permisos] }` |
| `GET /api/dependencias` | sesión | — | 200 `{ data: [dependencia activa] }` |

**Usuario** (nunca incluye el hash de la contraseña):

```json
{
  "id": 1, "username": "admin", "email": "admin@institucion.test", "nombre": "Administrador del sistema", "activo": true,
  "ultimoAcceso": "2026-10-14T15:00:00.000Z", "creadoEn": "2026-10-14T14:00:00.000Z",
  "rol": { "id": 1, "clave": "ADMINISTRADOR", "nombre": "Administrador" },
  "dependencia": { "id": 1, "codigo": "ADM", "nombre": "Administración General" },
  "permisos": ["usuarios.gestionar", "…"]
}
```

`permisos` solo aparece en el usuario de la sesión (`login` y `me`).

## 5 bis. Expedientes, documentos, actuaciones e historial (Sprints 3 y 4)

Todas requieren sesión. Las rutas de un expediente verifican además que el usuario pueda verlo: si no tiene `expedientes.consultar_todas`, solo los de su dependencia (403 en otro caso).

| Método y ruta | Permiso | Entrada | Respuesta |
|---|---|---|---|
| `GET /api/expedientes` | `expedientes.consultar` | `?q=&estado=&prioridad=&dependenciaId=&pagina=1&porPagina=20` | 200 `{ data: [expediente], paginacion: { total, pagina, porPagina, totalPaginas } }` |
| `POST /api/expedientes` | `expedientes.crear` | `{ caratula, asunto, tipo, iniciador, prioridad?, descripcion?, fechaVencimiento?, responsableId? }` | 201 · 400 (incluye responsable inexistente) |
| `GET /api/expedientes/:id` | `expedientes.consultar` | — | 200 · 403 · 404 |
| `PATCH /api/expedientes/:id` | `expedientes.modificar` | Campos a cambiar, incluido `estado` | 200 · 400 · 403 · 404 · **409** transición no permitida o expediente archivado |
| `GET /api/expedientes/:id/documentos` | `expedientes.consultar` | — | 200 `{ data: [documento] }` |
| `POST /api/expedientes/:id/documentos` | `documentos.adjuntar` | **Cuerpo = archivo** (ADR-12). Encabezados: `Content-Type`, `X-Nombre-Archivo`, `X-Descripcion` opcional (codificados con `encodeURIComponent`) | 201 `{ data: documento }` · 400 tipo no permitido, vacío o sin nombre · 409 archivado · **413** supera `MAX_UPLOAD_MB` |
| `GET /api/expedientes/:id/documentos/:documentoId/descarga` | `documentos.descargar` | — | 200 con el archivo (`Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`) · 404 si el documento no es de ese expediente · 500 genérico si el archivo falta o fue alterado (hash) |
| `GET /api/expedientes/:id/actuaciones` | `expedientes.consultar` | — | 200 `{ data: [actuacion] }` en orden cronológico |
| `POST /api/expedientes/:id/actuaciones` | `actuaciones.registrar` | `{ tipo: "ACTUACION" \| "OBSERVACION", texto }` (3 a 5000 caracteres; fecha y autor los pone el servidor) | 201 · 400 · 409 archivado |
| `GET /api/expedientes/:id/historial` | `expedientes.consultar` | — | 200 `{ data: [evento] }` ordenado por fecha |

No existen rutas para modificar ni borrar documentos, actuaciones o cambios de estado: son de solo inserción también en la base (triggers).

**Documento** (sin el nombre interno del almacenamiento):

```json
{ "id": 3, "expedienteId": 7, "nombreOriginal": "informe.pdf", "tipoMime": "application/pdf", "tamanoBytes": 2048,
  "hashSha256": "e3b0…", "descripcion": "Informe inicial", "subidoEn": "2026-10-15T11:00:00.000Z",
  "subidoPor": { "id": 1, "nombre": "Administrador del sistema", "username": "admin" } }
```

**Evento del historial:** `{ tipo: "CREACION" | "CAMBIO_ESTADO" | "DOCUMENTO" | "ACTUACION" | "OBSERVACION", fecha, usuario, descripcion, referenciaId?, estadoAnterior?, estadoNuevo? }`.

## 6. Encabezados

| Encabezado | Uso |
|---|---|
| `X-Request-Id` | Se devuelve siempre. Si el cliente envía uno válido (letras, números, `_` y `-`, hasta 64 caracteres), se reutiliza. |
| `X-Powered-By` | Deshabilitado para no exponer la tecnología del servidor. |

## 7. Dónde está en el código

| Pieza | Archivo |
|---|---|
| Errores tipados | `backend/src/shared/errors.ts` |
| Formato de respuesta | `backend/src/shared/http.ts` |
| Manejador central de errores | `backend/src/api/middlewares/error-handler.ts` |
| Pruebas del contrato | `backend/tests/integration/errors.test.ts`, `health.test.ts`, `auth.test.ts`, `usuarios.test.ts` |
