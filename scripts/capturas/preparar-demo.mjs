// Datos de demostración para las capturas (y para la demo, S8-02): crea un recorrido completo
// a través de la API real. Uso: node preparar-demo.mjs [http://localhost:3000] > demo.json
// Usuarios del seed (contraseña 12345): mesa (Mesa de Entradas), jefe y funcionario (Asesoría Jurídica).
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

const mesa = await sesion('mesa');
const jefe = await sesion('jefe');
const deps = await mesa('GET', '/dependencias');
const ajur = deps.find((d) => d.codigo === 'AJUR');

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

// Documento y actuación en la licitación, y envío a Asesoría Jurídica.
await mesa('POST', `/expedientes/${licitacion.id}/documentos`, Buffer.from('%PDF-1.4\n% Documento de demostración (ficticio)\n'), {
  crudo: true,
  headers: {
    'Content-Type': 'application/pdf',
    'X-Nombre-Archivo': encodeURIComponent('pliego-de-bases.pdf'),
    'X-Descripcion': encodeURIComponent('Pliego de bases y condiciones'),
  },
});
await mesa('POST', `/expedientes/${licitacion.id}/actuaciones`, { tipo: 'ACTUACION', texto: 'Se verificó que la solicitud incluye el pliego de bases firmado.' });
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
await jefe('POST', `/expedientes/${licitacion.id}/actuaciones`, { tipo: 'OBSERVACION', texto: 'Falta la constancia de disponibilidad presupuestaria.' });

console.log(JSON.stringify({ licitacion: licitacion.id, reclamo: reclamo.id, nota: nota.id }));
