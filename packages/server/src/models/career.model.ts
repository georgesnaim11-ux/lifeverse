import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { Career, CareerTrack } from '@lifeverse/shared';

interface CareerRow {
  id: string;
  character_id: string;
  track: string;
  tier: number;
  years_in_role: number;
  annual_salary: number;
  start_age: number | null;
  end_age: number | null;
  is_active: number;
}

function rowToCareer(row: CareerRow): Career {
  return {
    id: row.id,
    characterId: row.character_id,
    track: row.track as CareerTrack,
    tier: row.tier,
    yearsInRole: row.years_in_role,
    annualSalary: row.annual_salary,
    startAge: row.start_age,
    endAge: row.end_age,
    isActive: row.is_active === 1,
  };
}

export const CareerModel = {
  create(characterId: string, track: CareerTrack, salary: number, startAge: number): Career {
    const id = newId();
    getDb()
      .prepare(
        `INSERT INTO careers (id, character_id, track, annual_salary, start_age, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
      )
      .run(id, characterId, track, salary, startAge);
    // Deactivate any previous active career
    getDb()
      .prepare('UPDATE careers SET is_active = 0 WHERE character_id = ? AND id != ?')
      .run(characterId, id);
    return this.findById(id) as Career;
  },

  findById(id: string): Career | null {
    const row = getDb()
      .prepare('SELECT * FROM careers WHERE id = ?')
      .get(id) as CareerRow | undefined;
    return row ? rowToCareer(row) : null;
  },

  findActive(characterId: string): Career | null {
    const row = getDb()
      .prepare('SELECT * FROM careers WHERE character_id = ? AND is_active = 1')
      .get(characterId) as CareerRow | undefined;
    return row ? rowToCareer(row) : null;
  },

  findByCharacterId(characterId: string): Career[] {
    const rows = getDb()
      .prepare('SELECT * FROM careers WHERE character_id = ? ORDER BY start_age ASC')
      .all(characterId) as CareerRow[];
    return rows.map(rowToCareer);
  },

  incrementYear(id: string): void {
    getDb().prepare('UPDATE careers SET years_in_role = years_in_role + 1 WHERE id = ?').run(id);
  },

  promote(id: string, newTier: number, newSalary: number): Career {
    getDb()
      .prepare('UPDATE careers SET tier = ?, annual_salary = ?, years_in_role = 0 WHERE id = ?')
      .run(newTier, newSalary, id);
    return this.findById(id) as Career;
  },

  retire(id: string, endAge: number): void {
    getDb()
      .prepare('UPDATE careers SET is_active = 0, end_age = ? WHERE id = ?')
      .run(endAge, id);
  },
};
