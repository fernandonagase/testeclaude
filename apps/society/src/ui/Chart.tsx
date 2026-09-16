import { useMemo, useState } from 'react';

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 84;
const MAX_POINTS = 240;

interface Point {
  value: number;
  index: number;
}

function sample(series: readonly number[]): Point[] {
  if (series.length <= MAX_POINTS) {
    return series.map((value, index) => ({ value, index }));
  }
  const step = (series.length - 1) / (MAX_POINTS - 1);
  return Array.from({ length: MAX_POINTS }, (_, k) => {
    const index = Math.round(k * step);
    return { value: series[index] ?? 0, index };
  });
}

export interface ChartPanelProps {
  label: string;
  series: readonly number[];
  color: string;
  formatValue: (value: number) => string;
  xLabel: (index: number) => string;
  domainMin?: number;
  domainMax?: number;
}

export function ChartPanel({
  label,
  series,
  color,
  formatValue,
  xLabel,
  domainMin,
  domainMax,
}: ChartPanelProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const { points, path, area, low, high } = useMemo(() => {
    const sampled = sample(series);
    const values = sampled.map((point) => point.value);
    const rawLow = domainMin ?? Math.min(...values, 0);
    const rawHigh = domainMax ?? Math.max(...values, 1);
    const span = rawHigh - rawLow || 1;
    const lowBound = domainMin ?? rawLow - span * 0.08;
    const highBound = domainMax ?? rawHigh + span * 0.08;
    const range = highBound - lowBound || 1;

    const toX = (i: number): number =>
      sampled.length <= 1 ? 0 : (i / (sampled.length - 1)) * VIEW_WIDTH;
    const toY = (value: number): number =>
      VIEW_HEIGHT - ((value - lowBound) / range) * VIEW_HEIGHT;

    const line = sampled
      .map((point, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(2)},${toY(point.value).toFixed(2)}`)
      .join(' ');

    return {
      points: sampled.map((point, i) => ({ ...point, x: toX(i), y: toY(point.value) })),
      path: line,
      area: `${line} L${VIEW_WIDTH},${VIEW_HEIGHT} L0,${VIEW_HEIGHT} Z`,
      low: lowBound,
      high: highBound,
    };
  }, [series, domainMin, domainMax]);

  const last = points[points.length - 1];
  const active = hovered === null ? last : points[hovered];
  const gradientId = `grad-${label.replace(/\W/g, '')}`;

  const onMove = (event: React.MouseEvent<SVGSVGElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || points.length === 0) return;
    const fraction = (event.clientX - rect.left) / rect.width;
    const index = Math.round(Math.min(1, Math.max(0, fraction)) * (points.length - 1));
    setHovered(index);
  };

  return (
    <figure className="chart">
      <figcaption>
        <span className="chart-label">{label}</span>
        <span className="chart-value" style={{ color }}>
          {active ? formatValue(active.value) : '—'}
        </span>
      </figcaption>

      <div className="chart-plot">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${label}: ${active ? formatValue(active.value) : 'sem dados'}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {hovered !== null && active ? (
            <line
              x1={active.x}
              x2={active.x}
              y1="0"
              y2={VIEW_HEIGHT}
              stroke="var(--muted)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        {active ? (
          <span
            className="chart-marker"
            style={{
              left: `${(active.x / VIEW_WIDTH) * 100}%`,
              top: `${(active.y / VIEW_HEIGHT) * 100}%`,
              background: color,
            }}
          />
        ) : null}

        {hovered !== null && active ? (
          <div
            className="chart-tooltip"
            style={{ left: `${(active.x / VIEW_WIDTH) * 100}%` }}
            role="status"
          >
            <strong>{formatValue(active.value)}</strong>
            <span>{xLabel(active.index)}</span>
          </div>
        ) : null}
      </div>

      <div className="chart-axis">
        <span>{formatValue(low)}</span>
        <span>{formatValue(high)}</span>
      </div>
    </figure>
  );
}
