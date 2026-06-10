import { z } from 'zod';
import { DEX_CATEGORIES } from './domain';

/**
 * Schemas de validação dos contratos da API v1 (doc 04, seção 4).
 * Usados pelo backend para validar entrada e pelos clientes para tipar requisições.
 */

export const createDexInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  category: z.enum(DEX_CATEGORIES),
});
export type CreateDexInput = z.infer<typeof createDexInputSchema>;

export const captureInputSchema = z.object({
  /** UUID gerado no cliente — chave de idempotência da sincronização offline (ADR 005). */
  clientCaptureId: z.string().uuid(),
  capturedAt: z.string().datetime(),
  note: z.string().trim().max(1000).optional(),
});
export type CaptureInput = z.infer<typeof captureInputSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  db: z.enum(['ok', 'unconfigured', 'error']),
  version: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
