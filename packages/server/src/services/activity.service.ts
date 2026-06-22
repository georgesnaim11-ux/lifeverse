import { transaction } from '../db/index.js';
import { CharacterModel, StatsModel, FlagsModel, FinanceModel } from '../models/index.js';
import { DomainsModel } from '../models/domains.model.js';
import { ResourcesModel } from '../models/resources.model.js';
import { ActivityLogModel } from '../models/activity-log.model.js';
import { ALL_ACTIVITIES, ACTIVITY_REGISTRY } from '../activities/registry.js';
import { filterAvailableActivities, validateActivityPerform, computeActivityOutcome } from '../engine/activity.engine.js';
import { applyDeltas } from '../engine/stat.engine.js';
import { AchievementService } from './achievement.service.js';
import type {
  ActivityDefinition,
  DomainState,
  Finance,
  PerformActivityResponse,
} from '@lifeverse/shared';
import { CharacterService } from './character.service.js';

function blankFinance(characterId: string): Finance {
  return { characterId, cash: 0, annualIncome: 0, annualExpenses: 0, totalDebt: 0, updatedAt: '' };
}

export const ActivityService = {
  /** Return all activities currently available to a character. */
  getAvailableActivities(characterId: string): ActivityDefinition[] {
    const character = CharacterModel.findById(characterId);
    if (!character) return [];
    const stats = StatsModel.findByCharacterId(characterId);
    if (!stats) return [];
    const domains = DomainsModel.ensureExists(characterId);
    const resources = ResourcesModel.ensureExists(characterId, 3);
    const flags = FlagsModel.getAll(characterId);
    return filterAvailableActivities(ALL_ACTIVITIES, character, stats, domains, resources, flags);
  },

  /** Perform an activity — validate, spend resources, apply gains, record log. */
  perform(characterId: string, activityId: string): PerformActivityResponse {
    return transaction(() => {
      const activity = ACTIVITY_REGISTRY.get(activityId);
      if (!activity) throw new Error(`Unknown activity: ${activityId}`);

      const character = CharacterModel.findById(characterId);
      if (!character) throw new Error(`Character ${characterId} not found`);
      if (!character.isAlive) throw new Error('Character is dead');

      const stats = StatsModel.findByCharacterId(characterId);
      if (!stats) throw new Error('Stats not found');
      const domains = DomainsModel.ensureExists(characterId);
      const resources = ResourcesModel.ensureExists(characterId, 3);
      const finance = FinanceModel.findByCharacterId(characterId) ?? blankFinance(characterId);
      const flags = FlagsModel.getAll(characterId);

      // Validate resources
      const validationError = validateActivityPerform(activity, resources, finance);
      if (validationError) throw new Error(validationError);

      // Compute resource changes
      const { updatedResources, domainGains } = computeActivityOutcome(activity, resources);

      // Persist resource changes
      ResourcesModel.update(characterId, {
        usedTimeSlots: updatedResources.usedTimeSlots,
        mentalEnergy: updatedResources.mentalEnergy,
        physicalEnergy: updatedResources.physicalEnergy,
      });

      // Apply stat deltas (immediate)
      const allDeltas = [
        ...(activity.statDeltas ?? []),
        ...(activity.statDeltasOverride ?? []),
      ];
      let updatedStats = stats;
      if (allDeltas.length > 0) {
        updatedStats = applyDeltas(stats, allDeltas);
        StatsModel.update(characterId, updatedStats);
      }

      // Apply domain gains
      let updatedDomains = domains;
      if (domainGains && domainGains.length > 0) {
        updatedDomains = DomainsModel.applyDomainDeltas(characterId, domainGains);
        // Update momentum toward positive for this domain
        const primaryMomentumKey = `${activity.domain}Momentum` as keyof DomainState;
        const currentMomentum = updatedDomains[primaryMomentumKey] as number;
        DomainsModel.update(characterId, {
          [primaryMomentumKey]: Math.min(3, currentMomentum + 1),
        });
        updatedDomains = DomainsModel.findByCharacterId(characterId)!;
      }

      // Deduct money cost
      let updatedFinance = finance;
      if ((activity.moneyCost ?? 0) > 0) {
        updatedFinance = FinanceModel.update(characterId, {
          cash: Math.max(0, finance.cash - (activity.moneyCost ?? 0)),
        });
      }

      // Record in activity log
      ActivityLogModel.record(characterId, activityId, character.age, {
        timeCost: activity.timeCost,
        mentalCost: activity.mentalCost ?? 0,
        physicalCost: activity.physicalCost ?? 0,
        moneyCost: activity.moneyCost ?? 0,
      });

      // Check achievements (granted as a side effect; not part of the DTO)
      AchievementService.checkAndGrant({
        character,
        stats: updatedStats,
        flags,
        finance: updatedFinance,
      });

      const state = CharacterService.getFullState(characterId);

      return {
        state,
        resources: ResourcesModel.findByCharacterId(characterId)!,
        domains: updatedDomains,
        finance: updatedFinance,
        appliedActivity: activity,
      };
    });
  },
};
