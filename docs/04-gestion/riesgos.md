# Gestión de riesgos

**Estado:** Completo (TP Unidad 6) — registro vivo · **Unidad:** 6 · **Fuente:** TP Unidad 6 — Gestión de Riesgos (Expediente Electrónico)

## 1. Objetivo

Identificar y priorizar los principales riesgos y oportunidades del proyecto, definiendo respuestas, responsables, indicadores y disparadores para actuar antes de que afecten el alcance, plazo, costo, calidad o seguridad.

## 2. Criterio utilizado

Cada riesgo se redacta como **causa + evento incierto + efecto**. Escala simple de 1 a 3:

| Nivel | Probabilidad | Impacto |
|---|---|---|
| 1 – Bajo | Poco probable | Afectación menor |
| 2 – Medio | Puede ocurrir | Afecta tareas, calidad o fechas parciales |
| 3 – Alto | Probable o ya hay señales | Afecta objetivos importantes |

Prioridad = Probabilidad × Impacto: 1–2 = Baja · 3–4 = Media · 6 = Alta · 9 = Crítica.

## 3. Matriz de probabilidad e impacto

| P \ I | 1 Bajo | 2 Medio | 3 Alto |
|---|---|---|---|
| 3 Alto | Media | Alta | Crítica |
| 2 Medio | Baja | Media | Alta |
| 1 Bajo | Baja | Baja | Media |

La matriz ordena los riesgos, pero también se consideran urgencia, proximidad, dependencias y capacidad de respuesta.

## 4. Registro de riesgos y oportunidades (proyecto institucional)

| ID | Tipo | Categoría | Causa – evento – efecto | P | I | Prioridad | Respuesta | Responsable | Indicador | Disparador | Acción / contingencia | Residual | Secundario |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| R01 | Amenaza | Proveedor / integración | La API de identidad podría entregarse tarde y retrasar la integración. | 3 | 3 | Crítica | Mitigar + contingencia | Líder técnico | Entrega de API | API no disponible en fecha | Usar mock y escalar | 2 | Dependencia contractual |
| R02 | Amenaza | Adopción / cambio | Usuarios podrían resistirse al nuevo sistema y reducir su adopción. | 2 | 3 | Alta | Mitigar | PO / Referentes | % usuarios capacitados | Baja asistencia o rechazo | Refuerzo y acompañamiento | 2 | Mayor soporte |
| R03 | Amenaza | Requisitos | Una nueva exigencia documental podría cambiar flujos y generar retrabajo. | 3 | 3 | Crítica | Mitigar | PO / Gerente | Cambios aprobados | Nueva exigencia formal | Analizar impacto y control de cambios | 2 | Retraso del release |
| R04 | Amenaza | Migración | Los datos existentes podrían tener errores o formatos incompatibles. | 2 | 3 | Alta | Mitigar | Líder de migración | % datos validados | Errores sobre el umbral | Limpieza y migración por etapas | 2 | Demora del piloto |
| R05 | Amenaza | Infraestructura | Los ambientes podrían no estar disponibles a tiempo para pruebas. | 2 | 3 | Alta | Mitigar | Infraestructura | % ambientes listos | Ambiente fuera de fecha | Ambiente alternativo y escalamiento | 2 | Costo adicional |
| R06 | Amenaza | Seguridad | Una mala configuración de accesos podría exponer documentos sensibles. | 2 | 3 | Alta | Evitar + mitigar | Seguridad | Hallazgos críticos | Hallazgo crítico | Bloquear despliegue y corregir | 1 | Retraso |
| R07 | Amenaza | Capacidad del equipo | La ausencia de una persona clave podría reducir la capacidad del equipo. | 2 | 3 | Alta | Mitigar | Gerente de Proyecto | Disponibilidad de roles | Ausencia prolongada | Redistribuir y activar reemplazo | 2 | Retraso |
| R08 | Amenaza | Proveedor | El soporte externo podría responder tarde ante una falla crítica. | 2 | 2 | Media | Transferir + mitigar | Gerente de Proyecto | Tiempo de respuesta | Incumplimiento de SLA | Escalar y activar soporte alternativo | 1 | Costo adicional |
| R09 | Amenaza | Gestión / cronograma | Las estimaciones podrían ser optimistas y generar retrasos. | 2 | 3 | Alta | Mitigar | Gerente de Proyecto | Desviación de avance | Desviación sobre umbral | Actualizar pronóstico y prioridades | 2 | Presión sobre el equipo |
| R10 | Amenaza | Calidad | La cobertura insuficiente de pruebas podría permitir defectos importantes. | 2 | 3 | Alta | Mitigar | QA | Cobertura y defectos | Cobertura bajo objetivo | Aumentar pruebas y revisar release | 2 | Retraso |
| R11 | Amenaza | Despliegue | Una falla en el piloto podría interrumpir el trabajo de la dependencia. | 2 | 3 | Alta | Mitigar + contingencia | Infra / QA | Incidentes del piloto | Incidente crítico | Rollback y soporte inmediato | 2 | Resistencia |
| R12 | Amenaza | Capacitación | La capacitación insuficiente podría generar errores de uso. | 2 | 2 | Media | Mitigar | PO / Capacitación | % usuarios capacitados | Baja aprobación | Refuerzo y nuevos materiales | 1 | Mayor soporte |
| O01 | Oportunidad | Piloto | El piloto podría detectar problemas temprano y mejorar el producto. | 2 | 3 | Alta | Explotar | PO / QA | Mejoras detectadas | Feedback relevante | Priorizar mejoras de alto valor | 1 | Ajustes adicionales |
| O02 | Oportunidad | Reutilización | Los flujos y configuraciones podrían reutilizarse en otras dependencias. | 2 | 2 | Media | Potenciar | Gerente / Arquitectura | % componentes reutilizables | Componentes comunes identificados | Documentar y estandarizar | 1 | Más documentación |
| O03 | Oportunidad | Automatización | Automatizar pruebas y tareas repetitivas podría reducir tiempos y errores. | 2 | 2 | Media | Potenciar | Líder técnico / QA | % tareas automatizadas | Tarea repetitiva identificada | Priorizar automatización | 1 | Esfuerzo inicial |

