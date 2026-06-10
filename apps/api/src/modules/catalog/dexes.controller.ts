import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { createDexInputSchema } from '@collectdex/shared';
import { AuthGuard } from '../identity/auth.guard';
import { CurrentUser } from '../identity/current-user.decorator';
import type { AuthenticatedUser } from '../identity/auth.service';
import { CatalogService } from './catalog.service';

@Controller({ path: 'dexes', version: '1' })
export class DexesController {
  constructor(private readonly catalog: CatalogService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const parsed = createDexInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.catalog.createDraft(user.id, parsed.data);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard)
  publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.catalog.publish(id, user.id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    const dex = this.catalog.findById(id);
    if (!dex) throw new NotFoundException();
    // TODO(Fase 1): incluir itens da versão corrente; emitir evento dex_viewed.
    return dex;
  }
}
