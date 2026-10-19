/**
 * S6-04 — Verificar que los indicadores coinciden con los datos almacenados.
 *
 * Calcula el dashboard con la misma implementación que usa la API (repositorio de
 * Prisma) y lo compara con conteos SQL escritos a mano, para toda la institución y
 * para cada dependencia. Si un número no coincide, termina con error (falla la CI).
 *
 * Uso: npx tsx prisma/verificar-indicadores.ts   (necesita DATABASE_URL, migraciones y seed)
 * Agrega dos tareas de verificación (una vencida) para que los indicadores de tareas no sean 0.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPrismaClient } from '../src/database/prisma/client.js';
import { createPrismaRepos } from '../src/database/prisma/repos.js';
import type { FiltrosReporte } from '../src/database/repositories.js';
import { DIAS_AVISO } from '../src/modules/pendientes/pendientes.service.js';

const rootEnvFile = resolve(import.meta.dirname, '../../.env');
if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile);

const DIA = 24 * 60 * 60 * 1000;
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}

const prisma = createPrismaClient(url);
const repos = createPrismaRepos(prisma);
const errores: string[] = [];
let verificados = 0;

function comparar(alcance: string, indicador: string, sistema: number, base: number) {
  verificados++;
  if (sistema === base) {
    console.log(`OK  ${alcance.padEnd(28)} ${indicador.padEnd(26)} sistema=${sistema} base=${base}`);
  } else {
    errores.push(`${alcance} · ${indicador}: el sistema muestra ${sistema} y la base tiene ${base}`);
    console.log(`::error title=Indicador distinto::${alcance} · ${indicador}: sistema=${sistema} base=${base}`);
  }
}

type Fila = { clave: string; n: number };
const aMapa = (filas: Fila[]) => new Map(filas.map((f) => [f.clave, f.n]));

async function verificarAlcance(nombre: string, dependenciaId: number | null, ahora: Date) {
  const dep = dependenciaId;
  const t = ahora.toISOString();
  const hasta = new Date(ahora.getTime() + DIAS_AVISO * DIA).toISOString();
  const filtros: FiltrosReporte = dep ? { dependenciaId: dep } : {};

  const resumen = await repos.estadisticas.resumen(filtros);
  const seg = await repos.estadisticas.seguimiento({ dependenciaId: dep ?? undefined, ahora, hasta: new Date(hasta) });

  const [{ n: total }] = await prisma.$queryRaw<[{ n: number }]>`
    SELECT count(*)::int AS n FROM expedientes WHERE activo AND (${dep}::int IS NULL OR dependencia_actual_id = ${dep}::int)`;
  comparar(nombre, 'total', resumen.total, total);

  const estados = aMapa(await prisma.$queryRaw<Fila[]>`
    SELECT estado::text AS clave, count(*)::int AS n FROM expedientes
    WHERE activo AND (${dep}::int IS NULL OR dependencia_actual_id = ${dep}::int) GROUP BY estado`);
  for (const [estado, n] of Object.entries(resumen.porEstado)) comparar(nombre, `estado ${estado}`, n, estados.get(estado) ?? 0);

  const prioridades = aMapa(await prisma.$queryRaw<Fila[]>`
    SELECT prioridad::text AS clave, count(*)::int AS n FROM expedientes
    WHERE activo AND (${dep}::int IS NULL OR dependencia_actual_id = ${dep}::int) GROUP BY prioridad`);
  for (const [prioridad, n] of Object.entries(resumen.porPrioridad)) comparar(nombre, `prioridad ${prioridad}`, n, prioridades.get(prioridad) ?? 0);

  const tipos = aMapa(await prisma.$queryRaw<Fila[]>`
    SELECT tipo AS clave, count(*)::int AS n FROM expedientes
    WHERE activo AND (${dep}::int IS NULL OR dependencia_actual_id = ${dep}::int) GROUP BY tipo`);
  comparar(nombre, 'cantidad de tipos', resumen.porTipo.length, tipos.size);
  for (const { tipo, total: n } of resumen.porTipo) comparar(nombre, `tipo ${tipo}`, n, tipos.get(tipo) ?? 0);

  const [{ n: vencidos }] = await prisma.$queryRaw<[{ n: number }]>`
    SELECT count(*)::int AS n FROM expedientes
    WHERE activo AND (${dep}::int IS NULL OR dependencia_actual_id = ${dep}::int)
      AND estado NOT IN ('RESUELTO', 'ARCHIVADO') AND fecha_vencimiento < ${t}::timestamp`;
  comparar(nombre, 'vencidos', seg.vencidos, vencidos);

  const [{ n: porVencer }] = await prisma.$queryRaw<[{ n: number }]>`
    SELECT count(*)::int AS n FROM expedientes
    WHERE activo AND (${dep}::int IS NULL OR dependencia_actual_id = ${dep}::int)
      AND estado NOT IN ('RESUELTO', 'ARCHIVADO')
      AND fecha_vencimiento >= ${t}::timestamp AND fecha_vencimiento <= ${hasta}::timestamp`;
  comparar(nombre, 'por vencer', seg.porVencer, porVencer);

  const [{ n: enTransito }] = await prisma.$queryRaw<[{ n: number }]>`
    SELECT count(*)::int AS n FROM expedientes e
    WHERE e.activo AND (${dep}::int IS NULL OR e.dependencia_actual_id = ${dep}::int)
      AND EXISTS (SELECT 1 FROM pases p WHERE p.expediente_id = e.id AND p.recibido_en IS NULL)`;
  comparar(nombre, 'en tránsito', seg.enTransito, enTransito);

  const [{ n: porRecibir }] = await prisma.$queryRaw<[{ n: number }]>`
    SELECT count(*)::int AS n FROM pases WHERE recibido_en IS NULL AND (${dep}::int IS NULL OR destino_id = ${dep}::int)`;
  comparar(nombre, 'por recibir', seg.porRecibir, porRecibir);

  const [{ abiertas, vencidas }] = await prisma.$queryRaw<[{ abiertas: number; vencidas: number }]>`
    SELECT count(*)::int AS abiertas, count(*) FILTER (WHERE t.vencimiento < ${t}::timestamp)::int AS vencidas
    FROM tareas t JOIN expedientes e ON e.id = t.expediente_id
    WHERE t.estado IN ('PENDIENTE', 'EN_CURSO') AND e.activo AND (${dep}::int IS NULL OR e.dependencia_actual_id = ${dep}::int)`;
  comparar(nombre, 'tareas abiertas', seg.tareasAbiertas, abiertas);
  comparar(nombre, 'tareas vencidas', seg.tareasVencidas, vencidas);

  return { resumen, seg };
}

async function main() {
  // Datos de verificación: dos tareas abiertas sobre el primer expediente, una ya vencida.
  const expediente = await prisma.expediente.findFirst({ orderBy: { id: 'asc' } });
  const usuario = await prisma.usuario.findFirst({ orderBy: { id: 'asc' } });
  if (!expediente || !usuario) throw new Error('La base no tiene expedientes o usuarios: ejecute el seed antes');
  const ahora = new Date();
  await prisma.tarea.createMany({
    data: [
      { expedienteId: expediente.id, titulo: 'Verificación CI (vencida)', asignadoAId: usuario.id, creadoPorId: usuario.id, vencimiento: new Date(ahora.getTime() - DIA) },
      { expedienteId: expediente.id, titulo: 'Verificación CI (al día)', asignadoAId: usuario.id, creadoPorId: usuario.id, vencimiento: new Date(ahora.getTime() + 5 * DIA) },
    ],
  });

  const global = await verificarAlcance('Institución', null, ahora);
  for (const d of await prisma.dependencia.findMany({ orderBy: { id: 'asc' } })) {
    await verificarAlcance(`Dependencia ${d.codigo}`, d.id, ahora);
  }

  // Un reporte con filtro también debe coincidir (S6-02).
  const filtrado = await repos.estadisticas.resumen({ estado: 'EN_TRAMITE' });
  const [{ n }] = await prisma.$queryRaw<[{ n: number }]>`SELECT count(*)::int AS n FROM expedientes WHERE activo AND estado = 'EN_TRAMITE'`;
  comparar('Reporte estado=EN_TRAMITE', 'total', filtrado.total, n);

  // Sin datos la verificación no prueba nada (misma lección que D-09).
  const sinDatos = [
    ['expedientes', global.resumen.total],
    ['vencidos', global.seg.vencidos],
    ['por vencer', global.seg.porVencer],
    ['tareas vencidas', global.seg.tareasVencidas],
  ].filter(([, valor]) => valor === 0);
  for (const [indicador] of sinDatos) {
    errores.push(`No hay datos para "${indicador}": la verificación no sería válida`);
    console.log(`::error title=Sin datos::No hay datos para "${indicador}"; revise el seed`);
  }

  console.log(`\n${verificados} comparaciones, ${errores.length} con diferencias o sin datos.`);
  // Evidencia visible en el resumen de la ejecución de la CI.
  console.log(`::notice title=Indicadores (S6-04)::${verificados} comparaciones contra la base, ${errores.length} con diferencias o sin datos.`);
  if (errores.length > 0) process.exitCode = 1;
}

main()
  .catch((err: unknown) => {
    console.error('Error en la verificación:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
