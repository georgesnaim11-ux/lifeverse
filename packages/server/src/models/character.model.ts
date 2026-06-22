import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import { nationalityOf } from '@lifeverse/shared';
import type { Character, Gender, LifeStage, Major } from '@lifeverse/shared';

interface CharacterRow {
  id: string;
  bloodline_id: string;
  parent_id: string | null;
  name: string;
  birth_year: number;
  age: number;
  life_stage: string;
  is_alive: number;
  is_heir: number;
  fame: number;
  country: string;
  gender: string;
  major: string | null;
  created_at: string;
}

function rowToCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    bloodlineId: row.bloodline_id,
    parentId: row.parent_id,
    name: row.name,
    birthYear: row.birth_year,
    age: row.age,
    lifeStage: row.life_stage as LifeStage,
    isAlive: row.is_alive === 1,
    isHeir: row.is_heir === 1,
    fame: row.fame,
    country: row.country,
    nationality: nationalityOf(row.country),
    gender: (row.gender as Gender) ?? 'male',
    major: (row.major as Major | null) ?? null,
    createdAt: row.created_at,
  };
}

export interface CreateCharacterInput {
  bloodlineId: string;
  name: string;
  birthYear: number;
  country: string;
  gender: Gender;
}

export const CharacterModel = {
  create(input: CreateCharacterInput): Character {
    const id = newId();
    getDb()
      .prepare(
        `INSERT INTO characters
           (id, bloodline_id, name, birth_year, country, gender, life_stage)
         VALUES (?, ?, ?, ?, ?, ?, 'childhood')`,
      )
      .run(id, input.bloodlineId, input.name, input.birthYear, input.country, input.gender);
    return this.findById(id) as Character;
  },

  findById(id: string): Character | null {
    const row = getDb()
      .prepare('SELECT * FROM characters WHERE id = ?')
      .get(id) as CharacterRow | undefined;
    return row ? rowToCharacter(row) : null;
  },

  update(
    id: string,
    fields: Partial<{ age: number; lifeStage: LifeStage; isAlive: boolean; fame: number; major: Major | null }>,
  ): Character {
    const updates: string[] = [];
    const values: unknown[] = [];
    if (fields.age !== undefined) { updates.push('age = ?'); values.push(fields.age); }
    if (fields.lifeStage !== undefined) { updates.push('life_stage = ?'); values.push(fields.lifeStage); }
    if (fields.isAlive !== undefined) { updates.push('is_alive = ?'); values.push(fields.isAlive ? 1 : 0); }
    if (fields.fame !== undefined) { updates.push('fame = ?'); values.push(fields.fame); }
    if (fields.major !== undefined) { updates.push('major = ?'); values.push(fields.major); }
    if (updates.length > 0) {
      values.push(id);
      getDb().prepare(`UPDATE characters SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    return this.findById(id) as Character;
  },

  markDead(id: string): void {
    getDb().prepare('UPDATE characters SET is_alive = 0 WHERE id = ?').run(id);
  },
};
