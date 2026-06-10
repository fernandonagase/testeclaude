import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { MeController } from './me.controller';

@Module({
  controllers: [MeController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class IdentityModule {}
