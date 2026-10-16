/**
 * S7-05 — Medición básica de rendimiento contra PostgreSQL real.
 *
 * Carga 1000 expedientes de prueba, mide los tiempos de respuesta de las consultas más usadas
 * a través de la API completa (Express + Prisma) y publica p50 y p95. Falla si algún p95 supera
 * el umbral del requisito (1 s). Al terminar borra los expedientes de prueba.
 *
 * Uso: npx tsx prisma/medir-rendimiento.ts   (necesita DATABASE_URL, migraciones y seed)
 */
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPrismaClient } from '../src/database/prisma/client.js';
import { createPrismaRepos } from '../src/database/prisma/repos.js';
import { AlmacenamientoLocal } from '../src/integrations/almacenamiento/almacenamiento.js';
import { LocalIdentityProvider } from '../src/integrations/identity/identity-provider.js';

const rootEnvFile = resolve(import.meta.dirname, '../../.env');
if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile);

const CANTIDAD = 1000;
const REPETICIONES = 30;
const UMBRAL_P95_MS = 1000;
const PREFIJO = 'PERF-';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}
const prisma = createPrismaClient(url);

function percentil(valores: number[], p: number): number {
  const orden = [...valores].sort((a, b) => a - b);
  return orden[Math.max(0, Math.ceil((p / 100) * orden.length) - 1)]!;
}

async function main() {
  const admin = await prisma.usuario.findUnique({ where: { username: process.env.ADMIN_USERNAME ?? 'admin' } });
  const dependencias = await prisma.dependencia.findMany({ where: { activa: true } });
  if (!admin || dependencias.length === 0) throw new Error('Falta el seed: no hay administrador o dependencias');

  await prisma.expediente.deleteMany({ where: { numero: { startsWith: PREFIJO } } });
  const estados = ['BORRADOR', 'EN_TRAMITE', 'EN_REVISION', 'RESUELTO', 'ARCHIVADO'] as const;
  const prioridades = ['BAJA', 'MEDIA', 'ALTA'] as const;
  const tipos = ['NOTA', 'SOLICITUD', 'RECLAMO', 'INFORME'];
  const ahora = Date.now();
  await prisma.expediente.createMany({
    data: Array.from({ length: CANTIDAD }, (_, i) => ({
      numero: `${PREFIJO}${String(i + 1).padStart(6, '0')}`,
      caratula: `Expediente de rendimiento ${i + 1}`,
      asunto: 'Carga de prueba para medir tiempos de respuesta (S7-05)',
      tipo: tipos[i % tipos.length]!,
      iniciador: 'Prueba de rendimiento',
      estado: estados[i % estados.length]!,
      prioridad: prioridades[i % prioridades.length]!,
      dependenciaActualId: dependencias[i % dependencias.length]!.id,
      creadoPorId: admin.id,
      fechaVencimiento: new Date(ahora + ((i % 20) - 10) * 24 * 60 * 60 * 1000),
    })),
  });

  const repos = createPrismaRepos(prisma);
  const app = createApp({
    dbCheck: async () => true,
    version: 'rendimiento',
    repos,
    identity: new LocalIdentityProvider(repos.usuarios),
    almacenamiento: new AlmacenamientoLocal(join(tmpdir(), 'is3-rendimiento')),
  });
  const agente = request.agent(app);
  const login = await agente.post('/api/auth/login').send({ usuario: admin.username, password: process.env.ADMIN_PASSWORD ?? '12345' });
  if (login.status !== 200) throw new Error(`No se pudo iniciar sesión como ${admin.username} (${login.status})`);

  const consultas: [string, string][] = [
    ['Listado de expedientes', '/api/expedientes?porPagina=20'],
    ['Búsqueda por texto', '/api/expedientes?q=rendimiento&porPagina=20'],
    ['Dashboard', '/api/estadisticas/dashboard'],
    ['Reporte con filtro', '/api/reportes/expedientes?estado=EN_TRAMITE'],
    ['Exportar CSV (todo)', '/api/reportes/expedientes/exportar'],
  ];

  let fallas = 0;
  for (const [nombre, ruta] of consultas) {
    for (let i = 0; i < 3; i++) await agente.get(ruta); // calentamiento
    const tiempos: number[] = [];
    for (let i = 0; i < REPETICIONES; i++) {
      const inicio = performance.now();
      const res = await agente.get(ruta);
      tiempos.push(performance.now() - inicio);
      if (res.status !== 200) throw new Error(`${ruta} respondió ${res.status}`);
    }
    const p50 = percentil(tiempos, 50);
    const p95 = percentil(tiempos, 95);
    const texto = `${nombre}: p50 ${p50.toFixed(0)} ms · p95 ${p95.toFixed(0)} ms (${REPETICIONES} peticiones, ${CANTIDAD} expedientes de prueba)`;
    if (p95 > UMBRAL_P95_MS) {
      fallas++;
      console.log(`::error title=Rendimiento (S7-05)::${texto} — supera el umbral de ${UMBRAL_P95_MS} ms`);
    } else {
      console.log(`::notice title=Rendimiento (S7-05)::${texto}`);
    }
  }

  await prisma.expediente.deleteMany({ where: { numero: { startsWith: PREFIJO } } });
  if (fallas > 0) process.exitCode = 1;
}

main()
  .catch((err: unknown) => {
    console.error('Error en la medición:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
