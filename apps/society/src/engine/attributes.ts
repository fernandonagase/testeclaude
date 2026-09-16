/**
 * Registro de atributos. Para adicionar um atributo novo à simulação basta
 * incluir uma entrada aqui: tipos, geração da população, herança genética e a
 * UI derivam desta lista.
 */
export interface AttributeDef {
  id: string;
  label: string;
  description: string;
  /** Média da população inicial, em 0..1. */
  mean: number;
  /** Desvio padrão da população inicial. */
  spread: number;
  /** Quanto do valor dos pais passa para os filhos, em 0..1. */
  heritability: number;
}

export const ATTRIBUTE_DEFS = [
  {
    id: 'metabolism',
    label: 'Metabolismo',
    description: 'Quanto de recursos essenciais o indivíduo queima por ciclo.',
    mean: 0.5,
    spread: 0.14,
    heritability: 0.8,
  },
  {
    id: 'strength',
    label: 'Força',
    description: 'Rendimento bruto na coleta e peso em conflitos.',
    mean: 0.5,
    spread: 0.17,
    heritability: 0.7,
  },
  {
    id: 'intelligence',
    label: 'Inteligência',
    description: 'Eficiência do trabalho e avanço tecnológico do grupo.',
    mean: 0.5,
    spread: 0.17,
    heritability: 0.6,
  },
  {
    id: 'vitality',
    label: 'Saúde',
    description: 'Resistência a doenças, longevidade e recuperação.',
    mean: 0.55,
    spread: 0.15,
    heritability: 0.65,
  },
  {
    id: 'communication',
    label: 'Comunicação',
    description: 'Capacidade de formar laços, liderar e unir grupos.',
    mean: 0.5,
    spread: 0.18,
    heritability: 0.5,
  },
  {
    id: 'coldResistance',
    label: 'Resistência ao frio',
    description: 'Reduz o desgaste em invernos e climas frios.',
    mean: 0.5,
    spread: 0.18,
    heritability: 0.75,
  },
  {
    id: 'heatResistance',
    label: 'Resistência ao calor',
    description: 'Reduz o desgaste em verões e secas.',
    mean: 0.5,
    spread: 0.18,
    heritability: 0.75,
  },
  {
    id: 'fertility',
    label: 'Fertilidade',
    description: 'Chance de gerar descendentes em idade reprodutiva.',
    mean: 0.5,
    spread: 0.16,
    heritability: 0.6,
  },
  {
    id: 'empathy',
    label: 'Empatia',
    description: 'Disposição a partilhar excedente e sustentar a coesão.',
    mean: 0.5,
    spread: 0.18,
    heritability: 0.45,
  },
  {
    id: 'ambition',
    label: 'Ambição',
    description: 'Impulso de acumular poder — sustenta e também racha grupos.',
    mean: 0.5,
    spread: 0.2,
    heritability: 0.45,
  },
] as const satisfies readonly AttributeDef[];

export type AttributeId = (typeof ATTRIBUTE_DEFS)[number]['id'];
export type Attributes = Record<AttributeId, number>;

export const ATTRIBUTE_IDS = ATTRIBUTE_DEFS.map((def) => def.id) as readonly AttributeId[];

export function attributeDef(id: AttributeId): AttributeDef {
  const found = ATTRIBUTE_DEFS.find((def) => def.id === id);
  if (!found) throw new Error(`Atributo desconhecido: ${id}`);
  return found;
}
