import { GAME_CONSTANTS } from '@lifeverse/shared';

const { mortalityStartAge } = GAME_CONSTANTS.lifespan;

/**
 * Determine whether a character dies this year. Mortality is probabilistic,
 * rising steeply with age, mitigated partially by health.
 *
 * P(death) = 0 below age 55.
 * Scales from ~0% at 55 to ~95% at 95.
 * Good health (100) reduces mortality by up to 40%.
 */
export function rollMortality(age: number, health: number): boolean {
  if (age < mortalityStartAge) return false;
  const ageFactor = Math.min(1, (age - mortalityStartAge) / 35);
  const healthFactor = 1 - (health / 100) * 0.4;
  const probability = ageFactor * healthFactor;
  return Math.random() < Math.max(0, Math.min(0.95, probability));
}

/**
 * Check for accidental early death from catastrophically low health.
 * Below 10 health, there's a meaningful chance of death at any age.
 */
export function rollHealthCrisis(health: number): boolean {
  if (health >= 10) return false;
  return Math.random() < 0.3;
}
