# Personas, equipo y comunicación

**Estado:** Completo (TP Unidad 5) · **Unidad:** 5 · **Fuente:** Trabajo Práctico Nro 6 — sección Personas y comunicación

## 1. Roles y responsabilidades (proyecto institucional)

| Rol | Responsabilidad principal |
|---|---|
| Patrocinador | Aprobar decisiones importantes y recursos. |
| Gerente de Proyecto | Coordinar el proyecto y controlar el avance. |
| Product Owner | Priorizar necesidades y backlog. |
| Desarrolladores | Construir y modificar el sistema. |
| QA | Realizar pruebas y validar resultados. |
| Infraestructura | Preparar ambientes y soporte técnico. |
| Especialista de seguridad | Revisar controles de seguridad. |
| Referente de dependencia | Representar las necesidades de cada dependencia. |
| Especialista de migración | Preparar y validar la migración de datos. |

### Roles ágiles

- **Product Owner:** mantiene el backlog, prioriza historias, representa a los usuarios y valida entregas.
- **Equipo de desarrollo:** analiza, diseña, programa, integra y corrige problemas.
- **QA:** participa en las pruebas y la validación de funcionalidades.

### Especialistas y referentes

Seguridad (controles y protección de información), infraestructura (servidores y ambientes), migración (datos existentes), normativa (requisitos institucionales) y referentes de cada dependencia. Son especialmente importantes porque el caso contempla datos y documentos oficiales, proveedores externos, múltiples interesados y evidencia de auditoría.

## 2. Matriz RACI (matriz de responsabilidades)

R = Responsable de ejecutar · A = Responsable final / aprueba · C = Consultado · I = Informado

| Actividad | Patrocinador | Gerente | PO | Desarrollo | QA | Infra. | Referente |
|---|---|---|---|---|---|---|---|
| Planificación | A | R | C | I | I | C | C |
| Infraestructura | I | A | I | C | I | R | I |
| Desarrollo | I | A | R | R | C | C | C |
| Pruebas | I | A | C | C | R | C | C |
| Migración | I | A | C | C | R | R | C |
| Capacitación | I | A | C | I | C | I | R |
| Despliegue | A | R | C | R | C | R | C |

**Actividades agregadas para el prototipo** (misma lógica, complementan la matriz del TP):

| Actividad | Patrocinador | Gerente | PO | Desarrollo | QA | Infra. | Referente |
|---|---|---|---|---|---|---|---|
| Control de cambios | A | R | C | C | C | C | I |
| Gestión de riesgos | I | A | R | C | C | C | C |
| Pipeline CI y versionado | I | A | I | R | C | C | I |
| Auditoría y seguridad del sistema | I | A | C | R | R | C | I |
| Bitácora de uso de IA | I | A | I | R | C | I | I |

## 3. Asignación de roles en el equipo del TP académico

El proyecto institucional es simulado. En el TP académico los roles se asumen así:

| Integrante | Roles asumidos |
|---|---|
| Carlos Gabriel Velázquez Franco | Gerente de Proyecto, Product Owner, Desarrollo, QA |
| *(otros integrantes, si el equipo los tiene)* | *a completar* |
| Docente / comité simulado | Patrocinador / Comité (aprobaciones y defensa) |

> La guía pide equipos de 2 a 4 estudiantes con roles definidos y rotación documentada. Si se suman integrantes, se actualiza esta tabla y se registra la rotación por sprint. Cuando una misma persona tiene varios roles, se separan las decisiones: por ejemplo, el rol de QA revisa con la checklist de la DoD antes de mover una tarjeta a *Hecho*.

## 4. Plan de capacitación

| Etapa | Capacitación |
|---|---|
| Antes del piloto | Capacitación inicial a usuarios seleccionados |
| Durante el piloto | Acompañamiento y resolución de dudas |
| Antes del despliegue | Capacitación a usuarios de cada dependencia |
| Después del despliegue | Soporte y refuerzo |

**Temas:** acceso al sistema, creación y consulta de expedientes, gestión de documentos, envío y recepción, seguridad, uso correcto del sistema.
**En el prototipo:** manual de usuario breve y guion de demostración (S8-03, S8-05).

## 5. Plan de comunicaciones

| Nivel | Participantes | Información | Frecuencia | Canal / evidencia en el prototipo |
|---|---|---|---|---|
| Ejecutiva | Patrocinador, comité, gerente | Avance general, hitos, presupuesto, problemas importantes, decisiones | Mensual | Informe de estado + tablero de métricas |
| Operativa | Gerente, PO, referentes, especialistas | Avance, dependencias, bloqueos, cambios | Semanal | Comentarios en Trello, registro de cambios |
| Equipo | Desarrollo, QA, infraestructura, PO | Trabajo del sprint, problemas, cambios, resultados | Durante cada sprint | Trello, pull requests, notas de review y retrospectiva en `07-evidencias` |

## 6. Resolución de conflicto (simulación)

**Situación:** durante el piloto se detecta que un nuevo control documental es necesario para cumplir la normativa, pero hace que el proceso sea más largo para los usuarios y podría retrasar el despliegue.

**Decisión:** se analiza el impacto y se prioriza el cumplimiento obligatorio. Al mismo tiempo, el equipo busca simplificar el proceso para reducir el impacto sobre el usuario. Si el cambio afecta el alcance o la fecha aprobada, se escala al Gerente de Proyecto y, si corresponde, al Comité/Patrocinador.

**Resultado:** se mantiene el requisito obligatorio, se ajusta la experiencia de usuario y se revisa el impacto sobre el cronograma antes de aprobar el cambio. Este conflicto se conecta con el evento de cambio CF-03 ([control-cambios.md](control-cambios.md)).
