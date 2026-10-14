// Auditoría de dependencias para CI (plan de configuración §10, DT-05).
// - Publica cada vulnerabilidad como anotación de GitHub (paquete, severidad, arreglo).
// - FALLA si hay vulnerabilidades altas o críticas en paquetes que usa el
//   sistema en ejecución (producción).
// - Solo ADVIERTE si el paquete vulnerable es exclusivamente de desarrollo
//   (en package-lock figura como "dev" o "devOptional", por ejemplo la CLI de
//   Prisma, que se usa para crear migraciones y no corre dentro del servidor).
// Uso: node ../scripts/ci/audit.mjs  (desde backend/ o frontend/)
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

let salida;
try {
  salida = execSync('npm audit --json', { encoding: 'utf8' });
} catch (err) {
  salida = err.stdout; // npm audit sale con código 1 cuando encuentra vulnerabilidades
}
const reporte = JSON.parse(salida);
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')).packages ?? {};

/** true si todas las instalaciones del paquete son solo de desarrollo. */
const soloDesarrollo = (v) =>
  (v.nodes ?? []).length > 0 && v.nodes.every((n) => lock[n]?.dev === true || lock[n]?.devOptional === true);

let bloqueantes = 0;
let advertencias = 0;
for (const v of Object.values(reporte.vulnerabilities ?? {})) {
  const grave = v.severity === 'high' || v.severity === 'critical';
  const desarrollo = soloDesarrollo(v);
  const avisos = v.via.filter((x) => typeof x === 'object').map((x) => `${x.title} (${x.url})`).join(' | ') || `vía ${v.via.join(', ')}`;
  const arreglo = v.fixAvailable === true ? 'npm audit fix' : v.fixAvailable ? `${v.fixAvailable.name}@${v.fixAvailable.version}` : 'sin arreglo publicado';
  const ambito = desarrollo ? 'solo desarrollo' : 'PRODUCCIÓN';
  const nivel = grave && !desarrollo ? 'error' : 'warning';
  if (nivel === 'error') bloqueantes++;
  else advertencias++;
  console.log(`::${nivel} title=npm audit ${v.severity} (${ambito}): ${v.name}@${v.range}::${avisos} — Arreglo sugerido: ${arreglo}`);
}

console.log(`Resumen: ${bloqueantes} bloqueante(s) en producción, ${advertencias} advertencia(s).`);
if (bloqueantes > 0) {
  console.log(`::error title=npm audit::${bloqueantes} dependencia(s) de producción con vulnerabilidad alta o crítica`);
  process.exit(1);
}
