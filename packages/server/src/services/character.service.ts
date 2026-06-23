import { transaction } from '../db/index.js';
import {
  BloodlineModel,
  CharacterModel,
  StatsModel,
  TraitsModel,
  FinanceModel,
  EducationModel,
  FlagsModel,
  JobModel,
  RelationshipsModel,
  AssetsModel,
  EventLogModel,
  AchievementsModel,
  HousingModel,
} from '../models/index.js';
import { DomainsModel } from '../models/domains.model.js';
import { ResourcesModel } from '../models/resources.model.js';
import { FinanceService } from './finance.service.js';
import { RelationshipService } from './relationship.service.js';
import { getMajorLabel, getCountry, randomSurname, DEFAULT_COUNTRY_ID } from '@lifeverse/shared';
import type { TimelineEntry, LegacyScore } from '@lifeverse/shared';
import { rollStartingTraits } from '../engine/trait.engine.js';
import { computeTimeSlots } from '../engine/domain.engine.js';
import { GAME_CONSTANTS, EducationLevel, LifeStage, RelationStage, Gender } from '@lifeverse/shared';
import type { CharacterCreationInput, CharacterState, StatBlock, LifeSummary } from '@lifeverse/shared';

const BIRTH_YEAR = 1990; // cosmetic in Phase 1

/**
 * Validates and clamps stat allocation from character creation.
 * Budget is shared/constants GAME_CONSTANTS.creation.pointBudget.
 */
function buildStartingStats(
  allocation: Partial<StatBlock> = {},
): Partial<StatBlock> {
  const budget = GAME_CONSTANTS.creation.pointBudget;
  const maxStat = GAME_CONSTANTS.creation.maxStartingStat;
  const baseline = GAME_CONSTANTS.stat.baseline;

  // Sum all requested bonuses and clamp
  let remaining = budget;
  const stats: Partial<StatBlock> = {};
  const keys = ['health', 'intelligence', 'happiness', 'looks'] as const;
  for (const key of keys) {
    const bonus = Math.max(0, (allocation[key] ?? 0) - baseline);
    const clamped = Math.min(bonus, remaining, maxStat - baseline);
    stats[key] = baseline + clamped;
    remaining -= clamped;
  }
  return stats;
}

