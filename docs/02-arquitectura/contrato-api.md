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
| `DELETE /api/usuarios/:id` (CR-06) | `usuarios.gestionar` | — | 204 sin cuerpo · 404 · 409 (eliminarse a uno mismo, dejar el sistema sin administradores activos, o usuario con actividad registrada: hay que desactivarlo) |
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
| `PATCH /api/expedientes/:id` | `expedientes.modificar` | Datos generales (`caratula`, `asunto`, `tipo`, `iniciador`, `prioridad`, `descripcion`, `fechaVencimiento`). **Desde el Sprint 5 no acepta `estado` ni `responsableId`** (400): tienen rutas propias | 200 · 400 · 403 · 404 · **409** archivado o en tránsito |
| `GET /api/expedientes/:id/documentos` | `expedientes.consultar` | — | 200 `{ data: [documento] }` |
| `POST /api/expedientes/:id/documentos` | `documentos.adjuntar` | **Cuerpo = archivo** (ADR-12). Encabezados: `Content-Type`, `X-Nombre-Archivo`, `X-Descripcion` opcional (codificados con `encodeURIComponent`) | 201 `{ data: documento }` · 400 tipo no permitido, vacío o sin nombre · 409 archivado · **413** supera `MAX_UPLOAD_MB` |
| `GET /api/expedientes/:id/documentos/:documentoId/descarga` | `documentos.descargar` | — | 200 con el archivo (`Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`) · 404 si el documento no es de ese expediente · 500 genérico si el archivo falta o fue alterado (hash) |
| `GET /api/expedientes/:id/actuaciones` | `expedientes.consultar` | — | 200 `{ data: [actuacion] }` en orden cronológico |
| `POST /api/expedientes/:id/actuaciones` | `actuaciones.registrar` | `{ tipo: "ACTUACION" \| "OBSERVACION", texto }` (3 a 5000 caracteres; fecha y autor los pone el servidor) | 201 · 400 · 409 archivado |
| `GET /api/expedientes/:id/historial` | `expedientes.consultar` | — | 200 `{ data: [evento] }` ordenado por fecha |

**Sprint 5 — seguimiento.** Un expediente con un pase sin recibir está **en tránsito**: responde con `paseEnTransito: { id, destino, enviadoEn }`, lo puede consultar también la dependencia destino, y toda modificación, carga o acción responde 409 hasta que se reciba.

| Método y ruta | Permiso | Entrada | Respuesta |
|---|---|---|---|
| `POST /api/expedientes/:id/estado` | `estados.cambiar` | `{ estado, motivo? }` | 200 `{ data: expediente }` · 409 transición no permitida, archivado o en tránsito |
| `POST /api/expedientes/:id/responsable` | `responsables.asignar` | `{ responsableId: number \| null }` (usuario activo de la dependencia del expediente) | 200 · 400 |
| `POST /api/expedientes/:id/pases` | `expedientes.enviar` (y estar en la dependencia del expediente, salvo `expedientes.consultar_todas`) | `{ destinoId, motivo }` | 201 `{ data: pase }` · 400 destino inválido · 403 · 409 archivado o ya en tránsito. Un borrador pasa a `EN_TRAMITE` |
| `GET /api/expedientes/:id/tareas` | `expedientes.consultar` | — | 200 `{ data: [tarea] }` |
| `POST /api/expedientes/:id/tareas` | `tareas.gestionar` | `{ titulo, asignadoAId, vencimiento, descripcion? }` (vencimiento obligatorio y no pasado) | 201 · 400 · 409 |
| `PATCH /api/tareas/:id` | `tareas.gestionar` (y ser el asignado, el creador o tener `responsables.asignar`) | `{ estado }` | 200 · 403 · 404 · 409 tarea cerrada |
| `GET /api/pases/recibidos` | `expedientes.recibir` | — | 200 `{ data: [pase sin recibir hacia mi dependencia] }` |
| `POST /api/pases/:id/recepcion` | `expedientes.recibir` (solo la dependencia destino) | — | 200 `{ data: pase }`; el expediente pasa a la dependencia destino sin responsable · 403 · 404 · 409 ya recibido |
| `GET /api/pendientes` | sesión | — | 200 `{ data: { tareas: [tarea + alerta], recibidos: [pase], expedientesPorVencer: [expediente + alerta] } }`; `alerta` = `VENCIDA`, `POR_VENCER` (3 días) o `null` |
| `GET /api/dependencias/:id/usuarios` | `tareas.gestionar` o `responsables.asignar` | — | 200 `{ data: [{ id, nombre, username }] }` (activos) |

No existen rutas para modificar ni borrar documentos, actuaciones o cambios de estado: son de solo inserción también en la base (triggers).

**Documento** (sin el nombre interno del almacenamiento):

