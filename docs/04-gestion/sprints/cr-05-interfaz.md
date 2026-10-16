# CR-05 · Mejora de la interfaz

Fecha: 16/10/2026 · Rama: `feature/S8-UI-interfaz` (sale de `feature/S7-calidad-seguridad`) · Solicitud: [control-cambios.md](../control-cambios.md#cr-05--mejora-de-la-interfaz)

## Objetivo

Que el sistema se vea y se use como una herramienta institucional coherente, sin cambiar reglas de negocio ni la API. El PO eligió tres frentes: navegación y diseño general, detalle del expediente y componentes con estilo coherente; además pidió capturas antes y después generadas en la CI.

## Qué se cambió

| Área | Antes | Después |
|---|---|---|
| Navegación | Barra superior con todos los enlaces | Menú lateral agrupado (Trabajo diario, Control, Sistema), sección activa marcada en ocre, usuario y "Cerrar sesión" abajo. En el celular se abre como panel con fondo y se cierra con Escape |
| Barra superior | Logo + enlaces + campana | Nombre de la dependencia y campana; en el celular, botón de menú |
| Inicio | Estado del sistema arriba y tarjetas grandes | Saludo, "Situación de …" (dashboard), accesos a las secciones y el estado del sistema como franja al pie |
| Detalle del expediente | Una página larga con todas las secciones una abajo de otra | Carátula tipo carpeta (número en la pestaña de la carpeta), datos clave y cambio de estado arriba; contenido en pestañas Datos, Documentos, Actuaciones, Tareas e Historial. La pestaña queda en la dirección (`?pestana=historial`) |
| Listado | Columna "Ver", fecha con hora, número en monoespaciada | El número es el enlace, fecha corta, iniciador truncado; etiquetas de estado y prioridad comunes |
| Mensajes de éxito | Texto dentro de cada pantalla | Avisos flotantes (`role="status"`) que se cierran solos a los 6 s |
| Estilo | Clases repetidas en cada pantalla, mayúsculas en etiquetas | Componentes `ui/` (Boton, Etiquetas, Tarjeta, Avisos, Pestanas), tipografía Public Sans, colores tinta / papel / carpeta / sello, sin mayúsculas forzadas |

## Accesibilidad

- Pestañas según el patrón WAI-ARIA: `tablist`/`tab`/`tabpanel`, flechas, Inicio y Fin.
- Menú con `aria-controls` y `aria-expanded`; los avisos se anuncian con `aria-live`.
- Se respeta `prefers-reduced-motion` y el foco visible con teclado.
- El número del expediente se lee en el título (`Expediente EXP-…: carátula`).

## Verificación

| Verificación | Resultado | Evidencia |
|---|---|---|
| CI (lint, tipos, pruebas, build) | Frontend 51/51, backend sin cambios y en verde | [run 38916734397](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38916734397) |
| Capturas antes (13) | Generadas en la CI con Playwright | [capturas/feature-S8-UI-interfaz-917a101](https://github.com/gabrielvelaz16-dev/is3/tree/capturas/feature-S8-UI-interfaz-917a101) |
| Capturas después (16, con pestañas y detalle en celular) | Generadas en la CI | [capturas/feature-S8-UI-interfaz-aebfa65](https://github.com/gabrielvelaz16-dev/is3/tree/capturas/feature-S8-UI-interfaz-aebfa65) · [run 38916734471](https://github.com/gabrielvelaz16-dev/is3/actions/runs/38916734471) |
| Revisión visual de las capturas | Se corrigieron 4 problemas vistos en la primera tanda: menú lateral cortado en páginas largas, columna "Ver" fuera de la tabla, números demasiado anchos en el texto y "Solicitud iniciado" | Commit `aebfa65` |

Las pruebas de detalle (`anexos.test.tsx`, `seguimiento.test.tsx`) y del menú (`navigation.test.tsx`) se ajustaron a las pestañas y al menú lateral; no se quitó ninguna verificación.

## Pendientes

- Probar en la PC con el navegador real (las capturas son de Chromium en la CI).
- El historial todavía muestra los estados con su nombre interno (`EN_TRAMITE`); el texto lo arma el backend. Queda para el Sprint 8.
- Prueba de usabilidad con 3 personas ([guia-usabilidad.md](../../05-calidad-pruebas/guia-usabilidad.md)), ahora sobre la interfaz nueva.
