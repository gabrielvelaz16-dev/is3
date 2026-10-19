import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { crearEntorno, PASSWORD_ADMIN, PASSWORD_USUARIO } from '../support/memoria.js';

type Entorno = Awaited<ReturnType<typeof crearEntorno>>;
type Agente = ReturnType<typeof request.agent>;

async function sesion(e: Entorno, usuario: string, password = PASSWORD_USUARIO) {
  const agente = request.agent(e.app);
  const r = await agente.post('/api/auth/login').send({ usuario, password });
  expect(r.status, `login ${usuario}`).toBe(200);
  return agente;
}

const EXPEDIENTE = {
  caratula: 'Pedido de informe técnico',
  asunto: 'Informe sobre el estado del edificio central',
  tipo: 'SOLICITUD',
  iniciador: 'Área de Mantenimiento',
};

// Contenidos mínimos con la "firma" real de cada tipo.
const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.from('contenido de prueba')]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const EXE = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]); // ejecutable de Windows ("MZ")
const TXT = Buffer.from('Nota de Mesa de Entradas\r\nSe recibió el pedido con 3 anexos.\tFolio 12\n', 'utf8');
const TXT_UTF16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('Nota en UTF-16', 'utf16le')]);
const GIF = Buffer.from('GIF89a\x01\x00\x01\x00', 'latin1');
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x0c, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);
const DOCX = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);

function subir(agente: Agente, expedienteId: number, contenido: Buffer, nombre: string, tipo: string, descripcion?: string) {
  const req = agente
    .post(`/api/expedientes/${expedienteId}/documentos`)
    .set('Content-Type', tipo)
    .set('X-Nombre-Archivo', encodeURIComponent(nombre));
  if (descripcion) req.set('X-Descripcion', encodeURIComponent(descripcion));
  return req.send(contenido);
}

/** Recibe el cuerpo binario de una descarga como Buffer. */
function binario(res: unknown, cb: (err: Error | null, body: Buffer) => void) {
  const flujo = res as NodeJS.ReadableStream;
  const partes: Buffer[] = [];
  flujo.on('data', (c: Buffer) => partes.push(c));
  flujo.on('end', () => cb(null, Buffer.concat(partes)));
}

