const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function formatCount(value: number): string {
  return value >= 10000 ? compact.format(value) : integer.format(value);
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',');
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatTemperature(value: number): string {
  if (value < -0.5) return 'congelante';
  if (value < -0.15) return 'frio';
  if (value <= 0.15) return 'ameno';
  if (value <= 0.5) return 'quente';
  return 'escaldante';
}
