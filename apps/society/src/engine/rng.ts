export interface Rng {
  /** Float uniforme em [0, 1). */
  next(): number;
  range(min: number, max: number): number;
  int(minInclusive: number, maxExclusive: number): number;
  bool(probability: number): boolean;
  normal(mean: number, stdDev: number): number;
  pick<T>(items: readonly T[]): T | undefined;
  shuffle<T>(items: T[]): T[];
}

/** mulberry32: barato, determinístico e suficiente para simulação. */
export function createRng(seed: number): Rng {
  let state = Math.trunc(seed) || 1;

  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (minInclusive, maxExclusive) =>
      minInclusive + Math.floor(next() * (maxExclusive - minInclusive)),
    bool: (probability) => next() < probability,
    normal: (mean, stdDev) => {
      const u = 1 - next();
      const v = next();
      return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    pick: (items) => items[Math.floor(next() * items.length)],
    shuffle: (items) => {
      for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        const a = items[i] as (typeof items)[number];
        const b = items[j] as (typeof items)[number];
        items[i] = b;
        items[j] = a;
      }
      return items;
    },
  };
}
