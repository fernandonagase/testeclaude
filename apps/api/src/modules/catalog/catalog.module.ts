import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CatalogService } from './catalog.service';
import { DexesController } from './dexes.controller';

@Module({
  imports: [IdentityModule],
  controllers: [DexesController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
