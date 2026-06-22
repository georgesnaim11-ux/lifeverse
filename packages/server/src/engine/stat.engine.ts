import { GAME_CONSTANTS, STAT_KEYS } from '@lifeverse/shared';
import type { StatBlock, StatDelta } from '@lifeverse/shared';

const { min: STAT_MIN, max: STAT_MAX, softCap: SOFT_CAP } = GAME_CONSTANTS.stat;
const { min: STRESS_MIN, max: STRESS_MAX } = GAME_CONSTANTS.hidden.stress;
const { min: WILL_MIN, max: WILL_MAX } = GAME_CONSTANTS.hidden.willpower;

/**
 * Apply a single stat delta to a current value, enforcing soft-cap and hard
 * clamp rules. Pure function — no side effects.
 *
 * Soft cap rule (primary stats only): raising a stat above 70 costs double
 * effort. Positive deltas applied while current >= 70 are halved (rounded up).
 * Negative deltas are always applied in full (no soft floor).
 */
function applyPrimaryDelta(current: number, delta: number): number {
  if (delta <= 0) {
    return Math.max(STAT_MIN, current + delta);
  }
  if (current >= SOFT_CAP) {
    return Math.min(STAT_MAX, current + Math.ceil(delta / 2));
  }
  if (current + delta > SOFT_CAP) {
    const belowGain = SOFT_CAP - current;
    const aboveGain = Math.ceil((delta - belowGain) / 2);
    return Math.min(STAT_MAX, SOFT_CAP + aboveGain);
  }
  return Math.min(STAT_MAX, current + delta);
}

function applyHiddenDelta(
  stat: 'stress' | 'willpower',
  current: number,
  delta: number,
): number {
  const [lo, hi] =
    stat === 'stress'
      ? [STRESS_MIN, STRESS_MAX]
      : [WILL_MIN, WILL_MAX];
  return Math.min(hi, Math.max(lo, current + delta));
}

/**
 * Remap legacy stat keys (charisma/discipline/creativity) onto the current
 * core stats so historical event/activity content keeps working after the
 * stat simplification.
 */
function normalizeStatKey(key: string): string {
  switch (key) {
    case 'charisma':   return 'looks';
    case 'creativity': return 'happiness';
    case 'discipline': return 'intelligence';
    default:           return key;
  }
}

/**
 * Apply a list of stat deltas to a stat block. Returns a NEW block; the
 * original is unchanged. Unknown/legacy keys are remapped onto core stats.
 */
export function applyDeltas(block: StatBlock, deltas: StatDelta[]): StatBlock {
  const result: StatBlock = { ...block };
  const coreKeys = STAT_KEYS as readonly string[];
  for (const { stat, amount } of deltas) {
    const key = normalizeStatKey(stat);
    if (key === 'stress') {
      result.stress = applyHiddenDelta('stress', result.stress, amount);
    } else if (key === 'willpower') {
      result.willpower = applyHiddenDelta('willpower', result.willpower, amount);
    } else if (coreKeys.includes(key)) {
      const k = key as keyof StatBlock;
      result[k] = applyPrimaryDelta(result[k] as number, amount);
    }
    // silently ignore any key that doesn't map to a real stat
  }
  return result;
}

/** Apply annual health decay for characters over 50. */
export function applyAgeDecay(block: StatBlock, age: number): StatBlock {
  if (age < GAME_CONSTANTS.lifespan.declineStartAge) return block;
  return applyDeltas(block, [
    { stat: 'health', amount: -GAME_CONSTANTS.lifespan.healthDeclinePerYear },
  ]);
}

/**
 * Drift happiness toward 50 when nothing maintains it.
 * Applied each year; events and focus actions counteract this.
 */
export function applyHappinessDrift(block: StatBlock): StatBlock {
  const diff = 50 - block.happiness;
  if (diff === 0) return block;
  const drift = Math.sign(diff) * 2; // 2 points/year toward 50
  return applyDeltas(block, [{ stat: 'happiness', amount: drift }]);
}

/**
 * Apply high-stress penalties: above 80 stress, drain health and happiness.
 */
export function applyStressPenalties(block: StatBlock): StatBlock {
  if (block.stress < 80) return block;
  return applyDeltas(block, [
    { stat: 'health', amount: -3 },
    { stat: 'happiness', amount: -3 },
  ]);
}

/**
 * Natural stress recovery each year (stress decays toward 0 when no focus actions taken).
 */
export function applyStressRecovery(block: StatBlock): StatBlock {
  if (block.stress <= 0) return block;
  return applyDeltas(block, [{ stat: 'stress', amount: -5 }]);
}
