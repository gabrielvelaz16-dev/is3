/**
 * Documentos de expedientes — Sprint 4 (S4-01, S4-02, S4-05; RF-08, RF-09, RNF-04).
 * Reglas: tipos permitidos verificados por extensión, tipo declarado y contenido real;
 * tamaño máximo; guardado con nombre aleatorio y hash SHA-256; integridad verificada al descargar.
 */
import type { DocumentoRecord, ExpedienteRecord, Repos } from '../../database/repositories.js';
import type { AlmacenamientoDocumentos } from '../../integrations/almacenamiento/almacenamiento.js';
import { sha256 } from '../../integrations/almacenamiento/almacenamiento.js';
import { AppError, NotFoundError, ValidationError } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';
import type { AuditoriaService, Contexto } from '../auditoria/auditoria.service.js';
import { verificarEditable } from '../expedientes/expedientes.service.js';

interface TipoPermitido {
  mime: string;
  extensiones: string[];
  /** El contenido real debe corresponder al tipo declarado (no alcanza con la extensión). */
  contenidoValido: (contenido: Buffer) => boolean;
  descripcion: string;
}

/** Compara los primeros bytes del archivo ("firma") desde una posición. */
const tieneFirma = (firma: number[] | string, desde = 0) => (c: Buffer) => {
  const bytes = typeof firma === 'string' ? [...Buffer.from(firma, 'latin1')] : firma;
  return bytes.every((byte, i) => c[desde + i] === byte);
};

const ZIP = tieneFirma([0x50, 0x4b, 0x03, 0x04]); // Los documentos de Office modernos son archivos ZIP.

/**
 * Texto plano: UTF-16 con su marca inicial (BOM), o bytes sin caracteres de control fuera de
 * tabulación, saltos de línea y salto de página (UTF-8 o ANSI). Un ejecutable o cualquier
 * binario renombrado como .txt tiene bytes nulos o de control, y se rechaza.
 */
export function esTextoPlano(c: Buffer): boolean {
  if (c.length >= 2 && ((c[0] === 0xff && c[1] === 0xfe) || (c[0] === 0xfe && c[1] === 0xff))) return c.length % 2 === 0;
  for (const byte of c) {
    if ((byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0c && byte !== 0x0d) || byte === 0x7f) return false;
  }
  return true;
}

export const TIPOS_PERMITIDOS: TipoPermitido[] = [
  { mime: 'application/pdf', extensiones: ['.pdf'], contenidoValido: tieneFirma('%PDF-'), descripcion: 'PDF' },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensiones: ['.docx'],
    contenidoValido: ZIP,
    descripcion: 'Word (.docx)',
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensiones: ['.xlsx'],
    contenidoValido: ZIP,
    descripcion: 'Excel (.xlsx)',
  },
  { mime: 'text/plain', extensiones: ['.txt'], contenidoValido: esTextoPlano, descripcion: 'texto (.txt)' },
  { mime: 'image/png', extensiones: ['.png'], contenidoValido: tieneFirma([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), descripcion: 'PNG' },
  { mime: 'image/jpeg', extensiones: ['.jpg', '.jpeg'], contenidoValido: tieneFirma([0xff, 0xd8, 0xff]), descripcion: 'JPG' },
  { mime: 'image/gif', extensiones: ['.gif'], contenidoValido: (c) => tieneFirma('GIF87a')(c) || tieneFirma('GIF89a')(c), descripcion: 'GIF' },
  { mime: 'image/webp', extensiones: ['.webp'], contenidoValido: (c) => tieneFirma('RIFF')(c) && tieneFirma('WEBP', 8)(c), descripcion: 'WEBP' },
];

/** Tipos que el navegador manda cuando no reconoce el archivo: entonces se deduce por la extensión. */
const TIPOS_GENERICOS = new Set(['', 'application/octet-stream']);

export const DESCRIPCION_TIPOS = TIPOS_PERMITIDOS.map((t) => t.descripcion).join(', ');

/** Datos del documento que salen por la API: sin el nombre interno del almacenamiento. */
export type DocumentoPublico = Omit<DocumentoRecord, 'nombreAlmacenado'>;

export function aDocumentoPublico(d: DocumentoRecord): DocumentoPublico {
  const { nombreAlmacenado: _oculto, ...resto } = d;
  return resto;
}

/** Deja solo el nombre del archivo (sin rutas ni caracteres de control) y lo acota a 255. */
export function limpiarNombre(nombre: string): string {
  const base = nombre.split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex
  return base.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(-255);
}

function extensionDe(nombre: string): string {
  const i = nombre.lastIndexOf('.');
  return i >= 0 ? nombre.slice(i).toLowerCase() : '';
}

