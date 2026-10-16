// Capturas de pantalla de la interfaz con Playwright (CR-05). Uso:
//   node capturas.mjs <carpeta de salida> <demo.json> [http://localhost:5173]
// Cada captura es una pantalla completa; las de celular usan 390×844.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const [salida, archivoDemo, BASE = 'http://localhost:5173'] = process.argv.slice(2);
const demo = JSON.parse(readFileSync(archivoDemo, 'utf8'));
mkdirSync(salida, { recursive: true });
const hechas = [];
const fallidas = [];

const navegador = await chromium.launch();

async function contexto(usuario, viewport = { width: 1366, height: 800 }) {
  const ctx = await navegador.newContext({ viewport, locale: 'es-PY', timezoneId: 'America/Asuncion' });
  const page = await ctx.newPage();
  if (usuario) {
    await page.goto(`${BASE}/login`);
    await page.getByLabel('Usuario').fill(usuario);
    await page.getByLabel('Contraseña').fill(process.env.PASSWORD_DEMO ?? '12345');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  }
  return { ctx, page };
}

async function captura(page, nombre, titulo, accion) {
  try {
    if (accion) await accion(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(salida, `${nombre}.png`), fullPage: true });
    hechas.push({ nombre, titulo });
  } catch (err) {
    fallidas.push({ nombre, titulo, error: String(err).slice(0, 200) });
  }
}
const ir = (ruta) => (page) => page.goto(`${BASE}${ruta}`);

{
  const { ctx, page } = await contexto(null);
  await captura(page, '01-login', 'Inicio de sesión', ir('/login'));
  await ctx.close();
}
{
  const { ctx, page } = await contexto('admin');
  await captura(page, '02-inicio-admin', 'Inicio con estadísticas (administrador)', ir('/'));
  await captura(page, '03-expedientes', 'Listado de expedientes', ir('/expedientes'));
  await captura(page, '05-reportes', 'Reportes', ir('/reportes'));
  await captura(page, '07-auditoria', 'Auditoría', ir('/auditoria'));
  await captura(page, '08-administracion', 'Administración (usuarios y respaldos)', ir('/administracion'));
  await captura(page, '09-nuevo-expediente', 'Nuevo expediente', ir('/expedientes/nuevo'));
  await ctx.close();
}
{
  const { ctx, page } = await contexto('jefe');
  await captura(page, '04-expediente-detalle', 'Detalle de un expediente (jefe de Asesoría Jurídica)', ir(`/expedientes/${demo.licitacion}`));
  await captura(page, '06-tareas-pendientes', 'Tareas y pendientes (jefe)', ir('/tareas'));
  await captura(page, '10-notificaciones', 'Campana de notificaciones abierta', async (p) => {
    await p.goto(`${BASE}/`);
    await p.getByRole('button', { name: /^Notificaciones/ }).first().click();
  });
  await ctx.close();
}
{
  const { ctx, page } = await contexto('funcionario');
  await captura(page, '11-inicio-funcionario', 'Inicio de un funcionario (solo su dependencia)', ir('/'));
  await ctx.close();
}
{
  const { ctx, page } = await contexto('admin', { width: 390, height: 844 });
  await captura(page, '12-movil-inicio', 'Inicio en el celular', ir('/'));
  await captura(page, '13-movil-menu', 'Menú abierto en el celular', async (p) => {
    await p.goto(`${BASE}/`);
    await p.getByRole('button', { name: /abrir menú/i }).first().click();
  });
  await ctx.close();
}
await navegador.close();

writeFileSync(
  join(salida, 'README.md'),
  `# Capturas de la interfaz\n\n${hechas.map((c) => `## ${c.titulo}\n\n![${c.titulo}](${c.nombre}.png)\n`).join('\n')}` +
    (fallidas.length ? `\n## No se pudieron sacar\n\n${fallidas.map((f) => `- ${f.nombre}: ${f.error}`).join('\n')}\n` : ''),
);
console.log(`${hechas.length} capturas, ${fallidas.length} fallidas`);
for (const f of fallidas) console.log(`::warning title=Captura::${f.nombre}: ${f.error}`);
