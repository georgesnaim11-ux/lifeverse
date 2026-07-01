import type { LifeStage } from './enums.js';
import type { StatCondition, StatDelta } from './stats.js';
import type { TraitKey } from './traits.js';
import type { ThreadSeed } from './threads.js';

/**
 * A flag is boolean game state (`isMarried`, `hasDegree`, ...). Stored per
 * character; events both read and write them.
 */
export interface FlagChange {
  key: string;
  value: boolean;
}

/** A condition on a flag's current value. */
export interface FlagCondition {
  key: string;
  value: boolean;
}

/**
 * Where a choice can send the player after it resolves — the game opens the
 * matching existing tab instead of spawning a new flow.
 */
export type NavTarget =
  | 'education'
  | 'career'
  | 'family'
  | 'home'
  | 'shop'
  | 'finance'
  | 'activities'
  | 'activities-vacation';

/** One selectable response to an event. */
export interface Choice {
  /** Stable id, unique within the event. */
  id: string;
  label: string;
  /** Stat changes applied if chosen. */
  statDeltas: StatDelta[];
  /** Flag mutations applied if chosen. */
  flagChanges: FlagChange[];
  /** Flavour text shown after the choice resolves. */
  outcome: string;
  /** If set, the client opens this existing tab after the outcome. */
  navigateTo?: NavTarget;
  /**
   * Threads this choice plants. Recorded now (data flows into the `threads`
   * table); the firing engine arrives in Phase 2.
   */
  seedsThreads?: ThreadSeed[];
}

/**
 * A game event definition. Events are authored as data and registered in the
 * server's event registry; this is the shape both layers agree on.
 */
export interface GameEvent {
  id: string;
  title: string;
  description: string;
  /** Life stages in which this event may appear. */
  stages: LifeStage[];
  /** Exact-age gating (inclusive). Milestones use these for age-appropriate beats. */
  minAge?: number;
  maxAge?: number;
  /** 'milestone' events fire deterministically when eligible; 'normal' (default)
   * go into the weighted-random pool. */
  priority?: 'milestone' | 'normal';
  /** All must pass for the event to be eligible. */
  statConditions: StatCondition[];
  /** All must pass for the event to be eligible. */
  flagConditions: FlagCondition[];
  /** Traits that make this event eligible / more likely (optional gating). */
  requiredTraits?: TraitKey[];
  /** Relative selection weight among eligible events (default 1). */
  weight?: number;
  /**
   * Minimum years before this event may repeat for the same character.
   * The selector enforces this via the event log.
   */
  cooldownYears?: number;
  choices: Choice[];
}

/** A resolved event instance as presented to the player during a turn. */
export interface PresentedEvent {
  event: GameEvent;
  ageAtEvent: number;
}

/** A persisted record of an event the character experienced. */
export interface EventLogEntry {
  id: string;
  characterId: string;
  eventId: string;
  ageAtEvent: number;
  choiceId: string;
  outcomeText: string;
  occurredAt: string;
}
