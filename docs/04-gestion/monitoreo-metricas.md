# Monitoreo, control y mejora

**Estado:** Vivo — mediciones reales el 15/10/2026 (§6) y el 16/10/2026 (§7) · **Unidad:** 9 · **Tarjeta:** S6-05 · **TP:** [Unidades 8 y 9](../08-trabajos-practicos/tp-unidades-8-9.md)

> No confundir con el *dashboard del sistema* (S6-01), que muestra estadísticas de expedientes para los usuarios. Este tablero mide el **proyecto**.

## 1. Tablero integrado

| Dimensión | Métrica | Fuente | Frecuencia | Línea base | Umbral / meta |
|---|---|---|---|---|---|
| Alcance | % historias de la línea base terminadas | Trello (lista *Hecho*) | Por sprint | 0 % (Fase 0) | Según plan de releases |
| Alcance | Cambios aprobados / rechazados | [control-cambios.md](control-cambios.md) | Mensual | 0 | — |
| Cronograma | Hitos cumplidos vs planificados | Cronograma | Por hito | H1 pendiente | 0 hitos atrasados > 1 sprint |
| Costo / esfuerzo | Horas reales vs estimadas | Registro de horas por tarjeta | Por sprint | Pendiente S1 | Desvío ≤ 20 % |
| Velocidad | SP terminados por sprint | Trello | Por sprint | Pendiente S1 | Estable ± 20 % |
| Pronóstico | Sprints restantes = SP pendientes / velocidad promedio | Cálculo | Por sprint | 97 SP pendientes | ≤ sprints disponibles hasta la entrega |
| Flujo | Lead time (de *Sprint actual* a *Hecho*) | Historial de tarjetas de Trello | Por sprint | Pendiente S1 | Tendencia descendente |
| Calidad | Pruebas aprobadas / totales | Reporte de Vitest en CI | Por commit | Sin pruebas | 100 % para fusionar |
| Calidad | Cobertura de módulos de negocio y seguridad | Reporte de cobertura | Por sprint | 0 % | ≥ 70 % (RNF-10) |
| Calidad | Defectos abiertos por severidad | Tarjetas con etiqueta *Defecto* | Por sprint | 0 | 0 críticos al cerrar release |
| Riesgos | N.º de riesgos altos/críticos activos | [riesgos.md](riesgos.md) | Por sprint / mensual | 13 amenazas (3 críticas: R01, R03, R13 · 10 altas) | Tendencia descendente |
| Adopción (simulada) | Tareas de usabilidad completadas sin ayuda | Prueba de usabilidad S7-05 | Sprint 7 | — | ≥ 80 % |
| DevOps | Frecuencia de integración (PR fusionados por semana) | GitHub | Semanal | 0 | ≥ 2 |
| DevOps | Tasa de fallos del pipeline | GitHub Actions | Semanal | — | < 20 % |
| DevOps | Tiempo de recuperación (pipeline rojo → verde) | GitHub Actions | Semanal | — | < 1 día |

## 2. Fichas de métrica (Anexo C)

### Ficha M-01 · Velocidad del equipo

| Campo | Contenido |
|---|---|
| Propósito | Pronosticar cuántos sprints faltan para terminar el backlog. |
| Pregunta de gestión | ¿Llegamos a la fecha de entrega con el alcance comprometido? |
| Definición / fórmula | Suma de SP de historias que llegaron a *Hecho* en el sprint (cumpliendo DoD). Pronóstico = SP pendientes / promedio de los últimos 3 sprints. |
| Unidad / fuente | Story Points · Trello |
| Frecuencia / responsable | Al cierre de cada sprint · Gerente |
| Línea base / umbral | Se establece con los Sprints 1–3 · Alerta si el pronóstico supera los sprints disponibles. |
| Regla de interpretación | Una caída > 20 % respecto al promedio indica bloqueo o subestimación. |
| Limitaciones | Las tareas técnicas no tienen SP; se complementa con horas reales. |
| Acción ante desviación | Repriorizar (MoSCoW), dividir historias o abrir solicitud de cambio (no modificar la línea base en silencio). |
| Evidencia de decisión | *Pendiente: se registra en la tabla de decisiones.* |

### Ficha M-02 · Lead time

