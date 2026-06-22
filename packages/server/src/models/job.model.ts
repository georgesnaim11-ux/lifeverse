import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { JobState, JobCategory } from '@lifeverse/shared';

interface JobRow {
  id: string;
  character_id: string;
  job_id: string;
  title: string;
  category: string;
  level: number;
  annual_salary: number;
  years_in_role: number;
  satisfaction: number;
  start_age: number | null;
  is_active: number;
}

function rowToJob(row: JobRow): JobState {
  return {
    id: row.id,
    characterId: row.character_id,
    jobId: row.job_id,
    title: row.title,
    category: row.category as JobCategory,
    level: row.level,
    annualSalary: row.annual_salary,
    yearsInRole: row.years_in_role,
    satisfaction: row.satisfaction,
    startAge: row.start_age ?? 0,
    isActive: row.is_active === 1,
  };
}

export interface CreateJobInput {
  characterId: string;
  jobId: string;
  title: string;
  category: JobCategory;
  annualSalary: number;
  satisfaction: number;
  startAge: number;
}

export const JobModel = {
  create(input: CreateJobInput): JobState {
    const id = newId();
    // Deactivate any current job first
    getDb().prepare('UPDATE jobs SET is_active = 0 WHERE character_id = ?').run(input.characterId);
    getDb()
      .prepare(
        `INSERT INTO jobs (id, character_id, job_id, title, category, level, annual_salary, satisfaction, start_age, is_active)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 1)`,
      )
      .run(id, input.characterId, input.jobId, input.title, input.category, input.annualSalary, input.satisfaction, input.startAge);
    return this.findById(id) as JobState;
  },

  findById(id: string): JobState | null {
    const row = getDb().prepare('SELECT * FROM jobs WHERE id = ?').get(id) as JobRow | undefined;
    return row ? rowToJob(row) : null;
  },

  findActive(characterId: string): JobState | null {
    const row = getDb()
      .prepare('SELECT * FROM jobs WHERE character_id = ? AND is_active = 1')
      .get(characterId) as JobRow | undefined;
    return row ? rowToJob(row) : null;
  },

  findAll(characterId: string): JobState[] {
    const rows = getDb()
      .prepare('SELECT * FROM jobs WHERE character_id = ? ORDER BY start_age ASC')
      .all(characterId) as JobRow[];
    return rows.map(rowToJob);
  },

  /** Total years of work experience across all jobs ever held. */
  totalExperience(characterId: string): number {
    const row = getDb()
      .prepare('SELECT COALESCE(SUM(years_in_role), 0) as total FROM jobs WHERE character_id = ?')
      .get(characterId) as { total: number };
    return row.total;
  },

  incrementYear(id: string): void {
    getDb().prepare('UPDATE jobs SET years_in_role = years_in_role + 1 WHERE id = ?').run(id);
  },

  promote(id: string, newLevel: number, newSalary: number): JobState {
    getDb()
      .prepare('UPDATE jobs SET level = ?, annual_salary = ? WHERE id = ?')
      .run(newLevel, newSalary, id);
    return this.findById(id) as JobState;
  },

  updateSatisfaction(id: string, satisfaction: number): void {
    getDb().prepare('UPDATE jobs SET satisfaction = ? WHERE id = ?').run(satisfaction, id);
  },

  quit(characterId: string): void {
    getDb().prepare('UPDATE jobs SET is_active = 0 WHERE character_id = ? AND is_active = 1').run(characterId);
  },
};
