/**
 * Dashboard de estadísticas — Sprint 6 (S6-01, RF-18).
 * Cada usuario ve los números de su dependencia; quien tiene `expedientes.consultar_todas`
 * ve los de toda la institución (la misma regla que el listado de expedientes).
 * S6-04: estos números se verifican contra conteos directos en PostgreSQL en la CI.
 */
import type { IndicadoresSeguimiento, Repos, ResumenExpedientes } from '../../database/repositories.js';
import { DIAS_AVISO } from '../pendientes/pendientes.service.js';

const DIA_MS = 24 * 60 * 60 * 1000;

export interface Dashboard {
  alcance: { tipo: 'INSTITUCION' } | { tipo: 'DEPENDENCIA'; dependencia: { id: number; codigo: string; nombre: string } };
  generadoEn: Date;
  diasAviso: number;
  resumen: ResumenExpedientes;
  seguimiento: IndicadoresSeguimiento;
}

export class EstadisticasService {
  constructor(
    private readonly repos: Repos,
    private readonly opciones: { now?: () => Date } = {},
  ) {}

  async dashboard(usuario: { dependencia: { id: number; codigo: string; nombre: string }; permisos: string[] }): Promise<Dashboard> {
    const ahora = this.opciones.now?.() ?? new Date();
    const todas = usuario.permisos.includes('expedientes.consultar_todas');
    const dependenciaId = todas ? undefined : usuario.dependencia.id;
    const [resumen, seguimiento] = await Promise.all([
      this.repos.estadisticas.resumen({ dependenciaId }),
      this.repos.estadisticas.seguimiento({ dependenciaId, ahora, hasta: new Date(ahora.getTime() + DIAS_AVISO * DIA_MS) }),
    ]);
    return {
      alcance: todas
        ? { tipo: 'INSTITUCION' }
        : { tipo: 'DEPENDENCIA', dependencia: { id: usuario.dependencia.id, codigo: usuario.dependencia.codigo, nombre: usuario.dependencia.nombre } },
      generadoEn: ahora,
      diasAviso: DIAS_AVISO,
      resumen,
      seguimiento,
    };
  }
}