| Campo | Contenido |
|---|---|
| Propósito | Detectar cuellos de botella en el flujo. |
| Pregunta de gestión | ¿Dónde se traba el trabajo: desarrollo o revisión/pruebas? |
| Definición / fórmula | Días entre que la tarjeta entra a *Sprint actual* y llega a *Hecho*. |
| Unidad / fuente | Días · historial de acciones de Trello |
| Frecuencia / responsable | Por sprint · QA |
| Línea base / umbral | Sprint 1 · Alerta si una tarjeta pasa > 3 días en *En revisión / pruebas*. |
| Acción ante desviación | Limitar trabajo en progreso; priorizar revisiones antes de empezar algo nuevo. |

### Ficha M-03 · Pruebas aprobadas y cobertura

| Campo | Contenido |
|---|---|
| Propósito | Verificar que cada incremento no rompe lo existente. |
| Pregunta de gestión | ¿Podemos aprobar la puerta de calidad del release? |
| Definición / fórmula | Pruebas aprobadas / ejecutadas; % de líneas cubiertas en `modules/` y `security/`. |
| Fuente | Salida de Vitest en GitHub Actions |
| Frecuencia / responsable | Cada commit · Desarrollo; revisión por sprint · QA |
| Umbral | 100 % aprobadas para fusionar; cobertura ≥ 70 %. |
| Acción ante desviación | No se fusiona el PR; se agrega trabajo de prueba al sprint (oportunidad O03). |

### Ficha M-04 · Riesgos activos de alta prioridad

| Campo | Contenido |
|---|---|
| Propósito | Controlar la exposición del proyecto. |
| Definición | Cantidad de riesgos con prioridad Alta o Crítica en estado activo. |
| Fuente / frecuencia | [riesgos.md](riesgos.md) · por sprint y mensual |
| Acción ante desviación | Si un riesgo crítico no baja en dos revisiones, se escala al comité. |

## 3. Revisiones

| Revisión | Cuándo | Entradas | Salidas |
|---|---|---|---|
| Revisión ejecutiva | Mensual | Tablero integrado, hitos, riesgos estratégicos, cambios | Decisiones del comité, acta |
| Sprint review | Fin de cada sprint | Incremento funcionando, criterios de aceptación | Aceptación del PO, ajustes al backlog |
| Retrospectiva | Fin de cada sprint | Métricas de flujo y calidad, problemas | Acciones de mejora con responsable |
| Lecciones aprendidas | Fin de cada release y cierre | Retrospectivas, métricas | Registro de lecciones y estándares |

## 4. Registro de decisiones basadas en métricas

