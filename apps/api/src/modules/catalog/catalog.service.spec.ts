import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import type { AnalyticsService } from '../analytics/analytics.service';

function makeService() {
  const analytics = { track: vi.fn() };
  const service = new CatalogService(analytics as unknown as AnalyticsService);
  return { service, analytics };
}

describe('CatalogService', () => {
  it('cria Dex como rascunho, invisível na busca (R2)', () => {
    const { service } = makeService();
    const dex = service.createDraft('user-1', { title: 'Aves do Cerrado', category: 'natureza' });
    expect(dex.status).toBe('draft');
    expect(service.listPublished()).toHaveLength(0);
  });

  it('publicar torna a Dex visível e emite dex_published', () => {
    const { service, analytics } = makeService();
    const dex = service.createDraft('user-1', { title: 'Aves do Cerrado', category: 'natureza' });
    const published = service.publish(dex.id, 'user-1');
    expect(published.status).toBe('published');
    expect(published.currentVersion).toBe(1);
    expect(service.listPublished()).toHaveLength(1);
    expect(analytics.track).toHaveBeenCalledWith(
      'dex_published',
      expect.objectContaining({ dexId: dex.id, category: 'natureza' }),
    );
  });

  it('só o criador publica (R1)', () => {
    const { service } = makeService();
    const dex = service.createDraft('user-1', { title: 'Aves do Cerrado', category: 'natureza' });
    expect(() => service.publish(dex.id, 'user-2')).toThrow(ForbiddenException);
  });
});
