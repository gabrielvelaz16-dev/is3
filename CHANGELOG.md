# Historial de versiones

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones según [SemVer](https://semver.org/lang/es/).
El detalle de cada cambio está en [historial-cambios.md](docs/04-gestion/historial-cambios.md).

## [1.0.0] — pendiente de etiquetar

La versión que informa `/api/health` ya es `1.0.0` (`package.json` del backend y del frontend).

Primera versión estable del prototipo (Sprint 8).

### Agregado
- Datos de demostración cargados por la API: 16 expedientes en todos los estados, con pases, documentos, tareas y actuaciones (`npm run demo:cargar`).
- Manual de usuario y documentación final.

### Cambiado
- Interfaz (CR-05): menú lateral agrupado, detalle del expediente con carátula y pestañas, componentes comunes y avisos flotantes.

### Corregido
- D-12: el historial y los mensajes de error mostraban los nombres internos de los estados (`EN_TRAMITE`).

## [0.2.0] — pendiente de etiquetar

Sprints 3 a 7.

### Agregado
- Expedientes con número único, búsqueda, filtros y paginación (Sprint 3).
- Documentos validados por contenido con SHA-256, actuaciones e historial de solo inserción (Sprint 4).
- Pases entre dependencias, responsables, tareas con vencimiento y pendientes (Sprint 5).
- Notificaciones, dashboard, reportes con exportación CSV y verificación de indicadores en la CI (Sprint 6).
- Consulta de auditoría, copia de seguridad y restauración, matriz de permisos y medición de rendimiento (Sprint 7).

### Corregido
- D-04 a D-11 (ver [resultados de pruebas](docs/05-calidad-pruebas/resultados-pruebas.md)), entre ellos D-06 de seguridad.

## [0.1.0] — pendiente de etiquetar

Fase 0 y Sprints 1 y 2: estructura, CI, base de datos, inicio de sesión, roles y permisos en el servidor, auditoría base.
