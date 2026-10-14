// Auditoría de dependencias de producción para CI (plan de configuración §10).
// Publica cada vulnerabilidad como anotación de GitHub y falla si hay alguna
// de severidad alta o crítica. Uso: node ../scripts/ci/audit.mjs (desde backend/ o frontend/).
import { execSync } from 'node:child_process';

let salida;
try {
  salida = execSync('npm audit --omit=dev --json', { encoding: 'utf8' });
} catch (err) {
  salida = err.stdout; // npm audit sale con código 1 cuando encuentra vulnerabilidades
}
const reporte = JSON.parse(salida);
const vulns = Object.values(reporte.vulnerabilities ?? {});
const graves = vulns.filter((v) => v.severity === 'high' || v.severity === 'critical');

for (const v of vulns) {
  const avisos = v.via.filter((x) => typeof x === 'object').map((x) => `${x.title} (${x.url})`).join(' | ') || `vía ${v.via.join(', ')}`;
  const arreglo = v.fixAvailable === true ? 'npm audit fix' : v.fixAvailable ? `actualizar ${v.fixAvailable.name}@${v.fixAvailable.version}` : 'sin arreglo publicado';
  const nivel = v.severity === 'high' || v.severity === 'critical' ? 'error' : 'warning';
  console.log(`::${nivel} title=npm audit ${v.severity}: ${v.name}@${v.range}::${avisos} — Arreglo: ${arreglo}`);
}

const m = reporte.metadata?.vulnerabilities ?? {};
console.log(`Resumen: críticas ${m.critical ?? 0}, altas ${m.high ?? 0}, moderadas ${m.moderate ?? 0}, bajas ${m.low ?? 0}`);
if (graves.length > 0) {
  console.log(`::error title=npm audit::${graves.length} dependencia(s) de producción con vulnerabilidad alta o crítica`);
  process.exit(1);
}
