import { describe, expect, it } from 'vitest';
import { computeProgress } from './domain';
import { captureInputSchema, createDexInputSchema } from './api';

describe('computeProgress', () => {
  it('retorna 0 para Dex sem itens', () => {
    expect(computeProgress(0, 0)).toBe(0);
  });

  it('calcula a fração de capturas', () => {
    expect(computeProgress(37, 120)).toBeCloseTo(37 / 120);
  });

  it('nunca excede 100% (capturas legacy podem superar itens da versão atual)', () => {
    expect(computeProgress(15, 10)).toBe(1);
  });
});

describe('createDexInputSchema', () => {
  it('aceita uma Dex válida', () => {
    const result = createDexInputSchema.safeParse({
      title: 'Aves do Cerrado',
      category: 'natureza',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita categoria desconhecida', () => {
    const result = createDexInputSchema.safeParse({ title: 'Lista', category: 'esportes' });
    expect(result.success).toBe(false);
  });
});

describe('captureInputSchema', () => {
  it('exige clientCaptureId como UUID (idempotência do sync offline)', () => {
    const result = captureInputSchema.safeParse({
      clientCaptureId: 'nao-e-uuid',
      capturedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