```json
{ "id": 3, "expedienteId": 7, "nombreOriginal": "informe.pdf", "tipoMime": "application/pdf", "tamanoBytes": 2048,
  "hashSha256": "e3b0…", "descripcion": "Informe inicial", "subidoEn": "2026-10-15T11:00:00.000Z",
  "subidoPor": { "id": 1, "nombre": "Administrador del sistema", "username": "admin" } }
```

**Evento del historial:** `{ tipo: "CREACION" | "CAMBIO_ESTADO" | "DOCUMENTO" | "ACTUACION" | "OBSERVACION", fecha, usuario, descripcion, referenciaId?, estadoAnterior?, estadoNuevo? }`.

## 5 ter. Dashboard, reportes y notificaciones (Sprint 6)

| Método y ruta | Permiso | Entrada | Respuesta |
|---|---|---|---|
| `GET /api/estadisticas/dashboard` | `expedientes.consultar` | — | 200 `{ data: { alcance, generadoEn, diasAviso, resumen, seguimiento } }`. `alcance` = `{ tipo: "INSTITUCION" }` con `expedientes.consultar_todas`, si no `{ tipo: "DEPENDENCIA", dependencia }` |
| `GET /api/reportes/expedientes` | `reportes.consultar` | Query: `desde`, `hasta` (AAAA-MM-DD, creación, inclusivos), `estado`, `prioridad`, `tipo`, `dependenciaId`, `pagina`, `porPagina` (máx. 100) | 200 `{ data: { resumen, items: [expediente], total, pagina, porPagina } }` · 400 fecha inválida o `hasta` < `desde` · 403 otra dependencia sin `expedientes.consultar_todas` |
| `GET /api/reportes/expedientes/exportar` | `reportes.consultar` | Los mismos filtros | 200 `text/csv; charset=utf-8` con `Content-Disposition: attachment; filename="reporte-expedientes-AAAAMMDD.csv"` y `X-Filas`. 400 si hay más de 5000 filas. Se audita `reporte.exportar` |
| `GET /api/notificaciones` | sesión | Query: `soloNoLeidas=true` (opcional) | 200 `{ data: { items: [notificación], noLeidas } }` (las 30 más recientes, solo las propias) |
| `POST /api/notificaciones/:id/leida` | sesión | — | 200 `{ data: { id, leida: true } }` · 404 si no existe o es de otro usuario |
| `POST /api/notificaciones/leidas` | sesión | — | 200 `{ data: { marcadas } }` |

**Resumen:** `{ total, porEstado: { BORRADOR, EN_TRAMITE, EN_REVISION, RESUELTO, ARCHIVADO }, porPrioridad: { BAJA, MEDIA, ALTA }, porTipo: [{ tipo, total }], porDependencia: [{ dependencia, total }] }`.
**Seguimiento:** `{ vencidos, porVencer, enTransito, porRecibir, tareasAbiertas, tareasVencidas }` (vencidos y por vencer excluyen resueltos y archivados; "por vencer" = próximos 3 días).
**Notificación:** `{ id, tipo: "EXPEDIENTE_ASIGNADO" | "TAREA_ASIGNADA" | "PASE_ENTRANTE", mensaje, expediente: { id, numero, caratula } | null, creadaEn, leidaEn }`.

**CSV:** columnas `Número;Carátula;Tipo;Iniciador;Estado;Prioridad;Dependencia actual;Responsable;Creado;Vencimiento;En tránsito hacia`, con BOM UTF-8, separador `;` y fin de línea CRLF. Un valor que empieza con `=`, `+`, `-` o `@` se antepone con `'` para que Excel no lo ejecute como fórmula.

## 5 quater. Auditoría y respaldos (Sprint 7)

| Método y ruta | Permiso | Entrada | Respuesta |
|---|---|---|---|
| `GET /api/auditoria` | `auditoria.consultar` | Query: `desde`, `hasta` (AAAA-MM-DD, inclusivos), `usuarioId`, `accion`, `resultado` (`EXITO`/`FALLO`), `pagina`, `porPagina` (máx. 100, por defecto 25) | 200 `{ data: { items: [evento], total, pagina, porPagina } }` (más recientes primero) · 400 |
| `GET /api/auditoria/acciones` | `auditoria.consultar` | — | 200 `{ data: [accion] }` (ordenadas) |
| `GET /api/respaldos` | `respaldo.gestionar` | — | 200 `{ data: [{ nombre, creadoEn, totalFilas, documentos, documentosConProblemas, bytes }] }` |
| `POST /api/respaldos` | `respaldo.gestionar` | — | 201 `{ data: respaldo }`. Se audita `respaldo.crear` |

**Evento de auditoría:** `{ id, fecha, usuario: { id, nombre, username } | null, accion, resultado, entidad, entidadId, detalle, ip, requestId }`. No hay rutas para modificar ni borrar eventos, y no hay ruta para restaurar (ADR-13: solo `npm run respaldo:restaurar`).

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
