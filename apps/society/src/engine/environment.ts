import type { RunConfig } from './config';
import type { Rng } from './rng';
import type { Environment, Season } from './types';

const SEASONS: readonly Season[] = ['inverno', 'primavera', 'verão', 'outono'];

export function createEnvironment(): Environment {
  return {
    temperature: 0,
    season: 'primavera',
    landFertility: 1,
    shockTicks: 0,
    shockMagnitude: 0,
    drift: 0,
  };
}

export function seasonAt(tick: number, ticksPerYear: number): Season {
  const phase = (tick % ticksPerYear) / ticksPerYear;
  return SEASONS[Math.floor(phase * SEASONS.length) % SEASONS.length] ?? 'primavera';
}

export interface ClimateShock {
  magnitude: number;
  ticks: number;
}

/** Avança clima e fertilidade. Devolve um choque quando um começa neste ciclo. */
export function advanceEnvironment(
  env: Environment,
  tick: number,
  config: RunConfig,
  rng: Rng,
  harvestPressure: number,
): ClimateShock | null {
  const phase = (tick % config.ticksPerYear) / config.ticksPerYear;
  env.season = seasonAt(tick, config.ticksPerYear);

  env.drift = clamp(env.drift + rng.normal(0, 0.015 * config.climateHarshness), -0.35, 0.35);

  let started: ClimateShock | null = null;
  if (env.shockTicks > 0) {
    env.shockTicks -= 1;
    if (env.shockTicks === 0) env.shockMagnitude = 0;
  } else if (rng.bool(0.004 + 0.016 * config.climateHarshness)) {
    const magnitude = (rng.bool(0.5) ? -1 : 1) * rng.range(0.3, 0.9) * config.climateHarshness;
    const ticks = rng.int(2, 3 + Math.round(6 * config.climateHarshness));
    env.shockMagnitude = magnitude;
    env.shockTicks = ticks;
    started = { magnitude, ticks };
  }

  const seasonal = -Math.cos(phase * 2 * Math.PI) * config.seasonality;
  env.temperature = clamp(seasonal + env.drift + env.shockMagnitude, -1, 1);

  const climatePenalty = 1 - 0.6 * Math.abs(env.temperature);
  const regen = config.landRegeneration * (1 - env.landFertility) * Math.max(0.1, climatePenalty);
  env.landFertility = clamp(env.landFertility + regen - harvestPressure, 0.05, 1);

  return started;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
