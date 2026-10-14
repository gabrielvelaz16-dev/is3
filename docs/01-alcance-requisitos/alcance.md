# Alcance del proyecto

**Estado:** Línea base inicial (Fase 0) · **Unidad:** 3 · **Tarjetas:** F0-01, F0-03, CF-01

## 1. Contexto del caso

Una institución pública implementará un sistema de expediente electrónico en varias dependencias. Existen una fecha oficial, un presupuesto, normativa, controles de seguridad, hitos de infraestructura y aprobaciones institucionales que deben planificarse formalmente. Los flujos documentales, las integraciones y la experiencia de usuario requieren descubrimiento y ajustes mediante pilotos y sprints.

Condiciones del caso: despliegue gradual por dependencias, tratamiento de datos y documentos oficiales, infraestructura propia, múltiples interesados, proveedores externos, necesidad de capacitación, gestión del cambio y evidencia de auditoría.

## 2. Dos niveles de alcance

El trabajo tiene dos alcances que se relacionan pero no son iguales:

| Nivel | Qué abarca | Dónde se documenta |
|---|---|---|
| **Proyecto institucional (simulado)** | Implementación completa en la institución: infraestructura, gobernanza, capacitación, migración, seguridad, despliegue gradual. | EDT, cronograma maestro, RACI, riesgos (TP Unidades 2 a 6). |
| **Prototipo académico (construido)** | Sistema web funcional que se ejecuta localmente y sirve como evidencia técnica verificable de calidad, configuración, CI/CD y métricas. | Este repositorio. |

El prototipo implementa el paquete de trabajo *Desarrollo/configuración* de la EDT y simula los demás (por ejemplo, el proveedor de identidad mediante un adaptador).

## 3. Objetivo del prototipo

Construir una aplicación web que permita registrar y tramitar expedientes electrónicos entre dependencias de una institución pública ficticia, con documentos, actuaciones, tareas, estados, historial, roles y permisos, reportes, auditoría y copias de seguridad, siguiendo una gestión híbrida trazable.

## 4. Dentro del alcance

1. Gestión de expedientes: alta, consulta, modificación, listado, búsqueda, filtros y paginación, con número único.
2. Documentos asociados a expedientes con almacenamiento y acceso seguros.
3. Actuaciones y observaciones con fecha y responsable.
4. Responsables, tareas y vencimientos.
5. Estados del expediente con transiciones válidas.
6. Envío y recepción de expedientes entre dependencias *(incorporado desde el backlog del TP)*.
7. Pendientes, alertas y notificaciones internas.
8. Historial completo de cada expediente.
9. Usuarios, roles y permisos verificados en el servidor.
10. Dashboard de estadísticas y reportes con filtros y exportación.
11. Registro de auditoría protegido contra modificaciones ordinarias.
12. Copia de seguridad y restauración de los datos locales.
13. Adaptador de identidad simulado (contingencia del riesgo R01).
14. Documentación, pruebas automatizadas, CI y evidencias por sprint.

## 5. Fuera del alcance

- Integración con servicios institucionales reales (identidad, firma digital, mesa de entradas existente).
- Firma digital con validez legal.
- Despliegue en servidores reales o en la nube; el sistema se ejecuta localmente.
- Migración de datos reales: solo se usan datos ficticios.
- Notificaciones por correo, SMS u otros canales externos (solo notificaciones internas).
- Aplicación móvil nativa.

## 6. Entregables

| Entregable | Formato | Sprint |
|---|---|---|
| Documentos de gestión (gobernanza, EDT, cronograma, backlog, RACI, riesgos) | `docs/04-gestion` | Fase 0 (base) y vivos |
| Requisitos, arquitectura y modelo de datos | `docs/01` a `docs/03` | Fase 0, refinados en Sprint 2 |
| Prototipo funcional (frontend + backend + base de datos) | Código en este repositorio | Sprints 1 a 6 |
| Plan y resultados de pruebas | `docs/05-calidad-pruebas` + pipeline CI | Sprints 1 a 8 |
| Plan de configuración, CI/CD e instalación | `docs/06-configuracion-devops` | Sprints 1 y 8 |
| Tablero integrado de métricas | `docs/04-gestion/monitoreo-metricas.md` | Sprint 6 en adelante |
| Versión estable etiquetada `v1.0.0` | Git tag | Sprint 8 |
| Informe final (máximo 28 páginas) y defensa de 15 minutos | PDF | Sprint 8 |

## 7. Supuestos

- La infraestructura necesaria (una computadora con Node.js, Git y Docker) está disponible.
- Las dependencias de la institución ficticia participan en las validaciones (simuladas por el equipo).
- Todos los datos y documentos usados son ficticios.

## 8. Restricciones

- Fecha oficial de entrega y defensa fijadas por la cátedra.
- Dedicación limitada (la guía sugiere entre 18 y 24 horas-equipo por TP; el prototipo supera ese esfuerzo, ver riesgo R09).
- Tecnologías definidas en las instrucciones del proyecto (React, Express, PostgreSQL, Prisma, TypeScript).
- No ingresar datos personales, confidenciales ni credenciales en herramientas de IA.

## 9. Criterios de aceptación del proyecto

- Evidencia evaluable en cada una de las Unidades 2 a 9.
- El sistema se instala y ejecuta siguiendo el README.
- Las funciones críticas tienen pruebas automatizadas en verde en el pipeline.
- Existe trazabilidad desde paquete de trabajo hasta versión publicada.
