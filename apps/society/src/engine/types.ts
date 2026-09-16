import type { Attributes } from './attributes';

/**
 * Os três grupos de recursos que sustentam (ou destroem) um indivíduo.
 * - essentials: alimentação, água, abrigo. Zera → fome → morte.
 * - mental: saúde mental. Zera → desespero → abandono do grupo e morte.
 * - power: dinheiro e influência, acumulados ao longo da vida pelas escolhas.
 */
export interface Resources {
  essentials: number;
  mental: number;
  power: number;
}

export type DeathCause = 'fome' | 'desespero' | 'clima' | 'velhice' | 'doença' | 'conflito';

export interface Individual {
  id: number;
  name: string;
  birthTick: number;
  ageYears: number;
  alive: boolean;
  attributes: Attributes;
  resources: Resources;
  groupId: number | null;
  parentIds: readonly [number, number] | null;
  /** Ciclos consecutivos sem recursos essenciais. */
  starvingTicks: number;
  /** Ciclos consecutivos em colapso mental. */
  despairTicks: number;
  /** Produção do último ciclo, para a UI e para o cálculo de contribuição. */
  lastYield: number;
  deathTick: number | null;
  deathCause: DeathCause | null;
}

export const GROUP_TIERS = [
  'band',
  'clan',
  'tribe',
  'chiefdom',
  'cityState',
  'civilization',
] as const;

export type GroupTier = (typeof GROUP_TIERS)[number];

export interface TierDef {
  id: GroupTier;
  label: string;
  minSize: number;
  minCohesion: number;
  minTech: number;
  minCulture: number;
}

/**
 * Escalar exige mais do que gente: sem coesão, tecnologia e instituições
 * (cultura) o grupo não sobe de patamar — e regride quando os perde.
 */
export const TIER_DEFS = [
  { id: 'band', label: 'Bando', minSize: 2, minCohesion: 0, minTech: 0, minCulture: 0 },
  { id: 'clan', label: 'Clã', minSize: 8, minCohesion: 0.3, minTech: 0.2, minCulture: 0 },
  { id: 'tribe', label: 'Tribo', minSize: 25, minCohesion: 0.4, minTech: 1, minCulture: 0.15 },
  {
    id: 'chiefdom',
    label: 'Chefatura',
    minSize: 60,
    minCohesion: 0.48,
    minTech: 2.5,
    minCulture: 0.3,
  },
  {
    id: 'cityState',
    label: 'Cidade-Estado',
    minSize: 140,
    minCohesion: 0.55,
    minTech: 4.5,
    minCulture: 0.45,
  },
  {
    id: 'civilization',
    label: 'Civilização',
    minSize: 300,
    minCohesion: 0.6,
    minTech: 6.5,
    minCulture: 0.6,
  },
] as const satisfies readonly TierDef[];

export function tierDef(tier: GroupTier): TierDef {
  const found = TIER_DEFS.find((def) => def.id === tier);
  if (!found) throw new Error(`Patamar desconhecido: ${tier}`);
  return found;
}

export interface Group {
  id: number;
  name: string;
  foundedTick: number;
  memberIds: number[];
  tier: GroupTier;
  /** Coesão social, 0..1. Cai com escala, desigualdade e fome. */
  cohesion: number;
  /** Tecnologia acumulada, 0..12. Multiplica produção e tolera clima. */
  tech: number;
  /** Instituições e cultura, 0..1. É o que permite crescer sem rachar. */
  culture: number;
  /** Estoque comum de essenciais. */
  stock: number;
  leaderId: number | null;
  peakSize: number;
  dissolved: boolean;
}

export type Season = 'inverno' | 'primavera' | 'verão' | 'outono';

export interface Environment {
  /** -1 (frio extremo) .. +1 (calor extremo). */
  temperature: number;
  season: Season;
  /** Fertilidade da terra, 0..1. Cai com sobre-exploração, regenera devagar. */
  landFertility: number;
  /** Ciclos restantes de um choque climático em curso. */
  shockTicks: number;
  shockMagnitude: number;
  drift: number;
}

export type EventKind =
  | 'run'
  | 'group-formed'
  | 'group-merged'
  | 'group-split'
  | 'group-dissolved'
  | 'tier-up'
  | 'tier-down'
  | 'climate'
  | 'famine'
  | 'conflict'
  | 'milestone';

export type EventSeverity = 'info' | 'good' | 'warning' | 'critical';

export interface SimEvent {
  id: number;
  tick: number;
  year: number;
  kind: EventKind;
  severity: EventSeverity;
  message: string;
}

export interface TickMetrics {
  tick: number;
  year: number;
  population: number;
  births: number;
  deaths: number;
  groups: number;
  grouped: number;
  largestGroup: number;
  topTier: GroupTier | null;
  avgEssentials: number;
  avgMental: number;
  avgTech: number;
  avgCohesion: number;
  totalPower: number;
  powerGini: number;
  landFertility: number;
  temperature: number;
}

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';
export type RunOutcome = 'extinction' | 'timeout' | 'stopped';
