import { ATTRIBUTE_DEFS, type Attributes } from './attributes';
import type { RunConfig } from './config';
import { clamp, clamp01 } from './math';
import { individualName } from './names';
import type { Rng } from './rng';
import type { Environment, Individual } from './types';

export const BASE_NEED = 10;
export const BASE_YIELD = 15.5;

function rollAttributes(config: RunConfig, rng: Rng): Attributes {
  const attributes = {} as Attributes;
  for (const def of ATTRIBUTE_DEFS) {
    const configured = config.attributeMeans[def.id];
    const center = configured ?? def.mean;
    attributes[def.id] = clamp01(rng.normal(center, def.spread));
  }
  return attributes;
}

function inheritAttributes(
  a: Attributes,
  b: Attributes,
  config: RunConfig,
  rng: Rng,
): Attributes {
  const attributes = {} as Attributes;
  for (const def of ATTRIBUTE_DEFS) {
    const parentMix = (a[def.id] + b[def.id]) / 2;
    const baseline = config.attributeMeans[def.id] ?? def.mean;
    const blended = parentMix * def.heritability + baseline * (1 - def.heritability);
    attributes[def.id] = clamp01(blended + rng.normal(0, config.mutationRate));
  }
  return attributes;
}

export function createFounder(
  id: number,
  tick: number,
  config: RunConfig,
  rng: Rng,
): Individual {
  const attributes = rollAttributes(config, rng);
  const ageYears = rng.range(14, 38);
  return {
    id,
    name: individualName(rng),
    birthTick: tick - Math.round(ageYears * config.ticksPerYear),
    ageYears,
    alive: true,
    attributes,
    resources: {
      essentials: rng.range(45, 80),
      mental: rng.range(50, 85),
      power: rng.range(0, 4),
    },
    groupId: null,
    parentIds: null,
    starvingTicks: 0,
    despairTicks: 0,
    lastYield: 0,
    deathTick: null,
    deathCause: null,
  };
}

export function createChild(
  id: number,
  tick: number,
  mother: Individual,
  father: Individual,
  config: RunConfig,
  rng: Rng,
): Individual {
  const inheritedPower = ((mother.resources.power + father.resources.power) / 2) * 0.25;
  return {
    id,
    name: individualName(rng),
    birthTick: tick,
    ageYears: 0,
    alive: true,
    attributes: inheritAttributes(mother.attributes, father.attributes, config, rng),
    resources: { essentials: 55, mental: 65, power: inheritedPower },
    groupId: mother.groupId,
    parentIds: [mother.id, father.id],
    starvingTicks: 0,
    despairTicks: 0,
    lastYield: 0,
    deathTick: null,
    deathCause: null,
  };
}

/** Desgaste climático, 0 (confortável) a 1 (letal), já com tecnologia do grupo. */
export function climateStress(
  individual: Individual,
  env: Environment,
  config: RunConfig,
  tech: number,
): number {
  const temp = env.temperature;
  const resistance =
    temp < 0 ? individual.attributes.coldResistance : individual.attributes.heatResistance;
  const shelter = clamp01(tech * 0.07);
  const raw = Math.abs(temp) * (1 - resistance) * (1 - shelter);
  return clamp01(raw * (0.4 + 1.2 * config.climateHarshness));
}

/** Curva de produtividade por idade: crianças aprendem, idosos desaceleram. */
export function ageProductivity(ageYears: number): number {
  if (ageYears < 6) return 0;
  if (ageYears < 15) return ((ageYears - 6) / 9) * 0.6;
  if (ageYears <= 45) return 1;
  return Math.max(0.15, 1 - (ageYears - 45) * 0.028);
}

function ageNeed(ageYears: number): number {
  if (ageYears < 12) return 0.6;
  if (ageYears < 55) return 1;
  return 0.85;
}

export function essentialsNeed(individual: Individual, stress: number): number {
  const metabolism = individual.attributes.metabolism;
  return (
    BASE_NEED * (0.55 + 0.9 * metabolism) * (1 + 0.8 * stress) * ageNeed(individual.ageYears)
  );
}

export function essentialsYield(
  individual: Individual,
  config: RunConfig,
  env: Environment,
  stress: number,
  groupMultiplier: number,
  tech: number,
): number {
  const { strength, intelligence } = individual.attributes;
  const skill = 0.45 + 0.75 * strength + 0.55 * intelligence * (1 + tech * 0.2);
  const morale = 0.4 + 0.6 * (individual.resources.mental / 100);
  return Math.max(
    0,
    BASE_YIELD *
      config.resourceAbundance *
      env.landFertility *
      skill *
      morale *
      ageProductivity(individual.ageYears) *
      (1 - 0.55 * stress) *
      groupMultiplier,
  );
}

export function maxAgeYears(individual: Individual, tech: number): number {
  return 42 + individual.attributes.vitality * 45 + clamp(tech, 0, 12) * 1.6;
}