export const CharacterService = {
  create(input: CharacterCreationInput): CharacterState {
    const firstName = input.name.trim();
    if (firstName.length < GAME_CONSTANTS.creation.nameMinLength) {
      throw new Error(`Name must be at least ${GAME_CONSTANTS.creation.nameMinLength} characters.`);
    }
    if (firstName.length > GAME_CONSTANTS.creation.nameMaxLength) {
      throw new Error(`Name must be at most ${GAME_CONSTANTS.creation.nameMaxLength} characters.`);
    }

    const countryId = getCountry(input.country)?.id ?? DEFAULT_COUNTRY_ID;
    const countryData = getCountry(countryId)!;
    const gender = input.gender ?? (Math.random() < 0.5 ? Gender.Male : Gender.Female);

    // Use the player's chosen last name when given; otherwise generate a
    // culturally-matched surname from the country so the family shares it.
    const chosenLast = input.lastName?.trim();
    const surname = chosenLast && chosenLast.length > 0
      ? chosenLast.slice(0, GAME_CONSTANTS.creation.nameMaxLength)
      : randomSurname(countryId);
    const name = `${firstName} ${surname}`;

    // Starting cash band is country-dependent.
    const [lo, hi] = countryData.startingCash;
    const startingCash = lo + Math.floor(Math.random() * (hi - lo + 1));

    const startingStats = buildStartingStats(input.statAllocation);

    return transaction((_db) => {
      // 1. Bloodline (single-generation in Phase 1)
      const bloodline = BloodlineModel.create(surname, countryId);

      // 2. Character
      const character = CharacterModel.create({
        bloodlineId: bloodline.id,
        name,
        birthYear: BIRTH_YEAR,
        country: countryId,
        gender,
      });

      // 3. Stats
      const stats = StatsModel.create(character.id, startingStats);

      // 4. Traits (random roll)
      const rolledTraits = rollStartingTraits();
      const traits = TraitsModel.assign(character.id, rolledTraits);

      // 5. Finances (country-based starting cash)
      FinanceModel.create(character.id, startingCash);

      // 6. Auto-start elementary school
      EducationModel.create(character.id, EducationLevel.Elementary, 5);

      // 7. Flags (all false by default; no action needed)

      // 8. Initialize domains and resources
      DomainsModel.create(character.id);
      const slots = computeTimeSlots(LifeStage.Childhood, {});
      ResourcesModel.create(character.id, slots);

      // 9. Generate the family the character is born into (country + surname matched)
      RelationshipService.generateFamily(character.id, countryId, surname);

      // 10. Born living with parents.
      HousingModel.ensureExists(character.id, 'parents');

      return {
        character,
        stats,
        traits: traits.map((t) => t.key),
      };
    });
  },

  getFullState(characterId: string): CharacterState {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error(`Character ${characterId} not found.`);
    const stats = StatsModel.findByCharacterId(characterId);
    if (!stats) throw new Error(`Stats for ${characterId} not found.`);
    const traits = TraitsModel.findByCharacterId(characterId);

    // Surface hidden trait keys only to the server — client receives visible ones only
    FlagsModel.getAll(characterId); // preload (no-op here; used in routes)

    return {
      character,
      stats,
      traits: traits.filter((t) => !t.isHidden).map((t) => t.key),
    };
  },

  /** Assemble the end-of-life tombstone summary. */
  buildLifeSummary(characterId: string, causeOfDeath: string): LifeSummary {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error(`Character ${characterId} not found.`);

    const job = JobModel.findActive(characterId) ?? JobModel.findAll(characterId).at(-1) ?? null;
    const careerTitle = job ? job.title : 'Never formally employed';

    const completed = EducationModel.findByCharacterId(characterId).filter((e) => e.completed);
    const eduOrder = ['graduate', 'university', 'trade', 'high', 'middle', 'elementary'];
    const eduLabels: Record<string, string> = {
      graduate: 'Graduate Degree', university: 'University Degree', trade: 'Trade Certification',
      high: 'High School', middle: 'Middle School', elementary: 'Elementary School',
    };
    const highest = eduOrder.find((lvl) => completed.some((e) => e.level === lvl));
    const educationLevel = highest ? eduLabels[highest]! : 'No formal education';

    const rels = RelationshipsModel.findByCharacterId(characterId);
    const partner = rels.find((r) => r.type === 'partner' && r.isAlive);
    const childrenCount = rels.filter((r) => r.type === 'child').length;
    const relationshipStatus = partner?.stage === RelationStage.Married ? `Married to ${partner.name}`
      : partner?.stage === RelationStage.Engaged ? `Engaged to ${partner.name}`
      : partner ? `Dating ${partner.name}`
      : 'Single';

    // Epitaph: career + roles
    const roles: string[] = [];
    if (job) roles.push(job.title);
    if (partner?.stage === RelationStage.Married) roles.push('devoted Spouse');
    if (childrenCount > 0) roles.push('loving Parent');
    const epitaph = roles.length > 0 ? `Beloved ${roles.join(', ')}` : 'A life quietly lived';

    const summary = FinanceService.computeSummary(characterId);
    const stats = StatsModel.findByCharacterId(characterId);
    const achievementCount = AchievementsModel.findByCharacterId(characterId).length;

    // ── Legacy score ──
    const wealthPts = Math.max(0, Math.min(25, Math.round(summary.netWorth / 100000)));
    const eduPts = highest === 'graduate' ? 20 : highest === 'university' ? 16
      : highest === 'trade' ? 10 : highest === 'high' ? 5 : 0;
    const happyPts = Math.round(((stats?.happiness ?? 50) / 100) * 15);
    const careerPts = job
      ? (job.category === 'elite' ? 20 : job.category === 'university' ? 14 : job.category === 'trade' ? 9 : 5) + Math.min(5, job.level)
      : 0;
    const relPts = Math.min(20,
      (partner?.stage === RelationStage.Married ? 8 : partner ? 4 : 0)
      + childrenCount * 3
      + rels.filter((r) => r.type === 'friend' && r.isAlive).length);
    const achPts = Math.min(20, achievementCount * 2);
    const total = wealthPts + eduPts + happyPts + Math.min(25, careerPts) + relPts + achPts;
    const rank = total >= 85 ? 'Legendary Life' : total >= 65 ? 'Extraordinary Life'
      : total >= 42 ? 'Successful Life' : 'Ordinary Life';
    const legacy: LegacyScore = {
      wealth: wealthPts, education: eduPts, happiness: happyPts,
      career: Math.min(25, careerPts), relationships: relPts, achievements: achPts,
      total, rank,
    };

    const highlights = this.buildTimeline(characterId);
    highlights.push({ age: character.age, text: `Passed away — ${causeOfDeath.toLowerCase()}`, kind: 'death' });

    return {
      name: character.name,
      birthYear: character.birthYear,
      deathYear: character.birthYear + character.age,
      ageAtDeath: character.age,
      causeOfDeath,
      netWorth: summary.netWorth,
      careerTitle,
      educationLevel,
      relationshipStatus,
      childrenCount,
      epitaph,
      legacy,
      highlights,
    };
  },

  /** Build a chronological life-story timeline from recorded history. */
  buildTimeline(characterId: string): TimelineEntry[] {
    const character = CharacterModel.findById(characterId);
    if (!character) return [];
    const entries: TimelineEntry[] = [];

    entries.push({ age: 0, text: `${character.name} was born`, kind: 'milestone' });

    // Education completions
    const eduText: Record<string, string> = {
      high: 'Graduated High School', university: 'Graduated University',
      trade: 'Completed Trade School', graduate: 'Earned a Graduate Degree',
    };
    for (const e of EducationModel.findByCharacterId(characterId)) {
      if (e.completed && e.endAge != null && eduText[e.level]) {
        entries.push({ age: e.endAge, text: eduText[e.level]!, kind: 'education' });
        if (e.level === 'university' && character.major) {
          entries.push({ age: e.endAge, text: `Earned a degree in ${getMajorLabel(character.major)}`, kind: 'education' });
        }
      }
    }

    // Jobs
    for (const j of JobModel.findAll(characterId)) {
      if (j.startAge != null) entries.push({ age: j.startAge, text: `Started work as a ${j.title}`, kind: 'career' });
    }

    // Major purchases
    for (const a of AssetsModel.findByCharacterId(characterId)) {
      if (a.purchaseAge != null) entries.push({ age: a.purchaseAge, text: `Bought a ${a.label}`, kind: 'finance' });
    }

    // Relationship / family milestones (logged with eventId 'milestone:*')
    for (const log of EventLogModel.findByCharacterId(characterId, 500)) {
      if (log.eventId.startsWith('milestone:')) {
        entries.push({ age: log.ageAtEvent, text: log.outcomeText, kind: 'family' });
      }
    }

    entries.sort((a, b) => a.age - b.age);
    return entries;
  },
};
