import { ATTRIBUTE_DEFS, type AttributeId } from './attributes';
import { clampConfig, type RunConfig } from './config';
import { advanceEnvironment, createEnvironment } from './environment';
import {
  createGroup,
  evaluateTier,
  openness,
  productionMultiplier,
  selectLeader,
  stockPerCapita,
  tierRank,
  updateCohesion,
  updateKnowledge,
} from './groups';
import {
  BASE_YIELD,
  climateStress,
  createChild,
  createFounder,
  essentialsNeed,
  essentialsYield,
  maxAgeYears,
} from './individual';
import { clamp, clamp01, gini, mean } from './math';
import { groupName } from './names';
import { createRng, type Rng } from './rng';
import {
  tierDef,
  type DeathCause,
  type Environment,
  type EventKind,
  type EventSeverity,
  type Group,
  type GroupTier,
  type Individual,
  type RunOutcome,
  type RunStatus,
  type SimEvent,
  type TickMetrics,
} from './types';

const MAX_EVENTS = 400;

export interface GroupView {
  id: number;
  name: string;
  tier: GroupTier;
  tierLabel: string;
  size: number;
  cohesion: number;
  tech: number;
  culture: number;
  stockPerCapita: number;
  leaderName: string | null;
  foundedYear: number;
  peakSize: number;
}

export interface IndividualView {
  id: number;
  name: string;
  ageYears: number;
  groupName: string | null;
  isLeader: boolean;
  essentials: number;
  mental: number;
  power: number;
  attributes: Record<AttributeId, number>;
}

export interface SimulationView {
  tick: number;
  year: number;
  season: string;
  temperature: number;
  landFertility: number;
  status: RunStatus;
  outcome: RunOutcome | null;
  metrics: TickMetrics;
  history: readonly TickMetrics[];
  events: readonly SimEvent[];
  groups: readonly GroupView[];
  notables: readonly IndividualView[];
  totals: {
    births: number;
    deaths: number;
    deathsByCause: Readonly<Record<DeathCause, number>>;
    groupsFounded: number;
    highestTier: GroupTier | null;
  };
}

const EMPTY_DEATHS: Record<DeathCause, number> = {
  fome: 0,
  desespero: 0,
  clima: 0,
  velhice: 0,
  doença: 0,
  conflito: 0,
};

export class Simulation {
  readonly config: RunConfig;

  private readonly rng: Rng;
  private readonly individuals = new Map<number, Individual>();
  private readonly groups = new Map<number, Group>();
  private readonly env: Environment = createEnvironment();
  private readonly stress = new Map<number, number>();

  private events: SimEvent[] = [];
  private readonly history: TickMetrics[] = [];

  private currentTick = 0;
  private nextIndividualId = 1;
  private nextGroupId = 1;
  private nextEventId = 1;
  private harvestPressure = 0;

  private births = 0;
  private deaths = 0;
  private groupsFounded = 0;
  private deathsByCause: Record<DeathCause, number> = { ...EMPTY_DEATHS };
  private highestTier: GroupTier | null = null;

  private tickBirths = 0;
  private tickDeaths = 0;

  private status: RunStatus = 'running';
  private outcome: RunOutcome | null = null;

  constructor(config: RunConfig) {
    this.config = clampConfig(config);
    this.rng = createRng(this.config.seed);

    for (let i = 0; i < this.config.initialPopulation; i += 1) {
      const individual = createFounder(this.nextIndividualId++, 0, this.config, this.rng);
      this.individuals.set(individual.id, individual);
    }

    this.log('run', 'info', `Run iniciada com ${this.individuals.size} indivíduos.`);
    this.history.push(this.collectMetrics());
  }

  get tick(): number {
    return this.currentTick;
  }

  get finished(): boolean {
    return this.status === 'finished';
  }

  /** Encerramento manual: o usuário pode parar a run a qualquer momento. */
  stop(): void {
    if (this.finished) return;
    this.status = 'finished';
    this.outcome = 'stopped';
    this.log('run', 'info', `Run interrompida no ciclo ${this.currentTick}.`);
  }

