import { transaction } from '../db/index.js';
import {
  CharacterModel,
  StatsModel,
  FlagsModel,
  TraitsModel,
  FinanceModel,
  EventLogModel,
  SavesModel,
} from '../models/index.js';
import { DomainsModel } from '../models/domains.model.js';
import { ResourcesModel } from '../models/resources.model.js';
import { ActivityLogModel } from '../models/activity-log.model.js';
import {
  applyAgeDecay,
  applyHappinessDrift,
  applyStressPenalties,
  applyStressRecovery,
  applyDeltas,
} from '../engine/stat.engine.js';
import { rollMortality, rollHealthCrisis } from '../engine/lifespan.engine.js';
import { computePassiveBonuses } from '../engine/domain.engine.js';
import { selectEventsForTurn, applyChoice } from './event-engine.service.js';
import { FinanceService } from './finance.service.js';
import { EducationService } from './education.service.js';
import { RelationshipService } from './relationship.service.js';
import { AchievementService } from './achievement.service.js';
import { CharacterService } from './character.service.js';
import { DomainService } from './domain.service.js';
import { ActivityService } from './activity.service.js';
import { JobService } from './job.service.js';
import { HousingService } from './housing.service.js';
import { GarageService } from './garage.service.js';
import { JobModel, AssetsModel } from '../models/index.js';
import { ACTIVITY_REGISTRY } from '../activities/registry.js';
import { GAME_CONSTANTS, LIFE_STAGES_IN_ORDER } from '@lifeverse/shared';
import type { AgeUpResponse, ChooseResponse, Finance } from '@lifeverse/shared';

function computeLifeStage(age: number) {
  const thresholds = GAME_CONSTANTS.lifeStageAgeThresholds;
  for (const stage of [...LIFE_STAGES_IN_ORDER].reverse()) {
    if (age >= thresholds[stage]) return stage;
  }
  return LIFE_STAGES_IN_ORDER[0] ?? 'childhood';
}

function pickCauseOfDeath(age: number, health: number, healthCrisis: boolean): string {
  const pick = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)]!;
  if (healthCrisis || health < 15) {
    return pick(['Sudden illness', 'Heart failure', 'Complications from poor health', 'A long illness']);
  }
  if (age >= 80) return pick(['Old age', 'Passed peacefully in their sleep', 'Natural causes']);
  if (age >= 60) return pick(['Heart attack', 'Natural causes', 'A brief illness']);
  return pick(['An unexpected accident', 'A sudden illness', 'Tragic circumstances']);
}

function blankFinance(characterId: string): Finance {
  return { characterId, cash: 0, annualIncome: 0, annualExpenses: 0, totalDebt: 0, updatedAt: '' };
}

