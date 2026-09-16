import { useCallback, useEffect, useRef, useState } from 'react';
import { Simulation, type RunConfig, type SimulationView } from '../engine';

export type RunState = 'setup' | 'running' | 'paused' | 'finished';

/** Multiplicadores de velocidade disponíveis ao usuário. */
export const SPEEDS = [0.5, 1, 2, 4, 8, 16] as const;

/** Em 1×, um ano de simulação por segundo (com 4 ciclos por ano). */
const BASE_TICKS_PER_SECOND = 4;
const MAX_STEPS_PER_FRAME = 60;
const RENDER_INTERVAL_MS = 70;

export interface SimulationController {
  view: SimulationView | null;
  runState: RunState;
  speed: number;
  setSpeed: (speed: number) => void;
  start: (config: RunConfig) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSimulation(): SimulationController {
  const simulation = useRef<Simulation | null>(null);
  const [view, setView] = useState<SimulationView | null>(null);
  const [runState, setRunState] = useState<RunState>('setup');
  const [speed, setSpeed] = useState<number>(1);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (runState !== 'running') return;

    let frame = 0;
    let lastFrame = performance.now();
    let lastRender = 0;
    let pending = 0;

    const loop = (now: number): void => {
      const sim = simulation.current;
      if (!sim) return;

      const elapsed = Math.min(0.25, (now - lastFrame) / 1000);
      lastFrame = now;
      pending += elapsed * BASE_TICKS_PER_SECOND * speedRef.current;

      let steps = 0;
      while (pending >= 1 && steps < MAX_STEPS_PER_FRAME && !sim.finished) {
        sim.step();
        pending -= 1;
        steps += 1;
      }

      if (sim.finished) {
        setView(sim.view());
        setRunState('finished');
        return;
      }

      if (now - lastRender >= RENDER_INTERVAL_MS) {
        lastRender = now;
        setView(sim.view());
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [runState]);

  const start = useCallback((config: RunConfig) => {
    const sim = new Simulation(config);
    simulation.current = sim;
    setView(sim.view());
    setRunState('running');
  }, []);

  const pause = useCallback(() => {
    setRunState((current) => (current === 'running' ? 'paused' : current));
  }, []);

  const resume = useCallback(() => {
    setRunState((current) => (current === 'paused' ? 'running' : current));
  }, []);

  const stop = useCallback(() => {
    const sim = simulation.current;
    if (!sim) return;
    sim.stop();
    setView(sim.view());
    setRunState('finished');
  }, []);

  const reset = useCallback(() => {
    simulation.current = null;
    setView(null);
    setRunState('setup');
  }, []);

  return { view, runState, speed, setSpeed, start, pause, resume, stop, reset };
}