  step(): void {
    if (this.finished) return;

    this.currentTick += 1;
    this.tickBirths = 0;
    this.tickDeaths = 0;

    this.advanceClimate();
    this.ageEveryone();
    this.produceAndConsume();
    this.supportChildren();
    this.poolAndRedistribute();
    this.updateWellbeing();
    this.runGroupDynamics();
    this.runBirths();
    this.runDeaths();

    const metrics = this.collectMetrics();
    this.history.push(metrics);
    this.checkEnd(metrics);
  }

  view(): SimulationView {
    const metrics = this.history[this.history.length - 1] ?? this.collectMetrics();
    return {
      tick: this.currentTick,
      year: Math.floor(this.currentTick / this.config.ticksPerYear),
      season: this.env.season,
      temperature: this.env.temperature,
      landFertility: this.env.landFertility,
      status: this.status,
      outcome: this.outcome,
      metrics,
      history: this.history,
      events: this.events,
      groups: this.groupViews(),
      notables: this.notableViews(),
      totals: {
        births: this.births,
        deaths: this.deaths,
        deathsByCause: this.deathsByCause,
        groupsFounded: this.groupsFounded,
        highestTier: this.highestTier,
      },
    };
  }

  // ---------------------------------------------------------------- ambiente

  private advanceClimate(): void {
    const shock = advanceEnvironment(
      this.env,
      this.currentTick,
      this.config,
      this.rng,
      this.harvestPressure,
    );
    this.harvestPressure = 0;

    if (shock) {
      const kind = shock.magnitude < 0 ? 'Onda de frio' : 'Onda de calor';
      this.log(
        'climate',
        'warning',
        `${kind} atinge o território por ${shock.ticks} ciclos (intensidade ${Math.abs(
          shock.magnitude,
        ).toFixed(2)}).`,
      );
    }

    if (this.env.landFertility < 0.25 && this.currentTick % 10 === 0) {
      this.log('famine', 'critical', `Terra exaurida: fertilidade em ${pct(this.env.landFertility)}.`);
    }
  }

  private ageEveryone(): void {
    for (const individual of this.individuals.values()) {
      individual.ageYears = (this.currentTick - individual.birthTick) / this.config.ticksPerYear;
    }
  }

  // --------------------------------------------------------------- economia

  private produceAndConsume(): void {
    this.stress.clear();
    let harvest = 0;

    for (const individual of this.individuals.values()) {
      const group = this.groupOf(individual);
      const tech = group?.tech ?? 0;
      const stress = climateStress(individual, this.env, this.config, tech);
      this.stress.set(individual.id, stress);

      const multiplier = group ? productionMultiplier(group) : 1;
      const produced = essentialsYield(
        individual,
        this.config,
        this.env,
        stress,
        multiplier,
        tech,
      );
      const need = essentialsNeed(individual, stress);

      individual.lastYield = produced;
      harvest += produced;

      let essentials = individual.resources.essentials + produced - need;
      if (essentials > 100) {
        const overflow = essentials - 100;
        essentials = 100;
        if (group) {
          group.stock += overflow * storageEfficiency(group);
        } else {
          individual.resources.power += overflow * 0.02 * individual.attributes.ambition;
        }
      }
      individual.resources.essentials = Math.max(0, essentials);
    }

    const referenceHarvest = BASE_YIELD * this.config.resourceAbundance * this.config.carryingCapacity;
    this.harvestPressure = referenceHarvest > 0 ? (harvest / referenceHarvest) * 0.05 : 0;
  }

