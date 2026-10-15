# TP Unidades 8 y 9 — Configuración/DevOps y Seguimiento/mejora

**Estado:** Entregable del TP (15/10/2026) · **Unidades:** 8 y 9 · **Responsable:** Carlos Gabriel Velázquez Franco

Versión en Word para entregar: [TP_Unidades_8_y_9_Expediente_Electronico.docx](TP_Unidades_8_y_9_Expediente_Electronico.docx). Este archivo es la misma versión en Markdown para leerla en GitHub. Los datos son reales del prototipo al 15/10/2026 (después del Sprint 5) y amplían el [plan de configuración](../06-configuracion-devops/plan-configuracion.md) y el [monitoreo de métricas](../04-gestion/monitoreo-metricas.md).

## Configuración y DevOps

Para esta parte usamos como evidencia el prototipo del proyecto (repositorio **gabrielvelaz16-dev/is3**, tablero de Trello **IS3 – Expediente Electrónico** y GitHub Actions). Lo que se gobierna de forma predictiva son las líneas base, las aprobaciones y las versiones; lo adaptativo es el trabajo diario de cada sprint, que entra por ramas y pull requests.

### 8.1 Elementos de configuración

Un elemento de configuración (EC) es todo lo que necesitamos controlar porque si cambia afecta al proyecto. Separamos los técnicos de los de gestión:

| Tipo    | Elemento                     | Dónde se guarda              | Cómo se controla               |
|-------------|----------------------------------|----------------------------------|------------------------------------|
| Técnico | Código del backend y frontend    | backend/, frontend/              | Git + pull request                 |
| Técnico | Esquema y migraciones de la base | backend/prisma/                  | Una migración aplicada no se edita |
| Técnico | Pipeline de CI                   | .github/workflows/               | Git + revisión                     |
| Técnico | Dependencias                     | package.json y package-lock.json | Versiones fijas (ADR-01)           |
| Técnico | Infraestructura local            | docker-compose.yml               | Git                                |
| Técnico | Variables de entorno             | .env.example (sí) / .env (no)    | .env en .gitignore                 |
| Gestión | Requisitos, alcance y backlog    | docs/ y Trello                   | Línea base + control de cambios    |
| Gestión | Riesgos, calidad, planes         | docs/04 a docs/06                | Git, revisión por sprint           |
| Gestión | Evidencias y bitácora de IA      | docs/07, docs/bitacora-ia        | Git                                |

### 8.2 Líneas base y control de cambios

| Línea base | Contenido                           | Etiqueta             | Momento            |
|----------------|-----------------------------------------|--------------------------|------------------------|
| Funcional  | Requisitos, alcance y backlog aprobados | baseline-v1              | Puerta G1 (fin Fase 0) |
| Releases   | Código y documentos de cada release     | v0.1.0 / v0.2.0 / v0.3.0 | Fin de R1, R2 y R3     |
| Producto   | Versión estable para entregar           | v1.0.0                   | Sprint 8               |

Usamos versionado semántico (MAYOR.MENOR.PARCHE). Una etiqueta nunca se mueve: si la línea base cambia se crea otra (baseline-v2). Todo cambio de alcance sigue este circuito:

**Solicitud (CR) → análisis de impacto → aprobación → actualizar backlog y línea base → registrar**

Aprueba el Product Owner si solo cambia el orden del backlog, el Gerente si afecta un sprint y el Comité si afecta fecha, presupuesto o normativa. Casos reales del proyecto: **CR-02** (se adelantó el login al Sprint 2) y **CR-03** (las notificaciones pasaron del Sprint 5 al 6 porque el sprint tenía 29 SP contra una velocidad de 16).

### 8.3 Repositorio, ramas y etiquetas

| Rama                        | Para qué                     | Regla                                     |
|---------------------------------|----------------------------------|-----------------------------------------------|
| main                        | Versiones estables               | Solo desde develop, con aprobación y etiqueta |
| develop                     | Integración de cada sprint       | Solo por PR con CI en verde                   |
| feature/\<código\>-\<tema\> | Trabajo de una tarjeta de Trello | Nace de develop y se borra al fusionar        |
| hotfix/\<código\>           | Corrección urgente               | Nace de main, vuelve a main y develop         |

Los commits llevan el código de la tarjeta, por ejemplo **S5-04: envío de expedientes**. Así se puede seguir la cadena completa:

**Tarjeta Trello → rama → commits → PR → ejecución de CI → merge → etiqueta**

