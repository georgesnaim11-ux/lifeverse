import type { StatCondition } from './stats.js';
import type { ThreadCategory, ThreadStatus } from './enums.js';
import type { FlagCondition } from './events.js';

/**
 * Threads are the consequence engine — dormant seeds planted by choices that
 * fire callback events years (or generations) later.
 *
 * IMPORTANT (Phase 1 scope): events may PLANT threads (via `ThreadSeed`), and
 * the server PERSISTS them, but the evaluation/firing engine is NOT built yet.
 * These types and the `threads` table exist so Phase 2 is purely additive.
 */

/** What a choice records in order to plant a Thread. */
export interface ThreadSeed {
  /** Stable thread key (e.g. "rival_or_ally:marcus"). */
  key: string;
  category: ThreadCategory;
  /** Arbitrary structured data: involved NPC, original choice, payoff variants. */
  payload?: Record<string, unknown>;
  /** Earliest age (of the experiencing character) the thread may fire. */
  triggerMinAge?: number;
  /** Latest age after which the thread expires unfired. */
  triggerMaxAge?: number;
  /** Conditions evaluated at fire-time. */
  statConditions?: StatCondition[];
  flagConditions?: FlagCondition[];
  /** True if the thread can survive death and pass to an heir (Phase 3). */
  isGenerational?: boolean;
}

/** A Thread as persisted and tracked by the engine. */
export interface Thread {
  id: string;
  bloodlineId: string;
  /** Null for purely generational threads not tied to a living character. */
  characterId: string | null;
  key: string;
  category: ThreadCategory;
  payload: Record<string, unknown>;
  triggerMinAge: number | null;
  triggerMaxAge: number | null;
  statConditions: StatCondition[];
  flagConditions: FlagCondition[];
  status: ThreadStatus;
  createdAge: number;
  isGenerational: boolean;
}
