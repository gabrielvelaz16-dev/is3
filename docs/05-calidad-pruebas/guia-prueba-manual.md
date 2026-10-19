# Guía paso a paso para probar el sistema

**Para:** prueba manual en la PC (Sprint 8) · **Duración:** unos 40 minutos · **Rama:** `feature/S8-entrega`
**Resultado:** completar la tabla del final y pasarla a [resultados-pruebas.md §3](resultados-pruebas.md#3-pruebas-manuales).

Marcá cada paso con ✅ si salió como dice el "Resultado esperado", o anotá qué pasó si no. Si algo falla, sacá una captura y anotá el paso.

---

## Parte 0 — Preparar todo (10 min)

**0.1 Actualizar el código.** En VS Code, terminal en `is3-nuevo`:
```powershell
git checkout feature/S8-entrega
git pull
```
✔ Esperado: `Already up to date` o la lista de archivos actualizados.

**0.2 Abrir Docker Desktop** y esperar a que diga *Engine running*.

**0.3 Base de datos limpia** (borra los datos de prueba anteriores, son ficticios):
```powershell
docker compose --env-file .env -f infra/docker/docker-compose.yml down -v
docker compose --env-file .env -f infra/docker/docker-compose.yml up -d
```
✔ Esperado: el contenedor de PostgreSQL queda `Started` / `Healthy`.

**0.4 Backend** (terminal 1):
```powershell
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```
✔ Esperado: el seed muestra `Usuario creado: admin / 12345` y los demás usuarios; el backend queda escuchando en el puerto 3000 sin errores.

**0.5 Datos de demostración** (terminal 2, con el backend levantado):
```powershell
cd backend
npm run demo:cargar
```
✔ Esperado: `Datos de demostración cargados: 11 expedientes nuevos…` y una línea JSON con ids. Ejecutalo **otra vez**: tiene que decir `ya estaban cargados; no se agregó nada`.

**0.6 Frontend** (terminal 3):
```powershell
cd frontend
npm install
npm run dev
```
✔ Esperado: `Local: http://localhost:5173/`. Abrilo en el navegador.

> Si en Inicio aparece "No existe la ruta …", hay otro backend viejo en el puerto 3000. Cerralo y repetí 0.4.

---

## Parte 1 — Inicio de sesión y permisos (5 min)

| # | Acción | Resultado esperado |
|---|---|---|
| 1.1 | Entrá con `admin` / `1234` (contraseña mal) | Mensaje de error; no entra |
| 1.2 | Entrá con `admin` / `12345` | Pantalla **Inicio** con el menú lateral: Expedientes, Tareas y pendientes, Reportes, Auditoría, Administración |
| 1.3 | Mirá el pie de Inicio | *Estado del sistema*: API y Base de datos **Disponible**, Versión **1.0.0** |
| 1.4 | Mirá *Situación de toda la institución* | **16** expedientes; tarjetas de vencidos, por vencer, en tránsito y por recibir con números mayores a 0 |
| 1.5 | *Cerrar sesión* (abajo a la izquierda) y entrá con `funcionario` / `12345` | El menú **no** tiene Auditoría ni Administración; Inicio dice *Situación de Asesoría Jurídica* |
| 1.6 | Siendo `funcionario`, escribí en la barra `http://localhost:5173/administracion` | **Acceso denegado** |

---

## Parte 2 — Recorrido completo de un expediente (15 min)

Este es el flujo principal: Mesa de Entradas registra, envía a Asesoría Jurídica, y allí lo trabajan.

**Como `mesa` / `12345`:**

| # | Acción | Resultado esperado |
|---|---|---|
| 2.1 | *Expedientes → Nuevo expediente*. Tocá *Crear expediente* sin completar nada | Mensajes en rojo debajo de cada campo obligatorio |
| 2.2 | Completá: carátula "Prueba manual — pedido de informe", asunto cualquiera, tipo *Solicitud*, iniciador "Prueba", prioridad *Alta*, vencimiento dentro de 5 días → *Crear expediente* | Se abre el detalle con un número nuevo `EXP-2026-0000NN` en la pestaña de la carpeta y estado **Borrador**. **Anotá el número** |
| 2.3 | Pestaña **Documentos** → elegí un PDF cualquiera de tu PC (que no tenga datos personales) → *Adjuntar* | Aviso verde arriba a la derecha; el documento aparece en la lista |
| 2.4 | Adjuntá un `.txt` (se acepta, CR-07) y después intentá adjuntar un `.exe`, o un `.exe` renombrado como `.txt` | El `.txt` aparece en la lista; el `.exe` da el error "tipo de archivo no permitido" |
| 2.5 | Pestaña **Datos** → *Enviar a otra dependencia* → *Asesoría Jurídica*, motivo "Para dictamen" → *Enviar* | Aparece el aviso violeta **En tránsito**; desaparecen *Editar* y los botones de estado |
| 2.6 | Pestaña **Historial** | Creación, Documento, Pase enviado y Cambio de estado *Borrador → En trámite* |

**Como `jefe` / `12345`:**

| # | Acción | Resultado esperado |
|---|---|---|
| 2.7 | Mirá la **campana** de arriba | Número rojo; un aviso dice que llegó tu expediente |
| 2.8 | *Tareas y pendientes → Expedientes recibidos* → *Confirmar recepción* en tu expediente | Sale de la lista |
| 2.9 | Abrí tu expediente → **Datos** → *Responsable*: *Fabián Funcionario* → *Asignar* | El responsable aparece en la carátula |
| 2.10 | En la carátula, *Pasar a: En revisión*, motivo "Se analiza" | El estado cambia a **En revisión** |
| 2.11 | Pestaña **Tareas** → título "Redactar dictamen", asignar a Fabián, vence mañana → *Crear tarea* | La tarea aparece como pendiente |
| 2.12 | Pestaña **Actuaciones** → *Observación*, texto "Falta el presupuesto" → *Registrar* | Aparece con tu nombre y la fecha; no tiene botón para editar ni borrar |

**Como `funcionario` / `12345`:**

| # | Acción | Resultado esperado |
|---|---|---|
| 2.13 | Campana | Avisos de que te asignaron el expediente y la tarea |
| 2.14 | *Tareas y pendientes → Mis tareas* → *Completar* en "Redactar dictamen" | La tarea desaparece de las abiertas |
| 2.15 | Abrí el expediente: en **Datos** no aparece *Asignar responsable* | Correcto: el funcionario no tiene ese permiso |

**Como `jefe` otra vez:**

| # | Acción | Resultado esperado |
|---|---|---|
| 2.16 | *Pasar a: Resuelto*, después *Pasar a: Archivado* | Estado **Archivado**; ya no hay botones de estado ni *Editar* |
| 2.17 | Pestaña **Historial** | Todo el recorrido en orden: pases, responsable, estados con nombres legibles ("En trámite → En revisión"), tarea, observación |

---

## Parte 3 — Búsqueda, reportes y auditoría (5 min)

| # | Usuario | Acción | Resultado esperado |
|---|---|---|---|
| 3.1 | `admin` | *Expedientes* → buscá "ascensores" | Aparece solo la licitación de ascensores |
| 3.2 | `admin` | Filtro *Todos los estados → Archivado* | Aparecen los archivados (incluido el tuyo) |
| 3.3 | `admin` | *Reportes* → estado *En trámite* → *Generar reporte* → *Exportar a CSV* | Se descarga un `.csv` que abre en Excel con las mismas filas de la pantalla |
| 3.4 | `auditor` | *Auditoría* → filtro *Resultado: Fallo* → *Filtrar* | Aparece el intento de login fallido del paso 1.1 |
| 3.5 | `auditor` | Abrí cualquier expediente | Lo ve, pero sin *Editar*, sin botones de estado y sin *Adjuntar* |

---

## Parte 4 — Administración y copia de seguridad (5 min)

| # | Acción | Resultado esperado |
|---|---|---|
| 4.1 | `admin` → *Administración → Nuevo usuario*: nombre "Usuario Prueba", usuario `prueba`, correo `prueba@institucion.test`, contraseña `12345`, rol *Funcionario*, dependencia *Recursos Humanos* → *Guardar* | Aparece en la tabla como **Activo** |
| 4.2 | Cerrá sesión y entrá con `prueba` / `12345` | Entra; Inicio dice *Situación de Recursos Humanos* |
| 4.3 | Como `admin`: *Editar* en `prueba` → destildá *Usuario activo* → *Guardar*. Intentá entrar con `prueba` | Figura como **Inactivo** y no puede entrar |
| 4.4 | `admin` → *Administración → Copias de seguridad → Crear respaldo ahora* | Aviso con la cantidad de filas y documentos; el respaldo aparece en la lista. **No** hay botón de restaurar (es a propósito, ADR-13) |
| 4.5 | *(Opcional, 10 min más)* Restaurar ese respaldo en una base vacía siguiendo la [guía de instalación §7](../06-configuracion-devops/instalacion-ejecucion.md#7-copia-de-seguridad-y-restauración-sprint-7-adr-13) | El comando termina con "filas y documentos verificados" y al entrar está todo igual, incluido tu expediente archivado |

---

## Parte 5 — Celular (2 min)

| # | Acción | Resultado esperado |
|---|---|---|
| 5.1 | En el navegador, `F12` → ícono de celular (*Toggle device toolbar*) → elegí un iPhone | El menú lateral se oculta y arriba a la izquierda aparece el botón de menú (tres rayas) |
| 5.2 | Tocá el botón de menú → elegí *Expedientes* | Se abre el menú como panel y se cierra al elegir la sección |

---

## Registro de resultados

Copiá esta tabla en [resultados-pruebas.md §3](resultados-pruebas.md#3-pruebas-manuales) cuando termines:

| Parte | Fecha | Quién probó | Pasos OK | Pasos con problema | Observaciones |
|---|---|---|---|---|---|
| 0 Preparación | | | / 6 | | |
| 1 Login y permisos | | | / 6 | | |
| 2 Recorrido del expediente | | | / 17 | | |
| 3 Búsqueda, reportes, auditoría | | | / 5 | | |
| 4 Administración y respaldo | | | / 5 | | |
| 5 Celular | | | / 2 | | |

Si un paso falla: anotá el número de paso, qué esperabas, qué pasó y la captura. Se registra como defecto (D-13 en adelante) en [resultados-pruebas.md](resultados-pruebas.md).

> Esta guía es la **prueba manual** del responsable. La **prueba de usabilidad** con 3 personas es otra cosa (personas que no conocen el sistema, sin ayuda): ver [guia-usabilidad.md](guia-usabilidad.md).
