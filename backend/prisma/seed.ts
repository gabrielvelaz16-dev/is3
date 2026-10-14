/**
 * Datos iniciales (S2-06): dependencias ficticias, permisos, roles y el usuario
 * administrador. Es idempotente: se puede ejecutar varias veces sin duplicar.
 *
 * La contraseña del administrador NO está en el código: se lee de ADMIN_PASSWORD
 * en el .env. Si el administrador ya existe, su contraseña no se modifica.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPrismaClient } from '../src/database/prisma/client.js';
import { hashPassword, validarPoliticaPassword } from '../src/security/password.js';
import { PERMISOS, ROL_ADMINISTRADOR, ROLES } from '../src/security/permissions.js';

const rootEnvFile = resolve(import.meta.dirname, '../../.env');
if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile);

const DEPENDENCIAS = [
  { codigo: 'ADM', nombre: 'Administración General' },
  { codigo: 'MESA', nombre: 'Mesa de Entradas' },
  { codigo: 'AJUR', nombre: 'Asesoría Jurídica' },
  { codigo: 'RRHH', nombre: 'Recursos Humanos' },
];

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en el archivo .env (ver .env.example)`);
  return valor;
}

async function main() {
  const databaseUrl = requerida('DATABASE_URL');
  const adminEmail = requerida('ADMIN_EMAIL').trim().toLowerCase();
  const adminNombre = process.env.ADMIN_NOMBRE?.trim() || 'Administrador del sistema';
  const prisma = createPrismaClient(databaseUrl);

  try {
    for (const d of DEPENDENCIAS) {
      await prisma.dependencia.upsert({ where: { codigo: d.codigo }, update: { nombre: d.nombre }, create: d });
    }

    for (const [clave, descripcion] of Object.entries(PERMISOS)) {
      await prisma.permiso.upsert({ where: { clave }, update: { descripcion }, create: { clave, descripcion } });
    }
    const permisos = new Map((await prisma.permiso.findMany()).map((p) => [p.clave, p.id]));

    for (const [clave, rol] of Object.entries(ROLES)) {
      const guardado = await prisma.rol.upsert({
        where: { clave },
        update: { nombre: rol.nombre, descripcion: rol.descripcion },
        create: { clave, nombre: rol.nombre, descripcion: rol.descripcion },
      });
      // Los permisos del rol se sincronizan exactamente con el catálogo del código.
      await prisma.$transaction([
        prisma.rolPermiso.deleteMany({ where: { rolId: guardado.id } }),
        prisma.rolPermiso.createMany({ data: rol.permisos.map((p) => ({ rolId: guardado.id, permisoId: permisos.get(p)! })) }),
      ]);
    }

    const existente = await prisma.usuario.findUnique({ where: { email: adminEmail } });
    if (existente) {
      console.log(`El administrador ${adminEmail} ya existe; no se modifica su contraseña.`);
    } else {
      const password = requerida('ADMIN_PASSWORD');
      const problema = validarPoliticaPassword(password);
      if (problema) throw new Error(`ADMIN_PASSWORD no cumple la política: ${problema}`);
      const rolAdmin = await prisma.rol.findUniqueOrThrow({ where: { clave: ROL_ADMINISTRADOR } });
      const depAdm = await prisma.dependencia.findUniqueOrThrow({ where: { codigo: 'ADM' } });
      await prisma.usuario.create({
        data: {
          email: adminEmail,
          nombre: adminNombre,
          passwordHash: await hashPassword(password),
          rolId: rolAdmin.id,
          dependenciaId: depAdm.id,
        },
      });
      await prisma.auditoria.create({
        data: { accion: 'SEED_ADMIN_CREADO', resultado: 'EXITO', entidad: 'Usuario', detalle: { email: adminEmail } },
      });
      console.log(`Administrador creado: ${adminEmail}`);
    }

    console.log(`Seed completo: ${DEPENDENCIAS.length} dependencias, ${permisos.size} permisos, ${Object.keys(ROLES).length} roles.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('Error en el seed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
