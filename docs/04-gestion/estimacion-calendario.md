# Estimación y calendarización

**Estado:** Completo (TP Unidad 4) + actualización de la Fase 0 · **Unidad:** 4 · **Fuente:** Trabajo Práctico Nro 6 — sección Estimación y calendarización

## 1. Qué se estima

Tamaño, esfuerzo, costo, duración, recursos, hitos y cronograma. Por ser híbrido se combinan una **estimación macro** (predictiva, para la línea base) y una **estimación relativa** (adaptativa, para historias).

## 2. Estimación del tamaño

### 2.1 Puntos de Función (proyecto institucional)

| Tipo | Ejemplos |
|---|---|
| EI — Entradas externas | Crear expediente, registrar usuario, registrar documento |
| EO — Salidas externas | Generar reporte, emitir constancia |
| EQ — Consultas externas | Consultar expediente, consultar historial |
| ILF — Archivos lógicos internos | Expedientes, usuarios, documentos |
| EIF — Archivos de interfaz externos | Datos provenientes de sistemas externos |

**Estado:** pendiente. Como se indicó en el TP, no se inventan cantidades: primero se hace el inventario funcional real. Con los requisitos RF-01 a RF-23 y el modelo de datos ya definidos en la Fase 0, el conteo se puede realizar en el Sprint 2, cuando el modelo de datos esté implementado (ILF confirmados).

### 2.2 Story Points (parte adaptativa)

Escala: 1 – 2 – 3 – 5 – 8 – 13. Estimación inicial que se ajusta con Planning Poker y la información de los sprints. Los SP sirven para comparar tamaño relativo; no se convierten directamente en horas.

**Estimación del TP (línea base original):**

| Release | Historias | SP |
|---|---|---|
| R1 — Funciones básicas | Iniciar sesión (2), Crear expediente (5), Consultar expediente (3), Registrar documento (5), Consultar historial (3) | 18 |
| R2 — Flujo documental | Enviar expediente (5), Recibir expediente (5), Cambiar estado (3), Notificaciones (8) | 21 |
| R3 — Administración y control | Gestionar usuarios (5), Gestionar permisos (5), Consultar reportes (5), Auditoría de acciones (8) | 23 |
| R4 — Despliegue | Configuración para dependencia (5), Validación de migración (8), Capacitación y soporte inicial (5) | 18 |
| **Total** | | **80** |

**Estimación actualizada del prototipo (Fase 0, CR-00):**

| Release | Sprints | SP |
|---|---|---|
| R1 — Base del sistema | Fase 0, S1, S2 | 15 |
| R2 — Funciones principales | S3, S4 | 27 |
| R3 — Flujo documental y control | S5, S6 | 42 |
| R4 — Calidad y entrega | S7, S8 | 13 |
| **Total** | | **97** |

La conciliación 80 → 97 SP está en el [backlog](backlog.md#4-conciliación-con-el-backlog-del-tp-80-sp--97-sp).

## 3. Estimación macro (proyecto institucional)

| Elemento | Estimación inicial |
|---|---|
| Duración | 6 meses |
| Equipo base | 6 personas |
| Presupuesto | A definir según recursos |
| Despliegue | Gradual por dependencias |
| Releases | 4 |
| Sprint | 2 semanas |

- **Supuesto:** la infraestructura institucional estará disponible y las dependencias participarán en las validaciones.
- **Responsable de validar:** Gerente de Proyecto, con participación del patrocinador y responsables técnicos.

## 4. Velocidad y pronóstico

Ejemplo del TP: Sprint 1 = 18 SP, Sprint 2 = 20 SP, Sprint 3 = 22 SP → velocidad promedio **20 SP**. Si quedan 60 SP: 60 / 20 = **3 sprints**.

**Regla de gobierno híbrido:** la velocidad actualiza el **pronóstico**, pero no modifica silenciosamente la **línea base** aprobada. Si el pronóstico muestra que una fecha comprometida no se cumple, se abre una solicitud de cambio ([control-cambios.md](control-cambios.md)).

**Velocidad real del prototipo** (se completa al cierre de cada sprint con lo que quedó en *Hecho* en Trello):

| Sprint | SP comprometidos | SP terminados | Velocidad promedio acumulada | SP restantes | Pronóstico (sprints) |
|---|---|---|---|---|---|
| S1 | 3 | 3 | 3 | 94 | — |
| S2 | 12 | 12 | 7,5 | 82 | — |
| S3 | 16 | 16 (con correcciones del 15/10) | 10,3 | 66 | 6,4 |
| S4 | 11 | 11 | 13,0 | 55 | 4,2 |
| S5 | 21 (29 antes de CR-03) | 21 | 16,0 | 34 | 2,1 → **3 sprints** |
| S6 | 21 (13 + S5-06 por CR-03) | pendiente | — | — | — |
| S7 | 13 | pendiente | — | — | — |

Como los Sprints 1 y 8 tienen mayormente tareas técnicas sin SP, también se registran **horas reales por tarjeta** para no subestimar el esfuerzo.

La velocidad promedio acumulada usa los últimos 3 sprints (por ejemplo, después del S5: (16 + 11 + 21) / 3 = 16 SP).

**Lectura del pronóstico (15/10/2026):** quedan 34 SP (Sprints 6 y 7) y la velocidad promedio es 16 SP, así que el pronóstico es de 3 sprints contra 2 planificados: el Sprint 6 (21 SP) es el de mayor riesgo. **Limitación:** en el prototipo los sprints se ejecutaron en horas, con asistencia de IA, y no en las 2 semanas del plan institucional; la velocidad sirve para comparar sprints entre sí, no para estimar el calendario real del proyecto institucional.

## 5. Cronograma maestro (proyecto institucional)

| Fase | Duración | Resultado |
|---|---|---|
| Planificación | 2 semanas | Plan aprobado |
| Infraestructura | 3 semanas | Ambientes disponibles |
| Seguridad inicial | 2 semanas | Controles configurados |
| Release 1 | 4 semanas | Funciones básicas |
| Release 2 | 4 semanas | Flujo documental |
| Migración y piloto | 3 semanas | Piloto validado |
| Release 3 | 4 semanas | Administración y auditoría |
| Capacitación | 2 semanas | Usuarios capacitados |
| Release 4 | 4 semanas | Preparación del despliegue |
| Despliegue gradual | 4 semanas | Sistema implementado |

*Las duraciones son supuestos de planificación, no datos del caso.*

### Hitos

| Hito | Descripción |
|---|---|
| H1 | Plan aprobado |
| H2 | Infraestructura disponible |
| H3 | Release 1 completado |
| H4 | Release 2 completado |
| H5 | Piloto aprobado |
| H6 | Release 3 completado |
| H7 | Usuarios capacitados |
| H8 | Release 4 completado |
| H9 | Despliegue institucional |

### Camino crítico

```
Planificación → Infraestructura → Desarrollo / Releases → Migración → Piloto → Capacitación → Despliegue
```

El camino crítico definitivo se calcula cuando estén las duraciones de todas las actividades.

## 6. Calendario del prototipo

Sprints de 2 semanas según el TP. **Las fechas reales dependen de la fecha de entrega fijada por la cátedra, que todavía no está registrada.**

| Sprint | Inicio | Fin | Release |
|---|---|---|---|
| Fase 0 | 13/10/2026 | a definir | R1 |
| S1 a S8 | a definir | a definir | R1–R4 |

Si el tiempo disponible hasta la entrega no alcanza para 8 sprints de 2 semanas, se acortan los sprints (por ejemplo, a 1 semana) mediante una solicitud de cambio, sin modificar el alcance comprometido sin aprobación.