  /** Crianças não produzem: os pais vivos as sustentam antes de qualquer partilha coletiva. */
  private supportChildren(): void {
    for (const child of this.individuals.values()) {
      if (child.ageYears >= 12 || child.resources.essentials >= 40) continue;
      if (!child.parentIds) continue;
      for (const parentId of child.parentIds) {
        if (child.resources.essentials >= 40) break;
        const parent = this.individuals.get(parentId);
        if (!parent || parent.resources.essentials <= 25) continue;
        const given = Math.min(
          40 - child.resources.essentials,
          (parent.resources.essentials - 25) * 0.6,
        );
        parent.resources.essentials -= given;
        child.resources.essentials += given;
      }
    }
  }

  private poolAndRedistribute(): void {
    for (const group of this.groups.values()) {
      const members = this.membersOf(group);
      if (members.length === 0) continue;

      const efficiency = storageEfficiency(group);

      for (const member of members) {
        if (member.resources.essentials <= 60) continue;
        const shareRate = clamp(
          0.1 +
            0.6 * member.attributes.empathy * group.cohesion +
            0.3 * this.config.cooperationBias,
          0,
          0.85,
        );
        const contribution = (member.resources.essentials - 60) * shareRate;
        member.resources.essentials -= contribution;
        group.stock += contribution * efficiency;
      }

      // Sob alta desigualdade, quem tem poder é servido primeiro; senão, quem tem menos.
      const needy = members
        .filter((member) => member.resources.essentials < 35)
        .sort((a, b) =>
          this.rng.next() < this.config.inequalityPressure
            ? b.resources.power - a.resources.power
            : a.resources.essentials - b.resources.essentials,
        );

      for (const member of needy) {
        if (group.stock <= 0) break;
        const gap = 35 - member.resources.essentials;
        const given = Math.min(gap, group.stock);
        member.resources.essentials += given;
        group.stock -= given;
      }

      const skim = group.stock * 0.02 * this.config.inequalityPressure;
      if (skim > 0) {
        group.stock -= skim;
        const leader = group.leaderId === null ? null : this.individuals.get(group.leaderId);
        if (leader) leader.resources.power += skim * 0.08;
      }

      group.stock = Math.max(0, group.stock * (1 - 0.04 * (1 - efficiency)));
    }
  }

  private updateWellbeing(): void {
    const groupPowerAverage = new Map<number, number>();
    for (const group of this.groups.values()) {
      const members = this.membersOf(group);
      groupPowerAverage.set(group.id, mean(members.map((m) => m.resources.power)));
    }

    for (const individual of this.individuals.values()) {
      const group = this.groupOf(individual);
      const stress = this.stress.get(individual.id) ?? 0;
      const { empathy, communication, vitality, ambition, intelligence } = individual.attributes;

      // Homeostase: o humor sempre é puxado de volta para o meio, então nem a
      // bonança fixa todo mundo em 100 nem uma crise isolada zera a população.
      let delta = 0.5 * vitality - (individual.resources.mental - 50) * 0.06;

      delta += group
        ? (0.9 + 1.6 * group.cohesion) * (0.5 + 0.5 * communication)
        : -(0.6 + 1.2 * empathy);

      const essentials = individual.resources.essentials;
      if (essentials < 25) delta -= (25 - essentials) * 0.12;
      else if (essentials > 70) delta += 0.5;
      if (essentials <= 0.5) delta -= 3.5;

      delta -= 1.8 * stress;

      if (group) {
        const avgPower = groupPowerAverage.get(group.id) ?? 0;
        const relative = individual.resources.power / (avgPower + 1);
        delta +=
          relative < 1
            ? -(1 - relative) * 1.6 * this.config.inequalityPressure
            : Math.min(0.6, relative * 0.1);
        if (group.leaderId === individual.id) delta += 0.8;
      }

      individual.resources.mental = clamp(individual.resources.mental + delta, 0, 100);

      const size = group?.memberIds.length ?? 0;
      const sources =
        (individual.resources.essentials / 100) * 0.5 +
        (group?.leaderId === individual.id ? 1.2 : 0) +
        (group ? Math.log2(1 + size) * 0.18 * group.cohesion : 0.05);
      const gain =
        (0.02 + 0.5 * ambition) * sources * (0.6 + 0.8 * intelligence) * (0.5 + communication);
      const compounding =
        1 +
        this.config.inequalityPressure * Math.log10(1 + individual.resources.power) * 0.6;
      individual.resources.power = Math.max(
        0,
        individual.resources.power * 0.988 + gain * compounding,
      );
    }
  }

