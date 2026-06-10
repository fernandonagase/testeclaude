import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from './auth.service';

@Controller({ path: 'me', version: '1' })
@UseGuards(AuthGuard)
export class MeController {
  /** "Hello world autenticado" — critério de saída da Fase 0. */
  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser) {
    // TODO(Fase 1): carregar perfil persistido (handle, displayName, visibility).
    return { id: user.id };
  }
}
