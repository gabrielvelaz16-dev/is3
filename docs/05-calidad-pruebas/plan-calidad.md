# Plan maestro de calidad

**Estado:** Plan inicial (Fase 0) · **Unidad:** 7 · **Tarjetas:** CF-05, CF-06, F0-09

## 1. QA, QC y V&V

- **QA (aseguramiento):** crea las condiciones para que el proceso produzca calidad. *¿Tenemos un proceso capaz?*
- **QC (control):** verifica que el entregable cumple lo esperado. *¿El entregable cumple?*
- **Verificación:** ¿construimos el producto correctamente? · **Validación:** ¿construimos el producto correcto?

| Actividad | QA o QC | Cuándo | Responsable | Evidencia |
|---|---|---|---|---|
| Definition of Ready / Done | QA | Fase 0, revisión por retrospectiva | PO + equipo | Este documento |
| Estándares de código (ESLint, Prettier, TypeScript estricto) | QA | Sprint 1 | Desarrollo | Configuración en el repo |
| Plantilla de pull request con checklist | QA | Sprint 1 | Desarrollo | `.github/pull_request_template.md` |
| Pipeline CI (lint + pruebas + build) | QA (automatiza QC) | Sprint 1 en adelante | Desarrollo | Ejecuciones de GitHub Actions |
| Revisión de código en cada PR | QC | Cada integración | QA / revisor | Comentarios del PR |
| Pruebas unitarias y de integración | QC | Cada sprint | Desarrollo | Reportes de Vitest |
| Pruebas de aceptación de historias | QC (validación) | Sprint review | PO | Checklist de criterios en Trello |
| Auditoría de la puerta de calidad del release | QC | Fin de cada release | Gerente + QA | Acta en `07-evidencias` |
| Revisión de deuda técnica | QA | Retrospectiva | Equipo | Registro de deuda (sección 6) |

## 2. Matriz de calidad — ISO/IEC 25010

Se seleccionan los cinco atributos más críticos para un sistema de expediente electrónico: maneja documentos oficiales (seguridad, fiabilidad), su valor depende de que los flujos sean correctos (adecuación funcional), lo usan funcionarios no técnicos (usabilidad) y evoluciona por sprints (mantenibilidad).

| Atributo (subcaracterística) | Requisito de calidad | Métrica | Método de verificación | Evidencia |
|---|---|---|---|---|
| **Seguridad** (confidencialidad, integridad, responsabilidad) | RNF-01 a RNF-06 | % rutas protegidas con prueba de 403; hallazgos críticos de `npm audit`; registros de auditoría modificables | Pruebas automáticas de permisos (PR-02, PR-09); prueba de inmutabilidad de auditoría (PR-20); `npm audit` en CI | Reporte de CI; resultados en [resultados-pruebas.md](resultados-pruebas.md) |
| **Adecuación funcional** (corrección, completitud) | RF-01 a RF-23, RNF-08 | % criterios de aceptación cumplidos por historia; indicadores del dashboard = consulta directa | Pruebas de integración; prueba S6-04; aceptación del PO | Checklists de Trello; reporte de pruebas |
| **Fiabilidad** (recuperabilidad, tolerancia a fallos) | RNF-07 | Restauración exitosa (sí/no) y tiempo de restauración | Prueba de backup y restore sobre datos de demostración (PR-22) | Registro de la prueba con fecha, tamaño y conteo de registros antes/después |
| **Usabilidad** (aprendibilidad, protección contra errores) | RNF-11 | % tareas completadas sin ayuda; errores de validación con mensaje claro | Prueba con 3 usuarios y 5 tareas (S7-05) | Planilla de la prueba de usabilidad |
| **Mantenibilidad** (modularidad, capacidad de prueba) | RNF-10 | Cobertura en `modules/` y `security/`; controladores sin lógica de negocio | Reporte de cobertura; revisión de código | Reporte de cobertura en CI |

Atributos considerados con menor prioridad en el prototipo: eficiencia de desempeño (RNF-09, medición simple en el Sprint 7), compatibilidad y portabilidad (RNF-12, verificada con la instalación desde cero).

## 3. Definition of Ready (DoR)

Una historia puede entrar a un sprint cuando:

- [ ] Tiene código, descripción en formato *Como… quiero… para…* y requisito asociado.
- [ ] Tiene criterios de aceptación verificables en Trello.
- [ ] Está estimada en SP por el equipo.
- [ ] Sus dependencias están terminadas o planificadas en el mismo sprint.
- [ ] Se identificaron riesgos de seguridad o de datos si corresponde.

