/**
 * Reportes — Sprint 6 (S6-02 consultar con filtros, S6-03 exportar; RF-19).
 * Las mismas reglas de alcance que el listado: sin `expedientes.consultar_todas`
 * solo se reporta la dependencia del usuario.
 */
import type {
  EstadoExpediente,
  ExpedienteRecord,
  FiltrosReporte,
  Prioridad,
  Repos,
  ResumenExpedientes,
} from '../../database/repositories.js';
import { ForbiddenError, ValidationError } from '../../shared/errors.js';
import { fechaCompacta, fechaLocal, formatoFecha } from '../../shared/fechas.js';
import type { AuditoriaService, Contexto } from '../auditoria/auditoria.service.js';

/** Máximo de filas de una exportación; con más, se pide acotar los filtros. */
export const MAX_FILAS_EXPORTACION = 5000;

export interface FiltrosReporteInput {
  /** AAAA-MM-DD, fecha de creación desde (inclusive, hora local). */
  desde?: string;
  /** AAAA-MM-DD, fecha de creación hasta (inclusive, hora local). */
  hasta?: string;
  estado?: EstadoExpediente;
  prioridad?: Prioridad;
  tipo?: string;
  dependenciaId?: number;
}

interface UsuarioReporte {
  id: number;
  dependencia: { id: number };
  permisos: string[];
}

const ESTADO_TEXTO: Record<EstadoExpediente, string> = {
  BORRADOR: 'Borrador',
  EN_TRAMITE: 'En trámite',
  EN_REVISION: 'En revisión',
  RESUELTO: 'Resuelto',
  ARCHIVADO: 'Archivado',
};
const PRIORIDAD_TEXTO: Record<Prioridad, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };

/**
 * Celda CSV: comillas cuando hace falta y protección contra fórmulas
 * (un valor que empieza con = + - @ se antepone con ' para que Excel no lo ejecute).
 */
export function celdaCsv(valor: string | number | null | undefined): string {
  let s = valor === null || valor === undefined ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const COLUMNAS_CSV = [
  'Número',
  'Carátula',
  'Tipo',
  'Iniciador',
  'Estado',
  'Prioridad',
  'Dependencia actual',
  'Responsable',
  'Creado',
  'Vencimiento',
  'En tránsito hacia',
] as const;

function filaCsv(e: ExpedienteRecord): string {
  return [
    e.numero,
    e.caratula,
    e.tipo,
    e.iniciador,
    ESTADO_TEXTO[e.estado],
    PRIORIDAD_TEXTO[e.prioridad],
    e.dependenciaActual.nombre,
    e.responsable?.nombre ?? '',
    formatoFecha(e.creadoEn),
    formatoFecha(e.fechaVencimiento),
    e.paseEnTransito?.destino.nombre ?? '',
  ]
    .map(celdaCsv)
    .join(';');
}

export class ReportesService {
  constructor(
    private readonly repos: Repos,
    private readonly auditoria: AuditoriaService,
    private readonly opciones: { now?: () => Date } = {},
  ) {}

  /** Traduce los filtros recibidos y aplica el alcance del usuario. */
  filtrosPara(usuario: UsuarioReporte, input: FiltrosReporteInput): FiltrosReporte {
    const todas = usuario.permisos.includes('expedientes.consultar_todas');
    if (!todas && input.dependenciaId && input.dependenciaId !== usuario.dependencia.id) {
      throw new ForbiddenError('Solo puede consultar reportes de su dependencia');
    }
    const desde = input.desde ? fechaLocal(input.desde) : undefined;
    const hasta = input.hasta ? fechaLocal(input.hasta, true) : undefined;
    if (desde && hasta && desde.getTime() > hasta.getTime()) {
      throw new ValidationError([{ field: 'hasta', message: 'La fecha "hasta" no puede ser anterior a "desde"' }]);
    }
    return {
      estado: input.estado,
      prioridad: input.prioridad,
      tipo: input.tipo,
      dependenciaId: todas ? input.dependenciaId : usuario.dependencia.id,
      desde,
      hasta,
    };
  }

  async consultar(
    usuario: UsuarioReporte,
    input: FiltrosReporteInput,
    pagina: number,
    porPagina: number,
  ): Promise<{ resumen: ResumenExpedientes; items: ExpedienteRecord[]; total: number; pagina: number; porPagina: number }> {
    const filtros = this.filtrosPara(usuario, input);
    const [resumen, listado] = await Promise.all([
      this.repos.estadisticas.resumen(filtros),
      this.repos.expedientes.list({ ...filtros, skip: (pagina - 1) * porPagina, take: porPagina }),
    ]);
    return { resumen, items: listado.items, total: listado.total, pagina, porPagina };
  }

  async exportarCsv(
    usuario: UsuarioReporte,
    input: FiltrosReporteInput,
    ctx: Contexto = {},
  ): Promise<{ nombreArchivo: string; contenido: string; filas: number }> {
    const filtros = this.filtrosPara(usuario, input);
    const { items, total } = await this.repos.expedientes.list({ ...filtros, skip: 0, take: MAX_FILAS_EXPORTACION });
    if (total > MAX_FILAS_EXPORTACION) {
      throw new ValidationError(
        [{ message: `El reporte tiene ${total} expedientes; acote los filtros (máximo ${MAX_FILAS_EXPORTACION})` }],
        'El reporte es demasiado grande para exportarlo',
      );
    }
    // BOM: Excel reconoce UTF-8 (tildes y ñ). Separador ";" (configuración regional en español).
    const contenido = '﻿' + [COLUMNAS_CSV.join(';'), ...items.map(filaCsv)].join('\r\n') + '\r\n';
    const hoy = this.opciones.now?.() ?? new Date();
    const nombreArchivo = `reporte-expedientes-${fechaCompacta(hoy)}.csv`;

    await this.auditoria.registrar({ ...ctx, usuarioId: usuario.id }, {
      accion: 'reporte.exportar',
      resultado: 'EXITO',
      entidad: 'Reporte',
      detalle: { ...input, filas: items.length, formato: 'CSV' },
    });
    return { nombreArchivo, contenido, filas: items.length };
  }
}