  // ----------------------------------------------------------------- grupos

  private runGroupDynamics(): void {
    for (const group of this.groups.values()) {
      const members = this.membersOf(group);

      if (members.length < 2) {
        this.dissolveGroup(group, members);
        continue;
      }

      const starvingShare =
        members.filter((member) => member.resources.essentials <= 1).length / members.length;
      updateCohesion(group, { members, starvingShare }, this.config);
      updateKnowledge(group, members, stockPerCapita(group));

      if (
        group.leaderId === null ||
        !this.individuals.has(group.leaderId) ||
        this.currentTick % 12 === 0
      ) {
        group.leaderId = selectLeader(members);
      }

      group.peakSize = Math.max(group.peakSize, members.length);

      const nextTier = evaluateTier(group);
      if (nextTier !== group.tier) {
        const rising = tierRank(nextTier) > tierRank(group.tier);
        group.tier = nextTier;
        this.log(
          rising ? 'tier-up' : 'tier-down',
          rising ? 'good' : 'warning',
          rising
            ? `${group.name} ascende a ${tierDef(nextTier).label} (${members.length} membros).`
            : `${group.name} regride a ${tierDef(nextTier).label}.`,
        );
        if (rising && (this.highestTier === null || tierRank(nextTier) > tierRank(this.highestTier))) {
          this.highestTier = nextTier;
          if (nextTier === 'civilization') {
            this.log('milestone', 'good', `Nasce a primeira civilização: ${group.name}.`);
          }
        }
      }
    }

    this.abandonGroups();
    this.recruitOutsiders();
    this.formNewGroups();
    this.mergeGroups();
    this.splitGroups();
    this.runConflicts();
  }

  /** Quem desmorona psicologicamente se desliga do grupo. */
  private abandonGroups(): void {
    for (const individual of this.individuals.values()) {
      if (individual.groupId === null) continue;
      if (individual.despairTicks < 5) continue;
      if (!this.rng.bool(0.15)) continue;
      const group = this.groupOf(individual);
      if (!group) continue;
      this.removeMember(group, individual);
    }
  }

  private recruitOutsiders(): void {
    if (this.groups.size === 0) return;
    const groupList = [...this.groups.values()];
    const outsiders = this.rng
      .shuffle([...this.individuals.values()].filter((i) => i.groupId === null && i.ageYears >= 14))
      .slice(0, 80);

    for (const outsider of outsiders) {
      let best: Group | null = null;
      let bestScore = 0;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const candidate = this.rng.pick(groupList);
        if (!candidate || candidate.dissolved) continue;
        const score =
          (0.4 + candidate.cohesion) *
          openness(candidate) *
          (0.5 + Math.min(2, stockPerCapita(candidate) / 20));
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      if (!best) continue;

      const chance =
        0.2 *
        outsider.attributes.communication *
        bestScore *
        (0.5 + 0.5 * this.config.cooperationBias) *
        (outsider.resources.mental / 100);
      if (this.rng.bool(clamp01(chance))) this.addMember(best, outsider);
    }
  }

