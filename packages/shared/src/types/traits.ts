import type { StatKey } from './enums.js';

/** Stable identifiers for personality traits. */
export const TraitKey = {
  Ambitious: 'ambitious',
  Empathetic: 'empathetic',
  Reckless: 'reckless',
  AddictivePersonality: 'addictive_personality',
  Charming: 'charming',
  Gifted: 'gifted',
  Resilient: 'resilient',
  Cynical: 'cynical',
} as const;
export type TraitKey = (typeof TraitKey)[keyof typeof TraitKey];

/**
 * How a trait bends the simulation. All fields are optional; a trait uses only
 * the levers it needs. The engine reads these — designers never hard-code trait
 * behavior in event logic.
 */
export interface TraitEffect {
  /** Flat modifier added to a stat when a check of that stat is rolled. */
  statCheckModifiers?: Partial<Record<StatKey, number>>;
  /** Focus-point cost adjustment for a category of action (can be negative). */
  focusCostModifiers?: Partial<Record<string, number>>;
  /** Multiplier applied to relationship bond decay (e.g. 0.5 = decays slower). */
  bondDecayMultiplier?: number;
  /** Multiplier applied to stress gained from spending focus. */
  stressMultiplier?: number;
}

/** A full trait definition as registered in the trait registry. */
export interface TraitDefinition {
  key: TraitKey;
  label: string;
  description: string;
  effect: TraitEffect;
  /**
   * Whether the trait is hidden at birth and revealed through play.
   * (Reveal mechanics arrive with the event engine; the flag is honored now.)
   */
  hiddenByDefault: boolean;
  /** Heritability weight 0–1 for the generational system (Phase 3).  */
  heritability: number;
}

/** A trait as attached to a specific character. */
export interface CharacterTrait {
  key: TraitKey;
  isHidden: boolean;
  /** Age at which the trait was acquired; null if present from birth. */
  acquiredAge: number | null;
}
