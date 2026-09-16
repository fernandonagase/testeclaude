export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let total = 0;
  for (const value of values) total += value;
  return total / values.length;
}

/** Coeficiente de Gini, 0 (igualdade) a 1 (tudo em uma mão). */
export function gini(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  let total = 0;
  let weighted = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    const value = sorted[i] ?? 0;
    total += value;
    weighted += value * (i + 1);
  }
  if (total <= 0) return 0;
  return (2 * weighted) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
}
