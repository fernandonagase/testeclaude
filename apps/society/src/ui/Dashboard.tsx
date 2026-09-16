import { tierDef, type SimulationView } from '../engine';
import { ChartPanel } from './Chart';
import { formatCount, formatDecimal, formatPercent } from './format';

export const SERIES_COLOR = {
  people: '#3987e5',
  society: '#d95926',
  material: '#199e70',
  mind: '#d55181',
  power: '#c98500',
} as const;

interface DashboardProps {
  view: SimulationView;
  ticksPerYear: number;
}

export function Dashboard({ view, ticksPerYear }: DashboardProps) {
  const { metrics, history, totals } = view;
  const xLabel = (index: number): string => {
    const point = history[index];
    if (!point) return '';
    return `ciclo ${point.tick} · ano ${point.year}`;
  };

  const series = <K extends keyof (typeof history)[number]>(key: K): number[] =>
    history.map((point) => point[key] as number);

  return (
    <>
      <div className="tiles">
        <Tile label="População" value={formatCount(metrics.population)} accent={SERIES_COLOR.people} />
        <Tile
          label="Em grupos"
          value={
            metrics.population === 0 ? '—' : formatPercent(metrics.grouped / metrics.population)
          }
          note={`${metrics.groups} grupo(s)`}
          accent={SERIES_COLOR.society}
        />
        <Tile
          label="Maior grupo"
          value={formatCount(metrics.largestGroup)}
          note={metrics.topTier ? tierDef(metrics.topTier).label : 'sem grupos'}
          accent={SERIES_COLOR.society}
        />
        <Tile
          label="Essenciais"
          value={formatDecimal(metrics.avgEssentials, 0)}
          note="média por indivíduo"
          accent={SERIES_COLOR.material}
        />
        <Tile
          label="Saúde mental"
          value={formatDecimal(metrics.avgMental, 0)}
          note="média por indivíduo"
          accent={SERIES_COLOR.mind}
        />
        <Tile
          label="Poder"
          value={formatCount(metrics.totalPower)}
          note={`Gini ${formatDecimal(metrics.powerGini, 2)}`}
          accent={SERIES_COLOR.power}
        />
        <Tile
          label="Tecnologia"
          value={formatDecimal(metrics.avgTech, 1)}
          note={`coesão ${formatDecimal(metrics.avgCohesion, 2)}`}
          accent={SERIES_COLOR.society}
        />
        <Tile
          label="Nascimentos"
          value={formatCount(totals.births)}
          note={`${formatCount(totals.deaths)} mortes`}
          accent={SERIES_COLOR.people}
        />
      </div>

      <div className="charts">
        <ChartPanel
          label="População"
          series={series('population')}
          color={SERIES_COLOR.people}
          formatValue={(value) => formatCount(Math.round(value))}
          xLabel={xLabel}
          domainMin={0}
        />
        <ChartPanel
          label="Maior grupo"
          series={series('largestGroup')}
          color={SERIES_COLOR.society}
          formatValue={(value) => formatCount(Math.round(value))}
          xLabel={xLabel}
          domainMin={0}
        />
        <ChartPanel
          label="Recursos essenciais (média)"
          series={series('avgEssentials')}
          color={SERIES_COLOR.material}
          formatValue={(value) => formatDecimal(value, 0)}
          xLabel={xLabel}
          domainMin={0}
          domainMax={100}
        />
        <ChartPanel
          label="Saúde mental (média)"
          series={series('avgMental')}
          color={SERIES_COLOR.mind}
          formatValue={(value) => formatDecimal(value, 0)}
          xLabel={xLabel}
          domainMin={0}
          domainMax={100}
        />
        <ChartPanel
          label="Poder acumulado"
          series={series('totalPower')}
          color={SERIES_COLOR.power}
          formatValue={(value) => formatCount(Math.round(value))}
          xLabel={xLabel}
          domainMin={0}
        />
        <ChartPanel
          label="Concentração de poder (Gini)"
          series={series('powerGini')}
          color={SERIES_COLOR.power}
          formatValue={(value) => formatDecimal(value, 2)}
          xLabel={xLabel}
          domainMin={0}
          domainMax={1}
        />
        <ChartPanel
          label="Tecnologia (média dos grupos)"
          series={series('avgTech')}
          color={SERIES_COLOR.society}
          formatValue={(value) => formatDecimal(value, 1)}
          xLabel={xLabel}
          domainMin={0}
        />
        <ChartPanel
          label="Coesão social (média)"
          series={series('avgCohesion')}
          color={SERIES_COLOR.society}
          formatValue={(value) => formatDecimal(value, 2)}
          xLabel={xLabel}
          domainMin={0}
          domainMax={1}
        />
        <ChartPanel
          label="Fertilidade da terra"
          series={series('landFertility')}
          color={SERIES_COLOR.material}
          formatValue={formatPercent}
          xLabel={xLabel}
          domainMin={0}
          domainMax={1}
        />
      </div>

      <p className="hint">
        Um ciclo é {formatDecimal(1 / ticksPerYear, 2)} ano. Passe o mouse sobre um gráfico para
        ler o valor em cada ciclo.
      </p>
    </>
  );
}

interface TileProps {
  label: string;
  value: string;
  note?: string;
  accent: string;
}

function Tile({ label, value, note, accent }: TileProps) {
  return (
    <div className="tile">
      <span className="tile-label">
        <span className="dot" style={{ background: accent }} aria-hidden="true" />
        {label}
      </span>
      <strong className="tile-value">{value}</strong>
      {note ? <span className="tile-note">{note}</span> : null}
    </div>
  );
}
