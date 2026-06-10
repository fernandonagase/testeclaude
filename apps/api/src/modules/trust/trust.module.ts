import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';

/**
 * Trust & safety: denúncias, moderação e LGPD (doc 02, épico E).
 * TODO(Fase 2): POST /v1/reports, fila de moderação, GET /v1/me/export, DELETE /v1/me.
 */
@Module({
  imports: [IdentityModule],
})
export class TrustModule {}
