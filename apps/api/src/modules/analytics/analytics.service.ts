import { Injectable, Logger } from '@nestjs/common';
import type { ProductEventMap, ProductEventName } from '@collectdex/shared';

/**
 * Pipeline de eventos de produto (doc 04, seção 6).
 * Fase 0: emite logs estruturados (JSON) que podem ser coletados por qualquer
 * agregador. Trocar o destino por um provedor de analytics é alteração local aqui.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger('ProductAnalytics');

  track<E extends ProductEventName>(event: E, payload: ProductEventMap[E]): void {
    this.logger.log(
      JSON.stringify({ type: 'product_event', event, payload, ts: new Date().toISOString() }),
    );
  }
}