## 4. Definition of Done (DoD)

Una historia o tarea pasa a *Hecho* cuando:

- [ ] Cumple todos sus criterios de aceptación.
- [ ] El código está en una rama `feature/<código>` y fue integrado a `develop` mediante PR.
- [ ] El pipeline CI está en verde (lint, tipos, pruebas, build).
- [ ] Tiene pruebas automatizadas si toca negocio, seguridad o datos.
- [ ] Las validaciones existen en frontend **y** backend cuando hay entrada de datos.
- [ ] Las operaciones importantes quedan registradas en auditoría.
- [ ] No expone secretos ni detalles internos en errores.
- [ ] La documentación afectada está actualizada (README, docs, trazabilidad).
- [ ] Si se usó IA, la bitácora tiene la entrada correspondiente.

## 5. Puertas de calidad

| Puerta | Momento | Criterios de salida | Aprueba |
|---|---|---|---|
| G1 · Requisitos | Fin de Fase 0 | Requisitos, alcance y backlog unificados; CR-00 decidido; DoR/DoD aprobadas | Gerente / Comité |
| G2 · Desarrollo | Cada PR | DoD cumplida; revisión aprobada | QA / revisor |
| G3 · Pruebas | Fin de cada release | 100 % pruebas aprobadas; 0 defectos críticos abiertos; cobertura según meta | QA |
| G4 · Aprobación | Fin de cada release | Sprint review aceptada por PO; riesgos críticos con plan | Gerente (R1–R3) / Comité (R4) |
| G5 · Despliegue | R4 | Instalación desde cero verificada; backup/restore probado; tag `v1.0.0` | Comité |

Un hallazgo crítico de seguridad bloquea cualquier puerta (respuesta a R06).

## 6. Deuda técnica

La deuda técnica no surge solo de decisiones del programador; también de planificación y alcance. Se hace visible, se evalúa su impacto y se planifica su reducción como parte del proyecto.

| ID | Deuda | Origen | Impacto / riesgo | Prioridad | Plan |
|---|---|---|---|---|---|
| DT-01 | Integración real de identidad reemplazada por un adaptador simulado | Decisión de diseño (R01, ADR-06) | Alto si se pasara a producción; bajo para el prototipo | Alta | Mantener la interfaz documentada; prueba de contrato del adaptador |
| DT-02 | Versiones de dependencias aún no verificadas en la máquina de desarrollo | Restricción de la Fase 0 | Medio: incompatibilidades al instalar | Alta | **Resuelta** 14/10/2026: versiones fijadas en ADR-01 y `package-lock.json` |
| DT-03 | Puntos de Función sin calcular | Planificación (TP Unidad 4) | Medio: estimación macro sin tamaño funcional | Media | Conteo en el Sprint 2 con el modelo implementado |
| DT-04 | Almacenamiento de documentos en disco local | Decisión de diseño (ADR-08) | Bajo en el prototipo; el backup debe incluir la carpeta | Baja | **Resuelta** 16/10/2026: el respaldo incluye los archivos con su hash y la restauración los verifica (S7-04, ADR-13) |
| DT-05 | 4 vulnerabilidades altas en la CLI de Prisma 7.10.0 (`mysql2` ≤ 3.23.0: GHSA-3f6p-5ww8-9rcr, GHSA-rgwj-5xj2-c3m3; `deepmerge-ts` < 8.0.0: GHSA-ggr8-5vv4-36mx), detectadas por CI el 14/10/2026 | Dependencia de desarrollo (`prisma`); el arreglo sugerido es bajar a Prisma 6 | Bajo: la CLI solo se usa para migraciones en la PC y en CI; el servidor no carga `mysql2` ni `@prisma/config`, y el proyecto no usa MySQL | Media | La CI informa estas vulnerabilidades como advertencia (solo desarrollo) y sigue fallando ante vulnerabilidades altas en paquetes de producción. Revisar en cada sprint y actualizar Prisma cuando publique el arreglo. **16/10/2026:** la auditoría de la CI sugiere `prisma@7.10.1`; actualizar en la PC después de verificar las versiones (sprint-07.md §6). |

## 7. Gestión de defectos

Cada defecto se registra como tarjeta con etiqueta *Defecto*, con severidad (crítica, alta, media, baja), pasos para reproducir, resultado esperado y obtenido. Los críticos se corrigen antes de cerrar el sprint; el resto se prioriza en el backlog.
