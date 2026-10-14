/**
 * Datos iniciales (S2-06): dependencias ficticias, permisos, roles, el usuario
 * administrador y un usuario de prueba por rol. Es idempotente: se puede
 * ejecutar varias veces sin duplicar. Los usuarios iniciales se restablecen
 * (contraseña, rol y estado) en cada ejecución.
 *
 * Por decisión del PO (prototipo académico local) el administrador por defecto
 * es admin / 12345; se puede cambiar con ADMIN_USERNAME y ADMIN_PASSWORD en .env.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPrismaClient } from '../src/database/prisma/client.js';
import { hashPassword, validarPoliticaPassword } from '../src/security/password.js';
import { PERMISOS, ROL_ADMINISTRADOR, ROLES } from '../src/security/permissions.js';

const rootEnvFile = resolve(import.meta.dirname, '../../.env');
if (existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile);

/** Contraseña de los usuarios de prueba (solo datos ficticios en un equipo local). */
const PASSWORD_DEMO = '12345';

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

    const rolId = async (clave: string) => (await prisma.rol.findUniqueOrThrow({ where: { clave } })).id;
    const depId = async (codigo: string) => (await prisma.dependencia.findUniqueOrThrow({ where: { codigo } })).id;

    const usuarios = [
      {
        username: (process.env.ADMIN_USERNAME?.trim() || 'admin').toLowerCase(),
        email: (process.env.ADMIN_EMAIL?.trim() || 'admin@institucion.test').toLowerCase(),
        nombre: process.env.ADMIN_NOMBRE?.trim() || 'Administrador del sistema',
        password: process.env.ADMIN_PASSWORD || PASSWORD_DEMO,
        rol: ROL_ADMINISTRADOR,
        dependencia: 'ADM',
      },
      // Usuarios ficticios de prueba, uno por rol (S2-06).
      ...(process.env.SEED_USUARIOS_DEMO === 'false'
        ? []
        : [
            { username: 'mesa', email: 'mesa@institucion.test', nombre: 'Marta Mesa (prueba)', password: PASSWORD_DEMO, rol: 'MESA_ENTRADAS', dependencia: 'MESA' },
            { username: 'funcionario', email: 'funcionario@institucion.test', nombre: 'Fabián Funcionario (prueba)', password: PASSWORD_DEMO, rol: 'FUNCIONARIO', dependencia: 'AJUR' },
            { username: 'jefe', email: 'jefe@institucion.test', nombre: 'Julia Jefa (prueba)', password: PASSWORD_DEMO, rol: 'JEFE_DEPENDENCIA', dependencia: 'AJUR' },
            { username: 'auditor', email: 'auditor@institucion.test', nombre: 'Andrés Auditor (prueba)', password: PASSWORD_DEMO, rol: 'AUDITOR', dependencia: 'ADM' },
          ]),
    ];

    // Usuarios iniciales: si no existen se crean; si ya existen se RESTABLECEN
    // (contraseña, rol, dependencia y estado activo). Así "npm run db:seed"
    // siempre deja admin / 12345 funcionando, aunque se haya cambiado antes.
    for (const u of usuarios) {
      const problema = validarPoliticaPassword(u.password);
      if (problema) throw new Error(`Contraseña de "${u.username}" inválida: ${problema}`);
      const datos = {
        nombre: u.nombre,
        passwordHash: await hashPassword(u.password),
        rolId: await rolId(u.rol),
        dependenciaId: await depId(u.dependencia),
        activo: true,
      };
      const existente = await prisma.usuario.findFirst({ where: { OR: [{ username: u.username }, { email: u.email }] } });
      if (existente) {
        await prisma.usuario.update({ where: { id: existente.id }, data: { ...datos, username: u.username, email: u.email } });
        await prisma.sesion.deleteMany({ where: { usuarioId: existente.id } });
      } else {
        await prisma.usuario.create({ data: { ...datos, username: u.username, email: u.email } });
      }
      await prisma.auditoria.create({
        data: {
          accion: existente ? 'SEED_USUARIO_RESTABLECIDO' : 'SEED_USUARIO_CREADO',
          resultado: 'EXITO',
          entidad: 'Usuario',
          detalle: { username: u.username, rol: u.rol },
        },
      });
      console.log(`${existente ? 'Usuario restablecido' : 'Usuario creado'}: ${u.username} / ${u.password === PASSWORD_DEMO ? PASSWORD_DEMO : '(contraseña del .env)'} (${u.rol})`);
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
