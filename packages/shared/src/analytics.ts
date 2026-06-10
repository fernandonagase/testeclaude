/**
 * Eventos de produto instrumentados desde o dia 1 (doc 04, seção 6).
 * As hipóteses H1–H4 do doc 01 dependem destes eventos.
 */

export interface ProductEventMap {
  user_signed_up: { userId: string };
  dex_published: { dexId: string; category: string; itemCount: number; version: number };
  dex_viewed: { dexId: string };
  tracker_joined: { dexId: string; trackerId: string };
  tracker_abandoned: { dexId: string; trackerId: string; historyKept: boolean };
  item_captured: { trackerId: string; itemStableId: string; offlineSync: boolean };
  capture_undone: { trackerId: string; itemStableId: string };
}

export type ProductEventName = keyof ProductEventMap;

export const PRODUCT_EVENT_NAMES = [
  'user_signed_up',
  'dex_published',
  'dex_viewed',
  'tracker_joined',
  'tracker_abandoned',
  'item_captured',
  'capture_undone',
] as const satisfies readonly ProductEventName[];
