# Control integrado de cambios

**Estado:** Vivo · **Unidades:** 2, 3 y 8 · **Tarjetas:** CF-02, CF-03

## 1. Qué pasa por control de cambios

| Pasa por control formal (predictivo) | Se gestiona dentro del sprint (adaptativo) |
|---|---|
| Cambios de alcance que agregan o quitan requisitos `RF`/`RNF` | Reordenar prioridades del backlog |
| Cambios en fechas de hitos o en la cantidad de sprints/releases | Dividir historias o ajustar sus criterios sin cambiar el requisito |
| Cambios en requisitos normativos o de seguridad | Corregir defectos |
| Cambios en la arquitectura aceptada (ADR) | Refactorizaciones internas |
| Cualquier cambio a un documento en estado *Línea base* | Mejoras de UX dentro de una historia |

## 2. Procedimiento

```mermaid
flowchart LR
    A[Solicitud<br/>CR-xx] --> B[Análisis de impacto<br/>alcance · plazo · costo<br/>riesgos · calidad · releases]
    B --> C{¿Afecta línea base?}
    C -- No --> D[Decide PO<br/>se refina backlog]
    C -- Sí --> E{¿Supera autoridad<br/>del Gerente?}
    E -- No --> F[Decide Gerente]
    E -- Sí --> G[Decide Comité /<br/>Patrocinador]
    D --> H[Actualizar artefactos<br/>backlog · Trello · docs · riesgos]
    F --> H
    G --> H
    H --> I[Nueva versión de línea base<br/>tag baseline-vN en Git]
```

