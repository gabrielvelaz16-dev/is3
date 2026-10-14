// Publica en GitHub Actions el resumen real de las pruebas (y la cobertura si existe)
// como anotación "notice", para registrarlo como evidencia (resultados-pruebas.md).
// Uso: node ../scripts/ci/resumen-pruebas.mjs <vitest-results.json> [coverage-summary.json] <etiqueta>
import { existsSync, readFileSync } from 'node:fs';

const [resultados, cobertura, etiqueta = 'Pruebas'] = process.argv.slice(2);
const r = JSON.parse(readFileSync(resultados, 'utf8'));
const archivos = r.testResults?.length ?? 0;
let msg = `${r.numPassedTests}/${r.numTotalTests} pruebas aprobadas, ${r.numFailedTests} fallidas, ${r.numPendingTests ?? 0} omitidas, en ${archivos} archivos.`;
if (cobertura && existsSync(cobertura)) {
  const t = JSON.parse(readFileSync(cobertura, 'utf8')).total;
  msg += ` Cobertura: líneas ${t.lines.pct}%, sentencias ${t.statements.pct}%, funciones ${t.functions.pct}%, ramas ${t.branches.pct}%.`;
}
console.log(`::notice title=${etiqueta}::${msg}`);
