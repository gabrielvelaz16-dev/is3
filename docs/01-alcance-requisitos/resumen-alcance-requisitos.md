# Resumen de alcance y requisitos

**Estado:** Aprobado con la puerta G1 (14/10/2026) · **Unidades:** 3 y 7 · **Uso:** lectura rápida y apoyo para la defensa

Este documento resume en lenguaje simple el [alcance](alcance.md) y los [requisitos](requisitos.md). Ante cualquier diferencia, mandan esos dos documentos.

## 1. La idea general

Es un sistema web para que una **institución pública ficticia** gestione sus **expedientes** (trámites con documentos) en formato digital y los pase entre dependencias (Mesa de Entradas, Asesoría Jurídica, Recursos Humanos, etc.). Se ejecuta en una sola computadora y usa solo datos ficticios.

Hay **dos alcances** que no deben confundirse:

| Alcance | Qué es | Dónde está |
|---|---|---|
| **Proyecto institucional (simulado)** | La implementación completa en la institución: infraestructura, capacitación, migración, despliegue por dependencias. | En papel: EDT, cronograma, RACI y riesgos (TP Unidades 2 a 6). |
| **Prototipo (construido)** | El sistema web real. Es la evidencia técnica de calidad, configuración, CI/CD y métricas que pide la guía. | Este repositorio. |

## 2. Qué hace el sistema

1. **Expedientes:** crear, consultar, modificar y listar, con búsqueda, filtros y paginación. Cada uno recibe un número único (`EXP-2026-000123`).
2. **Documentos:** adjuntar archivos al expediente (validando tipo y tamaño); solo los descarga quien tiene permiso.
3. **Actuaciones y observaciones:** cada movimiento queda registrado con fecha y responsable.
4. **Responsables, tareas y vencimientos.**
5. **Estados con reglas:** un expediente no puede pasar de cualquier estado a cualquier otro (por ejemplo, no se archiva sin estar resuelto).
6. **Pases entre dependencias:** enviar un expediente y que la dependencia destino confirme la recepción. Se incorporó desde el backlog del TP porque es el centro del caso.
7. **Pendientes, alertas y notificaciones internas.**
8. **Historial completo** de cada expediente.
9. **Usuarios, roles y permisos** verificados en el servidor (no solo ocultando botones).
10. **Dashboard y reportes** con filtros y exportación a CSV.
11. **Auditoría:** registro de quién hizo qué, que no se puede borrar ni modificar.
12. **Copia de seguridad y restauración.**
13. **Inicio de sesión mediante un adaptador simulado:** respuesta al riesgo R01 (atraso del proveedor de identidad). Cuando exista el proveedor real, se reemplaza esa pieza sin tocar el resto.

## 3. Qué NO hace

- No se conecta a sistemas reales (identidad, firma digital, mesa de entradas existente).
- No tiene firma digital con validez legal.
- No se instala en servidores ni en la nube: se ejecuta localmente.
- No migra datos reales.
- No envía correos ni SMS (solo notificaciones internas).
- No tiene aplicación móvil.

## 4. Roles

| Rol | Qué puede hacer |
|---|---|
| **Administrador** | Todo: usuarios, roles, dependencias, auditoría y copias de seguridad. |
| **Mesa de entradas** | Crear, consultar y enviar expedientes de su dependencia. |
| **Funcionario / Responsable** | Tramitar lo asignado: actuaciones, documentos, cambios de estado y tareas. |
| **Jefe de dependencia** | Lo del funcionario, más asignar responsables y ver reportes de su dependencia. |
| **Auditor** | Solo lectura: expedientes, reportes y auditoría. |

## 5. Requisitos funcionales (RF-01 a RF-23)

Cada requisito indica la tarjeta que lo implementa y la prueba que lo verifica ([detalle](requisitos.md#2-requisitos-funcionales)).

| Sprint | Requisitos |
|---|---|
| 2 | Inicio y cierre de sesión, permisos por rol, gestión de usuarios, auditoría base, adaptador de identidad (RF-01 a RF-03, RF-20, RF-23) |
| 3 | Crear, consultar, modificar y listar expedientes; número único (RF-04 a RF-07) |
| 4 | Documentos, descarga controlada, actuaciones, historial (RF-08 a RF-11) |
| 5 | Responsables, tareas, estados, pases, recepción, alertas (RF-12 a RF-17) |
| 6 | Estadísticas, reportes y exportación (RF-18, RF-19) |
| 7 | Consulta de auditoría, copia de seguridad y restauración (RF-21, RF-22) |

**Prioridad (MoSCoW):** 17 son *Must* (obligatorios) y 6 son *Should* (importantes, primeros en ajustarse si falta tiempo): tareas (RF-13), alertas (RF-17), estadísticas (RF-18), reportes (RF-19), consulta de auditoría (RF-21) y adaptador de identidad (RF-23).

## 6. Requisitos no funcionales (RNF-01 a RNF-13)

Basados en ISO/IEC 25010; cada uno tiene un criterio medible ([detalle](requisitos.md#3-requisitos-no-funcionales)).

| Característica | Qué se exige |
|---|---|
| **Seguridad** | Contraseñas con hash seguro (bcrypt o argon2); permisos verificados en el servidor con pruebas de acceso denegado en el 100 % de las rutas protegidas; auditoría inmodificable; documentos fuera de la carpeta pública con verificación de hash; errores sin información interna; secretos solo en `.env`. |
| **Fiabilidad** | La copia de seguridad se puede restaurar (prueba en el Sprint 7). |
| **Corrección** | Los indicadores del dashboard coinciden con los datos de la base. |
| **Rendimiento** | Listados con p95 menor a 1 segundo con 1.000 expedientes. |
| **Mantenibilidad** | Reglas de negocio fuera de los controladores; cobertura de pruebas de al menos 70 % en módulos de negocio y seguridad. |
| **Usabilidad** | Interfaz en español con mensajes claros, probada con al menos 3 usuarios. |
| **Instalabilidad** | Instalación desde cero siguiendo solo el README. |
| **Integridad de datos** | Claves foráneas, campos únicos y obligatorios en la base. |

Los umbrales de 1 segundo y 70 % son **supuestos iniciales** y se revisan en el Sprint 7.

## 7. Tamaño del trabajo

El backlog suma **97 Story Points** en 8 sprints, según el CR-00 aprobado: 80 SP del TP, menos 18 SP de historias institucionales que no se programan, más 35 SP de funciones nuevas ([backlog](../04-gestion/backlog.md), [control de cambios](../04-gestion/control-cambios.md)). El Sprint 5 quedó con 29 SP; en su planificación se decide si las notificaciones (S5-06) pasan al Sprint 6.
