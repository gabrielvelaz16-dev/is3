# Sprint 2 — Base de datos y usuarios

**Release:** R1 · **Estado:** En curso (adelantado por [CR-02](../control-cambios.md#cr-02--adelantar-login-y-gestión-de-usuarios)) · **Inicio:** 14/10/2026
**Compromiso:** 12 SP de historias (S2-02: 2, S2-03: 5, S2-05: 5) + tareas técnicas S2-01, S2-04, S2-06, S2-07

## 1. Objetivo

Que solo usuarios identificados puedan usar el sistema y que cada uno vea y haga solo lo que su rol permite. Un administrador inicial puede hacer todo, crear usuarios y asignarles rol y dependencia.

## 2. Tareas y criterios de aceptación

| ID | Tarea | SP | Criterios de aceptación | Estado |
|---|---|---|---|---|
| S2-01 | Modelo de datos y migraciones con Prisma | — | Esquema de dependencias, roles, permisos, usuarios, sesiones y auditoría; migración inicial aplicada | Migración `init` generada y aplicada en la PC (14/10/2026) |
| S2-02 | Iniciar y cerrar sesión | 2 | Login con nombre de usuario (o correo) y contraseña; logout invalida la sesión en el servidor; mensaje único para credenciales incorrectas | Código y pruebas escritos |
| S2-03 | Roles y autorización en el servidor | 5 | 5 roles con permisos; toda ruta protegida responde 401 sin sesión y 403 sin permiso | Código y pruebas escritos |
| S2-04 | Adaptador de identidad simulado (R01) | — | Interfaz `IdentityProvider` con implementación local; el login no depende de la implementación | Código escrito |
| S2-05 | Gestionar usuarios | 5 | Crear, listar, buscar, editar, cambiar rol y dependencia, desactivar, cambiar contraseña; siempre queda un administrador activo | Código y pruebas escritos |
| S2-06 | Usuarios ficticios de prueba (seed) | — | Seed idempotente con dependencias, permisos, roles, administrador `admin`/`12345` y un usuario de prueba por rol | Código escrito; falta ejecutar el seed en la PC |
| S2-07 | Auditoría base (solo inserción) | — | Se registran login, logout y cambios de usuarios; la base impide `UPDATE`/`DELETE` | Código escrito; migración `auditoria_solo_insercion` con triggers que rechazan `UPDATE`, `DELETE` y `TRUNCATE` |

## 3. Decisiones

- Sesión en el servidor con cookie `httpOnly` ([ADR-05](../../02-arquitectura/decisiones-tecnicas.md#adr-05--mecanismo-de-sesión)).
- Hash de contraseñas con scrypt ([ADR-10](../../02-arquitectura/decisiones-tecnicas.md#adr-10--hash-de-contraseñas-con-scrypt)).
- Servicios con repositorios como interfaces; pruebas sin base de datos ([ADR-11](../../02-arquitectura/decisiones-tecnicas.md#adr-11--repositorios-como-interfaces)).

## 4. Roles y permisos

| Rol | Permisos |
|---|---|
| Administrador | Todos (17) |
| Mesa de entradas | Crear, consultar, enviar y recibir expedientes; adjuntar y descargar documentos |
| Funcionario / Responsable | Consultar y modificar expedientes, enviar y recibir, documentos, actuaciones, cambiar estado, tareas |
| Jefe de dependencia | Lo del funcionario + asignar responsables + reportes |
| Auditor | Consultar expedientes de todas las dependencias, descargar documentos, reportes y auditoría |

Fuente única: `backend/src/security/permissions.ts` (el seed lo copia a la base).

## 5. Archivos principales

| Capa | Archivos |
|---|---|
| Persistencia | `backend/prisma/schema.prisma`, `prisma.config.ts`, `prisma/seed.ts`, `src/database/repositories.ts`, `src/database/prisma/*` |
| Seguridad | `src/security/password.ts`, `session-token.ts`, `permissions.ts`, `src/api/middlewares/auth.ts` |
| Integraciones | `src/integrations/identity/identity-provider.ts` |
| Negocio | `src/modules/auth/auth.service.ts`, `src/modules/usuarios/usuarios.service.ts`, `src/modules/auditoria/auditoria.service.ts` |
| API | `src/api/routes/auth.routes.ts`, `usuarios.routes.ts`, `src/api/schemas/usuarios.schemas.ts` |
| Frontend | `src/auth/*`, `src/pages/LoginPage.tsx`, `src/pages/UsuariosPage.tsx`, `src/services/*`, `src/components/SystemStatus.tsx` |
| Pruebas | Backend: `tests/integration/auth.test.ts`, `usuarios.test.ts`, `tests/unit/password.test.ts`, `usuarios.service.test.ts` · Frontend: `tests/login.test.tsx`, `usuarios.test.tsx` |

## 6. Riesgos

| Riesgo | Respuesta |
|---|---|
| La IA no puede instalar paquetes ni ejecutar Prisma (sin acceso a npm) | Instalación, migración, seed y pruebas se ejecutan en la PC; solo se registran resultados reales. |
| Prisma 7 cambió su configuración (cliente generado, `prisma.config.ts`, adaptador `pg`) | Configuración tomada de la guía oficial de actualización a la v7. |
| Bloqueo de la cuenta del administrador por intentos fallidos | El bloqueo dura 15 minutos y se borra al reiniciar el backend. |

## 7. Resultado del sprint

**Cierre:** 14/10/2026 (adelantado por CR-02).

| Tarea | SP | Resultado | Evidencia |
|---|---|---|---|
| S2-01 | — | ✅ Migraciones `init` y `auditoria_solo_insercion` aplicadas en la PC y en CI | `prisma migrate deploy` en [CI](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38596214215) |
| S2-02 | 2 | ✅ Login por usuario (o correo), logout que invalida la sesión | `auth.test.ts`; ingreso con `admin` / `12345` en la PC |
| S2-03 | 5 | ✅ 5 roles; 401/403 verificados en el servidor | `usuarios.test.ts` |
| S2-04 | — | ✅ `IdentityProvider` con implementación local | `auth.test.ts` (login por usuario y por correo) |
| S2-05 | 5 | ✅ Alta, edición, roles, desactivación, cambio de contraseña | `usuarios.test.ts` y pruebas de la pantalla |
| S2-06 | — | ✅ Seed con `admin` y un usuario por rol (todos `12345`) | Seed en CI y en la PC |
| S2-07 | — | ✅ Auditoría de login y usuarios; la base rechaza `DELETE` | Paso "Verificar que la auditoría rechaza modificaciones" en CI |

- **SP terminados:** 12 de 12.
- **Velocidad combinada Sprint 1 + 2:** 15 SP de historias (referencia del TP: 20 SP por sprint).
- **Defecto D-03:** el seed no restablecía usuarios existentes; corregido.
- **Pendiente para el cierre formal:** revisión e integración de los PR en `develop`.
