import type { Rng } from './rng';

const ONSETS = [
  'ka',
  'me',
  'tor',
  'sha',
  've',
  'nu',
  'bra',
  'lis',
  'dar',
  'ye',
  'zo',
  'pel',
  'thi',
  'gan',
  'ru',
  'ol',
];
const CODAS = [
  'ra',
  'mir',
  'ta',
  'lun',
  'dor',
  'nia',
  'vek',
  'sha',
  'ion',
  'ka',
  'reth',
  'mo',
  'sil',
  'dan',
];
const GROUP_PREFIX = [
  'Vale',
  'Pedra',
  'Rio',
  'Cinza',
  'Alva',
  'Fogo',
  'Norte',
  'Sul',
  'Bruma',
  'Raiz',
  'Sal',
  'Duna',
];
const GROUP_SUFFIX = [
  'funda',
  'alta',
  'negra',
  'clara',
  'longa',
  'firme',
  'quieta',
  'vasta',
  'antiga',
  'nova',
];

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function individualName(rng: Rng): string {
  const onset = rng.pick(ONSETS) ?? 'ka';
  const coda = rng.pick(CODAS) ?? 'ra';
  return capitalize(`${onset}${coda}`);
}

export function groupName(rng: Rng): string {
  const prefix = rng.pick(GROUP_PREFIX) ?? 'Vale';
  const suffix = rng.pick(GROUP_SUFFIX) ?? 'funda';
  return `${prefix}${suffix}`;
}
