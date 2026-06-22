import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';

interface BloodlineRow {
  id: string;
  family_name: string;
  country: string;
  generation: number;
  legacy_score: number;
  dynasty_goals: string | null;
  created_at: string;
}

export interface Bloodline {
  id: string;
  familyName: string;
  country: string;
  generation: number;
  legacyScore: number;
  createdAt: string;
}

function rowToBloodline(row: BloodlineRow): Bloodline {
  return {
    id: row.id,
    familyName: row.family_name,
    country: row.country,
    generation: row.generation,
    legacyScore: row.legacy_score,
    createdAt: row.created_at,
  };
}

export const BloodlineModel = {
  create(familyName: string, country: string): Bloodline {
    const id = newId();
    getDb()
      .prepare(
        `INSERT INTO bloodlines (id, family_name, country)
         VALUES (?, ?, ?)`,
      )
      .run(id, familyName, country);
    const row = getDb()
      .prepare('SELECT * FROM bloodlines WHERE id = ?')
      .get(id) as BloodlineRow;
    return rowToBloodline(row);
  },

  findById(id: string): Bloodline | null {
    const row = getDb()
      .prepare('SELECT * FROM bloodlines WHERE id = ?')
      .get(id) as BloodlineRow | undefined;
    return row ? rowToBloodline(row) : null;
  },
};
