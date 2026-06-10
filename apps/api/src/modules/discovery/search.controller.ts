import { Controller, Get } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';

@Controller({ path: 'dexes', version: '1' })
export class SearchController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list() {
    // TODO(Fase 3): query, category, sort + paginação.
    return { items: this.catalog.listPublished() };
  }
}
