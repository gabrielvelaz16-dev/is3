# Manual de usuario — Expediente Electrónico

Guía corta para usar el prototipo. Todos los datos son ficticios. Para instalarlo, ver el [README](../README.md).

## 1. Entrar al sistema

Abrí http://localhost:5173 y entrá con tu usuario y contraseña. Con los datos de demostración existen:

| Usuario | Rol | Dependencia | Qué puede hacer |
|---|---|---|---|
| `admin` | Administrador | Administración General | Todo, incluidos usuarios, auditoría y copias de seguridad |
| `mesa` | Mesa de entradas | Mesa de Entradas | Registrar expedientes, adjuntar documentos, enviar y recibir |
| `jefe` | Jefe de dependencia | Asesoría Jurídica | Lo del funcionario, más asignar responsables y ver reportes |
| `funcionario` | Funcionario | Asesoría Jurídica | Modificar, registrar actuaciones, cambiar estados, gestionar tareas |
| `auditor` | Auditor | Administración General | Consultar todo, reportes y auditoría, sin modificar nada |

La contraseña de todos es `12345`. Al entrar, el sistema siempre abre **Inicio**. Después de 5 intentos fallidos hay que esperar 15 minutos para volver a probar.

## 2. La pantalla

- **Menú lateral:** Inicio, Expedientes, Tareas y pendientes, Reportes, Auditoría y Administración. Cada persona ve solo lo que su rol permite.
- **Barra de arriba:** el nombre de tu dependencia y la campana de notificaciones. El número rojo indica avisos sin leer.
- **Inicio:** la situación de tu dependencia: expedientes por estado, vencidos, por vencer, en tránsito y tareas vencidas.

## 3. Tareas frecuentes

### Registrar un expediente (Mesa de entradas)
1. *Expedientes → Nuevo expediente*.
2. Completá carátula, asunto, tipo, iniciador y prioridad. El vencimiento es opcional.
3. *Crear expediente*. El sistema le da un número único (`EXP-2026-000017`) y lo deja en estado **Borrador**.

### Adjuntar un documento
1. Abrí el expediente → pestaña **Documentos**.
2. Elegí el archivo (PDF, Word, Excel, texto `.txt` o imágenes PNG, JPG, GIF y WEBP, hasta 10 MB) y *Adjuntar*.
El sistema revisa el contenido real del archivo, no solo la extensión, y guarda su huella (SHA-256).

### Enviar a otra dependencia
1. En el expediente, pestaña **Datos** → *Enviar a otra dependencia*.
2. Elegí el destino, escribí el motivo y *Enviar*.
El expediente queda **en tránsito** y nadie lo puede modificar hasta que el destino lo reciba.

### Recibir un expediente
1. *Tareas y pendientes → Expedientes recibidos*.
2. *Confirmar recepción*. Desde ese momento el expediente es de tu dependencia.

### Cambiar el estado
En la carátula del expediente aparecen los botones **Pasar a:** con los estados permitidos. El motivo es opcional pero queda en el historial.

Borrador → En trámite → En revisión ↔ En trámite → Resuelto → Archivado. Un expediente archivado ya no se puede modificar.

### Asignar responsable y crear tareas (Jefe)
- **Responsable:** pestaña **Datos** → *Responsable* → *Asignar*.
- **Tarea:** pestaña **Tareas** → título, persona y vencimiento → *Crear tarea*. La persona recibe una notificación y la ve en *Tareas y pendientes*.

### Registrar una actuación u observación
Pestaña **Actuaciones** → elegí *Actuación* u *Observación*, escribí el texto y *Registrar*. Lo registrado no se puede editar ni borrar.

### Ver el historial
Pestaña **Historial**: creación, cambios de estado, documentos, pases, responsables, tareas y actuaciones, con fecha y persona.

### Reportes (Jefe, Administrador, Auditor)
*Reportes* → filtrá por fechas, estado, prioridad, tipo o dependencia → *Exportar CSV* para abrirlo en Excel.

### Auditoría (Administrador, Auditor)
*Auditoría* → filtrá por fecha, acción o resultado. Es solo de consulta.

### Desactivar o eliminar un expediente (Administrador)
- **Desactivar:** en el expediente, botón **Desactivar** → escribí el motivo → *Desactivar*. Deja de aparecer en la lista, en Inicio, en los reportes y en los pendientes, y no se puede modificar. El historial se conserva.
- **Expedientes desactivados** (menú *Sistema*): muestra quién, cuándo y por qué se desactivó cada uno. **Reactivar** lo devuelve a la lista.
- **Eliminar:** solo se puede con expedientes sin ningún movimiento (sin documentos, actuaciones, tareas, pases ni cambios de estado). Si tiene historial, el sistema pide desactivarlo.

### Copia de seguridad (Administrador)
*Administración → Copias de seguridad → Crear respaldo ahora*. La restauración se hace solo por consola, siguiendo la [guía de instalación §7](06-configuracion-devops/instalacion-ejecucion.md).

## 4. Mensajes frecuentes

| Mensaje | Qué significa |
|---|---|
| "No tiene permiso para realizar esta acción" / *Acceso denegado* | Tu rol no permite esa función |
| "No se puede pasar de Borrador a Archivado" | Ese cambio de estado no está permitido; usá los botones *Pasar a:* |
| "El expediente está en tránsito hacia …" | Esperá a que la dependencia destino lo reciba |
| "No se puede … un expediente desactivado" | El administrador lo dio de baja; hay que reactivarlo desde *Expedientes desactivados* |
| "El expediente tiene documentos, actuaciones… y no se puede eliminar" | Tiene historial: desactivalo en lugar de eliminarlo |
| "No existe la ruta …" | El frontend es más nuevo que el backend: reiniciá el backend de la misma versión |
