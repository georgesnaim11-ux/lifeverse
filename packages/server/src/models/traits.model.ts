import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { CharacterTrait, TraitKey } from '@lifeverse/shared';

interface TraitRow {
  id: string;
  character_id: string;
  trait_key: string;
  is_hidden: number;
  acquired_age: number | null;
}

function rowToTrait(row: TraitRow): CharacterTrait {
  return {
    key: row.trait_key as TraitKey,
    isHidden: row.is_hidden === 1,
    acquiredAge: row.acquired_age,
  };
}

export const TraitsModel = {
  assign(characterId: string, traits: CharacterTrait[]): CharacterTrait[] {
    const stmt = getDb().prepare(
      `INSERT OR IGNORE INTO traits (id, character_id, trait_key, is_hidden, acquired_age)
       VALUES (?, ?, ?, ?, ?)`,
    );
    for (const trait of traits) {
      stmt.run(newId(), characterId, trait.key, trait.isHidden ? 1 : 0, trait.acquiredAge);
    }
    return this.findByCharacterId(characterId);
  },

  add(
    characterId: string,
    traitKey: TraitKey,
    isHidden = false,
    acquiredAge: number | null = null,
  ): CharacterTrait {
    getDb()
      .prepare(
        `INSERT OR IGNORE INTO traits (id, character_id, trait_key, is_hidden, acquired_age)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(newId(), characterId, traitKey, isHidden ? 1 : 0, acquiredAge);
    return { key: traitKey, isHidden, acquiredAge };
  },

  findByCharacterId(characterId: string): CharacterTrait[] {
    const rows = getDb()
      .prepare('SELECT * FROM traits WHERE character_id = ? ORDER BY rowid ASC')
      .all(characterId) as TraitRow[];
    return rows.map(rowToTrait);
  },

  revealTrait(characterId: string, traitKey: TraitKey): void {
    getDb()
      .prepare('UPDATE traits SET is_hidden = 0 WHERE character_id = ? AND trait_key = ?')
      .run(characterId, traitKey);
  },
};