  private formNewGroups(): void {
    const loners = this.rng
      .shuffle([...this.individuals.values()].filter((i) => i.groupId === null && i.ageYears >= 14))
      .slice(0, 60);

    for (let i = 0; i + 1 < loners.length; i += 2) {
      const a = loners[i];
      const b = loners[i + 1];
      if (!a || !b) continue;

      const avgCommunication = (a.attributes.communication + b.attributes.communication) / 2;
      const avgEmpathy = (a.attributes.empathy + b.attributes.empathy) / 2;
      const morale = (a.resources.mental + b.resources.mental) / 200;
      const chance =
        0.04 +
        0.55 * avgCommunication * (0.4 + 0.6 * avgEmpathy) * (0.5 + 0.5 * this.config.cooperationBias) * morale;

      if (!this.rng.bool(clamp01(chance))) continue;

      const group = createGroup(
        this.nextGroupId++,
        groupName(this.rng),
        this.currentTick,
        [],
        0.35 + 0.3 * avgCommunication,
        { tech: 0, culture: 0.02, stock: 0 },
      );
      this.groups.set(group.id, group);
      this.groupsFounded += 1;
      this.addMember(group, a);
      this.addMember(group, b);
      group.leaderId = selectLeader([a, b]);
      this.log('group-formed', 'info', `${a.name} e ${b.name} fundam ${group.name}.`);
    }
  }

  private mergeGroups(): void {
    if (this.groups.size < 2) return;
    const list = [...this.groups.values()];
    const attempts = Math.min(6, list.length);

    for (let i = 0; i < attempts; i += 1) {
      const a = this.rng.pick(list);
      const b = this.rng.pick(list);
      if (!a || !b || a.id === b.id || a.dissolved || b.dissolved) continue;
      if (a.cohesion < 0.45 || b.cohesion < 0.45) continue;

      const membersA = this.membersOf(a);
      const membersB = this.membersOf(b);
      if (membersA.length + membersB.length > this.config.populationCap) continue;

      const diplomacy = mean([
        ...membersA.map((m) => m.attributes.communication),
        ...membersB.map((m) => m.attributes.communication),
      ]);
      const chance =
        0.03 *
        diplomacy *
        ((a.cohesion + b.cohesion) / 2) *
        (0.4 + 0.6 * this.config.cooperationBias) *
        (0.5 + (a.culture + b.culture) / 2) *
        (1 - this.config.conflictRate * 0.5);

      if (!this.rng.bool(clamp01(chance))) continue;

      const [host, guest] = membersA.length >= membersB.length ? [a, b] : [b, a];
      const hostSize = host.memberIds.length;
      const guestSize = guest.memberIds.length;
      const total = hostSize + guestSize || 1;

      host.cohesion = clamp01(
        ((host.cohesion * hostSize + guest.cohesion * guestSize) / total) * 0.88,
      );
      host.tech = Math.max(host.tech, guest.tech) * 0.95 + Math.min(host.tech, guest.tech) * 0.15;
      host.culture = clamp01((host.culture * hostSize + guest.culture * guestSize) / total);
      host.stock += guest.stock;

      for (const member of this.membersOf(guest)) {
        this.removeMember(guest, member);
        this.addMember(host, member);
      }
      guest.dissolved = true;
      this.groups.delete(guest.id);
      host.leaderId = selectLeader(this.membersOf(host));

      this.log('group-merged', 'good', `${guest.name} se une a ${host.name} (${total} membros).`);
    }
  }

  private splitGroups(): void {
    for (const group of [...this.groups.values()]) {
      const members = this.membersOf(group);
      if (members.length < 8) continue;

      const powerGini = gini(members.map((m) => m.resources.power));
      const unstable = group.cohesion < 0.25 || powerGini > 0.62;
      if (!unstable) continue;
      if (!this.rng.bool(0.12 + 0.2 * (1 - group.cohesion))) continue;

      // A facção se forma em torno dos ambiciosos que ficaram sem poder.
      const grievance = (member: Individual): number =>
        member.attributes.ambition - member.resources.power / 50;
      const dissidents = members
        .filter((m) => m.id !== group.leaderId && m.ageYears >= 14)
        .sort((a, b) => grievance(b) - grievance(a))
        .slice(0, Math.max(2, Math.floor(members.length * 0.35)));

      if (dissidents.length < 2) continue;

      const faction = createGroup(
        this.nextGroupId++,
        groupName(this.rng),
        this.currentTick,
        [],
        clamp01(group.cohesion + 0.2),
        { tech: group.tech * 0.7, culture: group.culture * 0.6, stock: group.stock * 0.25 },
      );
      group.stock *= 0.75;
      this.groups.set(faction.id, faction);
      this.groupsFounded += 1;

      for (const dissident of dissidents) {
        this.removeMember(group, dissident);
        this.addMember(faction, dissident);
      }
      faction.leaderId = selectLeader(dissidents);
      group.cohesion = clamp01(group.cohesion - 0.08);
      group.leaderId = selectLeader(this.membersOf(group));

      this.log(
        'group-split',
        'warning',
        `${dissidents.length} dissidentes deixam ${group.name} e fundam ${faction.name}.`,
      );
    }
  }

