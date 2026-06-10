import { describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('emite evento como log estruturado JSON', () => {
    const spy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const service = new AnalyticsService();

    service.track('item_captured', {
      trackerId: 't-1',
      itemStableId: 'i-1',
      offlineSync: false,
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(line).toMatchObject({
      type: 'product_event',
      event: 'item_captured',
      payload: { trackerId: 't-1', itemStableId: 'i-1', offlineSync: false },
    });
    spy.mockRestore();
  });
});
