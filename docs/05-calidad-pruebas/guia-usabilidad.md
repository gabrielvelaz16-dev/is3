# Guía de prueba de usabilidad (S7-05, RNF-11, PR-27)

**Estado:** Preparada; pendiente de ejecución con usuarios · **Unidad:** 7

La prueba de usabilidad es **manual**: la IA no puede ejecutarla ni inventar sus resultados. Esta guía deja todo listo para hacerla en unos 30 minutos.

## 1. Participantes y condiciones

- **Participantes:** al menos 3 personas que no hayan usado el sistema, por ejemplo compañeros de la carrera. Se anota solo un alias (P1, P2, P3) y ningún dato personal.
- **Equipo:** la PC de desarrollo, con el backend y el frontend levantados y los datos de demostración del seed.
- **Rol del observador:** lee la tarea, no ayuda, anota el tiempo, los errores y los comentarios. Solo da una pista si la persona se traba más de 2 minutos; en ese caso, la tarea cuenta como "con ayuda".

## 2. Tareas

| # | Tarea (se lee tal cual) | Usuario | Éxito si… |
|---|---|---|---|
| T1 | "Registrá un expediente nuevo de tipo Solicitud, con prioridad Alta." | `mesa` | El expediente aparece en el listado con número asignado |
| T2 | "Adjuntá un PDF a ese expediente y enviá el expediente a Asesoría Jurídica." | `mesa` | El expediente queda "en tránsito" con el documento |
| T3 | "Confirmá la recepción del expediente que te llegó y asignale una tarea a un funcionario con vencimiento la semana que viene." | `jefe` | El pase figura como recibido y la tarea aparece en el expediente |
| T4 | "Fijate qué avisos tenés y completá la tarea que te asignaron." | `funcionario` | El aviso queda leído y la tarea, completada |
| T5 | "Sacá un reporte de los expedientes en trámite de Asesoría Jurídica y exportalo a Excel." | `auditor` | Se descarga el CSV y abre en Excel con tildes |

## 3. Registro de resultados

| Participante | T1 | T2 | T3 | T4 | T5 | Tiempo total | Comentarios |
|---|---|---|---|---|---|---|---|
| P1 | | | | | | | |
| P2 | | | | | | | |
| P3 | | | | | | | |

Para cada tarea se anota: ✅ sin ayuda · 🟡 con ayuda · ❌ no la completó.

**Métrica (tablero de la Unidad 9):** porcentaje de tareas sin ayuda = tareas ✅ / (participantes × 5). El umbral es ≥ 80 %.

**Acción ante desviación:** cada tarea con 2 o más 🟡 o ❌ genera una tarjeta de mejora en Trello para el Sprint 8.

## 4. Preguntas al final (escala 1 a 5)

1. ¿Qué tan fácil fue encontrar lo que buscabas?
2. ¿Los mensajes de error explicaban qué corregir?
3. ¿Usarías este sistema en lugar del papel?
