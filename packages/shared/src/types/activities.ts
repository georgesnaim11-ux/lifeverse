import type { LifeStage } from './enums.js';
import type { StatCondition, StatDelta } from './stats.js';
import type { DomainKey, DomainDelta } from './domains.js';

export interface ActivityDefinition {
  id: string;
  label: string;
  description: string;
  domain: DomainKey;
  secondaryDomain?: DomainKey;
  timeCost: number;
  mentalCost?: number;
  physicalCost?: number;
  moneyCost?: number;
  statDeltas?: StatDelta[];
  /** Additional stat deltas that bypass the normal system (e.g. stress reduction). */
  statDeltasOverride?: StatDelta[];
  domainGains?: DomainDelta[];
  energyRestore?: { mental?: number; physical?: number };
  burnoutRisk?: number;
  stages?: LifeStage[];
  minAge?: number;
  maxAge?: number;
  minDomainLevel?: Partial<Record<DomainKey, number>>;
  requiredFlags?: string[];
  blockedFlags?: string[];
  requiredStats?: StatCondition[];
  weight?: number;
  tags?: string[];
}

export interface PerformedActivity {
  activityId: string;
  timeCost: number;
  mentalCost: number;
  physicalCost: number;
  moneyCost: number;
}

/* ─────────────── New unlimited "life choices" activity system ─────────────── */

export const ActivityCategory = {
  Health: 'health',
  Education: 'education',
  Career: 'career',
  Relationships: 'relationships',
  Entertainment: 'entertainment',
  Travel: 'travel',
  Casino: 'casino',
  Lifestyle: 'lifestyle',
  Hobbies: 'hobbies',
} as const;
export type ActivityCategory = (typeof ActivityCategory)[keyof typeof ActivityCategory];

/** A randomized stat effect range (server rolls a value in [min, max]). */
export interface ActivityEffect {
  stat: string; // health | intelligence | happiness | looks | stress
  min: number;
  max: number;
}

/** A life-choice activity. No time/energy cost — just choose and live it. */
export interface LifeActivity {
  id: string;
  category: ActivityCategory;
  label: string;
  emoji: string;
  description: string;
  effects: ActivityEffect[];
  /** One-time cash cost. */
  moneyCost?: number;
  /** Random cash earned (freelance / side hustle). */
  moneyReward?: { min: number; max: number };
  minAge?: number;
  maxAge?: number;
  requiredFlags?: string[];
  blockedFlags?: string[];
}

export interface VacationType {
  id: string; // budget | standard | luxury
  label: string;
  emoji: string;
  costMultiplier: number;
}

export interface VacationActivityOption {
  id: string;
  label: string;
  emoji: string;
}

export interface CasinoGame {
  id: string; // slots | blackjack | roulette | poker
  label: string;
  emoji: string;
  /** Probability of winning a round. */
  winChance: number;
  /** Net payout multiple of the bet on a win (1 = even money). House edge keeps EV < 0. */
  winMultiplier: number;
  minBet: number;
}
