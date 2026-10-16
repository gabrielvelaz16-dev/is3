# Sprint 7 — Calidad y seguridad

**Release:** R4 · **Estado:** desarrollo terminado con CI en verde. Quedan pendientes:
- la prueba de usabilidad con personas;
- DT-05 (requiere la PC);
- la integración de los PR #1 a #15.

**Fecha:** 16/10/2026
**Compromiso:** 13 SP (S7-03: 8, S7-04: 5), más las tareas técnicas S7-01, S7-02, S7-05 y S7-06, que no llevan SP.

## 1. Objetivo

Que el sistema se pueda auditar y recuperar, y demostrar con pruebas automáticas que ningún rol accede a lo que no le corresponde.

## 2. Tareas y criterios de aceptación

| ID | Tarea | SP | Criterios de aceptación | Resultado |
|---|---|---|---|---|
| S7-03 | Consultar la auditoría; revisar errores y logs | 8 | Pantalla de auditoría con filtros por fecha, usuario, acción y resultado, con paginación. Solo con `auditoria.consultar`. Los errores no muestran trazas ni credenciales | ✅ Sin rutas para modificar o borrar (404). La respuesta no incluye contraseñas ni hashes (PR-21). Los errores 500 siguen siendo genéricos (PR-25, `errors.test.ts`) |
| S7-04 | Copia de seguridad y restauración | 5 | El respaldo incluye datos, documentos y manifiesto con hashes. Si el respaldo fue alterado, no se restaura. Después de restaurar se verifican filas y documentos. Se ejecuta en la CI | ✅ La CI respalda, restaura en otra base y compara las 15 tablas y un documento real. También rechaza restaurar sobre una base con datos y un respaldo alterado (ADR-13) |
| S7-01 / S7-02 | Pruebas de permisos y seguridad | — | Cada ruta se prueba con cada rol. Una ruta nueva sin probar hace fallar la CI | ✅ Matriz con las 40 rutas × 5 roles + sin sesión (`permisos.test.ts`, 75 casos) |
| S7-05 | Rendimiento y usabilidad | — | p95 menor a 1 s con 1000 expedientes. Guía de usabilidad con 5 tareas | ✅ Rendimiento: el peor p95 fue 34 ms. ⏳ La usabilidad necesita 3 personas: [guía](../../05-calidad-pruebas/guia-usabilidad.md) |
| S7-06 | Corrección de defectos | — | Sin defectos abiertos; DT-05 | ✅ No aparecieron defectos. ⏳ DT-05 necesita `npm install` en la PC (ver §6) |

## 3. Decisiones

- **ADR-13:** el respaldo se genera desde la pantalla o por consola. La restauración se hace solo por consola, con el backend detenido y sobre una base vacía. Lo aprobó el PO.
- **Sin `pg_dump`:** el respaldo se arma con Prisma y funciona igual en Windows (PostgreSQL en Docker) y en la CI. Los ids se conservan.
- **Documentos con problemas al respaldar:** si un documento registrado en la base no tiene su archivo, el respaldo no falla. Lo deja anotado en el manifiesto (`documentosConProblemas`) y lo avisa por pantalla y por consola.
- **Matriz de permisos autoverificada:** la prueba cuenta las rutas que tiene registradas Express y las compara con la matriz. Así no puede quedar una ruta nueva sin probar.

## 4. Archivos principales

| Capa | Archivos |
|---|---|
| Persistencia | `src/database/repositories.ts` (`AuditoriaRepo.list`, `RespaldoRepo`, `TABLAS_RESPALDO`), `src/database/prisma/respaldo-repo.ts`, `src/database/prisma/repos.ts` |
| Negocio | `src/modules/respaldo/respaldo.service.ts`, `src/modules/auditoria/auditoria.service.ts`, `src/integrations/almacenamiento/almacenamiento.ts` (`escribir`) |
| API y consola | `src/api/routes/administracion.routes.ts`, `src/api/schemas/administracion.schemas.ts`, `src/cli/respaldo.ts`, scripts `respaldo:*` en `package.json`, `BACKUP_PATH` |
| Frontend | `src/pages/AuditoriaPage.tsx`, `src/components/RespaldosPanel.tsx`, `src/services/administracion.ts`, sección *Auditoría* en el menú |
| Verificación | `prisma/medir-rendimiento.ts`; pasos de CI "Respaldo y restauración en una base nueva" y "Medir rendimiento" |
| Pruebas | Backend `tests/unit/respaldo.service.test.ts` (8), `tests/integration/administracion.test.ts` (8), `tests/integration/permisos.test.ts` (75) · Frontend `tests/administracion.test.tsx` (6) |

## 5. Resultado del sprint

| Métrica | Valor |
|---|---|
| SP terminados | 13 de 13 |
| Velocidad promedio (últimos 3 sprints) | (21 + 21 + 13) / 3 = 18,3 SP. No quedan SP: el Sprint 8 tiene solo tareas técnicas |
| Pruebas | Backend 221/221 · Frontend 51/51 ([run 38909943384](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38909943384)) |
| Cobertura backend | Líneas 94 % · sentencias 92,33 % · funciones 95,57 % · ramas 87,23 % |
| Restauración verificada en la CI | 99 filas y 1 documento; 15 tablas iguales al origen |
| Rendimiento (p95, 1000 expedientes) | Listado 12 ms · búsqueda 14 ms · dashboard 13 ms · reporte 11 ms · exportar CSV 34 ms |
| Ejecuciones de CI del sprint (hasta el código) | 3, todas en verde (0 fallos) |
| Defectos | Ninguno nuevo |

**Limitación del rendimiento:** se mide en la máquina de GitHub Actions, con la API y la base en la misma máquina y sin red de por medio. Sirve para detectar consultas lentas, no para asegurar los tiempos de un servidor institucional.

### 6. Pasos para la PC (prueba manual y DT-05)

```powershell
cd "$HOME\Documents\IS3"
git fetch origin
git checkout feature/S7-calidad-seguridad
cd backend
npm install
npm run db:migrate
npm run dev
```

Recorrido sugerido:
1. Entrá como `auditor` y abrí *Auditoría*. Filtrá por resultado *Fallo* para ver los intentos de inicio de sesión fallidos.
2. Entrá como `admin`, abrí *Administración → Copias de seguridad* y tocá *Crear respaldo ahora*.
3. Restaurá ese respaldo en una base vacía siguiendo la [guía de instalación §7](../../06-configuracion-devops/instalacion-ejecucion.md#7-copia-de-seguridad-y-restauración-sprint-7-adr-13).
4. **DT-05** (actualizar Prisma, en `backend`). Primero verificá que existan las tres versiones (ADR-01: no se instala una versión sin comprobarla):
   ```powershell
   npm view prisma@7.10.1 version
   npm view @prisma/client@7.10.1 version
   npm view @prisma/adapter-pg@7.10.1 version
   ```
   Si las tres responden `7.10.1`:
   ```powershell
   npm install --save-exact prisma@7.10.1 @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1
   npm test
   git add package.json package-lock.json
   git commit -m "S7-06: Prisma 7.10.1 (DT-05)"
   git push
   ```
   Si alguna versión no existe, avisá y se registra la decisión en DT-05.
5. Prueba de usabilidad con 3 personas, según la [guía](../../05-calidad-pruebas/guia-usabilidad.md).