1. Cualquier integrante registra la solicitud en este documento y crea una tarjeta en la lista *Control formal* de Trello.
2. El Gerente analiza el impacto con la plantilla de la sección 3.
3. Decide quien corresponde según el escalamiento de [enfoque-gobernanza.md](enfoque-gobernanza.md#escalamiento).
4. Si se aprueba: se actualizan backlog, Trello, requisitos, riesgos y cronograma; se registra en el [historial de cambios](historial-cambios.md); si cambia la línea base, se etiqueta una nueva versión (`baseline-v2`, …).
5. Si se rechaza: queda registrada con el motivo.

## 3. Plantilla de solicitud

```
CR-xx · Título
Fecha / Solicitante:
Descripción del cambio:
Motivo (origen: normativa, usuario, riesgo, técnico):
Impacto en alcance (RF/RNF, historias):
Impacto en plazo y SP:
Impacto en riesgos:
Impacto en calidad / pruebas:
Releases y despliegue afectados:
Decisión / Quién decide / Fecha:
Artefactos actualizados:
```

## 4. Registro de cambios

| ID | Título | Fecha | Estado | Decide |
|---|---|---|---|---|
| CR-00 | Unificación del backlog del TP con el alcance del prototipo | 13/10/2026 | **Aprobado** 14/10/2026 | Gerente / Comité |
| CR-01 | Evento de cambio: nuevo control documental + retraso del proveedor de identidad | — | Planificado para el piloto (R3) | Comité |
| CR-02 | Adelantar login y gestión de usuarios (Sprint 2) en paralelo al cierre del Sprint 1; aclarar RNF-01 | 14/10/2026 | **Aprobado** 14/10/2026 | Product Owner / Gerente |
| CR-03 | Mover S5-06 (notificaciones internas, 8 SP) del Sprint 5 al Sprint 6 | 15/10/2026 | **Aprobado** 15/10/2026 | Product Owner / Gerente |
| CR-04 | Orden de recorte del Sprint 6: si se atrasa, S6-03 (exportar, 3 SP) pasa al Sprint 7 | 16/10/2026 | **Aprobado** 16/10/2026 · no fue necesario aplicarlo | Product Owner / Gerente |
| CR-05 | Mejora de la interfaz: menú lateral, detalle en pestañas y componentes comunes | 16/10/2026 | **Aprobado** 16/10/2026 | Product Owner |
| CR-06 | Mostrar la contraseña, eliminar usuarios sin actividad y mejoras de navegación | 19/10/2026 | **Aprobado** 19/10/2026 | Product Owner |
| CR-07 | Adjuntar documentos de texto (.txt) e imágenes GIF y WEBP | 19/10/2026 | **Aprobado** 19/10/2026 | Product Owner |
| CR-08 | Desactivar, reactivar y eliminar expedientes; sección "Expedientes desactivados" | 19/10/2026 | **Aprobado** 19/10/2026 | Product Owner |

### CR-00 · Unificación del backlog del TP con el alcance del prototipo

- **Solicitante:** Gerente de Proyecto · **Fecha:** 13/10/2026
- **Descripción:** el backlog del TP Nro 6 (80 SP, 4 releases) y las instrucciones del prototipo (Fase 0 + 8 sprints) no coincidían. Se unifican en un solo backlog.
- **Motivo:** técnico y de trazabilidad (Unidad 3).
- **Impacto en alcance:**
  - Se agregan al prototipo historias del TP que no estaban en las instrucciones: enviar y recibir expediente, notificaciones (RF-15, RF-16, RF-17).
  - Se agregan al backlog funciones de las instrucciones que no estaban en el TP: tareas y vencimientos, dashboard, exportación, copia de seguridad, listado con filtros, modificación de expediente, actuaciones, responsables (RF-13, RF-18, RF-19, RF-22, entre otros).
  - Se agrega el paquete 1.7 *Desarrollo/configuración del sistema* a la EDT.
  - Las historias institucionales del Release 4 (18 SP) quedan fuera del prototipo y se gestionan como actividades simuladas.
- **Impacto en plazo y SP:** 80 SP → 97 SP (+17 netos). Sprint 5 queda con 29 SP (sobre la velocidad de referencia).
- **Impacto en riesgos:** aumenta R09/R13 (estimación optimista). Mitigación: priorización MoSCoW y propuesta de mover S5-06 al Sprint 6.
- **Releases:** usuarios y permisos pasan de R3 a R1 (prerequisito técnico); pases y notificaciones pasan de R2 a R3.
- **Artefactos actualizados:** [backlog.md](backlog.md), [planificacion.md](planificacion.md), [estimacion-calendario.md](estimacion-calendario.md), [requisitos.md](../01-alcance-requisitos/requisitos.md), tablero Trello.
- **Decisión:** **aprobado** por el Gerente de Proyecto el 14/10/2026, en la revisión de la puerta G1 ([acta](../07-evidencias/fase0/acta-puerta-g1.md)). La propuesta de mover S5-06 al Sprint 6 se decide en la planificación del Sprint 5.

### CR-01 · Evento de cambio obligatorio del TP

- **Descripción:** durante el piloto aparece una nueva exigencia de control documental que afecta varios flujos, y el proveedor de identidad retrasa su integración.
- **Riesgos relacionados:** R01 (crítica) y R03 (crítica).
- **Respuesta planificada:**
  1. *Proveedor de identidad:* se mantiene el adaptador simulado (ADR-06, S2-04); el desarrollo no se bloquea. La integración real pasa a un release posterior.
  2. *Control documental:* se registra como nuevo requisito. Propuesta para el prototipo: **un expediente no puede pasar a `EN_REVISION` si no tiene al menos un documento con tipo documental asignado y verificado por su responsable**. Afecta RF-08, RF-14 y el flujo de pases.
  3. Se refina el backlog con nuevas historias, se reestiman SP y se revisa qué release absorbe el cambio sin perder la fecha (o se escala).
  4. Se actualizan riesgos, cronograma, plan de pruebas y estrategia de despliegue.
- **Evidencia esperada:** esta solicitud completada, commits con código `CR-01`, tarjetas nuevas en Trello, nueva línea base etiquetada.
- **Estado:** se ejecuta cuando el prototipo llegue al piloto (después del Sprint 5).

### CR-02 · Adelantar login y gestión de usuarios

- **Solicitante:** Product Owner (Carlos G. Velázquez F.) · **Fecha:** 14/10/2026
- **Descripción:** construir ya el inicio de sesión con un usuario administrador con todos los permisos, la creación de usuarios y la asignación de roles (S2-01 a S2-05 y parte de S2-06/S2-07), sin esperar al cierre formal del Sprint 1. S1-06 (CI) queda para después.
- **Motivo:** usuario (prioridad del PO): sin login no se pueden probar los permisos de ninguna función posterior.
- **Impacto en alcance:** ninguno; son historias ya aprobadas del Release 1 (mismo release). Cambia el orden, no el contenido.
- **Impacto en plazo y SP:** el Sprint 1 y el Sprint 2 se solapan; los SP del Sprint 2 (12 SP de historias) no cambian. La velocidad se medirá sobre ambos sprints juntos.
- **Impacto en requisitos:** RNF-01 se aclara: se admite scrypt además de bcrypt y argon2 (ADR-10). El criterio medible no cambia.
- **Impacto en riesgos:** aumenta levemente R13 (sobrecarga de alcance); mitigación: la CI (S1-06) se completa antes de cerrar el Release 1.
- **Decisión:** aprobado por el PO el 14/10/2026 (pedido directo en la sesión de trabajo).
- **Artefactos actualizados:** [sprint-02.md](sprints/sprint-02.md), [decisiones-tecnicas.md](../02-arquitectura/decisiones-tecnicas.md) (ADR-05, ADR-10, ADR-11), [requisitos.md](../01-alcance-requisitos/requisitos.md), tablero Trello.
- **Ampliación (14/10/2026, decisión del PO):** el login usa **nombre de usuario** (campo `username`) en lugar del correo, y la política de contraseñas se simplifica a mínimo 5 caracteres para facilitar la demostración (`admin` / `12345`). Se mantiene el hash scrypt (RNF-01 sigue cumpliéndose). Riesgo aceptado y documentado en ADR-10.

### CR-03 · Mover las notificaciones internas al Sprint 6

- **Solicitante:** Gerente de Proyecto · **Fecha:** 15/10/2026 · **Decisión:** aprobado por el PO el 15/10/2026.
- **Descripción:** el Sprint 5 tenía 29 SP, contra una velocidad de referencia de 20 SP y una velocidad real de 11 a 16 SP en los Sprints 3 y 4. Se mueve **S5-06 Notificaciones internas (8 SP)** al Sprint 6.
- **Qué queda en el Sprint 5:** los pendientes y las alertas de vencimiento (pantalla *Tareas y pendientes*), que cubren la parte de RF-17 sobre vencimientos. Se mueven solo los avisos internos de cambios (por ejemplo, "te asignaron un expediente").
- **Impacto en plazo y SP:** Sprint 5 pasa de 29 a 21 SP; Sprint 6 de 13 a 21 SP. Total sin cambios (97 SP). No cambia el alcance ni la fecha del release R3 (Sprints 5 y 6).
- **Impacto en riesgos:** reduce R13 (sobrecarga) en el Sprint 5.
- **Artefactos actualizados:** [backlog.md](backlog.md), [estimacion-calendario.md](estimacion-calendario.md), tarjeta S5-06 en Trello, [sprint-05.md](sprints/sprint-05.md).

### CR-04 · Orden de recorte del Sprint 6

- **Solicitante:** Gerente de Proyecto · **Fecha:** 16/10/2026 · **Decisión:** aprobado por el PO el 16/10/2026, junto con el plan del Sprint 6.
- **Motivo:** el Sprint 6 comprometía 21 SP contra una velocidad promedio de 16 SP, y el pronóstico de la Unidad 9 daba 3 sprints contra 2 disponibles (alerta del tablero, [monitoreo-metricas.md](monitoreo-metricas.md)).
- **Descripción:** se decidió de antemano qué se recortaría: **S6-03 Exportar reportes (3 SP)** pasaría al Sprint 7. Así el recorte no se hace en silencio a último momento.
- **Resultado:** el Sprint 6 terminó los 21 SP con la CI en verde, así que **el recorte no se aplicó**. La línea base no cambia.
- **Artefactos:** [sprint-06.md](sprints/sprint-06.md), [estimacion-calendario.md](estimacion-calendario.md).

### CR-05 · Mejora de la interfaz

- **Solicitante:** Product Owner · **Fecha:** 16/10/2026 · **Decisión:** aprobado por el PO al pedir "mejoremos la interfaz" y elegir los frentes.
- **Motivo:** la interfaz de los sprints 1 a 7 funcionaba pero cada pantalla tenía su propio estilo, el menú superior ya no entraba con 6 secciones y el detalle del expediente era una página muy larga.
- **Descripción:** menú lateral agrupado, carátula tipo carpeta con secciones en pestañas, componentes `ui/` reutilizables, avisos flotantes y capturas antes/después generadas en la CI.
- **Impacto en alcance:** no agrega requisitos funcionales; mejora RNF de usabilidad y accesibilidad. No cambia la API ni la base de datos.
- **Impacto en plazo:** se hace antes del Sprint 8, en una rama propia. Sin cambio de fecha de entrega.
- **Impacto en riesgos:** riesgo de romper pruebas de interfaz (controlado: se ajustaron 4 archivos de prueba y la CI quedó en verde).
- **Artefactos:** [cr-05-interfaz.md](sprints/cr-05-interfaz.md).

### CR-06 · Contraseña visible, eliminación de usuarios y navegación

- **Solicitante:** Product Owner · **Fecha:** 19/10/2026 · **Decisión:** aprobado por el PO el 19/10/2026, al pedir los cambios y probarlos en la PC durante el Sprint 8.
- **Motivo:** usuario. Pedidos del PO al probar el sistema: ver la contraseña mientras se escribe, poder eliminar usuarios y moverse con más facilidad entre las pantallas.
- **Descripción:**
  1. *Contraseña visible:* botón del ojo en el inicio de sesión y en el formulario de usuarios. El pedido incluía ver la contraseña actual al editar un usuario; **no se implementó** porque se guarda como hash scrypt (RNF-01, ADR-10) y no se puede recuperar. El formulario lo explica y permite ver la contraseña nueva mientras se escribe.
  2. *Eliminar usuarios:* `DELETE /api/usuarios/:id`. Solo se eliminan usuarios **sin actividad** (sin registros en la auditoría, expedientes, documentos, actuaciones, estados, tareas, pases ni asignaciones). La auditoría es de solo inserción (ADR-07) y el historial debe seguir mostrando quién hizo cada cosa; por eso un usuario con actividad se desactiva, como hasta ahora (409 con el motivo). No se permite eliminarse a uno mismo ni dejar el sistema sin administradores activos. Cada eliminación queda en la auditoría (`USUARIO_ELIMINADO`).
  3. *Navegación:* búsqueda, filtros y página de la lista en la dirección; migas de pan; buscador rápido en la barra superior (tecla `/`); tarjetas y distribuciones de Inicio con enlaces; título de la pestaña por página; foco y desplazamiento al cambiar de página.
- **Impacto en alcance:** amplía **RF-03** (crear, editar y desactivar usuarios → también eliminar los que no tienen actividad). El resto mejora RNF de usabilidad y accesibilidad. La base de datos no cambia (sin migraciones).
- **Impacto en plazo y SP:** se hace dentro del Sprint 8, sin mover la fecha de entrega. No suma SP al backlog de 97 SP: se registra como cambio del PO, igual que CR-05.
- **Impacto en riesgos:** R06 (accesos): la ruta nueva entra en la matriz de permisos, que pasa de 40 a **41 rutas** y sigue fallando si aparece una ruta sin probar. Riesgo de borrar trazabilidad: controlado con la regla de "solo sin actividad" y la prueba que lo verifica.
- **Impacto en calidad / pruebas:** backend 225 → **230** pruebas (eliminación, actividad, uno mismo, permisos); frontend 51 → **59** (ojo, confirmación de eliminación, navegación de la lista, migas, buscador). Tipos y lint sin errores. La consulta de actividad y el borrado en cascada de sesiones y notificaciones se verificaron también contra PostgreSQL.
- **Releases:** entra en la v1.0.0, todavía sin etiquetar.
- **Artefactos:** commits `4c58b9c` y `0dbd609` en `feature/S8-entrega`, [requisitos.md](../01-alcance-requisitos/requisitos.md) (RF-03), [contrato-api.md](../02-arquitectura/contrato-api.md), [historial-cambios.md](historial-cambios.md), [CHANGELOG.md](../../CHANGELOG.md).

### CR-07 · Más tipos de documentos adjuntos

- **Solicitante:** Product Owner · **Fecha:** 19/10/2026 · **Decisión:** aprobado por el PO el 19/10/2026, al pedir que se puedan adjuntar "pdf, docx, txt o imágenes".
- **Motivo:** usuario. PDF, Word e imágenes PNG/JPG ya se aceptaban desde el Sprint 4; faltaban el texto plano y otros formatos de imagen comunes.
- **Descripción:** se agregan **texto (.txt)**, **GIF** y **WEBP** a la lista blanca de ADR-12. Se mantiene la triple verificación (tipo declarado, extensión y contenido):
  - binarios: firma de los primeros bytes (`GIF87a`/`GIF89a`; `RIFF` + `WEBP`);
  - texto: sin bytes de control fuera de tabulación y saltos de línea (UTF-8 o ANSI), o UTF-16 con su BOM. Un ejecutable renombrado como `.txt` se rechaza.
  - Si el navegador no informa el tipo (vacío u `application/octet-stream`), se deduce por la extensión y el contenido se verifica igual; se guarda el tipo normalizado.
- **Fuera del cambio:** `.doc` y `.xls` (formatos viejos de Office) y SVG, que puede contener código ejecutable.
- **Impacto en alcance:** amplía la lista de tipos de **RF-08**; el requisito (validar tipo y tamaño) se mantiene. Sin cambios en la base de datos ni en la API (misma ruta, mismos errores).
- **Impacto en plazo y SP:** dentro del Sprint 8, sin cambio de fecha. No suma SP (cambio del PO, como CR-05 y CR-06).
- **Impacto en riesgos:** RNF-04 (integridad y archivos maliciosos): el texto no tiene firma, así que se valida por contenido; las pruebas cubren un ejecutable renombrado como `.txt` y como imagen.
- **Impacto en calidad / pruebas:** backend 230 → **233** (tipos nuevos, tipo no informado, binarios renombrados); frontend 59 → **60** (selector y carga de un `.txt`). Comprobado también contra el backend en ejecución: un `.exe` renombrado como `.txt` responde 400 con la lista nueva de tipos.
- **Defecto encontrado al probar:** D-13, mensaje del expediente en tránsito mal redactado ([resultados-pruebas.md](../05-calidad-pruebas/resultados-pruebas.md)).
- **Artefactos:** commits `0126404` (CR-07) y `5366bca` (D-13), [requisitos.md](../01-alcance-requisitos/requisitos.md) (RF-08), [decisiones-tecnicas.md](../02-arquitectura/decisiones-tecnicas.md) (ADR-12), [manual-usuario.md](../manual-usuario.md), [guia-prueba-manual.md](../05-calidad-pruebas/guia-prueba-manual.md), [historial-cambios.md](historial-cambios.md), [CHANGELOG.md](../../CHANGELOG.md).

### CR-08 · Bajas de expedientes

- **Solicitante:** Product Owner · **Fecha:** 19/10/2026 · **Decisión:** aprobado por el PO el 19/10/2026, al pedir que "el administrador pueda eliminar los expedientes o deshabilitarlos y que aparezcan en otro sector".
- **Motivo:** usuario. Los expedientes cargados por error o duplicados no se podían sacar de circulación: seguían en la lista, en los indicadores y en los pendientes.
- **Descripción:**
  1. *Desactivar:* el administrador da de baja un expediente con un motivo obligatorio. Sale de la lista, el dashboard, los reportes, los vencimientos y las tareas pendientes, y queda en solo lectura (409 al intentar modificarlo, como un archivado). No se permite en tránsito, para no dejar un pase sin recibir. El historial no se toca.
  2. *Expedientes desactivados:* sección nueva del menú (*Sistema*) con quién, cuándo y por qué se desactivó cada uno, buscador y botones **Reactivar** y **Eliminar**.
  3. *Reactivar:* el expediente vuelve a circular con su estado y su historial.
  4. *Eliminar:* borrado definitivo **solo si no tiene actividad** (documentos, actuaciones, cambios de estado, tareas, pases, asignaciones ni avisos). Esas tablas son de solo inserción (ADR-07) y referencian al expediente; borrarlo con historial obligaría a romper la regla. Con actividad responde 409 y pide desactivarlo. La numeración no se reutiliza: queda un hueco, registrado en la auditoría.
  - Auditoría: `EXPEDIENTE_DESACTIVADO` (con el motivo), `EXPEDIENTE_REACTIVADO` y `EXPEDIENTE_ELIMINADO` (con número, carátula y estado).
- **Alternativa descartada:** permitir eliminar cualquier expediente borrando también su historial. Contradice ADR-07 y la trazabilidad exigida: un expediente público con actuaciones no puede desaparecer sin rastro.
- **Impacto en alcance:** amplía **RF-06** (consultar y modificar → también dar de baja, reactivar y eliminar sin actividad). Permiso nuevo `expedientes.desactivar`, solo del administrador (18 permisos).
- **Impacto en datos:** migración `20261019172842_expedientes_desactivados`: columnas `activo` (por defecto `true`, con índice), `desactivado_en`, `desactivado_por_id` (FK a usuarios) y `motivo_desactivacion`. Los expedientes existentes quedan activos. El respaldo y la restauración las incluyen sin cambios.
- **Impacto en plazo y SP:** dentro del Sprint 8, sin cambio de fecha. No suma SP (cambio del PO).
- **Impacto en riesgos:** R06 (accesos): 4 rutas nuevas en la matriz de permisos (45 rutas, 85 casos). Riesgo de indicadores inconsistentes: `verificar-indicadores.ts` (S6-04) cuenta solo activos, y la demo agrega un expediente desactivado para que la CI lo pruebe.
- **Impacto en calidad / pruebas:** backend 233 → **251** (desactivar, solo lectura, pendientes, motivo, tránsito, permisos, reactivar, eliminar con y sin actividad); frontend 60 → **66** (menú, lista de desactivados, reactivar, eliminar rechazado, diálogo con motivo, detalle desactivado). Cobertura local del backend: líneas 94,45 %. Verificación de indicadores en local: 97 comparaciones sin diferencias.
- **Releases:** entra en la v1.0.0, todavía sin etiquetar.
- **Artefactos:** commit `6c950af` (y `56a3d10`, corrección del flujo de capturas por el CR-06), [requisitos.md](../01-alcance-requisitos/requisitos.md) (RF-06), [contrato-api.md](../02-arquitectura/contrato-api.md), [modelo-datos.md](../03-modelo-datos/modelo-datos.md), [manual-usuario.md](../manual-usuario.md), [guia-prueba-manual.md](../05-calidad-pruebas/guia-prueba-manual.md), [historial-cambios.md](historial-cambios.md), [CHANGELOG.md](../../CHANGELOG.md).
