/**
 * Documentos, actuaciones e historial de un expediente — Sprint 4.
 * Se montan dentro de /api/expedientes/:id (ver expedientes.routes.ts).
 *
 * GET  /:id/documentos                        → listar documentos            (expedientes.consultar)
 * POST /:id/documentos                        → adjuntar (cuerpo = archivo)  (documentos.adjuntar)
 * GET  /:id/documentos/:documentoId/descarga  → descargar                    (documentos.descargar)
 * GET  /:id/actuaciones                       → listar actuaciones           (expedientes.consultar)
 * POST /:id/actuaciones                       → registrar actuación          (actuaciones.registrar)
 * GET  /:id/historial                         → línea de tiempo              (expedientes.consultar)
 *
 * Subida sin multer (ADR-12): el cuerpo es el archivo tal cual; el nombre va en
 * X-Nombre-Archivo y la descripción opcional en X-Descripcion (ambos con encodeURIComponent).
 */
import express, { type Request, Router } from 'express';
import type { ActuacionesService } from '../../modules/actuaciones/actuaciones.service.js';
import type { DocumentosService } from '../../modules/documentos/documentos.service.js';
import type { ExpedientesService } from '../../modules/expedientes/expedientes.service.js';
import type { HistorialService } from '../../modules/historial/historial.service.js';
import { ValidationError } from '../../shared/errors.js';
import { sendData } from '../../shared/http.js';
import { contexto, requierePermiso, usuarioActual } from '../middlewares/auth.js';
import { crearActuacionSchema, encabezadosArchivoSchema, idDocumentoSchema } from '../schemas/anexos.schemas.js';
import { idExpedienteSchema } from '../schemas/expedientes.schemas.js';
import { expedienteVisible } from './expedientes.routes.js';

export interface AnexosDeps {
  documentos: DocumentosService;
  actuaciones: ActuacionesService;
  historial: HistorialService;
  maxBytes: number;
}

function decodificar(valor: string | undefined, campo: string): string | undefined {
  if (valor === undefined) return undefined;
  try {
    return decodeURIComponent(valor);
  } catch {
    throw new ValidationError([{ field: campo, message: 'Valor mal codificado' }]);
  }
}

/** Nombre seguro para Content-Disposition (con versión ASCII y versión UTF-8). */
function contentDisposition(nombre: string): string {
  const ascii = nombre.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombre)}`;
}

export function anexosRouter(expedientes: ExpedientesService, deps: AnexosDeps): Router {
  const router = Router({ mergeParams: true });

  const expedienteDe = (req: Request, res: express.Response) =>
    expedienteVisible(expedientes, idExpedienteSchema.parse(req.params).id, usuarioActual(res)!);

  // ── Documentos ──────────────────────────────────────────────────

  router.get('/documentos', requierePermiso('expedientes.consultar'), async (req, res) => {
    const expediente = await expedienteDe(req, res);
    sendData(res, await deps.documentos.listar(expediente.id));
  });

  router.post(
    '/documentos',
    requierePermiso('documentos.adjuntar'),
    // Cualquier tipo de contenido llega como Buffer; el servicio decide si el tipo es válido.
    express.raw({ type: () => true, limit: deps.maxBytes }),
    async (req, res) => {
      const expediente = await expedienteDe(req, res);
      if (!Buffer.isBuffer(req.body)) {
        throw new ValidationError([{ field: 'archivo', message: 'El cuerpo de la petición debe ser el archivo' }]);
      }
      const encabezados = encabezadosArchivoSchema.parse({
        nombre: decodificar(req.get('x-nombre-archivo'), 'nombre'),
        descripcion: decodificar(req.get('x-descripcion'), 'descripcion'),
        tipoMime: req.get('content-type') ?? '',
      });
      const usuario = usuarioActual(res)!;
      const documento = await deps.documentos.adjuntar(
        expediente,
        { contenido: req.body, ...encabezados },
        usuario.id,
        contexto(req, res),
      );
      sendData(res, documento, 201);
    },
  );

  router.get('/documentos/:documentoId/descarga', requierePermiso('documentos.descargar'), async (req, res) => {
    const { documentoId } = idDocumentoSchema.parse(req.params);
    const expediente = await expedienteDe(req, res);
    const { documento, contenido } = await deps.documentos.descargar(
      expediente,
      documentoId,
      usuarioActual(res)!.id,
      contexto(req, res),
    );
    res.set({
      'Content-Type': documento.tipoMime,
      'Content-Length': String(contenido.length),
      'Content-Disposition': contentDisposition(documento.nombreOriginal),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    });
    res.end(contenido);
  });

  // ── Actuaciones y observaciones ─────────────────────────────────

  router.get('/actuaciones', requierePermiso('expedientes.consultar'), async (req, res) => {
    const expediente = await expedienteDe(req, res);
    sendData(res, await deps.actuaciones.listar(expediente.id));
  });

  router.post('/actuaciones', requierePermiso('actuaciones.registrar'), async (req, res) => {
    const expediente = await expedienteDe(req, res);
    const body = crearActuacionSchema.parse(req.body);
    const usuario = usuarioActual(res)!;
    sendData(res, await deps.actuaciones.registrar(expediente, body, usuario.id, contexto(req, res)), 201);
  });

  // ── Historial ───────────────────────────────────────────────────

  router.get('/historial', requierePermiso('expedientes.consultar'), async (req, res) => {
    const expediente = await expedienteDe(req, res);
    sendData(res, await deps.historial.obtener(expediente));
  });

  return router;
}
