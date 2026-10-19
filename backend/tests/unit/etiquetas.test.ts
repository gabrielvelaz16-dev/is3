import { describe, expect, it } from 'vitest';
import { ESTADO_TAREA_TEXTO, ESTADO_TEXTO, PRIORIDAD_TEXTO, textoEstado } from '../../src/shared/etiquetas.js';

describe('Textos legibles (S8-03)', () => {
  it('cada estado tiene su texto, sin guiones bajos', () => {
    expect(Object.keys(ESTADO_TEXTO)).toEqual(['BORRADOR', 'EN_TRAMITE', 'EN_REVISION', 'RESUELTO', 'ARCHIVADO']);
    for (const texto of Object.values(ESTADO_TEXTO)) expect(texto).not.toMatch(/_/);
    expect(textoEstado('EN_TRAMITE')).toBe('En trámite');
  });

  it('un estado anterior vacío se muestra como guion', () => {
    expect(textoEstado(null)).toBe('—');
    expect(textoEstado(undefined)).toBe('—');
  });

  it('las prioridades tienen texto', () => {
    expect(PRIORIDAD_TEXTO).toEqual({ BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' });
  });

  it('los estados de tarea tienen texto', () => {
    expect(Object.values(ESTADO_TAREA_TEXTO)).toEqual(['Pendiente', 'En curso', 'Completada', 'Cancelada']);
  });
});
