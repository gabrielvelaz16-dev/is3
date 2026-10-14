# Monitoreo, control y mejora

**Estado:** Plan inicial — se alimenta con datos reales desde el Sprint 1 · **Unidad:** 9 · **Tarjeta:** S6-05

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

## 5. De mejora local a estándar institucional

Cuando una acción de retrospectiva funciona en dos sprints seguidos (por ejemplo, una plantilla de PR o una regla de la DoD), se documenta en el [plan de calidad](../05-calidad-pruebas/plan-calidad.md) o en el [plan de configuración](../06-configuracion-devops/plan-configuracion.md) y pasa a ser obligatoria para todo el proyecto. En el proyecto institucional, ese estándar se propone al comité para replicarlo en las demás dependencias (oportunidad O02).

### Registro de lecciones aprendidas

| Fecha | Lección | Origen | Acción / estándar resultante |
|---|---|---|---|
| — | *pendiente (primera retrospectiva al cierre del Sprint 1)* | | |
