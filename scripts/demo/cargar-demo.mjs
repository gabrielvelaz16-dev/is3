/**
 * Datos de demostración (S8-02). Arma un recorrido completo a través de la API real, así cada
 * expediente tiene su historial, auditoría y notificaciones como si lo hubieran cargado personas.
 * Todo es ficticio. Requiere el backend levantado y el seed aplicado.
 *
 *   cd backend && npm run demo:cargar            (usa http://localhost:3000)
 *   node scripts/demo/cargar-demo.mjs <url>      (lo usa el flujo de capturas)
 *
 * Imprime en la salida un JSON con los ids que usan las capturas. Si los datos ya estaban
 * cargados no duplica nada: avisa y devuelve los mismos ids.
 * Usuarios del seed (contraseña 12345): mesa (Mesa de Entradas), jefe y funcionario (Asesoría Jurídica),
 * y admin para desactivar el expediente duplicado (CR-08).
 */
const BASE = process.argv[2] ?? 'http://localhost:3000';
const DIA = 24 * 60 * 60 * 1000;
const enDias = (d) => new Date(Date.now() + d * DIA).toISOString();

async function sesion(usuario) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password: process.env.PASSWORD_DEMO ?? '12345' }),
  });
  if (!res.ok) throw new Error(`login ${usuario}: ${res.status}`);
  const cookie = res.headers.get('set-cookie').split(';')[0];
  return async (metodo, ruta, cuerpo, extra = {}) => {
    const r = await fetch(`${BASE}/api${ruta}`, {
      method: metodo,
      headers: { Cookie: cookie, ...(cuerpo && !extra.crudo ? { 'Content-Type': 'application/json' } : {}), ...extra.headers },
      body: cuerpo === undefined ? undefined : extra.crudo ? cuerpo : JSON.stringify(cuerpo),
    });
    const json = await r.json().catch(() => null);
    if (!r.ok) throw new Error(`${metodo} ${ruta}: ${r.status} ${JSON.stringify(json)}`);
    return json.data;
  };
}