  private runConflicts(): void {
    if (this.groups.size < 2) return;
    const scarcity = 1 + (1 - this.env.landFertility) * 2;
    if (!this.rng.bool(clamp01(this.config.conflictRate * 0.05 * scarcity))) return;

    const list = [...this.groups.values()];
    const a = this.rng.pick(list);
    const b = this.rng.pick(list);
    if (!a || !b || a.id === b.id) return;

    const membersA = this.membersOf(a);
    const membersB = this.membersOf(b);
    if (membersA.length < 2 || membersB.length < 2) return;

    const power = (group: Group, members: readonly Individual[]): number =>
      Math.pow(members.length, 0.9) *
      (0.5 + mean(members.map((m) => m.attributes.strength))) *
      (1 + group.tech * 0.15) *
      (0.5 + group.cohesion);

    const strengthA = power(a, membersA);
    const strengthB = power(b, membersB);
    const [winner, winnerMembers, loser, loserMembers] =
      strengthA >= strengthB ? [a, membersA, b, membersB] : [b, membersB, a, membersA];

    const parity = Math.min(strengthA, strengthB) / Math.max(strengthA, strengthB, 1);
    const loot = loser.stock * 0.4;
    loser.stock -= loot;
    winner.stock += loot;

    const loserCasualties = Math.max(1, Math.round(loserMembers.length * 0.08));
    const winnerCasualties = Math.round(winnerMembers.length * 0.08 * parity);
    this.killSome(loserMembers, loserCasualties, 'conflito');
    this.killSome(winnerMembers, winnerCasualties, 'conflito');

    winner.cohesion = clamp01(winner.cohesion + 0.05);
    loser.cohesion = clamp01(loser.cohesion - 0.1);

    this.log(
      'conflict',
      'critical',
      `${winner.name} ataca ${loser.name}: ${loserCasualties + winnerCasualties} mortos, estoque saqueado.`,
    );
  }

  // ------------------------------------------------------------ vida e morte

  private runBirths(): void {
    if (this.individuals.size >= this.config.populationCap) return;
    const rate = 4 / this.config.ticksPerYear;

    const fertile = this.rng.shuffle(
      [...this.individuals.values()].filter(
        (i) =>
          i.ageYears >= 16 &&
          i.ageYears <= 45 &&
          i.resources.essentials > 45 &&
          i.resources.mental > 20,
      ),
    );

    const crowding = 1 - this.individuals.size / this.config.populationCap;

    for (let i = 0; i + 1 < fertile.length; i += 2) {
      if (this.individuals.size >= this.config.populationCap) break;
      const mother = fertile[i];
      const father = fertile[i + 1];
      if (!mother || !father) continue;
      if (mother.groupId !== father.groupId) continue;

      const fertility = (mother.attributes.fertility + father.attributes.fertility) / 2;
      const comfort = Math.min(
        1,
        (mother.resources.essentials + father.resources.essentials) / 140,
      );
      const morale = clamp01((mother.resources.mental + father.resources.mental) / 120);
      const chance = this.config.birthRate * fertility * 0.6 * crowding * comfort * morale * rate;
      if (!this.rng.bool(clamp01(chance))) continue;

      const child = createChild(
        this.nextIndividualId++,
        this.currentTick,
        mother,
        father,
        this.config,
        this.rng,
      );
      this.individuals.set(child.id, child);
      const group = this.groupOf(mother);
      if (group) group.memberIds.push(child.id);
      else child.groupId = null;

      this.births += 1;
      this.tickBirths += 1;
    }
  }

