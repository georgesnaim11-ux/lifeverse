import { StatKey } from '../types/enums.js';
import { TraitKey, type TraitDefinition } from '../types/traits.js';

/**
 * The trait registry — the single source of truth for personality traits.
 *
 * Traits are data, not code: the engine reads `effect` to bend checks, focus
 * costs, decay, and stress. Adding a trait means adding an entry here.
 */
export const TRAIT_REGISTRY: Record<TraitKey, TraitDefinition> = {
  [TraitKey.Ambitious]: {
    key: TraitKey.Ambitious,
    label: 'Ambitious',
    description:
      'Driven to climb. Career actions cost less focus, but stagnation drains happiness.',
    effect: {
      focusCostModifiers: { career: -1 },
    },
    hiddenByDefault: false,
    heritability: 0.4,
  },
  [TraitKey.Empathetic]: {
    key: TraitKey.Empathetic,
    label: 'Empathetic',
    description:
      'Attuned to others. Relationship bonds decay more slowly; ruthless choices come hard.',
    effect: {
      bondDecayMultiplier: 0.5,
    },
    hiddenByDefault: false,
    heritability: 0.3,
  },
  [TraitKey.Reckless]: {
    key: TraitKey.Reckless,
    label: 'Reckless',
    description:
      'Lives on the edge. Unlocks high-risk, high-reward branches — and more accidents.',
    effect: {
      stressMultiplier: 1.25,
    },
    hiddenByDefault: false,
    heritability: 0.25,
  },
  [TraitKey.AddictivePersonality]: {
    key: TraitKey.AddictivePersonality,
    label: 'Addictive Personality',
    description:
      'Prone to compulsion. Temptation events appear more often and bite harder.',
    effect: {
      stressMultiplier: 1.15,
    },
    hiddenByDefault: true,
    heritability: 0.35,
  },
  [TraitKey.Charming]: {
    key: TraitKey.Charming,
    label: 'Charming',
    description:
      'Naturally magnetic. A boost to looks and first impressions — but rivals form more easily.',
    effect: {
      statCheckModifiers: { [StatKey.Looks]: 10 },
    },
    hiddenByDefault: false,
    heritability: 0.3,
  },
  [TraitKey.Gifted]: {
    key: TraitKey.Gifted,
    label: 'Gifted',
    description:
      'A natural talent. One stat starts high, but the soft cap bites sooner.',
    effect: {
      statCheckModifiers: { [StatKey.Intelligence]: 5 },
    },
    hiddenByDefault: false,
    heritability: 0.5,
  },
  [TraitKey.Resilient]: {
    key: TraitKey.Resilient,
    label: 'Resilient',
    description: 'Bounces back. Stress recovers faster and trauma threads heal.',
    effect: {
      stressMultiplier: 0.75,
    },
    hiddenByDefault: false,
    heritability: 0.35,
  },
  [TraitKey.Cynical]: {
    key: TraitKey.Cynical,
    label: 'Cynical',
    description:
      'Trusts no one easily. Immune to some manipulation; relationships start cooler.',
    effect: {
      statCheckModifiers: { [StatKey.Happiness]: -5 },
    },
    hiddenByDefault: false,
    heritability: 0.2,
  },
};

/** Number of traits rolled at birth in Phase 1 (inclusive range). */
export const TRAIT_ROLL_COUNT = { min: 2, max: 4 } as const;
