# Enfoque y gobernanza híbrida

**Estado:** Completo (TP Unidad 2) · **Unidad:** 2 · **Fuente:** Trabajo Práctico Nro 6 — sección Enfoque

## 1. Características del caso que definen el enfoque

- Existe una fecha oficial y un presupuesto.
- Hay normativa que cumplir y controles de seguridad.
- Hay hitos de infraestructura y se necesitan aprobaciones institucionales.
- Los flujos documentales pueden necesitar ajustes.
- Las integraciones requieren pruebas.
- La experiencia de usuario necesita validación.
- Se realizarán pilotos y sprints, y el despliegue será gradual por dependencias.

## 2. Matriz predictivo / adaptativo / compartido

| Componente | Tipo | Justificación |
|---|---|---|
| Fecha oficial del proyecto | Predictivo | Está definida y debe cumplirse. |
| Presupuesto | Predictivo | Existe una restricción económica que debe controlarse. |
| Normativa | Predictivo | Debe cumplirse y requiere control formal. |
| Seguridad | Compartido | Necesita requisitos definidos, pero también validaciones durante el desarrollo. |
| Infraestructura | Predictivo | Tiene hitos que deben planificarse previamente. |
| Aprobaciones institucionales | Predictivo | Requieren gobernanza y autorización formal. |
| Flujos documentales | Adaptativo | Pueden descubrirse y ajustarse durante los pilotos. |
| Integraciones | Adaptativo | Necesitan pruebas y ajustes durante los sprints. |
| Experiencia de usuario | Adaptativo | Requiere retroalimentación de los usuarios. |
| Despliegue por dependencias | Compartido | Hay una planificación general, pero la ejecución puede ajustarse según los resultados. |

**Justificación del enfoque:** se selecciona un enfoque híbrido porque el proyecto tiene restricciones formales de fecha, presupuesto, normativa, seguridad e infraestructura que requieren planificación y control, mientras que los flujos documentales, las integraciones y la experiencia de usuario necesitan pruebas, pilotos y retroalimentación.

### 2.1 Cómo se refleja la matriz en el prototipo

| Clasificación | Artefacto en el repositorio / Trello |
|---|---|
| Predictivo | Lista *Control formal (predictivo)* en Trello; línea base (CF-01); control de cambios (CF-02); puertas de calidad (CF-05); etiqueta `vX.Y.Z` por release. |
| Adaptativo | Backlog priorizado, sprints, revisiones y retrospectivas; historias con etiqueta *Adaptativo*. |
| Compartido | Seguridad (requisitos RNF fijos + pruebas en cada sprint), plan de calidad, pipeline CI, despliegue por releases. |

## 3. Gobernanza

| Rol | Responsabilidad |
|---|---|
| Patrocinador / Comité | Aprobar decisiones importantes y recursos. |
| Gerente de Proyecto | Coordinar el proyecto y controlar alcance, plazo y presupuesto. |
| Product Owner | Priorizar las necesidades funcionales y el backlog. |
| Equipo de desarrollo | Diseñar, desarrollar y probar el sistema. |
| Referentes de las dependencias | Aportar necesidades y validar los resultados. |

### Cadencias

| Cadencia | Frecuencia | Nivel |
|---|---|---|
| Seguimiento del proyecto / comité | Mensual | Estratégico (predictivo) |
| Reunión operativa | Semanal | Operativo |
| Sprint (planning, review, retrospectiva) | Cada 2 semanas | Equipo (adaptativo) |

### Puertas de control

Antes de avanzar entre etapas importantes se verifica:

```
Requisitos → Desarrollo → Pruebas → Aprobación → Despliegue
```

Los criterios concretos de cada puerta están en el [plan de calidad](../05-calidad-pruebas/plan-calidad.md#5-puertas-de-calidad).

### Escalamiento

Si el equipo no puede resolver un problema, se escala al Gerente de Proyecto. Si afecta presupuesto, alcance, normativa o decisiones institucionales importantes, se escala al Comité/Patrocinador. Es el mismo mecanismo usado para riesgos ([riesgos.md](riesgos.md)) y cambios ([control-cambios.md](control-cambios.md)).
