import { LifeStage, StatKey } from '../types/enums.js';
import type { FocusAction } from '../types/focus.js';

/**
 * Central balance constants. Tuning the game means editing this file — no magic
 * numbers scattered through services. Values are deliberately conservative for
 * Phase 1 and will be revisited in the balance pass.
 */
export const GAME_CONSTANTS = {
  /** Primary stats are clamped to this inclusive range. */
  stat: {
    min: 0,
    max: 100,
    /** Baseline value for an unallocated primary stat at birth. */
    baseline: 50,
    /**
     * Soft cap: raising a stat above this threshold costs double effort.
     * The stat service halves positive deltas applied above the cap.
     */
    softCap: 70,
  },

  /** Hidden stats. */
  hidden: {
    stress: { min: 0, max: 100, baseline: 0 },
    willpower: { min: 0, max: 100, baseline: 50 },
  },

  /** Character creation point budget the player distributes over baseline. */
  creation: {
    /** Extra stat points distributable across the six primary stats. */
    pointBudget: 30,
    /** No single stat may start above this via allocation. */
    maxStartingStat: 75,
    nameMinLength: 2,
    nameMaxLength: 40,
  },

  /** Focus Points granted per year, by life stage (opportunity-cost engine). */
  focusBudgetByStage: {
    [LifeStage.Childhood]: 1,
    [LifeStage.Adolescence]: 2,
    [LifeStage.YoungAdult]: 3,
    [LifeStage.Adult]: 3,
    [LifeStage.Senior]: 2,
    [LifeStage.Elder]: 1,
  } satisfies Record<LifeStage, number>,

  /** Stress accrued per Focus Point spent (before trait multipliers). */
  stressPerFocusPoint: 4,

  /** Number of events surfaced per turn (inclusive range). */
  eventsPerTurn: { min: 1, max: 3 },

  /** Age boundaries (inclusive lower bound) for each life stage. */
  lifeStageAgeThresholds: {
    [LifeStage.Childhood]: 0,
    [LifeStage.Adolescence]: 13,
    [LifeStage.YoungAdult]: 18,
    [LifeStage.Adult]: 26,
    [LifeStage.Senior]: 60,
    [LifeStage.Elder]: 80,
  } satisfies Record<LifeStage, number>,

  /** Lifespan model. Death is rolled from health + variance past this age. */
  lifespan: {
    /** Health begins natural decline at this age. */
    declineStartAge: 50,
    /** Base health lost per year after declineStartAge. */
    healthDeclinePerYear: 1,
    /** Mortality checks begin at this age. */
    mortalityStartAge: 60,
    /** Random variance (± years) applied to expected lifespan. */
    lifespanVariance: 10,
  },

  /** Relationship dynamics. */
  relationships: {
    bondBaseline: 50,
    trustBaseline: 50,
    /** Bond lost per year with no interaction (before trait multipliers). */
    bondDecayPerYear: 3,
    /** Bond threshold a partner must reach to unlock a marriage event. */
    marriageBondThreshold: 60,
    maxFriends: 5,
    maxChildren: 4,
  },

  /** Starting finances. */
  finance: {
    startingCash: 1000,
  },
} as const;

/**
 * Derived-stat formulas, kept here so client and server compute identical
 * values. Pure functions — no side effects, no I/O.
 */
export const DERIVED_STATS = {
  reputation: (looks: number, intelligence: number, happiness: number): number =>
    Math.round(looks * 0.4 + intelligence * 0.3 + happiness * 0.3),
} as const;

/**
 * Proactive focus actions the player may spend FP on each year.
 * Available actions are filtered server-side by stage and flag conditions.
 */
export const FOCUS_ACTIONS: FocusAction[] = [
  {
    key: 'study',
    label: 'Study',
    description: 'Hit the books. Your mind sharpens with every hour you invest.',
    cost: 1,
    category: 'education',
    statDeltas: [{ stat: StatKey.Intelligence, amount: 4 }],
  },
  {
    key: 'exercise',
    label: 'Exercise',
    description: 'Push your body. Consistent training pays off over a lifetime.',
    cost: 1,
    category: 'self',
    statDeltas: [{ stat: StatKey.Health, amount: 4 }],
  },
  {
    key: 'socialize',
    label: 'Socialize',
    description: 'Get out and meet people. Connections open doors stats cannot.',
    cost: 1,
    category: 'social',
    statDeltas: [{ stat: StatKey.Looks, amount: 2 }, { stat: StatKey.Happiness, amount: 2 }],
  },
  {
    key: 'reflect',
    label: 'Reflect & Rest',
    description: 'Slow down deliberately. You process more than you realize.',
    cost: 1,
    category: 'self',
    statDeltas: [{ stat: StatKey.Happiness, amount: 4 }],
  },
  {
    key: 'create',
    label: 'Create Something',
    description: 'Write, paint, build — make something that did not exist before.',
    cost: 1,
    category: 'creative',
    statDeltas: [{ stat: StatKey.Happiness, amount: 3 }, { stat: StatKey.Intelligence, amount: 1 }],
  },
  {
    key: 'grind',
    label: 'Work Extra Hard',
    description: 'Put in extra hours at work. Your discipline grows but so does your stress.',
    cost: 1,
    category: 'career',
    statDeltas: [
      { stat: StatKey.Intelligence, amount: 2 },
      { stat: 'stress', amount: 8 },
    ],
    requiresFlag: 'isEmployed',
    minStage: LifeStage.YoungAdult,
  },
  {
    key: 'nurture_relationship',
    label: 'Nurture Relationships',
    description: 'Invest time in the people who matter. Bonds need tending.',
    cost: 1,
    category: 'family',
    statDeltas: [{ stat: StatKey.Happiness, amount: 3 }],
  },
];