  private runDeaths(): void {
    const rate = 4 / this.config.ticksPerYear;

    for (const individual of [...this.individuals.values()]) {
      if (individual.resources.essentials <= 0.5) individual.starvingTicks += 1;
      else individual.starvingTicks = Math.max(0, individual.starvingTicks - 1);

      if (individual.resources.mental <= 8) individual.despairTicks += 1;
      else individual.despairTicks = Math.max(0, individual.despairTicks - 1);

      const group = this.groupOf(individual);
      const stress = this.stress.get(individual.id) ?? 0;
      const maxAge = maxAgeYears(individual, group?.tech ?? 0);
      const vitality = individual.attributes.vitality;

      const risks: Array<[DeathCause, number]> = [];
      if (individual.starvingTicks > 2) {
        risks.push(['fome', clamp((individual.starvingTicks - 2) * 0.16, 0, 0.85)]);
      }
      if (individual.despairTicks > 6) {
        risks.push(['desespero', clamp((individual.despairTicks - 6) * 0.04, 0, 0.4)]);
      }
      if (stress > 0.65) {
        risks.push(['clima', (stress - 0.65) * 0.3 * (1 - vitality)]);
      }
      if (individual.ageYears > maxAge * 0.7) {
        const over = (individual.ageYears - maxAge * 0.7) / (maxAge * 0.3);
        risks.push(['velhice', Math.min(0.5, over * over * 0.09)]);
      }
      risks.push(['doença', individual.ageYears < 3 ? 0.015 * (1 - vitality) : 0.0006]);

      let total = 0;
      let worstCause: DeathCause = 'doença';
      let worstRisk = -1;
      for (const [cause, risk] of risks) {
        total += risk;
        if (risk > worstRisk) {
          worstRisk = risk;
          worstCause = cause;
        }
      }

      if (this.rng.bool(clamp01(total * rate))) this.kill(individual, worstCause);
    }
  }

  private killSome(members: readonly Individual[], count: number, cause: DeathCause): void {
    const victims = this.rng.shuffle([...members]).slice(0, Math.max(0, count));
    for (const victim of victims) this.kill(victim, cause);
  }

  private kill(individual: Individual, cause: DeathCause): void {
    if (!this.individuals.has(individual.id)) return;
    const group = this.groupOf(individual);
    if (group) this.removeMember(group, individual);
    this.individuals.delete(individual.id);
    this.deaths += 1;
    this.tickDeaths += 1;
    this.deathsByCause[cause] += 1;
  }

  // ---------------------------------------------------------------- membros

  private groupOf(individual: Individual): Group | undefined {
    return individual.groupId === null ? undefined : this.groups.get(individual.groupId);
  }

  private membersOf(group: Group): Individual[] {
    const members: Individual[] = [];
    const surviving: number[] = [];
    for (const id of group.memberIds) {
      const member = this.individuals.get(id);
      if (member && member.groupId === group.id) {
        members.push(member);
        surviving.push(id);
      }
    }
    group.memberIds = surviving;
    return members;
  }

  private addMember(group: Group, individual: Individual): void {
    const previous = this.groupOf(individual);
    if (previous && previous.id !== group.id) this.removeMember(previous, individual);
    individual.groupId = group.id;
    if (!group.memberIds.includes(individual.id)) group.memberIds.push(individual.id);
  }

  private removeMember(group: Group, individual: Individual): void {
    group.memberIds = group.memberIds.filter((id) => id !== individual.id);
    if (individual.groupId === group.id) individual.groupId = null;
    if (group.leaderId === individual.id) group.leaderId = null;
  }

