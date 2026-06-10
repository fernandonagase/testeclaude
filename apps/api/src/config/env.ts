import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  /** Provedor gerenciado de auth (doc 04): configurar em staging/prod. */
  AUTH_JWKS_URL: z.string().url().optional(),
  AUTH_ISSUER: z.string().optional(),
  AUTH_AUDIENCE: z.string().optional(),
  /** Aceita tokens "dev:<userId>" — somente fora de produção. */
  AUTH_ALLOW_DEV_TOKEN: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const env = envSchema.parse(source);
  if (env.NODE_ENV === 'production' && env.AUTH_ALLOW_DEV_TOKEN) {
    throw new Error('AUTH_ALLOW_DEV_TOKEN não pode estar ativo em produção');
  }
  return env;
}

export const ENV = Symbol('ENV');
