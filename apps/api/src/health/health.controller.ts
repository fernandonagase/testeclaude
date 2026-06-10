import { Controller, Get, Inject, VERSION_NEUTRAL } from '@nestjs/common';
import { Pool } from 'pg';
import type { HealthResponse } from '@collectdex/shared';
import { ENV, type Env } from '../config/env';

@Controller({ path: 'healthz', version: VERSION_NEUTRAL })
export class HealthController {
  private pool: Pool | undefined;

  constructor(@Inject(ENV) private readonly env: Env) {}

  @Get()
  async check(): Promise<HealthResponse> {
    return {
      status: 'ok',
      db: await this.checkDb(),
      version: process.env.npm_package_version ?? '0.0.1',
    };
  }

  private async checkDb(): Promise<HealthResponse['db']> {
    if (!this.env.DATABASE_URL) return 'unconfigured';
    try {
      this.pool ??= new Pool({ connectionString: this.env.DATABASE_URL, max: 1 });
      await this.pool.query('SELECT 1');
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
