import type { HiddenStatKey, StatKey } from './enums.js';

/** The six primary stats, each clamped to [STAT_MIN, STAT_MAX]. */
export type PrimaryStats = Record<StatKey, number>;

/** Hidden internal stats (stress, willpower). */
export type HiddenStats = Record<HiddenStatKey, number>;

/** Full stat block as stored against a character. */
export interface StatBlock extends PrimaryStats, HiddenStats {}

/**
 * Derived stats are computed on read, never persisted, so the formula can
 * evolve without a migration.
 */
export interface DerivedStats {
  /** Social standing: weighted blend of looks, intelligence, happiness. */
  reputation: number;
}

/**
 * A single stat adjustment applied by a choice or event.
 * `stat` is a loose string so legacy content keys (charisma/discipline/
 * creativity) still type-check; the stat engine remaps them onto the core
 * stats at runtime.
 */
export interface StatDelta {
  stat: StatKey | HiddenStatKey | string;
  amount: number;
}

/** A gate that a value must satisfy for an event/choice to be eligible. */
export interface StatCondition {
  stat: StatKey | HiddenStatKey | string;
  /** Inclusive comparison. */
  operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq';
  value: number;
}
