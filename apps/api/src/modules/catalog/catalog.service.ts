import { ForbiddenException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateDexInput, Dex } from '@collectdex/shared';
import { AnalyticsService } from '../analytics/analytics.service';

/**
 * Catálogo: ciclo de vida de Dexes e itens (doc 03).
 * Fase 0: armazenamento em memória para validar o esqueleto ponta a ponta.
 * TODO(Fase 1): persistir em PostgreSQL com versionamento (DexVersion + stableId).
 */
@Injectable()
export class CatalogService {
  private readonly dexes = new Map<string, Dex>();

  constructor(private readonly analytics: AnalyticsService) {}

  createDraft(creatorId: string, input: CreateDexInput): Dex {
    const dex: Dex = {
      id: randomUUID(),
      creatorId,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      status: 'draft',
      currentVersion: 0,
      trackersCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.dexes.set(dex.id, dex);
    return dex;
  }

  /**
   * Publica uma Dex (regras R1 e R2 do doc 03).
   * TODO(Fase 1): exigir ≥ 1 item — itens ainda não existem no esqueleto.
   */
  publish(dexId: string, requesterId: string): Dex {
    const dex = this.dexes.get(dexId);
    if (!dex) throw new UnprocessableEntityException('Dex inexistente');
    if (dex.creatorId !== requesterId) {
      throw new ForbiddenException('só o criador publica sua Dex (R1)');
    }
    dex.status = 'published';
    dex.currentVersion += 1;
    this.analytics.track('dex_published', {
      dexId: dex.id,
      category: dex.category,
      itemCount: 0,
      version: dex.currentVersion,
    });
    return dex;
  }

  findById(id: string): Dex | undefined {
    return this.dexes.get(id);
  }

  listPublished(): Dex[] {
    return [...this.dexes.values()].filter((dex) => dex.status === 'published');
  }
}
