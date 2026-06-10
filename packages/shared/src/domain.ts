/**
 * Linguagem ubíqua do Collectdex — ver docs/03-dominio-e-dados.md.
 * Estes tipos são a fonte de verdade compartilhada entre api, web e mobile.
 */

export const DEX_CATEGORIES = [
  'natureza',
  'viagem',
  'colecionaveis',
  'midia',
  'gastronomia',
  'outros',
] as const;
export type DexCategory = (typeof DEX_CATEGORIES)[number];

export const DEX_STATUSES = ['draft', 'published', 'archived'] as const;
export type DexStatus = (typeof DEX_STATUSES)[number];

export const TRACKER_STATUSES = ['active', 'abandoned'] as const;
export type TrackerStatus = (typeof TRACKER_STATUSES)[number];

export const PROFILE_VISIBILITIES = ['public', 'private'] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number];

export interface Dex {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  category: DexCategory;
  status: DexStatus;
  currentVersion: number;
  trackersCount: number;
  createdAt: string;
}

export interface DexItem {
  id: string;
  dexVersionId: string;
  /** Persiste entre versões da Dex — capturas referenciam este id (ADR 004). */
  stableId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
  attributes: Record<string, unknown>;
}

export interface Tracker {
  id: string;
  userId: string;
  dexId: string;
  status: TrackerStatus;
  capturesCount: number;
  joinedAt: string;
}

export interface Capture {
  id: string;
  trackerId: string;
  itemStableId: string;
  capturedAt: string;
  note: string | null;
}

/** Progresso é sempre derivado, nunca fonte de verdade (doc 03, decisão 4). */
export function computeProgress(capturesCount: number, totalItems: number): number {
  if (totalItems <= 0) return 0;
  return Math.min(1, capturesCount / totalItems);
}
