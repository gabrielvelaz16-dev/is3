# Avance del proyecto IS3 — Expediente Electrónico

**Fecha de corte:** 19/10/2026 · **Responsable:** Carlos Gabriel Velázquez Franco
**Repositorio:** [gabrielvelaz16-dev/is3](https://github.com/gabrielvelaz16-dev/is3) · **Tablero:** [Trello — IS3 – Expediente Electrónico](https://trello.com/b/gST86mLw/)
**TP:** Ingeniería de Software III (LCIK, FPUNA) — TP 6, enfoque híbrido.

Este documento reúne en un solo lugar dónde está el proyecto. El detalle de cada parte está en los documentos enlazados.

---

## 1. Resumen

| Etapa | Estado | CI | PR |
|---|---|---|---|
| Fase 0 — Preparación | Cerrada (puerta G1, 14/10) | — | #1 a #4 |
| Sprint 1 — Estructura inicial | Terminado | Verde | #5 a #8 |
| Sprint 2 — Base de datos y usuarios | Terminado (adelantado por CR-02) | Verde (50 + 20) | #7, #8 |
| Sprint 3 — Expedientes | Terminado después de corregir D-04 a D-08 | Verde (76 + 20) | #9 + #10 |
| Sprint 4 — Documentos y actuaciones | Terminado | Verde (99 + 26) | #11 |
| Sprint 5 — Tareas y seguimiento | Terminado | Verde (115 + 34) | #12 |
| TP Unidades 8 y 9 | Entregable en Word y Markdown | Verde | #13 |
| Sprint 6 — Dashboard, reportes y notificaciones | Terminado | Verde (130 + 45) | #14 |
| Sprint 7 — Calidad y seguridad | Terminado | Verde (221 + 51) | #15 |
| CR-05 — Mejora de la interfaz | Terminado | Verde (51 frontend; 16 capturas) | #16 |
| Sprint 8 — Entrega | En curso | Verde (225 + 51) | #17 |
| CR-06 — Contraseña visible, eliminar usuarios, navegación | Terminado | Verde (run 39284967003) | — (en `feature/S8-entrega`) |
| CR-07 — Adjuntar texto e imágenes GIF y WEBP (+ D-13) | Terminado | Verde (233 + 60, run 39285882711) | — (en `feature/S8-entrega`) |
| CR-08 — Desactivar, reactivar y eliminar expedientes | Terminado | Verde (251 + 66, run 39296628029) | — (en `feature/S8-entrega`) |

- **Alcance:** 97 de 97 SP desarrollados. 23 requisitos funcionales y 13 no funcionales.
- **Calidad:** 317 pruebas automáticas aprobadas (251 backend + 66 frontend); cobertura del backend 94,45 % (medida en local el 19/10, después del CR-08). CI en verde sobre esos commits: run 39296628029.
- **Defectos:** 13 encontrados y corregidos (D-01 a D-13); ninguno abierto.
- **CI:** 50 ejecuciones al 19/10 (35 en verde, 12 en rojo, 3 canceladas). Las últimas 23 seguidas en verde. El flujo de capturas falló dos veces por el CR-06 y volvió a verde con `56a3d10`.
- **Integración:** los 17 PR están abiertos y apilados; **ninguno integrado**. No hay etiquetas creadas.

## 2. Qué hace el sistema

Registro de expedientes con número único (`EXP-AAAA-NNNNNN`), búsqueda, filtros y paginación · documentos validados por contenido con SHA-256 · actuaciones e historial de solo inserción · responsables, tareas con vencimiento y estados con transiciones válidas · pases entre dependencias (en tránsito → recepción) · notificaciones internas · dashboard, reportes con filtros y exportación CSV · usuarios, roles y permisos verificados en el servidor · auditoría consultable e inalterable · copia de seguridad desde la pantalla y restauración por consola.

**Stack:** React 19 + Vite 8 + TypeScript 6 + Tailwind 4 · Express 5 + Zod 4 · Prisma 7.10 + PostgreSQL 18 (Docker) · Vitest + Supertest · GitHub Actions.

**Usuarios de prueba** (contraseña `12345`): `admin`, `mesa` (Mesa de Entradas), `jefe` y `funcionario` (Asesoría Jurídica), `auditor`.

## 3. Detalle por sprint

- **Fase 0:** alcance y requisitos, arquitectura, backlog unificado (CR-00: 80 → 97 SP), entorno con Docker, Trello con 63 tarjetas iniciales. Acta G1.
- **Sprint 1:** backend y frontend base, `/api/health`, navegación, CI.
- **Sprint 2:** modelo de datos, login por usuario y sesiones en el servidor, roles y permisos, auditoría base, usuarios de prueba (ADR-05, ADR-10, ADR-11).
- **Sprint 3:** expedientes (crear, consultar, modificar, listar), número único, validaciones con Zod. La primera CI falló; se corrigieron D-04 a D-08, incluido D-06 de seguridad. Lección: nada pasa a *Hecho* sin CI en verde.
- **Sprint 4:** documentos sin multer (ADR-12), actuaciones y observaciones, historial.
- **Sprint 5:** responsables, tareas, máquina de estados, pases entre dependencias, página *Tareas y pendientes*. CR-03 movió notificaciones al Sprint 6.
- **Sprint 6:** notificaciones, dashboard, reportes, exportación CSV y verificación de indicadores contra SQL en la CI (97 comparaciones). CR-04 (recorte decidido de antemano, no aplicado). D-10 y D-11.
- **Sprint 7:** consulta de auditoría, respaldo y restauración (ADR-13) verificados en la CI, matriz de permisos de 40 rutas × 5 roles, medición de rendimiento (p95 ≤ 34 ms con 1000 expedientes), guía de usabilidad.
- **CR-05 (interfaz):** menú lateral agrupado, carátula tipo carpeta con pestañas, componentes `ui/`, avisos flotantes, Public Sans. Capturas antes/después generadas con Playwright en la CI (rama `capturas`).
- **Sprint 8 (en curso):**
  - S8-01 regresión completa en la CI ✅
  - S8-02 datos de demostración por la API (`npm run demo:cargar`, 16 expedientes en los 5 estados, no duplica) ✅
  - D-12 estados legibles en historial y errores ✅
  - CR-06 contraseña visible, eliminar usuarios sin actividad y navegación ✅
  - CR-07 adjuntar texto (.txt) e imágenes GIF y WEBP ✅ · D-13 mensaje de expediente en tránsito ✅
  - CR-08 desactivar, reactivar y eliminar expedientes; sección *Expedientes desactivados* ✅
  - S8-03 README, manual de usuario, `sprint-03.md`, `sprint-08.md` ✅
  - S8-04 CHANGELOG y versión 1.0.0 en los `package.json` ✅ — falta la etiqueta `v1.0.0`
  - S8-05 evidencias y capturas finales ✅ — falta la presentación de la defensa
  - S8-06 informe final en Word (17 páginas) ✅ borrador — falta tu revisión
  - [Guía de prueba manual](05-calidad-pruebas/guia-prueba-manual.md) ✅ — falta ejecutarla en la PC

## 4. Velocidad

| Sprint | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
| SP terminados | 3 | 12 | 16 | 11 | 21 | 21 | 13 | Tareas técnicas |
| Promedio últimos 3 | 3,0 | 7,5 | 10,3 | 13,0 | 16,0 | 17,7 | 18,3 | — |

## 5. Gestión

- **Solicitudes de cambio:** CR-00 (backlog 97 SP), CR-01 (evento de cambio, analizado pero **no implementado**), CR-02 (login antes), CR-03 (notificaciones al S6), CR-04 (orden de recorte), CR-05 (interfaz), CR-06 (contraseña, eliminar usuarios, navegación), CR-07 (más tipos de documentos), CR-08 (bajas de expedientes). → [control-cambios.md](04-gestion/control-cambios.md)
- **Riesgos:** 19 (12 amenazas + 3 oportunidades institucionales, 4 operativas). R15 (errores de IA) se materializó dos veces y se controló con CI y revisión. → [riesgos.md](04-gestion/riesgos.md)
- **Decisiones técnicas:** ADR-01 a ADR-13. → [decisiones-tecnicas.md](02-arquitectura/decisiones-tecnicas.md)
- **Métricas y decisiones:** [monitoreo-metricas.md](04-gestion/monitoreo-metricas.md). Alertas abiertas: PR sin integrar (0 de 17), 25 tarjetas en *En revisión*, costo sin horas registradas, adopción sin medir.
- **Bitácora de IA:** 19 entradas. → [bitacora-ia.md](bitacora-ia/bitacora-ia.md)
- **Trello:** 69 tarjetas — 29 en *Hecho*, 26 en *En revisión / pruebas*, 12 en *Control formal*, 2 en *Backlog*.

## 6. Entregables del TP

| Entregable | Archivo | Estado |
|---|---|---|
| TP Unidades 8 y 9 | [TP_Unidades_8_y_9_Expediente_Electronico.docx](08-trabajos-practicos/TP_Unidades_8_y_9_Expediente_Electronico.docx) | Entregable (15/10) |
| Informe final (máx. 28 páginas) | [Informe_Final_TP6_Expediente_Electronico.docx](08-trabajos-practicos/Informe_Final_TP6_Expediente_Electronico.docx) | Borrador de 17 páginas (19/10) |
| Tablero integrado | [monitoreo-metricas.md](04-gestion/monitoreo-metricas.md) y sección 9 del informe | Medido al 15, 16 y 19/10 |
| Evidencias | [evidencias.md](07-evidencias/evidencias.md) | Al día |
| Defensa de 15 minutos | — | Pendiente |

## 7. Pendientes

**Tuyos (la IA no los puede hacer):**
1. Integrar los PR #1 a #17 en GitHub, en orden. Del #9 en adelante, primero cambiar la base a `develop`. Atajo posible: cambiar la base del #17 a `develop` e integrarlo solo (trae todos los commits).
2. Probar el sistema en la PC con la rama `feature/S8-entrega` siguiendo la [guía de prueba manual](05-calidad-pruebas/guia-prueba-manual.md) (unos 40 minutos).
3. Prueba de usabilidad con 3 personas ([guia-usabilidad.md](05-calidad-pruebas/guia-usabilidad.md)).
4. DT-05: actualizar Prisma a 7.10.1 en la PC después de verificar con `npm view`.
5. Revisar el informe final.
6. Decidir si el repositorio sigue público (R16: hay PDF con datos personales).

**Siguientes con la IA:**
1. Implementar la regla de CR-01 (no pasar a *En revisión* sin un documento verificado) y actualizar el informe.
2. Preparar la presentación de la defensa (15 minutos).
3. Después de la integración: etiquetas `baseline-v1`, `v0.1.0`, `v0.2.0`, `v1.0.0` y release en GitHub.

## 8. Cómo ejecutarlo en la PC

```powershell
cd "$HOME\Documents"
git clone https://github.com/gabrielvelaz16-dev/is3.git is3-nuevo   # si todavía no está
cd is3-nuevo
git fetch origin
git checkout feature/S8-entrega
Copy-Item .env.example .env        # completar POSTGRES_PASSWORD y la misma clave en DATABASE_URL
docker compose --env-file .env -f infra/docker/docker-compose.yml up -d

cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev                        # http://localhost:3000
# en otra terminal, con el backend levantado:
npm run demo:cargar

cd ..\frontend
npm install
npm run dev                        # http://localhost:5173
```

Si aparece "No existe la ruta …", hay un backend viejo ocupando el puerto 3000: cerrarlo y levantar el de esta rama. La copia vieja en `Documents\IS3` está en la rama local `s3` (Sprint 3) con 45 archivos sin guardar; no se tocó.
