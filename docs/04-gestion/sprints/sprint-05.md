# Sprint 5 — Tareas y seguimiento

**Release:** R3 · **Estado:** Desarrollo terminado con CI en verde; pendiente la prueba manual en la PC y la revisión del PR · **Inicio:** 15/10/2026
**Compromiso:** 21 SP (S5-01: 3, S5-02: 5, S5-03: 3, S5-04: 5, S5-05: 5). S5-06 (8 SP) pasó al Sprint 6 por [CR-03](../control-cambios.md#cr-03--mover-las-notificaciones-internas-al-sprint-6).

## 1. Objetivo

Que un expediente pueda moverse entre dependencias (enviar y recibir), tener responsable y tareas con vencimiento, y que cada usuario vea en un solo lugar lo que tiene que atender. Es la parte central del caso: el trabajo por dependencias.

## 2. Tareas y criterios de aceptación

| ID | Tarea | SP | Criterios de aceptación | Resultado |
|---|---|---|---|---|
| S5-01 | Asignar responsables | 3 | Acción propia con `responsables.asignar`; responsable activo de la dependencia del expediente; queda en historial y auditoría | ✅ También se puede quitar el responsable |
| S5-02 | Registrar tareas y vencimientos | 5 | Vencimiento obligatorio y no pasado; responsable de la dependencia; estados pendiente → en curso → completada/cancelada | ✅ Una tarea cerrada no cambia más (409) |
| S5-03 | Cambiar estado con transiciones válidas | 3 | Acción propia con `estados.cambiar` y motivo opcional; transiciones inválidas → 409 | ✅ El PATCH general ya no acepta estado ni responsable |
| S5-04 | Enviar expediente a otra dependencia | 5 | Solo desde la dependencia que lo tiene; destino activo y distinto; motivo obligatorio; mientras está en tránsito no se modifica | ✅ Un borrador pasa a "en trámite" al enviarse |
| S5-05 | Recibir expediente | 5 | Bandeja de la dependencia destino; solo ella confirma; al recibir cambia la dependencia | ✅ Se quita el responsable anterior; no se recibe dos veces |
| — | Pendientes y alertas (parte de RF-17) | — | Mis tareas con alerta de vencimiento, recibidos sin confirmar, expedientes por vencer | ✅ Página *Tareas y pendientes* |

## 3. Decisiones

- **"En tránsito" no es un estado:** se deriva de que exista un pase sin recibir. Así no se mezcla con la máquina de estados del trámite (borrador, en trámite, etc.).
- **La dependencia destino ve el expediente antes de recibirlo**, para decidir; recién al confirmar pasa a ser suyo.
- **Al recibir se quita el responsable**: era de la dependencia anterior; la nueva asigna el suyo.
- **Protección en la base:** un solo pase sin recibir por expediente (índice único parcial), la recepción se registra una sola vez (trigger), y recepción y cambio de dependencia van en una transacción.
- **Contrato de la API:** estado y responsable salen del PATCH general y tienen rutas con permisos propios (`estados.cambiar`, `responsables.asignar`), que ya existían en el catálogo de permisos desde el Sprint 2.

## 4. Archivos principales

| Capa | Archivos |
|---|---|
| Persistencia | `backend/prisma/schema.prisma`, migración `20261015150000_tareas_pases`, `src/database/repositories.ts`, `src/database/prisma/repos.ts` |
| Negocio | `src/modules/expedientes/expedientes.service.ts` (estado, responsable, regla de tránsito), `src/modules/pases/pases.service.ts`, `src/modules/tareas/tareas.service.ts`, `src/modules/pendientes/pendientes.service.ts`, `src/modules/historial/historial.service.ts` |
| API | `src/api/routes/anexos.routes.ts`, `src/api/routes/seguimiento.routes.ts`, `src/api/schemas/anexos.schemas.ts`, `src/api/schemas/expedientes.schemas.ts` |
| Frontend | `src/components/expediente/AccionesExpediente.tsx`, `src/components/expediente/AnexosExpediente.tsx` (tareas), `src/pages/PendientesPage.tsx`, `src/pages/ExpedienteDetallePage.tsx`, `src/services/seguimiento.ts` |
| Pruebas | Backend `tests/integration/seguimiento.test.ts` (16 casos) · Frontend `tests/seguimiento.test.tsx` (8 casos) |
| CI | Verificación de protección de `pases` y `asignaciones` |

## 5. Riesgos

| Riesgo | Respuesta |
|---|---|
| Sobrecarga del sprint (R13) | CR-03: S5-06 al Sprint 6 (29 → 21 SP). |
| Cambio en el contrato de la API (PATCH sin estado ni responsable) | Se ajustaron en el mismo sprint el frontend y las pruebas de los Sprints 3 y 4. |
| Dos envíos simultáneos del mismo expediente | Índice único parcial en la base; el servicio lo traduce a 409. |
| El Sprint 6 queda con 21 SP y la velocidad promedio es 16 SP | Registrado en el pronóstico; se revisa al planificar el Sprint 6. |

## 6. Resultado del sprint

| Métrica | Valor |
|---|---|
| SP terminados | 21 de 21 |
| Velocidad promedio (últimos 3 sprints) | 16 SP · pronóstico: 3 sprints para 34 SP restantes |
| Pruebas | Backend 115/115 · Frontend 34/34 ([run 38745648399](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38745648399)) |
| Cobertura backend | Líneas 93,46 % · sentencias 91,37 % · funciones 93,64 % · ramas 85,46 % |
| Defectos | Ninguno del sistema. La CI detectó dos pruebas mal escritas, corregidas. |

### Cómo probarlo en la PC

```bash
git fetch origin
git checkout feature/S5-tareas-seguimiento
cd backend
npm install
npm run db:migrate     # crea tareas, pases y asignaciones
npm run dev
# otra terminal
cd frontend && npm install && npm run dev
```

Recorrido sugerido (contraseña `12345` para todos):
1. `mesa`: crear un expediente y enviarlo a **Asesoría Jurídica** con un motivo. Ver el aviso "En tránsito" y que no se puede editar.
2. `jefe` (Asesoría Jurídica): en *Tareas y pendientes*, confirmar la recepción. Abrir el expediente, asignar a `funcionario` como responsable, cambiar el estado con un motivo y crear una tarea con vencimiento.
3. `funcionario`: en *Tareas y pendientes*, iniciar y completar la tarea.
4. Revisar el historial del expediente: creación, pase enviado y recibido, cambios de estado, responsable y tarea.

### Pendiente para el cierre formal

- Prueba manual en la PC y registro en [evidencias](../../07-evidencias/evidencias.md).
- Revisión e integración de los PR en orden.
