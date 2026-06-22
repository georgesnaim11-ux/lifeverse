import {
  FOCUS_ACTIONS,
  GAME_CONSTANTS,
  LifeStage,
  LIFE_STAGES_IN_ORDER,
} from '@lifeverse/shared';
import type { FocusAction, FocusBudget, LifeStage as LifeStageType } from '@lifeverse/shared';
import { getFocusCost, getStressMultiplier } from './trait.engine.js';
import type { TraitKey } from '@lifeverse/shared';

/** Total FP budget for a given life stage. */
export function getFocusBudget(stage: LifeStageType): number {
  return GAME_CONSTANTS.focusBudgetByStage[stage];
}

/**
 * Compute how much FP has been spent at the given age, then return the
 * current budget state.
 */
export function buildFocusBudget(
  stage: LifeStageType,
  spentThisYear: number,
): FocusBudget {
  const total = getFocusBudget(stage);
  const remaining = Math.max(0, total - spentThisYear);
  return { total, spent: spentThisYear, remaining };
}

/**
 * Filter and adjust focus actions based on current state.
 * Removes actions gated by missing flags or life stage, and adjusts costs
 * for traits.
 */
export function getAvailableFocusActions(
  stage: LifeStageType,
  flags: Record<string, boolean>,
  traitKeys: TraitKey[],
): FocusAction[] {
  const stageIndex = LIFE_STAGES_IN_ORDER.indexOf(stage);

  return FOCUS_ACTIONS
    .filter((action) => {
      if (action.requiresFlag && !flags[action.requiresFlag]) return false;
      if (action.minStage) {
        const minIndex = LIFE_STAGES_IN_ORDER.indexOf(action.minStage);
        if (stageIndex < minIndex) return false;
      }
      return true;
    })
    .map((action) => ({
      ...action,
      cost: getFocusCost(traitKeys, action.cost, action.category),
    }));
}

/**
 * Stress added when a focus action is taken, after trait multipliers.
 */
export function stressForFocusSpend(
  cost: number,
  traitKeys: TraitKey[],
): number {
  const base = GAME_CONSTANTS.stressPerFocusPoint * cost;
  return Math.round(base * getStressMultiplier(traitKeys));
}

export { LifeStage };
