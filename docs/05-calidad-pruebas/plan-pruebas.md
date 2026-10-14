# Plan de pruebas

**Estado:** Plan inicial (Fase 0) · **Unidad:** 7

## 1. Niveles y tipos de prueba

| Tipo | Objetivo | Herramienta | Cuándo | Automatizada |
|---|---|---|---|---|
| Unitarias | Reglas de negocio aisladas (numeración, máquina de estados, permisos) | Vitest | Cada commit | Sí |
| Integración (API) | Rutas + validación + base de datos | Vitest + Supertest + PostgreSQL de prueba | Cada commit | Sí |
| Componentes frontend | Formularios y validaciones de la UI | Vitest + Testing Library | Desde Sprint 3 | Sí |
| Seguridad | Acceso no autorizado, inmutabilidad de auditoría, errores sin datos internos, dependencias vulnerables | Supertest, `npm audit` | Cada sprint (CI) y Sprint 7 | Sí |
| Rendimiento | Tiempo de respuesta del listado con 1.000 expedientes | Script de carga simple / medición con Supertest | Sprint 7 | Parcial |
| Recuperación | Backup y restauración completos | Script + verificación de conteos | Sprint 7 | Parcial |
| Usabilidad | Tareas básicas sin ayuda | Prueba moderada con 3 usuarios | Sprint 7 | No |
| Aceptación | Criterios de cada historia | Checklist de Trello en la sprint review | Cada sprint | No |
| Regresión | Todo lo anterior | Suite completa en CI | Sprint 8 y antes de cada release | Sí |

## 2. Ambiente de pruebas

- Base de datos PostgreSQL separada para pruebas (`DATABASE_URL_TEST`), recreada con migraciones antes de la suite.
- Datos ficticios generados por *seed*; nunca datos reales.
- En CI: servicio PostgreSQL de GitHub Actions.

## 3. Casos de prueba por requisito

| ID | Requisito | Caso principal | Casos negativos | Tipo | Sprint |
|---|---|---|---|---|---|
| PR-01 | RF-01, RNF-01 | Login correcto devuelve sesión; logout la invalida | Contraseña incorrecta → 401; contraseña no aparece en BD ni logs | Integración | S2 |
| PR-02 | RF-02, RNF-02 | Usuario con permiso accede | Usuario sin permiso → 403 en cada ruta protegida | Integración / seguridad | S2 |
| PR-03 | RF-03 | Admin crea, edita y desactiva usuario | No admin → 403; email duplicado → 409 | Integración | S2 |
| PR-04 | RF-04 | Alta de expediente válido | Campos obligatorios vacíos → 400 | Integración | S3 |
| PR-05 | RF-05 | Número con formato `EXP-AAAA-NNNNNN` | Altas concurrentes no duplican número | Unitaria / integración | S3 |
| PR-06 | RF-06 | Consulta y modificación con permiso | Expediente de otra dependencia sin permiso → 403; inexistente → 404 | Integración | S3 |
| PR-07 | RF-07 | Filtros y paginación devuelven total correcto | Página fuera de rango → lista vacía | Integración | S3 |
| PR-08 | RF-08, RNF-04 | Carga de PDF válido guarda hash | Tipo no permitido o tamaño excedido → 400 | Integración | S4 |
| PR-09 | RF-09 | Descarga autorizada | Descarga sin permiso → 403 | Seguridad | S4 |
| PR-10 | RF-10 | Actuación con fecha y autor automáticos | Texto vacío → 400 | Integración | S4 |
| PR-11 | RF-11 | Historial ordenado con todos los eventos | — | Integración | S4 |
| PR-12 | RF-12 | Asignar responsable | Usuario inactivo → 400 | Integración | S5 |
| PR-13 | RF-13 | Crear tarea con vencimiento | Sin vencimiento → 400 | Integración | S5 |
| PR-14 | RF-14 | Cada transición válida | Cada transición inválida → 409 | Unitaria | S5 |
| PR-15 | RF-15 | Pase registrado en historial | Origen = destino → 400 | Integración | S5 |
| PR-16 | RF-16 | Recepción cambia la dependencia actual | Recibir un pase ajeno → 403 | Integración | S5 |
| PR-17 | RF-17 | Alerta para tarea por vencer | — | Unitaria | S5 |
| PR-18 | RF-18, RNF-08 | Indicadores = consultas directas a la BD | — | Integración | S6 |
| PR-19 | RF-19 | Reporte filtrado y CSV con columnas correctas | — | Integración | S6 |
| PR-20 | RF-20, RNF-03 | Operaciones importantes generan registro | Intento de modificar o borrar auditoría falla | Seguridad | S2 / S7 |
| PR-21 | RF-21 | Admin filtra auditoría | No admin → 403 | Integración | S7 |
| PR-22 | RF-22, RNF-07 | Backup + restore conserva conteos y documentos | Restore con archivo corrupto informa error | Recuperación | S7 |
| PR-23 | RF-23 | Login funciona a través del adaptador | Adaptador no disponible → error controlado | Unitaria | S2 |
| PR-24 | RNF-12 | Instalación desde cero siguiendo el README + suite completa | — | Regresión | S8 |
| PR-25 | RNF-05 | Error interno devuelve mensaje genérico | Respuesta no contiene trazas ni SQL | Seguridad | S1 / S7 |
| PR-26 | RNF-09 | Listado con 1.000 expedientes p95 < 1 s | — | Rendimiento | S7 |
| PR-27 | RNF-11 | 5 tareas básicas con 3 usuarios | — | Usabilidad | S7 |

## 4. Pruebas de aceptación por dependencia (simulada)

Para el piloto se definen tres dependencias ficticias (Mesa de Entradas, Asesoría Jurídica, Recursos Humanos). El escenario de aceptación recorre un expediente completo: alta en Mesa de Entradas → pase a Asesoría Jurídica → recepción → actuación y documento → revisión → resolución → archivo, verificando historial y auditoría en cada paso.

## 5. Criterios de entrada y salida

- **Entrada a pruebas de un release:** historias en *En revisión / pruebas* con DoD de desarrollo cumplida.
- **Salida:** criterios de la puerta G3 del [plan de calidad](plan-calidad.md#5-puertas-de-calidad).
- **Suspensión:** si el ambiente de pruebas no levanta o falla el 30 % de la suite por una causa común, se detiene y se corrige primero.
