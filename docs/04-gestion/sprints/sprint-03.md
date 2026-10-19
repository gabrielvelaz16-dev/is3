# Sprint 3 — Expedientes

**Release:** R2 · **Estado:** terminado después de una corrección (la primera CI estuvo en rojo).
**Fechas:** 14/10/2026 (desarrollo) · 15/10/2026 (corrección)
**Compromiso:** 16 SP (S3-01: 5, S3-02: 3, S3-03: 3, S3-04: 5), más S3-05 y S3-06, que son tareas técnicas.

> Este documento se escribió en el Sprint 8 (S8-03) para completar la serie. Los datos salen del historial de Git, de las ejecuciones de la CI y de [resultados-pruebas.md](../../05-calidad-pruebas/resultados-pruebas.md); no se agregó nada que no esté registrado ahí.

## 1. Objetivo

Registrar, consultar, modificar y listar expedientes con número único, búsqueda, filtros y paginación, validando los datos en el frontend y en el backend.

## 2. Tareas y criterios de aceptación

| ID | Tarea | SP | Criterios de aceptación | Resultado |
|---|---|---|---|---|
| S3-01 | Crear expediente | 5 | Carátula, asunto, tipo, iniciador y prioridad obligatorios; queda en estado Borrador en la dependencia del usuario; se audita | ✅ |
| S3-02 | Consultar expediente | 3 | Solo se ve si es de la dependencia del usuario o si tiene permiso para ver todas; 404 si no existe | ✅ |
| S3-03 | Modificar expediente | 3 | No se modifica un expediente archivado (409) ni uno de otra dependencia (403) | ✅ después de corregir D-06 |
| S3-04 | Listado con búsqueda, filtros y paginación | 5 | Búsqueda por número, carátula, asunto o iniciador; filtros por estado y prioridad; páginas de 20 | ✅ después de corregir D-08 |
| S3-05 | Número único | — | Formato `EXP-AAAA-NNNNNN`, sin repetidos aunque se creen dos a la vez (tabla de secuencias por año) | ✅ |
| S3-06 | Validaciones con Zod | — | Las mismas reglas en el formulario y en la API; errores con el contrato de la API (400 y detalle por campo) | ✅ después de corregir D-07 |

## 3. Qué pasó

La primera CI del sprint ([run 38609784288](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38609784288)) falló: el backend no compilaba y fallaban 4 pruebas del frontend. Al revisar el código aparecieron además un problema de seguridad y errores que respondían 500. Se abrió la rama `feature/S3-correcciones` (PR #10):

| Defecto | Problema | Corrección |
|---|---|---|
| D-04 | El backend no compilaba (campos y tipos inexistentes, firma de auditoría equivocada) | Tipos correctos en los contratos |
| D-05 | 4 pruebas del frontend fallaban por datos de prueba incompletos | Permisos y respuestas simuladas completas |
| D-06 | **Seguridad:** se podía modificar un expediente de otra dependencia | Misma verificación de visibilidad que la consulta, con prueba de 403 |
| D-07 | Errores de negocio respondían 500 | Errores tipados: 400, 404 y 409 según el contrato |
| D-08 | Prueba de búsqueda por texto mal planteada | Prueba corregida |

**Lección (riesgo R15):** ninguna tarjeta pasa a *Hecho* sin una CI en verde. Desde el Sprint 4 se aplicó sin excepciones.

## 4. Resultado

| Métrica | Valor |
|---|---|
| SP terminados | 16 de 16 |
| Pruebas | Backend 76/76 · Frontend 20/20 ([run 38739999945](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38739999945)) |
| Cobertura backend | Líneas 93,92 % · ramas 86,57 % |
| Defectos | 5 encontrados y corregidos (D-04 a D-08), 1 de seguridad |
| PR | #9 (desarrollo) y #10 (correcciones) |
