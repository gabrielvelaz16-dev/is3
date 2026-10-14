# Bitácora de uso de inteligencia artificial

**Estado:** Vivo · **Referencia:** Anexo D de la guía de TP y reglas 4 a 6 de uso responsable de IA

Herramienta utilizada: **Claude (Anthropic)**, a través de la app de Claude, con acceso al navegador integrado para operar Trello y GitHub con la sesión del responsable.

**Reglas que sigue el equipo:**
- No se ingresan contraseñas, credenciales ni datos personales de terceros en la herramienta. Los inicios de sesión los realiza el responsable.
- Todo resultado de la IA se revisa antes de aceptarse; el equipo es responsable de errores, sesgos o referencias inexistentes.
- Los resultados de pruebas solo se registran si se ejecutaron realmente.

## Registro

| # | Fecha | Propósito | Entrada (resumen, sin datos sensibles) | Salida utilizada | Validación | Correcciones | Responsable |
|---|---|---|---|---|---|---|---|
| 1 | 13/10/2026 | Analizar las instrucciones del proyecto, la guía del TP y los TP de las Unidades 2 a 6 | Instrucciones del proyecto y documentos de la cátedra | Resumen del estado del trabajo y lista de inconsistencias (backlog vs sprints, CI/CD faltante, dos tableros distintos) | Lectura y comparación con los documentos originales por el responsable | — | Carlos G. Velázquez F. |
| 2 | 13/10/2026 | Crear el tablero de gestión en Trello | Estructura propuesta de listas, etiquetas y tarjetas de la Fase 0 y los 8 sprints | Tablero con 6 listas, 17 etiquetas y 63 tarjetas | Revisión visual del tablero; verificación automática de duplicados y checklists | Se quitaron los íconos de los nombres de las listas a pedido del responsable | Carlos G. Velázquez F. |
| 3 | 13/10/2026 | Configurar el espacio de trabajo y el repositorio | Pedido de renombrar el espacio de Trello y revisar el repositorio IS3 | Espacio de trabajo renombrado a IS3; ramas `develop` y `feature/F0-04-estructura-proyecto` con estructura de carpetas | Revisión de la estructura propuesta antes de crearla | Se detectó que el navegador tenía otra cuenta de GitHub; se agregó la cuenta de FPUNA | Carlos G. Velázquez F. |
| 4 | 13/10/2026 | Redactar la documentación inicial de `docs/` | Contenido de los TP de las Unidades 2 a 6 y requisitos del prototipo | Documentos de alcance, requisitos, arquitectura, modelo de datos, gestión, calidad, configuración, evidencias | **Pendiente:** revisión completa por el responsable antes de aprobar la puerta G1 | — | Carlos G. Velázquez F. |
| 5 | 14/10/2026 | Recuperar y publicar la Fase 0 en GitHub | Registro de la conversación anterior; vinculación de la cuenta de GitHub de FPUNA | Ramas `develop`, `feature/F0-04-estructura-proyecto` y `feature/F0-documentacion-inicial` publicadas | Verificación automática de enlaces internos, suma del backlog (97 SP) y cantidad de riesgos; revisión de ramas en GitHub y clon en la PC | Se corrigió la cuenta vinculada (primero quedó la personal, luego la de FPUNA) | Carlos G. Velázquez F. |
| 6 | 14/10/2026 | Verificar el entorno y fijar versiones (F0-05, F0-07) | Salidas de consola de la PC (versiones instaladas y `npm view`) | Guía de instalación, versiones fijadas (ADR-01), `README.md`, `.gitignore`, `.env.example`, `docker-compose.yml` | Las versiones salen de comandos ejecutados por el responsable, no de la IA; `docker compose config` sin errores | Se descartaron TypeScript 7 y Prisma 8 rc por compatibilidad y estabilidad | Carlos G. Velázquez F. |
| 7 | 14/10/2026 | Sprint 1: backend y frontend base (S1-01 a S1-05) | Plan del Sprint 1, contrato de API y criterios de las tarjetas | Código de Express (health, errores, logs) y de React (navegación, diseño) con pruebas | Instalación y arranque en la PC; `/api/health` respondió `ok` con la base conectada | Se corrigieron conflictos entre ramas y la ubicación del `package.json` del frontend | Carlos G. Velázquez F. |
| 8 | 14/10/2026 | Sprint 2 adelantado (CR-02): login, roles y usuarios | Pedido del PO: administrador con todos los permisos que cree usuarios y asigne roles | Modelo Prisma, seed, sesiones, autorización, gestión de usuarios, auditoría, pantallas de login y usuarios, 40+ pruebas | **Pendiente:** ejecución de migración, seed y pruebas en la PC | Configuración de Prisma 7 tomada de la guía oficial; mensajes en español con el idioma de Zod | Carlos G. Velázquez F. |
| 9 | 14/10/2026 | Simplificar credenciales a pedido del PO | Pedido: login con usuario `admin` y contraseña `12345`, sin exigencias de seguridad de contraseña | Campo `username`, login por usuario o correo, política de 5 caracteres, seed con `admin`/`12345` y un usuario por rol | **Pendiente:** migración, seed y pruebas en la PC | La IA mantuvo el hash de contraseñas (no afecta el uso y conserva RNF-01) y documentó el riesgo aceptado en ADR-10 | Carlos G. Velázquez F. |
| 10 | 14/10/2026 | Corregir el login y crear la CI (S1-06) | Reporte del PO: "usuario o contraseña incorrectos"; plan de configuración §6 | Seed que restablece usuarios, motivo del fallo en el log, migración de auditoría inmutable, workflow de GitHub Actions, auditoría de dependencias | Ejecución real en GitHub Actions: 70/70 pruebas, cobertura 92,99 %; ingreso confirmado por el PO | La CI detectó D-01 y D-02, corregidos; las vulnerabilidades de la CLI de Prisma se documentaron como DT-05 en lugar de ocultarlas | Carlos G. Velázquez F. |

## Contenido generado por IA que requiere validación especial

- Story Points de las historias nuevas (backlog): estimaciones iniciales, validar con Planning Poker.
- Riesgos R13 a R16 y deudas técnicas DT-01 a DT-04: propuestas, validar probabilidad e impacto.
- Umbrales de métricas (cobertura 70 %, p95 < 1 s, etc.): supuestos iniciales.
- Máquina de estados y modelo de datos: borradores para el Sprint 2 y 5.
- Matriz de permisos por rol (`backend/src/security/permissions.ts`): propuesta inicial; validar con el PO qué puede hacer cada rol.
- Parámetros de seguridad (scrypt N=2^15, sesión de 8 h, 5 intentos fallidos / 15 min): supuestos razonables para un prototipo local.
