import { LifeStage } from '@lifeverse/shared';
import type { DomainState, DomainKey, CharacterResources } from '@lifeverse/shared';

/**
 * Compute the number of time slots available based on life stage and character flags.
 */
export function computeTimeSlots(lifeStage: LifeStage, flags: Record<string, boolean>): number {
  if (flags['isRetired']) return 5;

  switch (lifeStage) {
    case LifeStage.Childhood:
      return 3;
    case LifeStage.Adolescence:
      return 4;
    case LifeStage.YoungAdult:
      if (flags['inUniversity']) return 3;
      if (flags['isEmployed']) return 4;
      return 6; // unemployed young adult
    case LifeStage.Adult:
      if (flags['isEmployed']) return 3;
      return 6; // unemployed adult
    case LifeStage.Senior:
      return 5;
    case LifeStage.Elder:
      return 3;
    default:
      return 3;
  }
}

/**
 * Compute energy recovery at the start of each year.
 * Mental domain ≥50 improves mental energy recovery rate.
 */
export function computeEnergyRecovery(
  domains: DomainState,
  resources: CharacterResources,
): { mental: number; physical: number } {
  // Base recovery: partial reset toward max
  const baseMentalRecovery = Math.floor(resources.mentalEnergyMax * 0.6);
  const basePhysicalRecovery = Math.floor(resources.physicalEnergyMax * 0.6);

  // Mental domain bonus
  const mentalBonus = domains.mental >= 50 ? 10 : 0;

  return {
    mental: Math.min(resources.mentalEnergyMax, resources.mentalEnergy + baseMentalRecovery + mentalBonus),
    physical: Math.min(resources.physicalEnergyMax, resources.physicalEnergy + basePhysicalRecovery),
  };
}

export interface DomainPassiveBonuses {
  intelligenceDeltaMultiplier: number;
  happinessBonus: number;
  stressRecoveryBonus: number;
  healthDecayMultiplier: number;
  bondDecayMultiplier: number;
  salaryMultiplier: number;
  mentalEnergyMaxBonus: number;
  physicalEnergyMaxBonus: number;
}

/**
 * Compute cross-domain passive bonuses from current domain levels.
 */
export function computePassiveBonuses(domains: DomainState): DomainPassiveBonuses {
  let intelligenceDeltaMultiplier = 1.0;
  let happinessBonus = 0;
  let stressRecoveryBonus = 0;
  let healthDecayMultiplier = 1.0;
  let bondDecayMultiplier = 1.0;
  let salaryMultiplier = 1.0;
  let mentalEnergyMaxBonus = 0;
  let physicalEnergyMaxBonus = 0;

  // Positive bonuses (≥50)
  if (domains.physical >= 50) {
    healthDecayMultiplier *= 0.5;
    physicalEnergyMaxBonus += 10;
  }
  if (domains.mental >= 50) {
    stressRecoveryBonus += 10;
    mentalEnergyMaxBonus += 10;
  }
  if (domains.academic >= 50) {
    intelligenceDeltaMultiplier *= 1.15;
  }
  if (domains.social >= 50) {
    bondDecayMultiplier *= 0.5;
  }
  if (domains.creative >= 50) {
    happinessBonus += 3;
  }
  if (domains.career >= 50) {
    salaryMultiplier *= 1.10;
  }

  // Negative penalties (<20)
  if (domains.mental < 20) {
    mentalEnergyMaxBonus -= 20;
    intelligenceDeltaMultiplier *= 0.5;
  }
  if (domains.physical < 20) {
    healthDecayMultiplier *= 1.5;
    physicalEnergyMaxBonus -= 20;
  }

  return {
    intelligenceDeltaMultiplier,
    happinessBonus,
    stressRecoveryBonus,
    healthDecayMultiplier,
    bondDecayMultiplier,
    salaryMultiplier,
    mentalEnergyMaxBonus,
    physicalEnergyMaxBonus,
  };
}

/**
 * Compute neglect decay for each domain.
 * Returns a map of domain -> negative delta to apply.
 */
export function applyNeglectDecay(domains: DomainState): Partial<Record<DomainKey, number>> {
  const result: Partial<Record<DomainKey, number>> = {};
  const domainList: DomainKey[] = ['academic', 'physical', 'career', 'social', 'creative', 'mental'];

  for (const domain of domainList) {
    const neglectKey = `${domain}Neglect` as keyof DomainState;
    const neglect = domains[neglectKey] as number;

    if (neglect >= 5) {
      result[domain] = -4;
    } else if (neglect >= 3) {
      result[domain] = -2;
    }
  }

  return result;
}

/**
 * Check if burnout should trigger based on current resources.
 */
export function shouldTriggerBurnout(resources: CharacterResources): boolean {
  return resources.consecutiveLowMentalYears >= 2 || false;
  // Note: stress > 85 check is done in age-up service where stats are available
}

/**
 * Compute the domain level delta from momentum for a given year.
 * Momentum is -3 to +3; each year, domains drift slightly in that direction.
 */
export function computeMomentumDelta(_domainLevel: number, momentum: number): number {
  if (momentum === 0) return 0;
  // Momentum of ±3 moves domain by ±1 per year; lower momentum is less impactful
  const magnitude = Math.abs(momentum);
  const direction = Math.sign(momentum);
  if (magnitude >= 3) return direction * 1;
  if (magnitude >= 2) return direction * 1;
  // magnitude 1 — 50% chance of movement, represented as fractional — round stochastically
  return Math.random() < 0.5 ? direction : 0;
}
