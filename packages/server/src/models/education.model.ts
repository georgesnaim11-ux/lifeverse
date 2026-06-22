import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { Education, EducationLevel } from '@lifeverse/shared';

interface EducationRow {
  id: string;
  character_id: string;
  level: string;
  completed: number;
  gpa: number | null;
  debt_incurred: number;
  start_age: number | null;
  end_age: number | null;
}

function rowToEducation(row: EducationRow): Education {
  return {
    id: row.id,
    characterId: row.character_id,
    level: row.level as EducationLevel,
    completed: row.completed === 1,
    gpa: row.gpa,
    debtIncurred: row.debt_incurred,
    startAge: row.start_age,
    endAge: row.end_age,
  };
}

export const EducationModel = {
  create(characterId: string, level: EducationLevel, startAge: number, debt = 0): Education {
    const id = newId();
    getDb()
      .prepare(
        `INSERT INTO education (id, character_id, level, start_age, debt_incurred)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, characterId, level, startAge, debt);
    return this.findById(id) as Education;
  },

  findById(id: string): Education | null {
    const row = getDb()
      .prepare('SELECT * FROM education WHERE id = ?')
      .get(id) as EducationRow | undefined;
    return row ? rowToEducation(row) : null;
  },

  findByCharacterId(characterId: string): Education[] {
    const rows = getDb()
      .prepare('SELECT * FROM education WHERE character_id = ? ORDER BY start_age ASC')
      .all(characterId) as EducationRow[];
    return rows.map(rowToEducation);
  },

  hasCompleted(characterId: string, level: EducationLevel): boolean {
    const row = getDb()
      .prepare(
        'SELECT id FROM education WHERE character_id = ? AND level = ? AND completed = 1',
      )
      .get(characterId, level) as { id: string } | undefined;
    return !!row;
  },

  complete(id: string, endAge: number, gpa: number | null = null): Education {
    getDb()
      .prepare('UPDATE education SET completed = 1, end_age = ?, gpa = ? WHERE id = ?')
      .run(endAge, gpa, id);
    return this.findById(id) as Education;
  },
};