## 5. Riesgos operativos del prototipo (agregados en la Fase 0)

Riesgos propios del desarrollo académico, identificados al preparar el entorno. Se revisan en cada sprint.

| ID | Tipo | Categoría | Causa – evento – efecto | P | I | Prioridad | Respuesta | Responsable | Disparador | Acción / contingencia | Relación |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R13 | Amenaza | Cronograma | El alcance del prototipo (97 SP + tareas técnicas) supera la dedicación sugerida por la guía y podría no terminarse antes de la defensa. | 3 | 3 | Crítica | Mitigar | Gerente / PO | Velocidad real < SP pendientes / sprints restantes | Priorizar Must; mover Should a sprints finales; solicitud de cambio | R09 |
| R14 | Amenaza | Infraestructura | Docker o PostgreSQL podrían no funcionar en el equipo de desarrollo y bloquear el Sprint 1. | 2 | 3 | Alta | Mitigar | Desarrollo | Falla al levantar el contenedor | Instalar PostgreSQL nativo con las mismas variables de entorno | R05 |
| R15 | Amenaza | Calidad / IA | El código o los documentos sugeridos por IA podrían contener errores no detectados. | 2 | 3 | Alta | Mitigar | Desarrollo / QA | Defecto originado en contenido de IA | Revisión humana obligatoria, pruebas y bitácora de IA | R10 |
| R16 | Amenaza | Seguridad / privacidad | El repositorio público podría exponer datos personales (nombre y cédula en PDFs) o secretos. | 2 | 2 | Media | Evitar | Gerente | Archivo con datos personales o secretos en un commit | Repo privado o retirar los archivos; `.gitignore` para `.env` | R06 |

## 6. Responsables y escalamiento

| Nivel | Responsables | Función |
|---|---|---|
| Operativo | Líder técnico, QA, Infraestructura, PO, migración y referentes | Detectar señales, ejecutar acciones y actualizar el registro. |
| Estratégico | Gerente de Proyecto + Patrocinador/Comité | Decidir cuando el riesgo afecta plazo, presupuesto, alcance, normativa o continuidad. |

Si el equipo no puede resolver un riesgo, se escala al Gerente de Proyecto. Si requiere modificar alcance, presupuesto o una línea base, se presenta al Comité/Patrocinador.

## 7. Revisión y seguimiento

| Tipo | Frecuencia | Actividad |
|---|---|---|
| Estratégico | Mensual (CF-04) | Revisar riesgos altos/críticos y decisiones pendientes. |
| Operativo | Cada sprint (en la retrospectiva) | Revisar riesgos, nuevos eventos, disparadores y acciones. |
| Piloto / despliegue | Semanal | Revisar incidentes, adopción, seguridad, infraestructura y soporte. |

El registro es vivo: los riesgos pueden cerrarse, materializarse, cambiar de prioridad o aparecer nuevos. Después de cada revisión se actualiza el estado, el riesgo residual, el secundario y la evidencia.

### Bitácora de revisiones

| Fecha | Tipo | Riesgos revisados | Cambios | Evidencia |
|---|---|---|---|---|
| 13/10/2026 | Operativo (Fase 0) | Todos | Se agregan R13–R16. R01: contingencia diseñada como adaptador de identidad (ADR-06, S2-04). | Este documento; tarjetas Trello CF-03 y S2-04 |

## 8. Relación con el enfoque híbrido

Los riesgos estratégicos se controlan mediante la gobernanza y revisiones mensuales. Los operativos se revisan dentro de los sprints. Los prototipos, pilotos y pruebas se usan para reducir incertidumbre antes de comprometer más esfuerzo.

## 9. Evento de cambio del TP

Durante el piloto aparece una nueva exigencia de control documental y el proveedor de identidad retrasa su integración. Se relaciona con **R01 y R03**. Se activa el control integrado de cambios, se analiza el impacto en alcance, riesgos y cronograma, se actualiza el backlog y se revisa el release. Detalle en [control-cambios.md](control-cambios.md) (CR-01).

*Las probabilidades, impactos y respuestas son estimaciones iniciales para el trabajo práctico y deben validarse por el equipo.*
