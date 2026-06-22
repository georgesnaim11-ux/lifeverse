/**
 * Focus Points — the opportunity-cost engine.
 *
 * Each year a character receives a budget of deliberate actions (FP). Proactive
 * choices spend FP; reactive random events are free. Spending FP also accrues
 * stress. Budgets scale by life stage (see GAME_CONSTANTS.focusBudgetByStage).
 */

/** A proactive action a player can spend Focus Points on during a turn. */
export interface FocusAction {
  /** Stable identifier (e.g. "study", "exercise", "create"). */
  key: string;
  label: string;
  description: string;
  /** Focus points consumed. */
  cost: number;
  /**
   * Category used by traits to modify cost (e.g. "career", "family", "self").
   * Trait focusCostModifiers are keyed by this category.
   */
  category: string;
  /** Stat changes applied when this action is taken. */
  statDeltas: import('./stats.js').StatDelta[];
  /** Optional flag that must be true for this action to be available. */
  requiresFlag?: string;
  /** Optional minimum life stage for this action. */
  minStage?: import('./enums.js').LifeStage;
}

/** The Focus budget state for the current turn. */
export interface FocusBudget {
  /** Total FP available this year (after stage + trait adjustments). */
  total: number;
  /** FP already spent this year. */
  spent: number;
  /** FP still available (total - spent). */
  remaining: number;
}

/** A record of a single Focus expenditure, for analytics and balance tuning. */
export interface FocusSpend {
  age: number;
  actionKey: string;
  cost: number;
}
