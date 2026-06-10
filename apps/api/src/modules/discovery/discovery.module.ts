import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { SearchController } from './search.controller';

/**
 * Discovery: busca e descoberta de Dexes (doc 02, épico D).
 * Fase 0: listagem simples. TODO(Fase 3): filtros, ordenação por popularidade,
 * full-text search do PostgreSQL (ADR 006).
 */
@Module({
  imports: [CatalogModule],
  controllers: [SearchController],
})
export class DiscoveryModule {}
