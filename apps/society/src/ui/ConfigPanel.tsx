import { ATTRIBUTE_DEFS, PARAM_DEFS, PRESETS, type ParamDef, type RunConfig } from '../engine';
import { formatDecimal } from './format';

const GROUP_ORDER: ReadonlyArray<ParamDef['group']> = ['run', 'mundo', 'população', 'sociedade'];
const GROUP_LABEL: Record<ParamDef['group'], string> = {
  run: 'Run',
  mundo: 'Mundo',
  'população': 'População',
  sociedade: 'Sociedade',
};

function displayValue(def: ParamDef, value: number): string {
  if (def.step >= 1) return String(Math.round(value));
  return formatDecimal(value, def.step >= 0.05 ? 2 : 3);
}

interface ConfigPanelProps {
  config: RunConfig;
  disabled: boolean;
  onChange: (config: RunConfig) => void;
}

export function ConfigPanel({ config, disabled, onChange }: ConfigPanelProps) {
  const setParam = (id: ParamDef['id'], value: number): void => {
    onChange({ ...config, [id]: value });
  };

  const setAttributeMean = (id: (typeof ATTRIBUTE_DEFS)[number]['id'], value: number): void => {
    onChange({ ...config, attributeMeans: { ...config.attributeMeans, [id]: value } });
  };

  return (
    <div className="config">
      <section className="config-section">
        <h3>Cenários</h3>
        <div className="preset-grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset"
              disabled={disabled}
              onClick={() => onChange({ ...preset.config })}
              title={preset.description}
            >
              <strong>{preset.label}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      {GROUP_ORDER.map((group) => (
        <section className="config-section" key={group}>
          <h3>{GROUP_LABEL[group]}</h3>
          {PARAM_DEFS.filter((def) => def.group === group).map((def) => (
            <label className="field" key={def.id}>
              <span className="field-head">
                <span title={def.description}>{def.label}</span>
                <output>{displayValue(def, config[def.id])}</output>
              </span>
              {def.id === 'seed' ? (
                <span className="seed-row">
                  <input
                    type="number"
                    min={def.min}
                    max={def.max}
                    step={1}
                    value={config.seed}
                    disabled={disabled}
                    onChange={(event) => setParam('seed', Number(event.target.value))}
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setParam('seed', Math.floor(Math.random() * 999999) + 1)}
                  >
                    sortear
                  </button>
                </span>
              ) : (
                <input
                  type="range"
                  min={def.min}
                  max={def.max}
                  step={def.step}
                  value={config[def.id]}
                  disabled={disabled}
                  onChange={(event) => setParam(def.id, Number(event.target.value))}
                />
              )}
            </label>
          ))}
        </section>
      ))}

      <section className="config-section">
        <h3>Atributos da população inicial</h3>
        <p className="hint">
          Média de cada atributo em 0..1. Os indivíduos são sorteados em torno dela e a herança
          leva os traços às gerações seguintes.
        </p>
        {ATTRIBUTE_DEFS.map((def) => {
          const value = config.attributeMeans[def.id] ?? def.mean;
          return (
            <label className="field" key={def.id}>
              <span className="field-head">
                <span title={def.description}>{def.label}</span>
                <output>{formatDecimal(value, 2)}</output>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value}
                disabled={disabled}
                onChange={(event) => setAttributeMean(def.id, Number(event.target.value))}
              />
            </label>
          );
        })}
      </section>
    </div>
  );
}
