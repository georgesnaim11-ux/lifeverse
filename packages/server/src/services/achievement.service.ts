import { AchievementsModel, RelationshipsModel, JobModel, EducationModel } from '../models/index.js';
import { RelationType, EducationLevel, JobCategory } from '@lifeverse/shared';
import type { Character, StatBlock, EarnedAchievement, Finance } from '@lifeverse/shared';

interface AchievementCheckContext {
  character: Character;
  stats: StatBlock;
  flags: Record<string, boolean>;
  finance: Finance;
}

interface AchievementDef {
  id: string;
  check: (ctx: AchievementCheckContext) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_step',        check: ({ character }) => character.age >= 1 },
  { id: 'teenager',          check: ({ character }) => character.age >= 13 },
  { id: 'adult',             check: ({ character }) => character.age >= 18 },
  { id: 'senior',            check: ({ character }) => character.age >= 65 },
  { id: 'elder',             check: ({ character }) => character.age >= 80 },
  { id: 'scholar',           check: ({ character }) => EducationModel.hasCompleted(character.id, EducationLevel.University) },
  { id: 'graduate',          check: ({ character }) => EducationModel.hasCompleted(character.id, EducationLevel.Graduate) },
  { id: 'first_job',         check: ({ flags }) => flags['isEmployed'] === true },
  { id: 'sports_award',      check: ({ flags }) => flags['sportsAward'] === true },
  { id: 'pro_athlete',       check: ({ flags }) => flags['isProAthlete'] === true },
  { id: 'pro_award',         check: ({ flags }) => flags['sportsProAward'] === true },
  { id: 'hall_of_fame',      check: ({ flags }) => flags['sportsHallOfFame'] === true },
  { id: 'married',           check: ({ flags }) => flags['isMarried'] === true },
  { id: 'parent',            check: ({ flags }) => flags['hasChildren'] === true },
  { id: 'homeowner',         check: ({ flags }) => flags['hasHouse'] === true },
  { id: 'retired',           check: ({ flags }) => flags['isRetired'] === true },
  {
    id: 'millionaire',
    check: ({ finance }) => finance.cash - finance.totalDebt >= 1_000_000,
  },
  {
    id: 'promotion',
    check: ({ character }) => {
      const job = JobModel.findActive(character.id);
      return job !== null && job.level >= 2;
    },
  },
  {
    id: 'executive',
    check: ({ character }) => {
      const job = JobModel.findActive(character.id);
      return job !== null && job.category === JobCategory.Elite;
    },
  },
  {
    id: 'social_butterfly',
    check: ({ character }) => {
      const rels = RelationshipsModel.findByCharacterId(character.id);
      return rels.filter((r) => r.type === RelationType.Friend && r.isAlive).length >= 5;
    },
  },
  {
    id: 'well_rounded',
    check: ({ stats }) =>
      stats.health >= 60 && stats.intelligence >= 60 &&
      stats.happiness >= 60 && stats.looks >= 60,
  },
  {
    id: 'iron_discipline',
    check: ({ stats }) => stats.looks >= 85,
  },
  {
    id: 'mastermind',
    check: ({ stats }) => stats.intelligence >= 85,
  },
  {
    id: 'beloved',
    check: ({ character }) => {
      const rels = RelationshipsModel.findByCharacterId(character.id);
      return rels.filter((r) => r.isAlive && r.bond >= 80).length >= 3;
    },
  },
];

export const AchievementService = {
  /** Check all achievements and grant newly-earned ones. Returns new grants. */
  checkAndGrant(ctx: AchievementCheckContext): EarnedAchievement[] {
    const granted: EarnedAchievement[] = [];
    for (const def of ACHIEVEMENTS) {
      if (AchievementsModel.hasAchievement(ctx.character.id, def.id)) continue;
      try {
        if (def.check(ctx)) {
          const earned = AchievementsModel.grant(ctx.character.id, def.id);
          if (earned) granted.push(earned);
        }
      } catch {
        // Silently skip achievement checks that throw (defensive)
      }
    }
    return granted;
  },
};
