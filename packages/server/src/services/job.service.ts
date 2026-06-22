import { JobModel, FinanceModel, FlagsModel, StatsModel, CharacterModel, EducationModel } from '../models/index.js';
import {
  JOBS, getJobById, salaryForLevel,
  EducationLevel, EducationRequirement,
} from '@lifeverse/shared';
import type {
  JobDefinition, JobEligibility, JobState, Character, StatBlock,
} from '@lifeverse/shared';

/** Does the character meet the education requirement of a job? */
function meetsEducation(characterId: string, req: EducationRequirement): boolean {
  switch (req) {
    case EducationRequirement.None:
      return true;
    case EducationRequirement.HighSchool:
      return EducationModel.hasCompleted(characterId, EducationLevel.High);
    case EducationRequirement.Trade:
      return EducationModel.hasCompleted(characterId, EducationLevel.Trade)
        || EducationModel.hasCompleted(characterId, EducationLevel.University);
    case EducationRequirement.University:
      return EducationModel.hasCompleted(characterId, EducationLevel.University);
    default:
      return false;
  }
}

function evaluateJob(
  job: JobDefinition,
  character: Character,
  stats: StatBlock,
): JobEligibility {
  const reasons: string[] = [];

  if (character.age < job.minAge) {
    reasons.push(`Must be ${job.minAge}+ (you are ${character.age})`);
  }
  if (!meetsEducation(character.id, job.requiredEducation)) {
    const label = job.requiredEducation === EducationRequirement.University ? 'a university degree'
      : job.requiredEducation === EducationRequirement.Trade ? 'trade school'
      : job.requiredEducation === EducationRequirement.HighSchool ? 'a high school diploma'
      : '';
    if (label) reasons.push(`Requires ${label}`);
  }
  if (job.requiredMajors && job.requiredMajors.length > 0) {
    if (!character.major || !job.requiredMajors.includes(character.major)) {
      reasons.push('Requires a specific degree major');
    }
  }
  if (job.minIntelligence !== undefined && stats.intelligence < job.minIntelligence) {
    reasons.push(`Needs Intelligence ${job.minIntelligence}+`);
  }
  if (job.experienceRequired !== undefined) {
    const exp = JobModel.totalExperience(character.id);
    if (exp < job.experienceRequired) {
      reasons.push(`Needs ${job.experienceRequired} yrs work experience (you have ${exp})`);
    }
  }

  return { job, eligible: reasons.length === 0, reasons };
}

export const JobService = {
  /** Eligibility for every job in the catalogue. */
  listEligibility(characterId: string): JobEligibility[] {
    const character = CharacterModel.findById(characterId);
    const stats = StatsModel.findByCharacterId(characterId);
    if (!character || !stats) return [];
    return JOBS.map((job) => evaluateJob(job, character, stats));
  },

  getActiveJob(characterId: string): JobState | null {
    return JobModel.findActive(characterId);
  },

  /** Apply for and start a job (validated). */
  apply(characterId: string, jobId: string): { job: JobState; message: string } {
    const job = getJobById(jobId);
    if (!job) throw new Error(`Unknown job: ${jobId}`);
    const character = CharacterModel.findById(characterId);
    const stats = StatsModel.findByCharacterId(characterId);
    if (!character || !stats) throw new Error('Character not found');

    const evalResult = evaluateJob(job, character, stats);
    if (!evalResult.eligible) {
      throw new Error(evalResult.reasons[0] ?? 'You are not eligible for this job');
    }

    const created = JobModel.create({
      characterId,
      jobId: job.id,
      title: job.title,
      category: job.category,
      annualSalary: job.baseSalary,
      satisfaction: job.satisfaction,
      startAge: character.age,
    });
    FlagsModel.set(characterId, 'isEmployed', true);
    FinanceModel.update(characterId, { annualIncome: job.baseSalary });
    return { job: created, message: `You were hired as a ${job.title}!` };
  },

  /** Try to get a promotion. Requires 2+ years and meeting intelligence bar. */
  askForPromotion(characterId: string): { job: JobState | null; message: string } {
    const active = JobModel.findActive(characterId);
    if (!active) return { job: null, message: 'You need a job first.' };
    const def = getJobById(active.jobId);
    if (!def) return { job: active, message: 'Unknown job.' };

    if (active.level >= def.promotionLevels) {
      return { job: active, message: 'You are already at the top of this career.' };
    }
    if (active.yearsInRole < 2) {
      return { job: active, message: 'You need at least 2 years in role before a promotion.' };
    }
    const stats = StatsModel.findByCharacterId(characterId);
    // Promotion odds scale with intelligence + satisfaction
    const chance = 0.35 + ((stats?.intelligence ?? 50) / 200) + (active.satisfaction / 400);
    if (Math.random() > chance) {
      return { job: active, message: 'Your request was declined this time. Keep at it.' };
    }
    const newLevel = active.level + 1;
    const newSalary = salaryForLevel(def, newLevel);
    const promoted = JobModel.promote(active.id, newLevel, newSalary);
    FinanceModel.update(characterId, { annualIncome: newSalary });
    return { job: promoted, message: `Promoted! You now earn $${newSalary.toLocaleString()}/yr.` };
  },

  /** Work hard for a year — boosts satisfaction/promotion odds but adds stress. */
  workHard(characterId: string): { job: JobState | null; message: string } {
    const active = JobModel.findActive(characterId);
    if (!active) return { job: null, message: 'You need a job first.' };
    const stats = StatsModel.findByCharacterId(characterId);
    if (stats) {
      StatsModel.update(characterId, {
        ...stats,
        stress: Math.min(100, stats.stress + 10),
        intelligence: Math.min(100, stats.intelligence + 1),
      });
    }
    const newSat = Math.min(100, active.satisfaction + 5);
    JobModel.updateSatisfaction(active.id, newSat);
    return { job: { ...active, satisfaction: newSat }, message: 'You put in extra effort this year. Stress rose, but so did your standing.' };
  },

  quit(characterId: string): { message: string } {
    const active = JobModel.findActive(characterId);
    if (!active) return { message: 'You have no job to quit.' };
    JobModel.quit(characterId);
    FlagsModel.set(characterId, 'isEmployed', false);
    FinanceModel.update(characterId, { annualIncome: 0 });
    return { message: `You quit your job as a ${active.title}.` };
  },

  /**
   * Annual payroll/satisfaction step. Returns stat deltas to apply
   * (happiness from satisfaction, stress from job).
   */
  annualUpdate(characterId: string): { happinessDelta: number; stressDelta: number } {
    const active = JobModel.findActive(characterId);
    if (!active) return { happinessDelta: 0, stressDelta: 0 };
    JobModel.incrementYear(active.id);
    const def = getJobById(active.jobId);
    const stress = def?.stressImpact ?? 6;
    // Satisfaction above 50 lifts happiness, below 50 drags it
    const happinessDelta = Math.round((active.satisfaction - 50) / 12);
    return { happinessDelta, stressDelta: stress };
  },
};
