# Sprint 4 — Documentos y actuaciones

**Release:** R2 · **Estado:** Desarrollo terminado con CI en verde; pendiente la prueba manual en la PC y la revisión del PR · **Inicio:** 15/10/2026
**Compromiso:** 11 SP de historias (S4-01: 5, S4-03: 3, S4-04: 3) + tareas técnicas S4-02 y S4-05

## 1. Objetivo

Que cada expediente pueda tener documentos adjuntos guardados de forma segura, actuaciones y observaciones con fecha y autor, y un historial que muestre todo lo ocurrido en orden. Con este sprint se completa el Release 2.

## 2. Antes de empezar: corrección del Sprint 3

Al revisar el estado inicial se encontró que la **CI del Sprint 3 estaba en rojo** ([run 38609784288](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38609784288)): el backend no compilaba y fallaban 4 pruebas del frontend, aunque las tarjetas figuraban como terminadas. Como la DoD exige CI en verde, se corrigió primero en la rama `feature/S3-correcciones` (defectos D-04 a D-08, ver [resultados de pruebas](../../05-calidad-pruebas/resultados-pruebas.md)). Uno de ellos era de seguridad: se podía modificar un expediente de otra dependencia (D-06). El Sprint 4 parte de esa corrección.

## 3. Tareas y criterios de aceptación

| ID | Tarea | SP | Criterios de aceptación | Resultado |
|---|---|---|---|---|
| S4-01 | Registrar documento en un expediente | 5 | PDF, PNG, JPG, DOCX y XLSX hasta 10 MB; otro tipo → 400; más grande → 413; queda en auditoría | ✅ |
| S4-02 | Almacenamiento seguro de archivos | — | Fuera de la carpeta pública y de Git, nombre aleatorio, hash SHA-256 | ✅ Nombre UUID en `storage/documentos`, hash verificado al descargar |
| S4-03 | Registrar actuaciones y observaciones | 3 | Fecha y autor automáticos; no se editan ni borran | ✅ También bloqueado en la base (triggers) |
| S4-04 | Consultar historial del expediente | 3 | Línea de tiempo ordenada con creación, cambios de estado, documentos y actuaciones | ✅ |
| S4-05 | Control de acceso a documentos (R06) | — | Adjuntar y descargar solo con permiso y en expedientes visibles para el usuario; prueba de acceso no autorizado | ✅ 403 entre dependencias, 404 con id de otro expediente |

Reglas adicionales: un expediente **archivado** no admite documentos ni actuaciones nuevas (409), pero sus documentos se pueden consultar y descargar.

## 4. Decisiones

- **Subida sin multer** ([ADR-12](../../02-arquitectura/decisiones-tecnicas.md#adr-12--subida-de-documentos-sin-multer)), aprobada por el PO: el archivo va como cuerpo de la petición; tipo verificado por extensión, tipo declarado y firma del contenido.
- **Historial desde tablas de solo inserción:** `documentos`, `actuaciones` y `cambios_estado` rechazan `UPDATE`, `DELETE` y `TRUNCATE` (mismo criterio que la auditoría, ADR-07).
- **Errores según el contrato de la API:** 400 validación, 403 sin permiso o de otra dependencia, 404 inexistente, 409 transición no permitida o expediente archivado, 413 archivo demasiado grande.

## 5. Archivos principales

| Capa | Archivos |
|---|---|
| Persistencia | `backend/prisma/schema.prisma`, migración `20261015120000_documentos_actuaciones`, `src/database/repositories.ts`, `src/database/prisma/repos.ts` |
| Integraciones | `src/integrations/almacenamiento/almacenamiento.ts` (local y en memoria) |
| Negocio | `src/modules/documentos/documentos.service.ts`, `src/modules/actuaciones/actuaciones.service.ts`, `src/modules/historial/historial.service.ts`, `src/modules/expedientes/expedientes.service.ts` (registro de cambios de estado) |
| API | `src/api/routes/anexos.routes.ts`, `src/api/schemas/anexos.schemas.ts`, `src/api/routes/index.ts`, `src/config/env.ts` (`STORAGE_PATH`, `MAX_UPLOAD_MB`) |
| Frontend | `src/components/expediente/AnexosExpediente.tsx`, `src/services/anexos.ts`, `src/services/api.ts`, `src/pages/ExpedienteDetallePage.tsx` |
| Pruebas | Backend `tests/integration/anexos.test.ts` (23 casos) · Frontend `tests/anexos.test.tsx` (6 casos) |
| CI | `.github/workflows/ci.yml` (verificación de solo inserción en 4 tablas), `scripts/ci/resumen-pruebas.mjs` (pruebas fallidas como anotaciones) |

## 6. Riesgos y dependencias

| Riesgo | Respuesta |
|---|---|
| El entorno de la IA no puede instalar paquetes ni ejecutar Vitest | Tipos y lint se verificaron en la VM de la PC con las dependencias reales; las pruebas, en GitHub Actions. Solo se registran resultados reales. |
| Subir archivos maliciosos o fuera de la carpeta (R06) | Lista blanca + firma del contenido, nombre UUID, sin rutas armadas con datos del usuario, `nosniff` al descargar. |
| Expedientes de demostración sin historial de estados previo | Su historial empieza en la creación; las transiciones se registran desde ahora. |
| Los PR #1 a #9 todavía no se integraron en `develop` | El PR del Sprint 4 se apila sobre la corrección del Sprint 3; se integran en orden. |

## 7. Resultado del sprint

| Métrica | Valor |
|---|---|
| SP terminados | 11 de 11 |
| Pruebas | Backend 99/99 · Frontend 26/26 ([run 38742104807](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38742104807)) |
| Cobertura backend | Líneas 92,14 % · sentencias 90,43 % · funciones 92,95 % · ramas 84,56 % (meta RNF-10: ≥ 70 %) |
| Defectos | D-04 a D-08 (Sprint 3, corregidos) · D-09 (paso de CI, corregido) |

### Cómo probarlo en la PC

```bash
git fetch origin
git checkout feature/S4-documentos-actuaciones
cd backend
npm install
npm run db:migrate     # crea documentos, actuaciones y cambios_estado
npm run dev
# otra terminal
cd frontend && npm install && npm run dev
```

Ingresar con `admin` / `12345`, abrir un expediente y: adjuntar un PDF, descargarlo, registrar una actuación y una observación, cambiar el estado y revisar el historial. Probar también subir un archivo `.exe` renombrado como `.pdf` (debe rechazarse).

### Pendiente para el cierre formal

- Prueba manual en la PC (sección anterior) y registro en [evidencias](../../07-evidencias/evidencias.md).
- Revisión e integración de los PR en orden.
- Retrospectiva: la principal lección es **no marcar tarjetas como hechas sin el enlace a una CI en verde** (riesgo R15 materializado en el Sprint 3).