export const AgeUpService = {
  ageUp(characterId: string): AgeUpResponse {
    return transaction(() => {
      const character = CharacterModel.findById(characterId);
      if (!character) throw new Error(`Character ${characterId} not found`);
      if (!character.isAlive) throw new Error('Character is already dead');

      const newAge = character.age + 1;
      const newStage = computeLifeStage(newAge);
      CharacterModel.update(characterId, { age: newAge, lifeStage: newStage });

      // Education auto-progression
      EducationService.autoProgressChildhood(characterId, newAge);
      EducationService.annualUpdate(characterId, newAge);

      // Get domain passive bonuses BEFORE applying stat changes
      const domains = DomainsModel.ensureExists(characterId);
      const bonuses = computePassiveBonuses(domains);

      // Base stat changes
      let stats = StatsModel.findByCharacterId(characterId);
      if (!stats) throw new Error('Stats not found');
      stats = applyAgeDecay(stats, newAge);
      stats = applyHappinessDrift(stats);

      // Apply domain passive bonuses to stats
      if (bonuses.happinessBonus !== 0) {
        stats = applyDeltas(stats, [{ stat: 'happiness', amount: bonuses.happinessBonus }]);
      }
      if (bonuses.stressRecoveryBonus !== 0) {
        stats = applyDeltas(stats, [{ stat: 'stress', amount: -bonuses.stressRecoveryBonus }]);
      }

      // Modify health decay by physical domain bonus
      if (bonuses.healthDecayMultiplier !== 1.0 && newAge >= GAME_CONSTANTS.lifespan.declineStartAge) {
        const extraDecay = Math.round((bonuses.healthDecayMultiplier - 1.0) * GAME_CONSTANTS.lifespan.healthDeclinePerYear);
        stats = applyDeltas(stats, [{ stat: 'health', amount: -Math.max(0, extraDecay) }]);
      }

      stats = applyStressPenalties(stats);
      stats = applyStressRecovery(stats);
      StatsModel.update(characterId, stats);

      // Finance
      const flags = FlagsModel.getAll(characterId);
      FinanceService.updateExpenses(characterId, newStage, flags);
      FinanceService.processCashFlow(characterId);

      // Career: salary multiplier from career domain + job satisfaction/stress
      if (bonuses.salaryMultiplier !== 1.0) {
        const finance = FinanceModel.findByCharacterId(characterId);
        if (finance && finance.annualIncome > 0) {
          const bonus = Math.round(finance.annualIncome * (bonuses.salaryMultiplier - 1.0));
          FinanceModel.update(characterId, { cash: finance.cash + bonus });
        }
      }
      const jobStep = JobService.annualUpdate(characterId);
      if (jobStep.happinessDelta !== 0 || jobStep.stressDelta !== 0) {
        const s = StatsModel.findByCharacterId(characterId)!;
        StatsModel.update(characterId, applyDeltas(s, [
          { stat: 'happiness', amount: jobStep.happinessDelta },
          { stat: 'stress', amount: jobStep.stressDelta },
        ]));
        stats = StatsModel.findByCharacterId(characterId)!;
      }

      // Relationships
      const traits = TraitsModel.findByCharacterId(characterId);
      const traitKeys = traits.map((t) => t.key);
      RelationshipService.annualDecay(characterId, traitKeys);
      RelationshipService.annualAge(characterId);          // age family members + school kids
      RelationshipService.checkMarriageHealth(characterId); // possible auto-divorce if bond collapses

      // Housing: appreciation, age-gating, homelessness penalties
      const housingStep = HousingService.annualUpdate(characterId, newAge);
      if (housingStep.happinessDelta !== 0 || housingStep.healthDelta !== 0) {
        const hs = StatsModel.findByCharacterId(characterId)!;
        StatsModel.update(characterId, applyDeltas(hs, [
          { stat: 'happiness', amount: housingStep.happinessDelta },
          { stat: 'health', amount: housingStep.healthDelta },
        ]));
        stats = StatsModel.findByCharacterId(characterId)!;
      }

      // Garage: vehicle depreciation + neglect-driven condition decay
      const garageStep = GarageService.annualUpdate(characterId);
      if (garageStep.happinessDelta !== 0) {
        const gs = StatsModel.findByCharacterId(characterId)!;
        StatsModel.update(characterId, applyDeltas(gs, [
          { stat: 'happiness', amount: garageStep.happinessDelta },
        ]));
        stats = StatsModel.findByCharacterId(characterId)!;
      }

      // Domain annual update — determine which domains were active this year
      const activeDomains = ActivityLogModel.getActiveDomainsThisYear(
        characterId, character.age, ACTIVITY_REGISTRY,
      );
      const { burnoutTriggered } = DomainService.annualUpdate(
        characterId, newStage, flags, activeDomains, stats.stress,
      );

      // If burnout just triggered, apply additional stat penalty
      if (burnoutTriggered) {
        const currentStats = StatsModel.findByCharacterId(characterId)!;
        StatsModel.update(characterId, applyDeltas(currentStats, [
          { stat: 'happiness', amount: -10 },
          { stat: 'health', amount: -5 },
        ]));
      }

      // Mortality check
      const diedOfHealth = rollHealthCrisis(stats.health);
      const isDead = rollMortality(newAge, stats.health) || diedOfHealth;
      if (isDead) {
        CharacterModel.markDead(characterId);
        SavesModel.create(characterId, 'Autosave', true);
        const causeOfDeath = pickCauseOfDeath(newAge, stats.health, diedOfHealth);
        const lifeSummary = CharacterService.buildLifeSummary(characterId, causeOfDeath);
        const state = CharacterService.getFullState(characterId);
        const finance = FinanceModel.findByCharacterId(characterId) ?? blankFinance(characterId);
        const finalDomains = DomainsModel.ensureExists(characterId);
        const finalResources = ResourcesModel.ensureExists(characterId, 0);
        return {
          state, events: [], finance, isDead: true, newAchievements: [],
          domains: finalDomains, resources: finalResources,
          availableActivities: [],
          job: JobModel.findActive(characterId),
          eligibleJobs: [],
          ownedAssets: AssetsModel.findByCharacterId(characterId),
          causeOfDeath, lifeSummary,
          // Legacy focus fields — empty
          focus: { total: 0, spent: 0, remaining: 0 },
          availableFocusActions: [],
        };
      }

      // Events
      const events = selectEventsForTurn(characterId, newAge);
      const finance = FinanceModel.findByCharacterId(characterId) ?? blankFinance(characterId);
      const newAchievements = AchievementService.checkAndGrant({
        character: { ...character, age: newAge, lifeStage: newStage },
        stats, flags, finance,
      });

      SavesModel.create(characterId, 'Autosave', true);
      const state = CharacterService.getFullState(characterId);
      const updatedDomains = DomainsModel.ensureExists(characterId);
      const updatedResources = ResourcesModel.ensureExists(characterId, 3);
      const availableActivities = ActivityService.getAvailableActivities(characterId);

      return {
        state, events, finance, isDead: false, newAchievements,
        domains: updatedDomains, resources: updatedResources, availableActivities,
        job: JobModel.findActive(characterId),
        eligibleJobs: JobService.listEligibility(characterId),
        ownedAssets: AssetsModel.findByCharacterId(characterId),
        // Legacy focus fields — empty, new system uses activities
        focus: { total: updatedResources.totalTimeSlots, spent: updatedResources.usedTimeSlots, remaining: updatedResources.totalTimeSlots - updatedResources.usedTimeSlots },
        availableFocusActions: [],
      };
    });
  },

  choose(characterId: string, eventId: string, choiceId: string): ChooseResponse {
    return transaction(() => {
      const character = CharacterModel.findById(characterId);
      if (!character) throw new Error(`Character ${characterId} not found`);

      const { stats } = applyChoice(character.bloodlineId, characterId, eventId, choiceId, character.age);

      const flags = FlagsModel.getAll(characterId);
      const finance = FinanceModel.findByCharacterId(characterId) ?? blankFinance(characterId);
      const newAchievements = AchievementService.checkAndGrant({ character, stats, flags, finance });

      const entries = EventLogModel.findByCharacterId(characterId);
      const logEntry = entries.at(-1);
      if (!logEntry) throw new Error('Log entry not created');

      const state = CharacterService.getFullState(characterId);
      return { state, logEntry, newAchievements };
    });
  },
};
