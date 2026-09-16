import type { RunConfig } from './config';
import { clamp, clamp01, gini, mean } from './math';
import { GROUP_TIERS, TIER_DEFS, type Group, type GroupTier, type Individual } from './types';

export function createGroup(
  id: number,
  name: string,
  tick: number,
  memberIds: number[],
  cohesion: number,
  seed: { tech: number; culture: number; stock: number },
): Group {
  return {
    id,
    name,
    foundedTick: tick,
    memberIds,
    tier: 'band',
    cohesion: clamp01(cohesion),
    tech: seed.tech,
    culture: seed.culture,
    stock: seed.stock,
    leaderId: null,
    peakSize: memberIds.length,
    dissolved: false,
  };
}

/** Maior patamar cujos requisitos de tamanho, coesão, tecnologia e cultura o grupo cumpre. */
export function evaluateTier(group: Group): GroupTier {
  let tier: GroupTier = 'band';
  for (const def of TIER_DEFS) {
    const meets =
      group.memberIds.length >= def.minSize &&
      group.cohesion >= def.minCohesion &&
      group.tech >= def.minTech &&
      group.culture >= def.minCulture;
    if (meets) tier = def.id;
  }
  return tier;
}

/** Ganho de produção coletiva: divisão de trabalho amplificada por coesão e cultura. */
export function productionMultiplier(group: Group): number {
  const scale = Math.log2(1 + group.memberIds.length);
  return 1 + group.cohesion * scale * 0.12 + group.culture * 0.35;
}

/** Quão receptivo o grupo está a forasteiros — cai com o tamanho, sobe com instituições. */
export function openness(group: Group): number {
  const capacity = 30 * (1 + group.culture * 5 + group.tech * 0.4);
  return clamp(1.2 - group.memberIds.length / capacity, 0.03, 1);
}

export function stockPerCapita(group: Group): number {
  return group.memberIds.length === 0 ? 0 : group.stock / group.memberIds.length;
}

export interface CohesionInputs {
  members: readonly Individual[];
  starvingShare: number;
}

/**
 * Coesão persegue um alvo determinado pelo grupo: comunicação e empatia puxam
 * para cima, a escala pura puxa para baixo — e é cultura/tecnologia
 * (instituições) que compra o direito de crescer sem rachar.
 */
export function updateCohesion(group: Group, inputs: CohesionInputs, config: RunConfig): void {
  const { members, starvingShare } = inputs;
  if (members.length === 0) return;

  const avgCommunication = mean(members.map((m) => m.attributes.communication));
  const avgEmpathy = mean(members.map((m) => m.attributes.empathy));
  const powerGini = gini(members.map((m) => m.resources.power));
  const institutions = 1 + group.culture * 6 + group.tech * 1.2;
  const scaleStrain = members.length / (12 * institutions);

  const target = clamp01(
    0.25 +
      0.45 * avgCommunication +
      0.3 * avgEmpathy +
      0.25 * group.culture +
      0.15 * config.cooperationBias -
      0.35 * scaleStrain -
      0.6 * powerGini * config.inequalityPressure -
      0.8 * starvingShare,
  );

  group.cohesion = clamp01(group.cohesion + (target - group.cohesion) * 0.15);
}

/** Excedente vira conhecimento; escassez o corrói. */
export function updateKnowledge(
  group: Group,
  members: readonly Individual[],
  surplusPerCapita: number,
): void {
  if (members.length === 0) return;
  const avgIntelligence = mean(members.map((m) => m.attributes.intelligence));

  if (surplusPerCapita > 6) {
    const scholars = Math.sqrt(members.length);
    group.tech = clamp(
      group.tech + avgIntelligence * scholars * 0.0016 * (1 + group.culture) * group.cohesion,
      0,
      12,
    );
    group.culture = clamp01(
      group.culture + 0.005 * group.cohesion * (1 + group.tech * 0.1) * (1 - group.culture),
    );
  } else {
    group.tech = clamp(group.tech - 0.002 * (1 - group.cohesion), 0, 12);
    group.culture = clamp01(group.culture - 0.0025 * (1 - group.cohesion));
  }
}

export function selectLeader(members: readonly Individual[]): number | null {
  let bestId: number | null = null;
  let bestScore = -Infinity;
  const maxPower = Math.max(1, ...members.map((m) => m.resources.power));
  for (const member of members) {
    if (member.ageYears < 16) continue;
    const score =
      (member.resources.power / maxPower) * 0.4 +
      member.attributes.ambition * 0.3 +
      member.attributes.communication * 0.3;
    if (score > bestScore) {
      bestScore = score;
      bestId = member.id;
    }
  }
  return bestId;
}

export function tierRank(tier: GroupTier): number {
  return GROUP_TIERS.indexOf(tier);
}
