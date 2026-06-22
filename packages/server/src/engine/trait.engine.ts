import { TRAIT_REGISTRY, TRAIT_ROLL_COUNT } from '@lifeverse/shared';
import type { CharacterTrait, TraitKey, StatBlock } from '@lifeverse/shared';

const ALL_TRAIT_KEYS = Object.keys(TRAIT_REGISTRY) as TraitKey[];

/**
 * Roll a random set of traits for a new character. Respects the min/max count
 * from the registry. Hidden traits are flagged so the UI can reveal them later.
 */
export function rollStartingTraits(): CharacterTrait[] {
  const count =
    TRAIT_ROLL_COUNT.min +
    Math.floor(Math.random() * (TRAIT_ROLL_COUNT.max - TRAIT_ROLL_COUNT.min + 1));

  const shuffled = [...ALL_TRAIT_KEYS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((key) => ({
    key,
    isHidden: TRAIT_REGISTRY[key].hiddenByDefault,
    acquiredAge: null,
  }));
}

/**
 * Get the effective stat bonus for a specific stat check, accounting for all
 * active (non-hidden) traits the character has.
 */
export function getStatCheckModifier(
  traitKeys: TraitKey[],
  stat: keyof StatBlock,
): number {
  let total = 0;
  for (const key of traitKeys) {
    const def = TRAIT_REGISTRY[key];
    const mods = def.effect.statCheckModifiers as Record<string, number> | undefined;
    const mod = mods?.[stat as string];
    if (mod !== undefined) total += mod;
  }
  return total;
}

/**
 * Compute the focus cost for an action category after trait adjustments.
 * Cost is clamped to a minimum of 0.
 */
export function getFocusCost(traitKeys: TraitKey[], baseCost: number, category: string): number {
  let adjustment = 0;
  for (const key of traitKeys) {
    const mod = TRAIT_REGISTRY[key].effect.focusCostModifiers?.[category];
    if (mod !== undefined) adjustment += mod;
  }
  return Math.max(0, baseCost + adjustment);
}

/**
 * Compute the bond decay multiplier for a character's traits.
 */
export function getBondDecayMultiplier(traitKeys: TraitKey[]): number {
  let multiplier = 1;
  for (const key of traitKeys) {
    const m = TRAIT_REGISTRY[key].effect.bondDecayMultiplier;
    if (m !== undefined) multiplier *= m;
  }
  return multiplier;
}

/**
 * Compute the stress accrual multiplier for a character's traits.
 */
export function getStressMultiplier(traitKeys: TraitKey[]): number {
  let multiplier = 1;
  for (const key of traitKeys) {
    const m = TRAIT_REGISTRY[key].effect.stressMultiplier;
    if (m !== undefined) multiplier *= m;
  }
  return multiplier;
}