Ejemplo real: la historia **S5-04 Enviar expediente** se trabajó en la rama feature/S5-tareas-seguimiento, entró por el **PR \#12** y su CI quedó en verde en la ejecución 38745648399 (115/115 pruebas de backend y 34/34 de frontend). Esto también queda en la matriz de trazabilidad (docs/04-gestion/trazabilidad.md).

### 8.4 Segregación de ambientes

| Ambiente               | En el prototipo                           | En el proyecto institucional         |
|----------------------------|-----------------------------------------------|------------------------------------------|
| Desarrollo             | PC local + Docker, datos ficticios            | Equipos del equipo de desarrollo         |
| Pruebas                | GitHub Actions con su propia base PostgreSQL  | Servidor de QA con datos anonimizados    |
| Piloto / preproducción | Build de producción con datos de demostración | Una dependencia habilitada (piloto)      |
| Producción             | No aplica (proyecto académico)                | Infraestructura propia de la institución |

Los ambientes se separan con variables de entorno (DATABASE_URL y DATABASE_URL_TEST) y nunca comparten base de datos. Las contraseñas no se suben a Git, solo el archivo .env.example sin valores reales.

### 8.5 CI/CD con aprobaciones institucionales

La integración continua ya funciona. En cada push y en cada pull request GitHub Actions ejecuta:

**Instalar (npm ci) → tipos → lint → pruebas + cobertura → migraciones en PostgreSQL → seed → verificar tablas de solo inserción → build → auditoría de dependencias**

Si un paso falla el PR no se puede fusionar. La parte de entrega (CD) combina automatización con aprobación formal, que es lo que pide el enfoque híbrido:

- **Automático:** pruebas, análisis y build en cada cambio.

- **Aprobación del equipo:** el merge a develop necesita CI en verde y una revisión.

- **Aprobación institucional:** el merge a main y la etiqueta de versión requieren la aprobación del Gerente/Comité en las puertas G4 (release) y G5 (entrega). En GitHub se representa con protección de rama y un environment con revisor obligatorio.

### 8.6 Despliegue gradual y rollback

El despliegue es por dependencias, no todo junto. Primero un piloto y después se habilitan las demás si el piloto se aprueba (hito H5):

**Mesa de Entradas (piloto) → Asesoría Jurídica → Recursos Humanos → resto**

Para pasar a la siguiente dependencia se pide: cero defectos críticos abiertos, usuarios capacitados y la conformidad del referente de la dependencia. Si algo sale mal, el **rollback** es: volver a la etiqueta estable anterior, restaurar el backup tomado antes del despliegue (es obligatorio hacerlo antes) y, si el problema es de una sola dependencia, deshabilitar solo esa. El incidente se registra en riesgos (R11).

### 8.7 Observabilidad y DevSecOps

Para saber que el sistema está funcionando tenemos el endpoint **/api/health** (estado de la API y de la base), logs en formato JSON con un identificador por petición y sin datos sensibles, y la auditoría funcional que consulta el administrador. Por ejemplo, el 15/10 el health respondió "database: down" y eso nos permitió ver rápido que Docker no estaba iniciado.

| Control DevSecOps              | Herramienta                                     | Etapa     |
|------------------------------------|-----------------------------------------------------|---------------|
| Secretos fuera del repositorio | .gitignore, .env.example                            | Commit        |
| Dependencias vulnerables       | npm audit en la CI (falla con altas o críticas)     | CI            |
| Análisis estático              | ESLint + TypeScript estricto                        | CI            |
| Revisión obligatoria           | Protección de ramas main y develop                  | Pull request  |
| Pruebas de seguridad           | Permisos por rol, acceso entre dependencias         | CI            |
| Auditoría inalterable          | Triggers en PostgreSQL que bloquean UPDATE y DELETE | Base de datos |

## Seguimiento y mejora

### 9.1 Tablero integrado

El tablero junta métricas predictivas (alcance, hitos, costo), ágiles (velocidad, lead time) y DevOps. Los valores son reales del prototipo al 15/10/2026, después del Sprint 5:

