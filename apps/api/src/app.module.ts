import { Module } from '@nestjs/common';
import { EnvModule } from './config/env.module';
import { HealthController } from './health/health.controller';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { IdentityModule } from './modules/identity/identity.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { TrustModule } from './modules/trust/trust.module';

/**
 * Monolito modular (ADR 001): fronteiras de módulo = fronteiras do domínio.
 * Comunicação entre módulos somente via providers exportados.
 */
@Module({
  imports: [
    EnvModule,
    AnalyticsModule,
    IdentityModule,
    CatalogModule,
    TrackingModule,
    DiscoveryModule,
    TrustModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