| Fecha | Métrica | Valor observado | Interpretación | Decisión | Evidencia |
|---|---|---|---|---|---|
| 13/10/2026 | SP por sprint (plan) | S5 = 29 SP vs referencia 20 | Sobrecarga planificada en S5 | Proponer mover S5-06 a S6; confirmar en planning con velocidad real | [backlog.md](backlog.md#5-alertas-de-planificación) |
| 15/10/2026 | Pronóstico | 34 SP / 16 SP = 3 sprints vs 2 disponibles | El alcance restante no entra en el plan | Abrir un CR para priorizar con MoSCoW lo que entra en v1.0.0, sin modificar la línea base en silencio | §6 |
| 15/10/2026 | Tasa de fallos del pipeline | 8 de 19 ejecuciones (42 %) vs umbral < 20 % | Se sube código sin verificarlo antes en local; la recuperación es rápida (2 a 8 min) | Ejecutar tipos y pruebas antes de cada push | §6 · historial de GitHub Actions |
| 15/10/2026 | PR integrados a `develop` | 0 de 12 vs ≥ 2 por semana | No hay versión estable ni etiquetas | Revisar e integrar los PR #1 a #12 en orden y crear `v0.2.0` antes del Sprint 6 | §6 |
| 16/10/2026 | Pronóstico | 13 SP / 17,7 SP = 1 sprint vs 1 disponible | La alerta del 15/10 se resolvió con el Sprint 6 completo (21 SP) | Se cierra la alerta; CR-04 queda registrado y sin aplicar | §7 · [CR-04](control-cambios.md#cr-04--orden-de-recorte-del-sprint-6) |
| 16/10/2026 | Tasa de fallos del pipeline | 12 de 25 (48 %); en el Sprint 6, 4 de 5 | La acción del 15/10 ("correr las pruebas antes del push") no se pudo aplicar: el entorno de la IA no puede instalar dependencias y la CI es el único lugar donde corren las pruebas. La recuperación sigue siendo rápida (10 min) | Mantener la CI como verificación obligatoria y pedir que el entorno de la IA tenga acceso al registro de npm; mientras tanto, se acepta la tasa alta con recuperación rápida | §7 |
| 16/10/2026 | Tarjetas en *En revisión / pruebas* | 10 tarjetas de S4 y S5 desde el 15/10 | El cuello de botella es la revisión e integración, no el desarrollo (coincide con 0 PR integrados) | El responsable integra los PR #1 a #14 antes de empezar el Sprint 7 | §7 |
| 15/10/2026 | Riesgos materializados | R15 (errores de IA) | El Sprint 3 se cerró con la CI en rojo | La DoD exige CI en verde para cerrar una historia | [riesgos.md](riesgos.md) |

## 5. De mejora local a estándar institucional

Cuando una acción de retrospectiva funciona en dos sprints seguidos (por ejemplo, una plantilla de PR o una regla de la DoD), se documenta en el [plan de calidad](../05-calidad-pruebas/plan-calidad.md) o en el [plan de configuración](../06-configuracion-devops/plan-configuracion.md) y pasa a ser obligatoria para todo el proyecto. En el proyecto institucional, ese estándar se propone al comité para replicarlo en las demás dependencias (oportunidad O02).

### Registro de lecciones aprendidas

| Fecha | Lección | Origen | Acción / estándar resultante |
|---|---|---|---|
| 15/10/2026 | Un sprint no se cierra sin CI en verde | Sprint 3 (D-04 a D-08) | Regla agregada a la Definition of Done |
| 15/10/2026 | Una verificación puede dar un falso OK | CI del Sprint 4 (D-09) | Las verificaciones de la base insertan datos antes de comprobar |
| 15/10/2026 | Al cambiar de rama, el cliente de Prisma quedó desactualizado | Prueba manual del 15/10 (D-10) | Propuesta: `npm run dev` regenera el cliente (`predev`) |
| 15/10/2026 | Un sprint muy cargado no se cumple | Planificación del Sprint 5 (CR-03) | Comparar el compromiso con la velocidad antes de aceptarlo |

## 6. Medición al 15/10/2026 (después del Sprint 5)

Valores reales del prototipo. Lo que no se midió queda como *pendiente*; no se completa con estimaciones.

| Dimensión | Métrica | Umbral | Valor | Estado | Fuente |
|---|---|---|---|---|---|
| Alcance | SP terminados / línea base | Según plan | 63 de 97 SP (65 %) | En curso | [estimacion-calendario.md](estimacion-calendario.md) |
| Alcance | Solicitudes de cambio aprobadas | — | 4 (CR-00 a CR-03) | Controlado | [control-cambios.md](control-cambios.md) |
| Cronograma | Pronóstico vs sprints disponibles | ≤ 2 sprints | 34 / 16 = 3 sprints | Alerta | Cálculo |
| Hitos | Puertas aprobadas | Sin atraso | G1 aprobada | OK | [acta G1](../07-evidencias/fase0/acta-puerta-g1.md) |
| Costo / esfuerzo | Horas reales vs estimadas | Desvío ≤ 20 % | No registrado | Pendiente | — |
| Velocidad | SP por sprint (S1 a S5) | ± 20 % | 3, 12, 16, 11, 21 | Inestable | Trello |
| Flujo | Lead time por tarjeta | Descendente | Sin medir | Pendiente | — |
| Riesgos | Riesgos materializados | 0 | R15 | Alerta | [riesgos.md](riesgos.md) |
| Calidad | Pruebas aprobadas | 100 % | 149 / 149 (115 + 34) | OK | [run 38745648399](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38745648399) |
| Calidad | Cobertura del backend (líneas) | ≥ 70 % | 93,46 % | OK | Mismo run |
| Calidad | Defectos abiertos / cerrados | 0 críticos | 1 abierto (D-10) / 9 cerrados | OK | [resultados-pruebas.md](../05-calidad-pruebas/resultados-pruebas.md) |
| Adopción | Tareas de usabilidad sin ayuda | ≥ 80 % | Se mide en el Sprint 7 | Pendiente | — |
| DevOps | Tasa de fallos del pipeline | < 20 % | 8 de 19 (42 %) | Alerta | GitHub Actions |
| DevOps | Tiempo de recuperación | < 1 día | 2 a 8 min; uno de 19 h (Sprint 3) | OK | GitHub Actions |
| DevOps | PR integrados a `develop` | ≥ 2 por semana | 0 de 12 | Alerta | GitHub |

**Cómo se calcularon los datos de DevOps:** historial de GitHub Actions del 14/10 al 15/10/2026: 21 ejecuciones, 2 canceladas (no cuentan), 11 exitosas y 8 fallidas. El tiempo de recuperación es la diferencia entre la primera ejecución roja y la siguiente verde de la misma rama. El caso de 19 h corresponde al Sprint 3 (run 38609784288 → run 38739999945), que se dio por terminado con la CI en rojo (R15).

**Limitación:** los sprints del prototipo se ejecutaron en horas y con asistencia de IA; las métricas sirven para comparar sprints entre sí y justificar decisiones, no para estimar el calendario real del proyecto institucional.

## 7. Medición al 16/10/2026 (después del Sprint 6, S6-05)

| Dimensión | Métrica | Umbral | Valor | Estado | Cambio vs §6 |
|---|---|---|---|---|---|
| Alcance | SP terminados / línea base | Según plan | 84 de 97 SP (87 %) | En curso | +21 SP |
| Alcance | Solicitudes de cambio | — | 5 (CR-00 a CR-04) | Controlado | +CR-04 |
| Cronograma | Pronóstico vs sprints disponibles | ≤ 1 sprint | 13 / 17,7 = 1 sprint | OK | Se resolvió la alerta |
| Velocidad | SP por sprint (S1 a S6) | ± 20 % | 3, 12, 16, 11, 21, 21 | Se estabiliza | Dos sprints seguidos de 21 SP |
| Flujo | Lead time (de *En progreso* a *Hecho*) | Descendente | Mediana de 2 h 28 min (11 tarjetas de S1 y S2) | Medido con limitación | Antes: sin medir |
| Flujo | Tarjetas en *En revisión / pruebas* | ≤ 3 | 10 (S4 y S5, desde el 15/10) | Alerta | Nueva métrica |
| Calidad | Pruebas aprobadas | 100 % | 175 / 175 (130 + 45) | OK | +26 pruebas |
| Calidad | Cobertura del backend (líneas) | ≥ 70 % | 93,89 % | OK | +0,43 |
| Calidad | Indicadores verificados contra la base | 100 % | Todos coinciden (S6-04) | OK | Nueva verificación |
| Defectos | Abiertos / cerrados | 0 críticos | 0 abiertos / 11 cerrados (D-10 y D-11 en el Sprint 6) | OK | D-10 cerrado |
| DevOps | Tasa de fallos del pipeline | < 20 % | 12 de 25 (48 %) | Alerta | Empeoró (era 42 %) |
| DevOps | Tiempo de recuperación | < 1 día | 10 min en el Sprint 6 | OK | Igual |
| DevOps | PR integrados a `develop` | ≥ 2 por semana | 0 de 14 | Alerta | +2 PR sin integrar |

**Cómo se midió el lead time:** con el historial de movimientos de tarjetas del tablero de Trello (60 movimientos). Solo 11 tarjetas, de los Sprints 1 y 2, tienen registrado el paso por *En progreso*. Duraron entre 2 h 27 min y 3 h 19 min, con una mediana de 2 h 28 min.

**Limitación:** muchas tarjetas se movieron juntas al final del día (por ejemplo, 17:55 del 14/10), así que el lead time mide cuándo se actualizó el tablero más que el trabajo real. Las tarjetas de los Sprints 3 a 5 se movieron una sola vez, sin pasar por *En progreso*, y no se pueden medir. **Acción:** desde el Sprint 7, mover cada tarjeta a *En progreso* al empezarla y a *Hecho* recién con la CI en verde y el PR integrado.

**Cómo se midió la tasa de fallos:** con el historial de GitHub Actions al 16/10/2026: 28 ejecuciones, 3 canceladas (no cuentan), 13 exitosas y 12 fallidas.