try {
const mesa = await sesion('mesa');
const jefe = await sesion('jefe');
const deps = await mesa('GET', '/dependencias');
const ajur = deps.find((d) => d.codigo === 'AJUR');

// ¿Ya se cargó? La nota de la Intendencia queda siempre en Mesa de Entradas: sirve de marca.
// (Cada usuario solo ve los expedientes de su dependencia, por eso se busca con mesa y con jefe.)
const buscar = async (quien, texto) => (await quien('GET', `/expedientes?q=${encodeURIComponent(texto)}&porPagina=1`))[0];
const notaPrevia = await buscar(mesa, 'convenio de cooperación');
if (notaPrevia) {
  const licitacionPrevia = await buscar(jefe, 'mantenimiento de ascensores');
  const reclamoPrevio = (await buscar(mesa, 'certificado de antecedentes')) ?? (await buscar(jefe, 'certificado de antecedentes'));
  console.error('Los datos de demostración ya estaban cargados; no se agregó nada.');
  console.log(JSON.stringify({ licitacion: licitacionPrevia?.id, reclamo: reclamoPrevio?.id, nota: notaPrevia.id }));
  process.exit(0);
}

const crear = (datos) => mesa('POST', '/expedientes', { iniciador: 'Ciudadanía (datos ficticios)', ...datos });
const licitacion = await crear({
  caratula: 'Solicitud de licitación para mantenimiento de ascensores',
  asunto: 'La Dirección Administrativa solicita iniciar el llamado a licitación para el mantenimiento anual de ascensores del edificio central.',
  tipo: 'SOLICITUD',
  prioridad: 'ALTA',
  fechaVencimiento: enDias(2),
});
const reclamo = await crear({
  caratula: 'Reclamo por demora en certificado de antecedentes',
  asunto: 'Un ciudadano reclama la demora de 30 días en la entrega de su certificado.',
  tipo: 'RECLAMO',
  prioridad: 'MEDIA',
  fechaVencimiento: enDias(-1),
});
const nota = await crear({
  caratula: 'Nota de la Intendencia sobre convenio de cooperación',
  asunto: 'La Intendencia remite propuesta de convenio de cooperación técnica para revisión.',
  tipo: 'NOTA',
  prioridad: 'BAJA',
  fechaVencimiento: enDias(15),
});

// Documento en la licitación y envío a Asesoría Jurídica (Mesa de Entradas no registra actuaciones).
await mesa('POST', `/expedientes/${licitacion.id}/documentos`, Buffer.from('%PDF-1.4\n% Documento de demostración (ficticio)\n'), {
  crudo: true,
  headers: {
    'Content-Type': 'application/pdf',
    'X-Nombre-Archivo': encodeURIComponent('pliego-de-bases.pdf'),
    'X-Descripcion': encodeURIComponent('Pliego de bases y condiciones'),
  },
});
await mesa('POST', `/expedientes/${licitacion.id}/pases`, { destinoId: ajur.id, motivo: 'Para dictamen jurídico sobre el llamado' });
await mesa('POST', `/expedientes/${reclamo.id}/pases`, { destinoId: ajur.id, motivo: 'Para responder el reclamo' });

// Asesoría Jurídica recibe la licitación, asigna responsable y crea una tarea. El reclamo queda en tránsito.
const recibidos = await jefe('GET', '/pases/recibidos');
await jefe('POST', `/pases/${recibidos.find((p) => p.expedienteId === licitacion.id).id}/recepcion`);
const usuariosAjur = await jefe('GET', `/dependencias/${ajur.id}/usuarios`);
const funcionario = usuariosAjur.find((u) => u.username === 'funcionario');
await jefe('POST', `/expedientes/${licitacion.id}/responsable`, { responsableId: funcionario.id });
await jefe('POST', `/expedientes/${licitacion.id}/estado`, { estado: 'EN_REVISION', motivo: 'Se analiza el pliego' });
await jefe('POST', `/expedientes/${licitacion.id}/tareas`, {
  titulo: 'Redactar dictamen sobre el pliego',
  asignadoAId: funcionario.id,
  vencimiento: enDias(1),
  descripcion: 'Revisar plazos y garantías.',
});
await jefe('POST', `/expedientes/${licitacion.id}/actuaciones`, { tipo: 'ACTUACION', texto: 'Se verificó que la solicitud incluye el pliego de bases firmado.' });
await jefe('POST', `/expedientes/${licitacion.id}/actuaciones`, { tipo: 'OBSERVACION', texto: 'Falta la constancia de disponibilidad presupuestaria.' });

// ── Más casos para la demo (S8-02): todos los estados, vencimientos y pases a otra dependencia ──
const rrhh = deps.find((d) => d.codigo === 'RRHH');
const funcionarioSesion = await sesion('funcionario');
const adjuntar = (quien, id, nombre, descripcion) =>
  quien('POST', `/expedientes/${id}/documentos`, Buffer.from(`%PDF-1.4\n% ${descripcion} (documento ficticio)\n`), {
    crudo: true,
    headers: {
      'Content-Type': 'application/pdf',
      'X-Nombre-Archivo': encodeURIComponent(nombre),
      'X-Descripcion': encodeURIComponent(descripcion),
    },
  });
/** Mesa crea, envía a Asesoría Jurídica y el jefe recibe. */
async function enAsesoria(datos, motivo) {
  const exp = await crear(datos);
  await mesa('POST', `/expedientes/${exp.id}/pases`, { destinoId: ajur.id, motivo });
  const pase = (await jefe('GET', '/pases/recibidos')).find((p) => p.expedienteId === exp.id);
  await jefe('POST', `/pases/${pase.id}/recepcion`);
  return exp;
}
const estado = (id, nuevo, motivo) => jefe('POST', `/expedientes/${id}/estado`, { estado: nuevo, motivo });
const actuacion = (id, tipo, texto) => jefe('POST', `/expedientes/${id}/actuaciones`, { tipo, texto });

// Archivado: recorrido completo de punta a punta.
const accesoInfo = await enAsesoria(
  { caratula: 'Pedido de acceso a la información pública sobre horarios de atención', asunto: 'Un ciudadano solicita los horarios de atención al público de todas las dependencias.', tipo: 'SOLICITUD', prioridad: 'MEDIA' },
  'Para verificar la información a entregar',
);
await actuacion(accesoInfo.id, 'ACTUACION', 'Se preparó la respuesta con los horarios vigentes.');
await estado(accesoInfo.id, 'RESUELTO', 'Respuesta entregada al solicitante');
await estado(accesoInfo.id, 'ARCHIVADO', 'Trámite concluido');

// Resuelto, con documento y observación.
const convenio = await enAsesoria(
  { caratula: 'Convenio marco de pasantías con universidad pública', asunto: 'Propuesta de convenio para recibir pasantes de carreras de informática y administración.', tipo: 'NOTA', prioridad: 'MEDIA', fechaVencimiento: enDias(20) },
  'Para dictamen sobre el texto del convenio',
);
await adjuntar(jefe, convenio.id, 'borrador-convenio.pdf', 'Borrador del convenio');
await actuacion(convenio.id, 'OBSERVACION', 'Se sugiere aclarar la cobertura del seguro de los pasantes.');
await estado(convenio.id, 'RESUELTO', 'Dictamen favorable con observaciones');

// En revisión, con responsable y una tarea en curso.
const recurso = await enAsesoria(
  { caratula: 'Recurso de reconsideración contra resolución de multa', asunto: 'Un comercio solicita reconsiderar una multa por habilitación vencida.', tipo: 'RECLAMO', prioridad: 'ALTA', fechaVencimiento: enDias(5), iniciador: 'Comercio ficticio S.R.L.' },
  'Para análisis del recurso',
);
await jefe('POST', `/expedientes/${recurso.id}/responsable`, { responsableId: funcionario.id });
await estado(recurso.id, 'EN_REVISION', 'Se analizan los antecedentes');
const tareaRecurso = await jefe('POST', `/expedientes/${recurso.id}/tareas`, {
  titulo: 'Pedir antecedentes de la multa',
  asignadoAId: funcionario.id,
  vencimiento: enDias(3),
});
await funcionarioSesion('PATCH', `/tareas/${tareaRecurso.id}`, { estado: 'EN_CURSO' });

// En trámite y vencido, con una tarea ya completada.
const prorroga = await enAsesoria(
  { caratula: 'Solicitud de prórroga del contrato de limpieza', asunto: 'La empresa contratada pide prorrogar el contrato por seis meses.', tipo: 'SOLICITUD', prioridad: 'MEDIA', fechaVencimiento: enDias(-2), iniciador: 'Empresa de limpieza ficticia' },
  'Para dictamen sobre la prórroga',
);
const tareaProrroga = await jefe('POST', `/expedientes/${prorroga.id}/tareas`, {
  titulo: 'Revisar cláusula de renovación',
  asignadoAId: funcionario.id,
  vencimiento: enDias(1),
});
await funcionarioSesion('PATCH', `/tareas/${tareaProrroga.id}`, { estado: 'COMPLETADA' });
await actuacion(prorroga.id, 'ACTUACION', 'La cláusula 12 permite una sola prórroga.');

// En trámite y por vencer.
await enAsesoria(
  { caratula: 'Rendición de cuentas del fondo fijo de octubre', asunto: 'Se remite la rendición del fondo fijo para su control.', tipo: 'INFORME', prioridad: 'BAJA', fechaVencimiento: enDias(1), iniciador: 'Administración General' },
  'Para control de la rendición',
);

// Borrador en Mesa de Entradas, con documento.
const informe = await crear({ caratula: 'Pedido de informe sobre compras del primer semestre', asunto: 'Se solicita un informe de las compras directas del primer semestre.', tipo: 'INFORME', prioridad: 'ALTA', fechaVencimiento: enDias(7), iniciador: 'Auditoría interna (ficticia)' });
await adjuntar(mesa, informe.id, 'nota-de-pedido.pdf', 'Nota de pedido');

// Enviados a Recursos Humanos: quedan en tránsito (por recibir).
for (const datos of [
  { caratula: 'Solicitud de constancia de servicios', asunto: 'Una funcionaria pide constancia de antigüedad para un trámite bancario.', tipo: 'SOLICITUD', prioridad: 'BAJA' },
  { caratula: 'Solicitud de licencia por estudios', asunto: 'Un funcionario solicita licencia por exámenes finales.', tipo: 'SOLICITUD', prioridad: 'MEDIA', fechaVencimiento: enDias(4) },
]) {
  const exp = await crear(datos);
  await mesa('POST', `/expedientes/${exp.id}/pases`, { destinoId: rrhh.id, motivo: 'Para trámite en Recursos Humanos' });
}

// Cargado dos veces por error (CR-08): tiene un documento, así que no se puede eliminar;
// el administrador lo desactiva y queda en "Expedientes desactivados", fuera de listas e indicadores.
const admin = await sesion('admin');
const duplicado = await crear({ caratula: 'Pedido de informe sobre compras del primer semestre (cargado dos veces)', asunto: 'Copia por error del pedido de informe sobre compras directas.', tipo: 'INFORME', prioridad: 'ALTA', iniciador: 'Auditoría interna (ficticia)' });
await adjuntar(mesa, duplicado.id, 'nota-de-pedido-copia.pdf', 'Copia de la nota de pedido');
await admin('POST', `/expedientes/${duplicado.id}/desactivar`, { motivo: `Duplicado de ${informe.numero}: se cargó dos veces la misma nota` });

console.error('Datos de demostración cargados: 12 expedientes nuevos (1 desactivado), con pases, documentos, tareas y actuaciones.');
console.log(JSON.stringify({ licitacion: licitacion.id, reclamo: reclamo.id, nota: nota.id }));
} catch (err) {
  // En GitHub Actions el mensaje queda como anotación visible sin abrir el log.
  console.error(`::error title=Datos de demostración::${String(err.message ?? err).replace(/\r?\n/g, ' ').slice(0, 500)}`);
  process.exit(1);
}
