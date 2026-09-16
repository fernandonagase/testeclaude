import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, PRESETS, type RunConfig } from './config';
import { gini } from './math';
import { createRng } from './rng';
import { Simulation } from './simulation';
import { tierRank } from './groups';

function run(overrides: Partial<RunConfig>, ticks: number): Simulation {
  const sim = new Simulation({ ...DEFAULT_CONFIG, ...overrides });
  for (let i = 0; i < ticks; i += 1) sim.step();
  return sim;
}

describe('rng', () => {
  it('é determinístico para a mesma semente', () => {
    const a = createRng(42);
    const b = createRng(42);
    const left = Array.from({ length: 5 }, () => a.next());
    const right = Array.from({ length: 5 }, () => b.next());
    expect(left).toEqual(right);
  });
});

describe('gini', () => {
  it('é zero na igualdade perfeita e alto na concentração', () => {
    expect(gini([10, 10, 10, 10])).toBeCloseTo(0, 5);
    expect(gini([0, 0, 0, 100])).toBeGreaterThan(0.7);
  });
});

describe('Simulation', () => {
  it('produz a mesma história para a mesma semente', () => {
    const a = run({ maxTicks: 400 }, 120);
    const b = run({ maxTicks: 400 }, 120);
    expect(a.view().metrics).toEqual(b.view().metrics);
  });

  it('diverge com sementes diferentes', () => {
    const a = run({ seed: 1, maxTicks: 400 }, 120);
    const b = run({ seed: 2, maxTicks: 400 }, 120);
    expect(a.view().metrics.population).not.toEqual(b.view().metrics.population);
  });

  it('forma grupos a partir de indivíduos soltos', () => {
    const sim = run({ maxTicks: 400 }, 80);
    const view = sim.view();
    expect(view.totals.groupsFounded).toBeGreaterThan(0);
    expect(view.metrics.grouped).toBeGreaterThan(0);
  });

  it('termina a run ao atingir a duração configurada', () => {
    const sim = run({ maxTicks: 50 }, 70);
    const view = sim.view();
    expect(view.status).toBe('finished');
    expect(view.outcome).toBe('timeout');
    expect(view.tick).toBe(50);
  });

  it('permite parar a run a qualquer momento', () => {
    const sim = run({ maxTicks: 1000 }, 20);
    sim.stop();
    const tickAtStop = sim.tick;
    sim.step();
    expect(sim.tick).toBe(tickAtStop);
    expect(sim.view().outcome).toBe('stopped');
  });

  it('mantém o teto populacional', () => {
    const sim = run(
      { populationCap: 150, carryingCapacity: 2000, resourceAbundance: 2, maxTicks: 600 },
      400,
    );
    expect(sim.view().metrics.population).toBeLessThanOrEqual(150);
  });

  it('extingue a população num mundo sem recursos', () => {
    const sim = run(
      {
        seed: 99,
        resourceAbundance: 0.2,
        carryingCapacity: 20,
        climateHarshness: 1,
        seasonality: 1,
        landRegeneration: 0.01,
        maxTicks: 2000,
      },
      2000,
    );
    const view = sim.view();
    expect(view.outcome).toBe('extinction');
    expect(view.totals.deathsByCause.fome).toBeGreaterThan(0);
  });

  it('chega a patamares avançados num cenário favorável', () => {
    const sim = run(
      {
        seed: 4242,
        initialPopulation: 80,
        resourceAbundance: 1.6,
        carryingCapacity: 2500,
        populationCap: 2000,
        climateHarshness: 0.1,
        cooperationBias: 0.9,
        inequalityPressure: 0.1,
        conflictRate: 0,
        maxTicks: 1500,
      },
      1500,
    );
    const view = sim.view();
    expect(view.totals.highestTier).not.toBeNull();
    expect(tierRank(view.totals.highestTier ?? 'band')).toBeGreaterThanOrEqual(
      tierRank('chiefdom'),
    );
  });

  it('registra histórico e eventos ao longo da run', () => {
    const sim = run({ maxTicks: 200 }, 200);
    const view = sim.view();
    expect(view.history.length).toBe(201);
    expect(view.events.length).toBeGreaterThan(1);
  });

  it('roda todos os presets sem quebrar invariantes', () => {
    for (const preset of PRESETS) {
      const sim = new Simulation({ ...preset.config, maxTicks: 300 });
      for (let i = 0; i < 300; i += 1) sim.step();
      const view = sim.view();
      expect(view.metrics.population).toBeGreaterThanOrEqual(0);
      expect(view.metrics.avgMental).toBeGreaterThanOrEqual(0);
      expect(view.metrics.avgMental).toBeLessThanOrEqual(100);
      for (const group of view.groups) {
        expect(group.size).toBeGreaterThan(0);
        expect(group.cohesion).toBeGreaterThanOrEqual(0);
        expect(group.cohesion).toBeLessThanOrEqual(1);
      }
    }
  });
});
