import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ENV, type Env } from '../../config/env';

export interface AuthenticatedUser {
  id: string;
}

/**
 * Autenticação delegada a provedor gerenciado (doc 04): a API só valida o JWT
 * emitido pelo provedor via JWKS. Fora de produção, tokens "dev:<userId>"
 * permitem desenvolvimento sem credenciais (saída da Fase 0).
 */
@Injectable()
export class AuthService {
  constructor(@Inject(ENV) private readonly env: Env) {}

  async verifyToken(token: string): Promise<AuthenticatedUser> {
    if (this.env.AUTH_ALLOW_DEV_TOKEN && token.startsWith('dev:')) {
      const userId = token.slice('dev:'.length);
      if (!userId) throw new UnauthorizedException('dev token sem userId');
      return { id: userId };
    }

    if (!this.env.AUTH_JWKS_URL) {
      throw new UnauthorizedException('autenticação não configurada (AUTH_JWKS_URL ausente)');
    }
    return this.verifyJwt(token);
  }

  private async verifyJwt(token: string): Promise<AuthenticatedUser> {
    // jose é ESM-only; import dinâmico para interoperar com o build CJS do Nest.
    const { createRemoteJWKSet, jwtVerify } = await import('jose');
    const jwks = createRemoteJWKSet(new URL(this.env.AUTH_JWKS_URL!));
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: this.env.AUTH_ISSUER,
        audience: this.env.AUTH_AUDIENCE,
      });
      if (!payload.sub) throw new Error('token sem subject');
      return { id: payload.sub };
    } catch {
      throw new UnauthorizedException('token inválido');
    }
  }
}
