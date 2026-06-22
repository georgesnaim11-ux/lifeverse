import { DomainsModel } from '../models/domains.model.js';
import { ResourcesModel } from '../models/resources.model.js';
import { computeTimeSlots, computeEnergyRecovery, computePassiveBonuses, applyNeglectDecay, shouldTriggerBurnout, computeMomentumDelta } from '../engine/domain.engine.js';
import type { DomainState, CharacterResources, DomainKey, LifeStage } from '@lifeverse/shared';

export const DomainService = {
  /** Create domain and resource records for a freshly created character. */
  initializeDomains(characterId: string, lifeStage: LifeStage, flags: Record<string, boolean>): void {
    DomainsModel.create(characterId);
    const slots = computeTimeSlots(lifeStage, flags);
    ResourcesModel.create(characterId, slots);
  },

  getDomains(characterId: string): DomainState {
    return DomainsModel.ensureExists(characterId);
  },

  getResources(characterId: string): CharacterResources {
    return ResourcesModel.ensureExists(characterId, 3);
  },

  /**
   * Run all annual domain-level updates:
   * 1. Apply neglect decay for domains with no activity this year.
   * 2. Apply momentum drift.
   * 3. Update energy caps from domain bonuses.
   * 4. Check and set burnout state.
   * 5. Reset time slots and recover energy for the coming year.
   */
  annualUpdate(
    characterId: string,
    lifeStage: LifeStage,
    flags: Record<string, boolean>,
    activeDomains: Set<DomainKey>,
    currentStress: number,
  ): { domains: DomainState; resources: CharacterResources; burnoutTriggered: boolean } {
    // 1. Update neglect counters
    DomainsModel.markDomainsActive(characterId, Array.from(activeDomains));

    let domains = DomainsModel.findByCharacterId(characterId)!;

    // 2. Apply neglect decay as domain deltas
    const decayDeltas = applyNeglectDecay(domains);
    if (Object.keys(decayDeltas).length > 0) {
      const deltaList = Object.entries(decayDeltas).map(([domain, amount]) => ({
        domain: domain as DomainKey,
        amount: amount as number,
      }));
      domains = DomainsModel.applyDomainDeltas(characterId, deltaList);
    }

    // 3. Apply momentum drift
    const momentumFields: Array<DomainKey> = ['academic', 'physical', 'career', 'social', 'creative', 'mental'];
    const momentumPatch: Partial<Omit<DomainState, 'characterId' | 'updatedAt'>> = {};
    for (const domain of momentumFields) {
      const momentumKey = `${domain}Momentum` as keyof DomainState;
      const momentum = domains[momentumKey] as number;
      const currentLevel = domains[domain] as number;
      const drift = computeMomentumDelta(currentLevel, momentum);
      if (drift !== 0) {
        const newLevel = Math.min(100, Math.max(0, currentLevel + drift));
        momentumPatch[domain as keyof typeof momentumPatch] = newLevel as never;
      }
    }
    if (Object.keys(momentumPatch).length > 0) {
      domains = DomainsModel.update(characterId, momentumPatch);
    }

    // 4. Compute passive bonuses → update energy caps
    const bonuses = computePassiveBonuses(domains);
    const newMentalMax = Math.max(40, Math.min(120, 100 + bonuses.mentalEnergyMaxBonus));
    const newPhysicalMax = Math.max(40, Math.min(120, 100 + bonuses.physicalEnergyMaxBonus));

    // 5. Get current resources and check burnout
    let resources = ResourcesModel.findByCharacterId(characterId)!;
    const lowMentalThisYear = resources.mentalEnergy < 20;
    const newConsecutiveLow = lowMentalThisYear
      ? resources.consecutiveLowMentalYears + 1
      : 0;

    const burnoutTriggered =
      (shouldTriggerBurnout({ ...resources, consecutiveLowMentalYears: newConsecutiveLow }) ||
        currentStress > 85) &&
      !resources.burnoutState;

    // Apply domain penalty on burnout
    if (burnoutTriggered) {
      const burnoutPenalty = momentumFields.map((domain) => ({ domain, amount: -5 }));
      domains = DomainsModel.applyDomainDeltas(characterId, burnoutPenalty);
    }

    // 6. Reset resources for the new year
    const newSlots = computeTimeSlots(lifeStage, flags);
    const energyRecovery = computeEnergyRecovery(domains, resources);

    resources = ResourcesModel.update(characterId, {
      totalTimeSlots: newSlots,
      usedTimeSlots: 0,
      mentalEnergy: energyRecovery.mental,
      physicalEnergy: energyRecovery.physical,
      mentalEnergyMax: newMentalMax,
      physicalEnergyMax: newPhysicalMax,
      consecutiveLowMentalYears: newConsecutiveLow,
      burnoutState: burnoutTriggered ? true : (resources.burnoutState && resources.mentalEnergy >= 30 ? false : resources.burnoutState),
    });

    return { domains, resources, burnoutTriggered };
  },
};