export interface ArchivoEntrante {
  contenido: Buffer;
  nombre: string;
  tipoMime: string;
  descripcion?: string | null;
}

export class DocumentosService {
  constructor(
    private readonly repos: Repos,
    private readonly almacenamiento: AlmacenamientoDocumentos,
    private readonly auditoria: AuditoriaService,
    private readonly opciones: { maxBytes: number },
  ) {}

  async listar(expedienteId: number): Promise<DocumentoPublico[]> {
    return (await this.repos.documentos.listByExpediente(expedienteId)).map(aDocumentoPublico);
  }

  async adjuntar(
    expediente: ExpedienteRecord,
    archivo: ArchivoEntrante,
    usuarioId: number,
    ctx: Contexto = {},
  ): Promise<DocumentoPublico> {
    verificarEditable(expediente, 'adjuntar documentos a');

    const nombre = limpiarNombre(archivo.nombre);
    if (!nombre) {
      throw new ValidationError([{ field: 'nombre', message: 'Falta el nombre del archivo' }]);
    }
    if (archivo.contenido.length === 0) {
      throw new ValidationError([{ field: 'archivo', message: 'El archivo está vacío' }]);
    }
    if (archivo.contenido.length > this.opciones.maxBytes) {
      throw new AppError(413, 'PAYLOAD_TOO_LARGE', 'El archivo supera el tamaño máximo permitido');
    }

    const declarado = archivo.tipoMime.split(';')[0]!.trim().toLowerCase();
    const extension = extensionDe(nombre);
    const tipo = TIPOS_GENERICOS.has(declarado)
      ? TIPOS_PERMITIDOS.find((t) => t.extensiones.includes(extension))
      : TIPOS_PERMITIDOS.find((t) => t.mime === declarado);
    const tipoValido = tipo && tipo.extensiones.includes(extension) && tipo.contenidoValido(archivo.contenido);
    if (!tipoValido) {
      throw new ValidationError(
        [{ field: 'archivo', message: `Tipo de archivo no permitido. Se aceptan: ${DESCRIPCION_TIPOS}` }],
        'Tipo de archivo no permitido',
      );
    }

    const { nombreAlmacenado, hashSha256 } = await this.almacenamiento.guardar(archivo.contenido);
    const documento = await this.repos.documentos.create({
      expedienteId: expediente.id,
      nombreOriginal: nombre,
      nombreAlmacenado,
      tipoMime: tipo.mime,
      tamanoBytes: archivo.contenido.length,
      hashSha256,
      descripcion: archivo.descripcion?.trim() || null,
      subidoPorId: usuarioId,
    });

    await this.auditoria.registrar({ ...ctx, usuarioId }, {
      accion: 'documento.adjuntar',
      resultado: 'EXITO',
      entidad: 'Documento',
      entidadId: String(documento.id),
      detalle: { expediente: expediente.numero, nombre, tamanoBytes: documento.tamanoBytes, hashSha256 },
    });

    return aDocumentoPublico(documento);
  }

  /** Devuelve el archivo solo si pertenece al expediente y su hash coincide con el registrado (RNF-04). */
  async descargar(
    expediente: ExpedienteRecord,
    documentoId: number,
    usuarioId: number,
    ctx: Contexto = {},
  ): Promise<{ documento: DocumentoPublico; contenido: Buffer }> {
    const documento = await this.repos.documentos.findById(documentoId);
    if (!documento || documento.expedienteId !== expediente.id) {
      throw new NotFoundError('Documento no encontrado');
    }

    const contenido = await this.almacenamiento.leer(documento.nombreAlmacenado);
    const integro = contenido !== null && sha256(contenido) === documento.hashSha256;
    if (!integro) {
      await this.auditoria.registrar({ ...ctx, usuarioId }, {
        accion: 'documento.descargar',
        resultado: 'FALLO',
        entidad: 'Documento',
        entidadId: String(documento.id),
        detalle: { motivo: contenido === null ? 'archivo inexistente' : 'hash distinto al registrado' },
      });
      logger.error('documento no disponible o alterado', { documentoId: documento.id, requestId: ctx.requestId });
      throw new AppError(500, 'INTERNAL_ERROR', 'El archivo no está disponible o fue alterado. Informe al administrador.');
    }

    await this.auditoria.registrar({ ...ctx, usuarioId }, {
      accion: 'documento.descargar',
      resultado: 'EXITO',
      entidad: 'Documento',
      entidadId: String(documento.id),
      detalle: { expediente: expediente.numero },
    });

    return { documento: aDocumentoPublico(documento), contenido };
  }
}
