import { useEffect, useState } from 'react';
import { DEFAULT_CONFIG, tierDef, type RunConfig, type RunOutcome } from '../engine';
import { ConfigPanel } from './ConfigPanel';
import { Dashboard } from './Dashboard';
import { EventLog, GroupPanel, NotablesPanel } from './Panels';
import { formatCount, formatTemperature } from './format';
import { SPEEDS, useSimulation } from './useSimulation';

type Tab = 'grupos' | 'notaveis' | 'eventos';

const OUTCOME_LABEL: Record<RunOutcome, string> = {
  extinction: 'Extinção',
  timeout: 'Run concluída',
  stopped: 'Interrompida',
};

export function App() {
  const [config, setConfig] = useState<RunConfig>(DEFAULT_CONFIG);
  const [tab, setTab] = useState<Tab>('grupos');
  const { view, runState, speed, setSpeed, start, pause, resume, stop, reset } = useSimulation();

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.code !== 'Space') return;
      if (event.target instanceof HTMLElement && event.target.tagName === 'INPUT') return;
      event.preventDefault();
      if (runState === 'running') pause();
      else if (runState === 'paused') resume();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runState, pause, resume]);

  const configLocked = runState !== 'setup';

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="brand">
          <h1>Society</h1>
          <p>Indivíduos, recursos e o que eles constroem juntos.</p>
        </header>

        {configLocked ? (
          <p className="hint locked">
            Parâmetros travados durante a run. Pare a run para reconfigurar e rodar de novo.
          </p>
        ) : null}

        <ConfigPanel config={config} disabled={configLocked} onChange={setConfig} />
      </aside>

      <main className="stage">
        <div className="topbar">
          <div className="clock">
            {view ? (
              <>
                <strong>Ano {view.year}</strong>
                <span>
                  ciclo {formatCount(view.tick)} / {formatCount(config.maxTicks)} · {view.season} ·{' '}
                  {formatTemperature(view.temperature)}
                </span>
              </>
            ) : (
              <>
                <strong>Pronto</strong>
                <span>Configure os parâmetros e inicie a run.</span>
              </>
            )}
          </div>

          <div className="speeds" role="group" aria-label="Velocidade da simulação">
            {SPEEDS.map((option) => (
              <button
                key={option}
                type="button"
                className={option === speed ? 'speed active' : 'speed'}
                aria-pressed={option === speed}
                disabled={runState === 'setup' || runState === 'finished'}
                onClick={() => setSpeed(option)}
              >
                {option}×
              </button>
            ))}
          </div>

          <div className="actions">
            {runState === 'setup' ? (
              <button type="button" className="primary" onClick={() => start(config)}>
                Iniciar run
              </button>
            ) : null}
            {runState === 'running' ? (
              <button type="button" onClick={pause}>
                Pausar
              </button>
            ) : null}
            {runState === 'paused' ? (
              <button type="button" className="primary" onClick={resume}>
                Retomar
              </button>
            ) : null}
            {runState === 'running' || runState === 'paused' ? (
              <button type="button" className="danger" onClick={stop}>
                Parar run
              </button>
            ) : null}
            {runState === 'finished' ? (
              <>
                <button type="button" className="primary" onClick={() => start(config)}>
                  Rodar de novo
                </button>
                <button type="button" onClick={reset}>
                  Reconfigurar
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="content">
          {view === null ? (
            <Welcome />
          ) : (
            <>
              {view.outcome ? (
                <div className={`outcome outcome-${view.outcome}`}>
                  <strong>{OUTCOME_LABEL[view.outcome]}</strong>
                  <span>
                    {formatCount(view.tick)} ciclos · {formatCount(view.totals.births)} nascimentos ·{' '}
                    {formatCount(view.totals.deaths)} mortes ·{' '}
                    {formatCount(view.totals.groupsFounded)} grupos fundados · maior organização
                    alcançada:{' '}
                    {view.totals.highestTier ? tierDef(view.totals.highestTier).label : 'nenhuma'}
                  </span>
                </div>
              ) : null}

              <Dashboard view={view} ticksPerYear={config.ticksPerYear} />

              <nav className="tabs" role="tablist">
                <TabButton id="grupos" active={tab} onSelect={setTab}>
                  Grupos ({view.groups.length})
                </TabButton>
                <TabButton id="notaveis" active={tab} onSelect={setTab}>
                  Indivíduos notáveis
                </TabButton>
                <TabButton id="eventos" active={tab} onSelect={setTab}>
                  Acontecimentos
                </TabButton>
              </nav>

              <section className="panel" role="tabpanel">
                {tab === 'grupos' ? <GroupPanel groups={view.groups} /> : null}
                {tab === 'notaveis' ? <NotablesPanel notables={view.notables} /> : null}
                {tab === 'eventos' ? <EventLog events={view.events} /> : null}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

interface TabButtonProps {
  id: Tab;
  active: Tab;
  onSelect: (tab: Tab) => void;
  children: React.ReactNode;
}

function TabButton({ id, active, onSelect, children }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active === id}
      className={active === id ? 'tab active' : 'tab'}
      onClick={() => onSelect(id)}
    >
      {children}
    </button>
  );
}

function Welcome() {
  return (
    <div className="welcome">
      <h2>Como funciona uma run</h2>
      <ol>
        <li>
          Cada indivíduo nasce com atributos próprios — metabolismo, força, inteligência, saúde,
          comunicação, resistência ao frio e ao calor, fertilidade, empatia, ambição.
        </li>
        <li>
          Para sobreviver ele precisa de <strong>recursos essenciais</strong> (comida, água,
          abrigo), sustentar a <strong>saúde mental</strong> e, se as escolhas levarem a isso,
          acumular <strong>poder</strong> — dinheiro e influência construídos ao longo da vida.
        </li>
        <li>
          Sozinho, a conta raramente fecha. Quem se comunica forma bandos; bandos que acumulam
          coesão, tecnologia e instituições viram clãs, tribos, chefaturas, cidades-estado e, se
          tudo der certo, civilizações.
        </li>
        <li>
          O tempo avança em ciclos. Acelere, desacelere, pause ou pare quando quiser — ao terminar,
          mude os parâmetros e rode de novo.
        </li>
      </ol>
      <p className="hint">Dica: a barra de espaço pausa e retoma a run.</p>
    </div>
  );
}