  private dissolveGroup(group: Group, members: readonly Individual[]): void {
    for (const member of members) {
      member.groupId = null;
    }
    group.memberIds = [];
    group.dissolved = true;
    this.groups.delete(group.id);
    this.log('group-dissolved', 'warning', `${group.name} se desfaz.`);
  }

  // --------------------------------------------------------------- métricas

  private collectMetrics(): TickMetrics {
    const people = [...this.individuals.values()];
    const groups = [...this.groups.values()];
    const sizes = groups.map((group) => group.memberIds.length);
    const topTier = groups.reduce<GroupTier | null>((top, group) => {
      if (top === null) return group.tier;
      return tierRank(group.tier) > tierRank(top) ? group.tier : top;
    }, null);

    return {
      tick: this.currentTick,
      year: Math.floor(this.currentTick / this.config.ticksPerYear),
      population: people.length,
      births: this.tickBirths,
      deaths: this.tickDeaths,
      groups: groups.length,
      grouped: people.filter((person) => person.groupId !== null).length,
      largestGroup: sizes.length === 0 ? 0 : Math.max(...sizes),
      topTier,
      avgEssentials: mean(people.map((person) => person.resources.essentials)),
      avgMental: mean(people.map((person) => person.resources.mental)),
      avgTech: mean(groups.map((group) => group.tech)),
      avgCohesion: mean(groups.map((group) => group.cohesion)),
      totalPower: people.reduce((total, person) => total + person.resources.power, 0),
      powerGini: gini(people.map((person) => person.resources.power)),
      landFertility: this.env.landFertility,
      temperature: this.env.temperature,
    };
  }

  private checkEnd(metrics: TickMetrics): void {
    if (metrics.population === 0) {
      this.status = 'finished';
      this.outcome = 'extinction';
      this.log('run', 'critical', `Extinção no ciclo ${this.currentTick}.`);
      return;
    }
    if (this.currentTick >= this.config.maxTicks) {
      this.status = 'finished';
      this.outcome = 'timeout';
      this.log('run', 'info', `Run concluída: ${this.config.maxTicks} ciclos.`);
    }
  }

  private groupViews(): GroupView[] {
    return [...this.groups.values()]
      .map((group) => ({
        id: group.id,
        name: group.name,
        tier: group.tier,
        tierLabel: tierDef(group.tier).label,
        size: group.memberIds.length,
        cohesion: group.cohesion,
        tech: group.tech,
        culture: group.culture,
        stockPerCapita: stockPerCapita(group),
        leaderName:
          group.leaderId === null ? null : (this.individuals.get(group.leaderId)?.name ?? null),
        foundedYear: Math.floor(group.foundedTick / this.config.ticksPerYear),
        peakSize: group.peakSize,
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 12);
  }

  private notableViews(): IndividualView[] {
    return [...this.individuals.values()]
      .sort((a, b) => b.resources.power - a.resources.power)
      .slice(0, 10)
      .map((individual) => {
        const group = this.groupOf(individual);
        const attributes = {} as Record<AttributeId, number>;
        for (const def of ATTRIBUTE_DEFS) attributes[def.id] = individual.attributes[def.id];
        return {
          id: individual.id,
          name: individual.name,
          ageYears: individual.ageYears,
          groupName: group?.name ?? null,
          isLeader: group?.leaderId === individual.id,
          essentials: individual.resources.essentials,
          mental: individual.resources.mental,
          power: individual.resources.power,
          attributes,
        };
      });
  }

  private log(kind: EventKind, severity: EventSeverity, message: string): void {
    this.events = [
      {
        id: this.nextEventId++,
        tick: this.currentTick,
        year: Math.floor(this.currentTick / this.config.ticksPerYear),
        kind,
        severity,
        message,
      },
      ...this.events,
    ].slice(0, MAX_EVENTS);
  }
}

function storageEfficiency(group: Group): number {
  return clamp(0.55 + 0.035 * group.tech, 0, 0.95);
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
