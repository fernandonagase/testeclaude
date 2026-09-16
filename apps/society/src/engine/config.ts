import { ATTRIBUTE_DEFS, type AttributeId } from './attributes';

export interface RunConfig {
  seed: number;
  initialPopulation: number;
  /** Duração máxima da run, em ciclos. */
  maxTicks: number;
  ticksPerYear: number;
  populationCap: number;
  /** Severidade do clima, 0..1. */
  climateHarshness: number;
  /** Amplitude das estações, 0..1. */
  seasonality: number;
  /** Riqueza base do território, 0.2..2. */
  resourceAbundance: number;
  /** Velocidade de regeneração da terra, 0..1. */
  landRegeneration: number;
  /** População que a terra sustenta com fertilidade cheia. */
  carryingCapacity: number;
  /** Pressão reprodutiva, 0..1. */
  birthRate: number;
  /** Variação genética por geração, 0..0.3. */
  mutationRate: number;
  /** Viés cultural pró-cooperação, 0..1. */
  cooperationBias: number;
  /** Quanto o poder se concentra em poucos, 0..1. */
  inequalityPressure: number;
  /** Frequência de conflitos entre grupos, 0..1. */
  conflictRate: number;
  /** Ajuste da média inicial de cada atributo (0..1). */
  attributeMeans: Partial<Record<AttributeId, number>>;
}

export interface ParamDef {
  id: Exclude<keyof RunConfig, 'attributeMeans'>;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  group: 'run' | 'mundo' | 'população' | 'sociedade';
}

export const PARAM_DEFS: readonly ParamDef[] = [
  {
    id: 'seed',
    label: 'Semente',
    description: 'Mesma semente + mesmos parâmetros = mesma run.',
    min: 1,
    max: 999999,
    step: 1,
    group: 'run',
  },
  {
    id: 'maxTicks',
    label: 'Duração (ciclos)',
    description: 'Fim automático da run.',
    min: 50,
    max: 4000,
    step: 50,
    group: 'run',
  },
  {
    id: 'ticksPerYear',
    label: 'Ciclos por ano',
    description: 'Resolução do tempo: 4 = estações.',
    min: 1,
    max: 12,
    step: 1,
    group: 'run',
  },
  {
    id: 'initialPopulation',
    label: 'População inicial',
    description: 'Indivíduos criados no ciclo zero.',
    min: 2,
    max: 400,
    step: 2,
    group: 'população',
  },
  {
    id: 'populationCap',
    label: 'Teto populacional',
    description: 'Limite duro para manter a simulação fluida.',
    min: 50,
    max: 4000,
    step: 50,
    group: 'população',
  },
  {
    id: 'birthRate',
    label: 'Natalidade',
    description: 'Chance de nascimento por casal fértil.',
    min: 0,
    max: 1,
    step: 0.01,
    group: 'população',
  },
  {
    id: 'mutationRate',
    label: 'Mutação',
    description: 'Variação genética a cada geração.',
    min: 0,
    max: 0.3,
    step: 0.005,
    group: 'população',
  },
  {
    id: 'resourceAbundance',
    label: 'Abundância',
    description: 'Riqueza base do território.',
    min: 0.2,
    max: 2,
    step: 0.05,
    group: 'mundo',
  },
  {
    id: 'carryingCapacity',
    label: 'Capacidade de suporte',
    description: 'Quantos a terra sustenta sem se degradar.',
    min: 20,
    max: 3000,
    step: 20,
    group: 'mundo',
  },
  {
    id: 'landRegeneration',
    label: 'Regeneração da terra',
    description: 'Velocidade de recuperação da fertilidade.',
    min: 0.01,
    max: 0.6,
    step: 0.01,
    group: 'mundo',
  },
  {
    id: 'climateHarshness',
    label: 'Rigor climático',
    description: 'Peso do clima e frequência de choques.',
    min: 0,
    max: 1,
    step: 0.02,
    group: 'mundo',
  },
  {
    id: 'seasonality',
    label: 'Sazonalidade',
    description: 'Amplitude entre inverno e verão.',
    min: 0,
    max: 1,
    step: 0.02,
    group: 'mundo',
  },
  {
    id: 'cooperationBias',
    label: 'Viés cooperativo',
    description: 'Tendência cultural a formar e sustentar grupos.',
    min: 0,
    max: 1,
    step: 0.02,
    group: 'sociedade',
  },
  {
    id: 'inequalityPressure',
    label: 'Pressão de desigualdade',
    description: 'Quanto o poder se concentra — e corrói a coesão.',
    min: 0,
    max: 1,
    step: 0.02,
    group: 'sociedade',
  },
  {
    id: 'conflictRate',
    label: 'Conflito',
    description: 'Frequência de disputas entre grupos.',
    min: 0,
    max: 1,
    step: 0.02,
    group: 'sociedade',
  },
];

export const DEFAULT_CONFIG: RunConfig = {
  seed: 20260916,
  initialPopulation: 60,
  maxTicks: 1200,
  ticksPerYear: 4,
  populationCap: 1500,
  climateHarshness: 0.35,
  seasonality: 0.5,
  resourceAbundance: 1,
  landRegeneration: 0.12,
  carryingCapacity: 600,
  birthRate: 0.3,
  mutationRate: 0.06,
  cooperationBias: 0.5,
  inequalityPressure: 0.4,
  conflictRate: 0.25,
  attributeMeans: {},
};

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: RunConfig;
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'default',
    label: 'Vale temperado',
    description: 'Clima gentil e terra farta: o cenário onde civilizações costumam nascer.',
    config: DEFAULT_CONFIG,
  },
  {
    id: 'harsh',
    label: 'Idade do gelo',
    description: 'Frio brutal e terra pobre. Sobreviver já é vitória.',
    config: {
      ...DEFAULT_CONFIG,
      seed: 71104,
      climateHarshness: 0.7,
      seasonality: 0.85,
      resourceAbundance: 1,
      landRegeneration: 0.06,
      carryingCapacity: 400,
      attributeMeans: { coldResistance: 0.7 },
    },
  },
  {
    id: 'abundance',
    label: 'Fartura e feudos',
    description: 'Recursos de sobra, mas o poder concentra e os grupos racham.',
    config: {
      ...DEFAULT_CONFIG,
      seed: 30507,
      resourceAbundance: 1.7,
      carryingCapacity: 1600,
      climateHarshness: 0.15,
      inequalityPressure: 0.9,
      conflictRate: 0.6,
      cooperationBias: 0.3,
    },
  },
  {
    id: 'commune',
    label: 'Comuna',
    description: 'Empatia e cooperação altas: o teste de quão longe a coesão leva.',
    config: {
      ...DEFAULT_CONFIG,
      seed: 88213,
      cooperationBias: 0.9,
      inequalityPressure: 0.12,
      conflictRate: 0.05,
      attributeMeans: { empathy: 0.7, communication: 0.65, ambition: 0.35 },
    },
  },
];

export function clampConfig(config: RunConfig): RunConfig {
  const next = { ...config };
  for (const def of PARAM_DEFS) {
    const raw = next[def.id];
    const value = Number.isFinite(raw) ? raw : def.min;
    next[def.id] = Math.min(def.max, Math.max(def.min, value));
  }
  const means: Partial<Record<AttributeId, number>> = {};
  for (const def of ATTRIBUTE_DEFS) {
    const mean = next.attributeMeans[def.id];
    if (mean !== undefined) means[def.id] = Math.min(1, Math.max(0, mean));
  }
  next.attributeMeans = means;
  return next;
}