| Dimensión  | Métrica                       | Umbral     | Valor actual        | Estado |
|----------------|-----------------------------------|----------------|-------------------------|------------|
| Alcance    | SP terminados / línea base        | Según plan     | 63 de 97 SP (65 %)      | En curso   |
| Cambios    | Solicitudes aprobadas             | —              | 4 (CR-00 a CR-03)       | Controlado |
| Cronograma | Pronóstico vs sprints disponibles | ≤ 2 sprints    | 34 / 16 = 3 sprints     | Alerta     |
| Hitos      | Puertas aprobadas                 | Sin atraso     | G1 aprobada             | OK         |
| Costo      | Horas reales vs estimadas         | Desvío ≤ 20 %  | No registrado           | Pendiente  |
| Velocidad  | SP por sprint (S1 a S5)           | ± 20 %         | 3, 12, 16, 11, 21       | Inestable  |
| Flujo      | Lead time por tarjeta             | Bajando        | Sin medir               | Pendiente  |
| Riesgos    | Riesgos materializados            | 0              | R15 (errores de IA)     | Alerta     |
| Calidad    | Pruebas aprobadas                 | 100 %          | 149 / 149               | OK         |
| Calidad    | Cobertura del backend             | ≥ 70 %         | 93,46 %                 | OK         |
| Defectos   | Abiertos / cerrados               | 0 críticos     | 1 abierto / 9 cerrados  | OK         |
| Adopción   | Tareas de usabilidad sin ayuda    | ≥ 80 %         | Sprint 7                | Pendiente  |
| DevOps     | Tasa de fallos del pipeline       | \< 20 %        | 8 de 19 (42 %)          | Alerta     |
| DevOps     | Tiempo de recuperación            | \< 1 día       | 2 a 8 min (uno de 19 h) | OK         |
| DevOps     | PR integrados a develop           | ≥ 2 por semana | 0 de 12                 | Alerta     |

Los datos de DevOps salen del historial de GitHub Actions (21 ejecuciones, 2 canceladas). Las métricas en "Pendiente" se reconocen como faltantes y no se completan con números inventados.

### 9.2 Interpretación y decisiones

Un tablero sin decisiones no sirve, por eso cada alerta tiene una acción:

| Alerta                                       | Lo que significa                                  | Decisión                                                                                                     |
|--------------------------------------------------|-------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Pronóstico de 3 sprints contra 2 disponibles | No llegamos con todo el alcance si seguimos igual     | Abrir un CR para priorizar con MoSCoW y dejar lo "deseable" fuera de v1.0.0, sin tocar la línea base en silencio |
| Pipeline con 42 % de fallos                  | Se sube código sin probarlo antes en local            | Correr tipos y pruebas antes del push; los fallos se arreglaron en minutos, el problema es la prevención         |
| 0 PR integrados                              | Todo el trabajo está en ramas, no hay versión estable | Revisar e integrar los PR \#1 a \#12 en orden y crear la etiqueta v0.2.0 antes del Sprint 6                      |
| R15 materializado                            | El Sprint 3 se dio por terminado con la CI en rojo    | La DoD exige CI en verde para cerrar una historia                                                                |

### 9.3 Revisiones

| Revisión             | Cuándo          | Participan                | Resultado                                          |
|--------------------------|---------------------|-------------------------------|--------------------------------------------------------|
| Revisión ejecutiva   | Mensual             | Comité, patrocinador, gerente | Decisiones sobre alcance, fecha y riesgos estratégicos |
| Sprint review        | Fin de cada sprint  | PO, equipo, referentes        | Historias aceptadas o rechazadas                       |
| Retrospectiva        | Fin de cada sprint  | Equipo                        | Acciones de mejora con responsable                     |
| Lecciones aprendidas | Fin de cada release | Gerente, PO, equipo           | Registro y nuevos estándares                           |

### 9.4 Lecciones aprendidas y mejora continua

| Lección                                             | De dónde salió             | Acción / estándar                                    |
|---------------------------------------------------------|--------------------------------|----------------------------------------------------------|
| Un sprint no se cierra sin CI en verde              | Sprint 3 (D-04 a D-08)         | Se agregó a la Definition of Done                        |
| Una verificación puede dar un falso OK              | CI del Sprint 4 (D-09)         | Las pruebas de la base insertan datos antes de verificar |
| Al cambiar de rama el cliente de Prisma quedó viejo | Prueba manual del 15/10 (D-10) | El comando dev va a regenerar el cliente solo            |
| Un sprint muy cargado no se cumple                  | Planificación del Sprint 5     | Comparar con la velocidad antes de comprometer           |

**De mejora local a estándar institucional:** cuando una acción de retrospectiva funciona dos sprints seguidos (por ejemplo, la regla de CI en verde o la plantilla de PR) se escribe en el plan de calidad o de configuración y pasa a ser obligatoria para todo el proyecto. Después se presenta en la revisión ejecutiva para que el Comité la apruebe como estándar y se aplique igual en cada dependencia que entra en el despliegue gradual. Así, lo que aprende un equipo en un sprint no se pierde y termina siendo parte de la forma de trabajo de toda la institución.
