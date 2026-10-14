# Planificación y estructuración

**Estado:** Completo (TP Unidad 3) + vínculo con el prototipo · **Unidad:** 3 · **Fuente:** Trabajo Práctico Nro 6 — sección EDT/WBS

## 1. EDT / WBS

```
1. Sistema de Expediente Electrónico
├── 1.1 Infraestructura
│   ├── 1.1.1 Preparación de servidores
│   └── 1.1.2 Configuración de ambientes
├── 1.2 Gobernanza
│   ├── 1.2.1 Definición de roles
│   └── 1.2.2 Gestión y aprobación
├── 1.3 Capacitación
│   ├── 1.3.1 Materiales de capacitación
│   └── 1.3.2 Capacitación a usuarios
├── 1.4 Migración
│   ├── 1.4.1 Preparación de datos
│   └── 1.4.2 Migración y validación
├── 1.5 Seguridad
│   ├── 1.5.1 Control de acceso
│   └── 1.5.2 Validaciones de seguridad
└── 1.6 Despliegue
    ├── 1.6.1 Piloto
    └── 1.6.2 Despliegue por dependencias
```

> **Agregado en la Fase 0:** la EDT del TP no tenía un paquete explícito para la construcción del software. Se agrega **1.7 Desarrollo/configuración del sistema** (que el cronograma maestro ya contemplaba como fase), cuyo detalle no se descompone en la EDT sino en el **Product Backlog** (parte adaptativa). Ver CR-00 en [control-cambios.md](control-cambios.md).

```
└── 1.7 Desarrollo/configuración del sistema   → Product Backlog (épicas E1–E8)
```

## 2. Paquetes de trabajo

Un paquete de trabajo es la unidad mínima de gestión de la EDT: permite asignar responsable, estimar esfuerzo y verificar el resultado.

| Paquete | Responsable | Resultado | En el prototipo |
|---|---|---|---|
| Preparación de servidores | Infraestructura | Servidores disponibles | Simulado: equipo local (F0-05) |
| Configuración de ambientes | Infraestructura | Ambientes configurados | Docker Compose + `.env` (F0-07) |
| Definición de roles | Gerente de proyecto | Roles aprobados | Roles del sistema (S2-03) y RACI |
| Materiales de capacitación | Capacitación | Material disponible | Manual de usuario breve (S8-03) |
| Preparación de datos | Equipo de migración | Datos preparados | Datos ficticios (S2-06, S8-02) |
| Control de acceso | Seguridad | Accesos configurados | Autenticación y autorización (S2-02, S2-03) |
| Piloto | Equipo del proyecto | Piloto funcionando | Demostración con datos ficticios |
| Despliegue por dependencias | Equipo técnico | Sistema desplegado | Release `v1.0.0` instalable (S8-04) |
| Desarrollo/configuración *(nuevo)* | Product Owner + Equipo | Incrementos funcionales | Sprints 1 a 8 |

## 3. Actividades, tareas y dependencias

Ejemplo de descomposición (Migración): actividades *ejecutar migración, revisar datos migrados, validar resultados*; tareas *preparar respaldo, ejecutar proceso, comparar registros, registrar errores, corregir inconsistencias*.

| Actividad | Depende de | Tipo |
|---|---|---|
| Configurar ambientes | Preparar servidores | Fin → Inicio |
| Migrar datos | Preparar datos | Fin → Inicio |
| Ejecutar piloto | Ambiente configurado | Fin → Inicio |
| Despliegue | Resultado del piloto | Fin → Inicio |
| Capacitación | Materiales preparados | Fin → Inicio |

**Dependencias del prototipo:**

| Trabajo | Depende de | Tipo |
|---|---|---|
| Sprint 1 (estructura) | Fase 0: entorno y repositorio (F0-05, F0-06, F0-07) | Fin → Inicio |
| Autenticación (S2-02) | Modelo de datos (S2-01) | Fin → Inicio |
| Todo módulo protegido | Autorización (S2-03) | Fin → Inicio |
| Documentos y actuaciones (S4) | Expedientes (S3) | Fin → Inicio |
| Pases y estados (S5) | Expedientes (S3) | Fin → Inicio |
| Reportes (S6) | Datos de S3 a S5 | Fin → Inicio |
| Backup/restore (S7-04) | Modelo estable + almacenamiento de documentos (S4-02) | Fin → Inicio |

## 4. Roadmap

| Etapa | Resultado principal |
|---|---|
| Etapa 1 | Preparación y planificación |
| Etapa 2 | Infraestructura y seguridad |
| Etapa 3 | Desarrollo y configuración |
| Etapa 4 | Migración y piloto |
| Etapa 5 | Capacitación |
| Etapa 6 | Despliegue gradual |

El roadmap muestra la evolución general; el *release planning* organiza las entregas y el *sprint planning* selecciona el trabajo de cada ciclo.

## 5. Releases y sprints del prototipo

El TP planificó 4 releases. Las instrucciones del prototipo definen una Fase 0 y 8 sprints. La correspondencia acordada (tarjeta F0-02) es:

| Release | Contenido | Sprints | Hito |
|---|---|---|---|
| R1 — Base del sistema | Estructura, base de datos, usuarios, roles, autenticación | Fase 0, S1, S2 | H3 |
| R2 — Funciones principales | Expedientes, documentos, actuaciones, historial | S3, S4 | H4 |
| R3 — Flujo documental y control | Responsables, tareas, estados, pases, notificaciones, dashboard y reportes | S5, S6 | H6 |
| R4 — Calidad y entrega | Pruebas, seguridad, backup, regresión, versión estable | S7, S8 | H8 |

> El TP agrupaba "Enviar/recibir expediente" en el Release 2 y "Gestionar usuarios/permisos" en el Release 3. En el prototipo usuarios y permisos se adelantan a R1 porque son prerequisito técnico de todo lo demás, y los pases pasan a R3 porque dependen de expedientes ya construidos. El cambio queda registrado en CR-00.

## 6. Épicas

| Épica | Nombre | Sprints |
|---|---|---|
| E1 | Plataforma base | S1 |
| E2 | Gestión de acceso | S2 |
| E3 | Gestión de expedientes | S3 |
| E4 | Documentos y actuaciones | S4 |
| E5 | Flujo documental y seguimiento | S5 |
| E6 | Reportes y monitoreo | S6 |
| E7 | Calidad, seguridad y respaldo | S7 |
| E8 | Entrega | S8 |

El detalle de historias está en el [backlog](backlog.md) y la relación con requisitos y pruebas en la [matriz de trazabilidad](trazabilidad.md).
