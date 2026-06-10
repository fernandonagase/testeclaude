import { describe, expect, it } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loadEnv } from '../../config/env';

function makeService(envOverrides: Record<string, string>): AuthService {
  const env = loadEnv({ NODE_ENV: 'test', ...envOverrides });
  return new AuthService(env);
}

describe('AuthService', () => {
  it('aceita token dev quando AUTH_ALLOW_DEV_TOKEN está ativo', async () => {
    const service = makeService({ AUTH_ALLOW_DEV_TOKEN: 'true' });
    await expect(service.verifyToken('dev:user-123')).resolves.toEqual({ id: 'user-123' });
  });

  it('rejeita token dev sem userId', async () => {
    const service = makeService({ AUTH_ALLOW_DEV_TOKEN: 'true' });
    await expect(service.verifyToken('dev:')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita token dev quando o modo dev está desligado e não há JWKS', async () => {
    const service = makeService({});
    await expect(service.verifyToken('dev:user-123')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('loadEnv recusa AUTH_ALLOW_DEV_TOKEN em produção', () => {
    expect(() => loadEnv({ NODE_ENV: 'production', AUTH_ALLOW_DEV_TOKEN: 'true' })).toThrow();
  });
});
