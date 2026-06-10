import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CatalogModule } from '../catalog/catalog.module';

/**
 * Tracking: adesões (trackers) e capturas — coração da mecânica de Pokédex.
 * TODO(Fase 1): POST /v1/dexes/:id/trackers, PUT /v1/trackers/:id/captures/:stableId
 * (idempotente, ADR 005) e POST /v1/sync/captures.
 */
@Module({
  imports: [IdentityModule, CatalogModule],
})
export class TrackingModule {}