describe('Documentos, actuaciones e historial (Sprint 4: RF-08 a RF-11)', () => {
  let e: Entorno;
  let admin: Agente;
  let expedienteId: number;

  beforeEach(async () => {
    e = await crearEntorno({ maxUploadBytes: 1024 });
    await e.agregarUsuario('mesa@institucion.test', PASSWORD_USUARIO, 'MESA_ENTRADAS', { dependenciaId: 2 });
    await e.agregarUsuario('auditor@institucion.test', PASSWORD_USUARIO, 'AUDITOR');
    admin = await sesion(e, 'admin', PASSWORD_ADMIN);
    expedienteId = (await admin.post('/api/expedientes').send(EXPEDIENTE)).body.data.id;
  });

  // ── Autorización ────────────────────────────────────────────────

  describe('autorización (S4-05, RNF-02)', () => {
    it('sin sesión, todas las rutas responden 401', async () => {
      for (const [metodo, ruta] of [
        ['get', `/api/expedientes/${expedienteId}/documentos`],
        ['post', `/api/expedientes/${expedienteId}/documentos`],
        ['get', `/api/expedientes/${expedienteId}/documentos/1/descarga`],
        ['get', `/api/expedientes/${expedienteId}/actuaciones`],
        ['post', `/api/expedientes/${expedienteId}/actuaciones`],
        ['get', `/api/expedientes/${expedienteId}/historial`],
      ] as const) {
        expect((await request(e.app)[metodo](ruta)).status, `${metodo} ${ruta}`).toBe(401);
      }
    });

    it('un auditor (sin documentos.adjuntar ni actuaciones.registrar) recibe 403, pero puede consultar y descargar', async () => {
      await subir(admin, expedienteId, PDF, 'informe.pdf', 'application/pdf');
      const auditor = await sesion(e, 'auditor');
      expect((await subir(auditor, expedienteId, PDF, 'otro.pdf', 'application/pdf')).status).toBe(403);
      expect((await auditor.post(`/api/expedientes/${expedienteId}/actuaciones`).send({ tipo: 'ACTUACION', texto: 'Intento' })).status).toBe(403);
      expect((await auditor.get(`/api/expedientes/${expedienteId}/documentos`)).status).toBe(200);
      expect((await auditor.get(`/api/expedientes/${expedienteId}/documentos/1/descarga`)).status).toBe(200);
    });

    it('un usuario de otra dependencia no puede ver, adjuntar, descargar ni registrar (403)', async () => {
      await subir(admin, expedienteId, PDF, 'informe.pdf', 'application/pdf'); // expediente en Administración General
      const mesa = await sesion(e, 'mesa'); // Mesa de Entradas, sin consultar_todas
      expect((await mesa.get(`/api/expedientes/${expedienteId}/documentos`)).status).toBe(403);
      expect((await subir(mesa, expedienteId, PDF, 'x.pdf', 'application/pdf')).status).toBe(403);
      expect((await mesa.get(`/api/expedientes/${expedienteId}/documentos/1/descarga`)).status).toBe(403);
      expect((await mesa.get(`/api/expedientes/${expedienteId}/historial`)).status).toBe(403);
      expect(e.documentos).toHaveLength(1);
    });

    it('responde 404 si el expediente no existe', async () => {
      expect((await admin.get('/api/expedientes/9999/documentos')).status).toBe(404);
      expect((await admin.get('/api/expedientes/9999/historial')).status).toBe(404);
    });
  });

  // ── Adjuntar documentos (S4-01, S4-02) ──────────────────────────

  describe('adjuntar documentos (S4-01, S4-02, RF-08, RNF-04)', () => {
    it('adjunta un PDF: guarda nombre aleatorio y hash SHA-256, sin exponer el nombre interno', async () => {
      const res = await subir(admin, expedienteId, PDF, 'Informe técnico Nº 1.pdf', 'application/pdf', 'Informe inicial');
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        expedienteId,
        nombreOriginal: 'Informe técnico Nº 1.pdf',
        tipoMime: 'application/pdf',
        tamanoBytes: PDF.length,
        descripcion: 'Informe inicial',
        subidoPor: { username: 'admin' },
      });
      expect(res.body.data.hashSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(res.body.data.nombreAlmacenado).toBeUndefined();
      // El archivo quedó guardado con un nombre UUID, no con el nombre original.
      const [nombreInterno] = [...e.almacenamiento.archivos.keys()];
      expect(nombreInterno).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('lista los documentos del expediente', async () => {
      await subir(admin, expedienteId, PDF, 'a.pdf', 'application/pdf');
      await subir(admin, expedienteId, PNG, 'foto.png', 'image/png');
      const res = await admin.get(`/api/expedientes/${expedienteId}/documentos`);
      expect(res.status).toBe(200);
      expect(res.body.data.map((d: { nombreOriginal: string }) => d.nombreOriginal)).toEqual(['a.pdf', 'foto.png']);
    });

    it('acepta texto (.txt en UTF-8 o UTF-16), Word y las imágenes GIF y WEBP', async () => {
      const casos: [Buffer, string, string][] = [
        [TXT, 'nota.txt', 'text/plain'],
        [TXT_UTF16, 'nota-unicode.txt', 'text/plain;charset=utf-16'],
        [DOCX, 'dictamen.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        [GIF, 'sello.gif', 'image/gif'],
        [WEBP, 'foto.webp', 'image/webp'],
      ];
      for (const [contenido, nombre, tipo] of casos) {
        const res = await subir(admin, expedienteId, contenido, nombre, tipo);
        expect(res.status, nombre).toBe(201);
        expect(res.body.data.tipoMime, nombre).toBe(tipo.split(';')[0]);
      }
    });

    it('si el navegador no informa el tipo, lo deduce por la extensión y verifica el contenido igual', async () => {
      const ok = await subir(admin, expedienteId, TXT, 'nota.txt', 'application/octet-stream');
      expect(ok.status).toBe(201);
      expect(ok.body.data.tipoMime).toBe('text/plain');
      expect((await subir(admin, expedienteId, EXE, 'factura.pdf', 'application/octet-stream')).status).toBe(400);
    });

    it('rechaza un binario renombrado como .txt o como imagen (400)', async () => {
      expect((await subir(admin, expedienteId, EXE, 'leame.txt', 'text/plain')).status).toBe(400);
      expect((await subir(admin, expedienteId, PNG, 'imagen.gif', 'image/gif')).status).toBe(400);
      expect((await subir(admin, expedienteId, Buffer.from('RIFF0000WAVE'), 'audio.webp', 'image/webp')).status).toBe(400);
      expect(e.documentos).toHaveLength(0);
    });

    it('rechaza un tipo no permitido (400)', async () => {
      const res = await subir(admin, expedienteId, EXE, 'programa.exe', 'application/octet-stream');
      expect(res.status).toBe(400);
      expect(res.body.error.details[0].field).toBe('archivo');
      expect(e.documentos).toHaveLength(0);
    });

    it('rechaza un ejecutable renombrado como PDF: el contenido no coincide con el tipo (400)', async () => {
      const res = await subir(admin, expedienteId, EXE, 'factura.pdf', 'application/pdf');
      expect(res.status).toBe(400);
      expect(e.almacenamiento.archivos.size).toBe(0);
    });

    it('rechaza una extensión que no corresponde al tipo declarado (400)', async () => {
      expect((await subir(admin, expedienteId, PDF, 'informe.png', 'application/pdf')).status).toBe(400);
    });

    it('rechaza un archivo vacío (400) y uno sin nombre (400)', async () => {
      expect((await subir(admin, expedienteId, Buffer.alloc(0), 'vacio.pdf', 'application/pdf')).status).toBe(400);
      const sinNombre = await admin
        .post(`/api/expedientes/${expedienteId}/documentos`)
        .set('Content-Type', 'application/pdf')
        .send(PDF);
      expect(sinNombre.status).toBe(400);
    });

    it('rechaza un archivo que supera el tamaño máximo (413)', async () => {
      const grande = Buffer.concat([PDF, Buffer.alloc(2048)]); // el entorno de prueba admite 1 KB
      const res = await subir(admin, expedienteId, grande, 'grande.pdf', 'application/pdf');
      expect(res.status).toBe(413);
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it('quita rutas del nombre del archivo (no se puede escribir fuera de la carpeta)', async () => {
      const res = await subir(admin, expedienteId, PDF, '../../etc/informe.pdf', 'application/pdf');
      expect(res.status).toBe(201);
      expect(res.body.data.nombreOriginal).toBe('informe.pdf');
    });

    it('registra la carga en la auditoría con el hash', async () => {
      const res = await subir(admin, expedienteId, PDF, 'a.pdf', 'application/pdf');
      const evento = e.auditoria.find((a) => a.accion === 'documento.adjuntar');
      expect(evento?.resultado).toBe('EXITO');
      expect(evento?.detalle).toMatchObject({ hashSha256: res.body.data.hashSha256 });
    });
  });

  // ── Descargar (S4-05) ───────────────────────────────────────────

  describe('descargar documentos (S4-05, RF-09)', () => {
    it('descarga el archivo íntegro como adjunto, con nombre y encabezados seguros', async () => {
      const { body } = await subir(admin, expedienteId, PDF, 'Informe técnico.pdf', 'application/pdf');
      const res = await admin
        .get(`/api/expedientes/${expedienteId}/documentos/${body.data.id}/descarga`)
        .buffer(true)
        .parse(binario);
      expect(res.status).toBe(200);
      expect(Buffer.compare(res.body as Buffer, PDF)).toBe(0);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain("filename*=UTF-8''Informe%20t%C3%A9cnico.pdf");
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(e.auditoria.some((a) => a.accion === 'documento.descargar' && a.resultado === 'EXITO')).toBe(true);
    });

    it('no permite descargar un documento usando el id de otro expediente (404)', async () => {
      const { body } = await subir(admin, expedienteId, PDF, 'a.pdf', 'application/pdf');
      const otro = (await admin.post('/api/expedientes').send({ ...EXPEDIENTE, caratula: 'Otro expediente' })).body.data.id;
      expect((await admin.get(`/api/expedientes/${otro}/documentos/${body.data.id}/descarga`)).status).toBe(404);
    });

    it('si el archivo fue alterado, no lo entrega y deja constancia (500 genérico + auditoría FALLO)', async () => {
      const { body } = await subir(admin, expedienteId, PDF, 'a.pdf', 'application/pdf');
      const [nombreInterno] = [...e.almacenamiento.archivos.keys()];
      e.almacenamiento.archivos.set(nombreInterno!, Buffer.from('%PDF-1.7 contenido alterado'));
      const res = await admin.get(`/api/expedientes/${expedienteId}/documentos/${body.data.id}/descarga`);
      expect(res.status).toBe(500);
      expect(res.body.error.message).not.toContain(nombreInterno);
      expect(e.auditoria.some((a) => a.accion === 'documento.descargar' && a.resultado === 'FALLO')).toBe(true);
    });
  });

  // ── Actuaciones (S4-03) ─────────────────────────────────────────

  describe('actuaciones y observaciones (S4-03, RF-10)', () => {
    it('registra una actuación con fecha y autor puestos por el servidor', async () => {
      const funcionario = await sesion(e, 'funcionario'); // misma dependencia que el expediente
      const res = await funcionario
        .post(`/api/expedientes/${expedienteId}/actuaciones`)
        .send({ tipo: 'ACTUACION', texto: '  Se solicita informe al área técnica.  ' });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ tipo: 'ACTUACION', texto: 'Se solicita informe al área técnica.', autor: { username: 'funcionario' } });
      expect(res.body.data.fecha).toBeTruthy();
      expect(e.auditoria.some((a) => a.accion === 'actuacion.registrar')).toBe(true);
    });

    it('registra observaciones y las lista en orden', async () => {
      await admin.post(`/api/expedientes/${expedienteId}/actuaciones`).send({ tipo: 'ACTUACION', texto: 'Primera' });
      await admin.post(`/api/expedientes/${expedienteId}/actuaciones`).send({ tipo: 'OBSERVACION', texto: 'Falta la firma' });
      const res = await admin.get(`/api/expedientes/${expedienteId}/actuaciones`);
      expect(res.body.data.map((a: { tipo: string }) => a.tipo)).toEqual(['ACTUACION', 'OBSERVACION']);
      expect(e.auditoria.some((a) => a.accion === 'observacion.registrar')).toBe(true);
    });

    it('rechaza texto vacío, tipo inválido o campos que pone el servidor (400)', async () => {
      const ruta = `/api/expedientes/${expedienteId}/actuaciones`;
      expect((await admin.post(ruta).send({ tipo: 'ACTUACION', texto: '  ' })).status).toBe(400);
      expect((await admin.post(ruta).send({ tipo: 'NOTA', texto: 'Texto válido' })).status).toBe(400);
      expect((await admin.post(ruta).send({ tipo: 'ACTUACION', texto: 'Texto válido', autorId: 99 })).status).toBe(400);
    });

    it('no existen rutas para editar ni borrar actuaciones', async () => {
      const { body } = await admin.post(`/api/expedientes/${expedienteId}/actuaciones`).send({ tipo: 'ACTUACION', texto: 'Original' });
      expect((await admin.patch(`/api/expedientes/${expedienteId}/actuaciones/${body.data.id}`).send({ texto: 'X' })).status).toBe(404);
      expect((await admin.delete(`/api/expedientes/${expedienteId}/actuaciones/${body.data.id}`)).status).toBe(404);
    });
  });

  // ── Expediente archivado ────────────────────────────────────────

  describe('expediente archivado', () => {
    it('no admite documentos ni actuaciones nuevas (409), pero se puede consultar y descargar', async () => {
      const { body } = await subir(admin, expedienteId, PDF, 'a.pdf', 'application/pdf');
      for (const estado of ['EN_TRAMITE', 'RESUELTO', 'ARCHIVADO']) {
        expect((await admin.post(`/api/expedientes/${expedienteId}/estado`).send({ estado })).status).toBe(200);
      }
      expect((await subir(admin, expedienteId, PDF, 'b.pdf', 'application/pdf')).status).toBe(409);
      expect((await admin.post(`/api/expedientes/${expedienteId}/actuaciones`).send({ tipo: 'ACTUACION', texto: 'Tarde' })).status).toBe(409);
      expect((await admin.get(`/api/expedientes/${expedienteId}/documentos/${body.data.id}/descarga`)).status).toBe(200);
    });
  });

  // ── Historial (S4-04) ───────────────────────────────────────────

  describe('historial del expediente (S4-04, RF-11)', () => {
    it('muestra creación, cambios de estado, documentos y actuaciones en orden cronológico', async () => {
      await admin.post(`/api/expedientes/${expedienteId}/estado`).send({ estado: 'EN_TRAMITE' });
      await subir(admin, expedienteId, PDF, 'informe.pdf', 'application/pdf');
      await admin.post(`/api/expedientes/${expedienteId}/actuaciones`).send({ tipo: 'OBSERVACION', texto: 'Revisar el anexo' });
      await admin.post(`/api/expedientes/${expedienteId}/estado`).send({ estado: 'EN_REVISION' });

      const res = await admin.get(`/api/expedientes/${expedienteId}/historial`);
      expect(res.status).toBe(200);
      const eventos = res.body.data as { tipo: string; fecha: string; descripcion: string; usuario: { username: string } }[];
      expect(eventos.map((ev) => ev.tipo)).toEqual(['CREACION', 'CAMBIO_ESTADO', 'DOCUMENTO', 'OBSERVACION', 'CAMBIO_ESTADO']);
      expect(eventos[1]).toMatchObject({ estadoAnterior: 'BORRADOR', estadoNuevo: 'EN_TRAMITE' });
      expect(eventos[2]!.descripcion).toContain('informe.pdf');
      expect(eventos.every((ev) => ev.usuario.username === 'admin')).toBe(true);
      const fechas = eventos.map((ev) => new Date(ev.fecha).getTime());
      expect([...fechas].sort((a, b) => a - b)).toEqual(fechas);
    });

    it('una modificación sin cambio de estado no agrega eventos de estado', async () => {
      await admin.patch(`/api/expedientes/${expedienteId}`).send({ caratula: 'Carátula corregida' });
      const res = await admin.get(`/api/expedientes/${expedienteId}/historial`);
      expect(res.body.data.map((ev: { tipo: string }) => ev.tipo)).toEqual(['CREACION']);
      expect(e.cambiosEstado).toHaveLength(0);
    });
  });
});
