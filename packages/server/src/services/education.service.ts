import { EducationModel, FlagsModel, CharacterModel, StatsModel } from '../models/index.js';
import { FinanceService } from './finance.service.js';
import { EducationLevel } from '@lifeverse/shared';
import type { Education, Major } from '@lifeverse/shared';

/** Education cost (debt incurred). */
const EDUCATION_COST: Partial<Record<EducationLevel, number>> = {
  [EducationLevel.Trade]:       15000,
  [EducationLevel.University]:  60000,
  [EducationLevel.Graduate]:    40000,
};

/** Years required to complete each level. */
const EDUCATION_YEARS: Partial<Record<EducationLevel, number>> = {
  [EducationLevel.Elementary]: 7,
  [EducationLevel.Middle]:     3,
  [EducationLevel.High]:       4,
  [EducationLevel.Trade]:      2,
  [EducationLevel.University]: 4,
  [EducationLevel.Graduate]:   3,
};

export const EducationService = {
  /** Enrol the character in a new education level. */
  enrol(characterId: string, level: EducationLevel, age: number): Education | null {
    if (EducationModel.hasCompleted(characterId, level)) return null;
    const cost = EDUCATION_COST[level] ?? 0;
    const edu = EducationModel.create(characterId, level, age, cost);
    // Paid tuition is financed by a student loan (real debt with payments).
    if (cost > 0) FinanceService.addStudentLoan(characterId, cost);
    return edu;
  },

  /** Run each year — auto-complete education records whose duration has elapsed. */
  annualUpdate(characterId: string, age: number): Education[] {
    const all = EducationModel.findByCharacterId(characterId);
    const completed: Education[] = [];

    for (const edu of all) {
      if (edu.completed || !edu.startAge) continue;
      const years = EDUCATION_YEARS[edu.level];
      if (years === undefined) continue;
      if (age >= edu.startAge + years) {
        const gpa = Math.round((2.5 + Math.random() * 1.5) * 10) / 10; // 2.5 – 4.0
        const done = EducationModel.complete(edu.id, age, gpa);
        completed.push(done);
        this.applyCompletionEffects(characterId, edu.level);
      }
    }
    return completed;
  },

  applyCompletionEffects(characterId: string, level: EducationLevel): void {
    switch (level) {
      case EducationLevel.Elementary:
        FlagsModel.set(characterId, 'hasElementary', true);
        break;
      case EducationLevel.Middle:
        FlagsModel.set(characterId, 'hasMiddleSchool', true);
        break;
      case EducationLevel.High:
        FlagsModel.set(characterId, 'hasHighSchool', true);
        break;
      case EducationLevel.Trade:
        FlagsModel.set(characterId, 'hasTradeDegree', true);
        FlagsModel.set(characterId, 'inHigherEd', false);
        break;
      case EducationLevel.University:
        FlagsModel.set(characterId, 'hasDegree', true);
        FlagsModel.set(characterId, 'inUniversity', false);
        break;
      case EducationLevel.Graduate:
        FlagsModel.set(characterId, 'hasGraduateDegree', true);
        FlagsModel.set(characterId, 'inHigherEd', false);
        break;
    }
  },

  /** Auto-enrol childhood education levels at the right ages. */
  autoProgressChildhood(characterId: string, age: number): void {
    if (age === 12) this.enrol(characterId, EducationLevel.Middle, age);
    if (age === 14) this.enrol(characterId, EducationLevel.High, age);
  },

  /* ─────────── Higher education (player-driven) ─────────── */

  /** Enrol in trade school, university (with major), or graduate school. */
  enrollHigher(
    characterId: string,
    level: 'trade' | 'university' | 'graduate',
    major?: Major,
  ): { message: string } {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error('Character not found');

    const eduLevel = level === 'trade' ? EducationLevel.Trade
      : level === 'university' ? EducationLevel.University
      : EducationLevel.Graduate;

    if (character.age < 18) throw new Error('You must be 18 or older for higher education.');
    if (!FlagsModel.get(characterId, 'hasHighSchool')) {
      throw new Error('You need to finish high school first.');
    }
    if (EducationModel.hasCompleted(characterId, eduLevel)) {
      throw new Error('You have already completed this level.');
    }
    // Already enrolled?
    const inProgress = EducationModel.findByCharacterId(characterId)
      .some((e) => e.level === eduLevel && !e.completed);
    if (inProgress) throw new Error('You are already enrolled.');

    if (eduLevel === EducationLevel.University) {
      if (!major) throw new Error('Choose a major to enrol in university.');
      CharacterModel.update(characterId, { major });
    }

    this.enrol(characterId, eduLevel, character.age);
    FlagsModel.set(characterId, eduLevel === EducationLevel.University ? 'inUniversity' : 'inHigherEd', true);
    const label = level === 'trade' ? 'trade school' : level === 'graduate' ? 'graduate school' : 'university';
    return { message: `You enrolled in ${label}.` };
  },

  /** Study — small intelligence boost, available to enrolled students. */
  study(characterId: string): { message: string } {
    const stats = StatsModel.findByCharacterId(characterId);
    if (!stats) throw new Error('Stats not found');
    StatsModel.update(characterId, {
      ...stats,
      intelligence: Math.min(100, stats.intelligence + 3),
      stress: Math.min(100, stats.stress + 4),
    });
    return { message: 'You hit the books. Intelligence rose.' };
  },

  attendClass(characterId: string): { message: string } {
    const stats = StatsModel.findByCharacterId(characterId);
    if (!stats) throw new Error('Stats not found');
    StatsModel.update(characterId, {
      ...stats,
      intelligence: Math.min(100, stats.intelligence + 2),
    });
    return { message: 'You attended your classes and absorbed the material.' };
  },

  /** Take an exam — bigger intelligence payoff scaled by current intelligence. */
  takeExam(characterId: string): { message: string } {
    const stats = StatsModel.findByCharacterId(characterId);
    if (!stats) throw new Error('Stats not found');
    const passed = Math.random() < (0.4 + stats.intelligence / 200);
    if (passed) {
      StatsModel.update(characterId, {
        ...stats,
        intelligence: Math.min(100, stats.intelligence + 4),
        happiness: Math.min(100, stats.happiness + 4),
      });
      return { message: 'You aced the exam! Intelligence and confidence rose.' };
    }
    StatsModel.update(characterId, {
      ...stats,
      happiness: Math.max(0, stats.happiness - 4),
      stress: Math.min(100, stats.stress + 6),
    });
    return { message: 'You struggled on the exam. Better luck next time.' };
  },
};
