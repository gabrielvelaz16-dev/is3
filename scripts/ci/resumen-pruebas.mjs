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

// Cada prueba fallida se publica como anotación "error" con su archivo y el
// primer renglón del motivo y las líneas de la pila del proyecto, para diagnosticarla sin abrir el log.
const limpiar = (t, max = 400) => String(t).replace(/\u001b\[[0-9;]*m/g, '').replace(/%/g, '%25').replace(/\r?\n/g, ' ').slice(0, max);
// Primer renglón del error y hasta 3 líneas de la pila que apuntan al código del proyecto.
const motivoDe = (mensaje = 'sin detalle') => {
  const lineas = String(mensaje).split('\n');
  const pila = lineas.filter((l) => /(src|tests)\/[^)]*:\d+:\d+/.test(l) && !/node_modules/.test(l)).slice(0, 3).map((l) => l.trim());
  return [lineas[0], ...pila].join(' | ');
};
for (const archivo of r.testResults ?? []) {
  for (const prueba of archivo.assertionResults ?? []) {
    if (prueba.status !== 'failed') continue;
    const ruta = archivo.name.replace(/^.*?\/(backend|frontend)\//, '$1/');
    const motivo = limpiar(motivoDe((prueba.failureMessages ?? [])[0]), 900);
    console.log(`::error file=${ruta},title=${etiqueta} · prueba fallida::${limpiar(prueba.fullName)} → ${motivo}`);
  }
}
