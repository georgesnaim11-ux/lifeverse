import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { Save } from '@lifeverse/shared';

interface SaveRow {
  id: string;
  character_id: string;
  save_name: string | null;
  is_autosave: number;
  saved_at: string;
}

function rowToSave(row: SaveRow): Save {
  return {
    id: row.id,
    characterId: row.character_id,
    saveName: row.save_name,
    isAutosave: row.is_autosave === 1,
    savedAt: row.saved_at,
  };
}

export const SavesModel = {
  create(characterId: string, saveName: string | null = null, isAutosave = false): Save {
    const id = newId();
    // Replace previous autosave if this is an autosave
    if (isAutosave) {
      getDb()
        .prepare('DELETE FROM saves WHERE character_id = ? AND is_autosave = 1')
        .run(characterId);
    }
    getDb()
      .prepare(
        `INSERT INTO saves (id, character_id, save_name, is_autosave)
         VALUES (?, ?, ?, ?)`,
      )
      .run(id, characterId, saveName, isAutosave ? 1 : 0);
    return rowToSave(
      getDb().prepare('SELECT * FROM saves WHERE id = ?').get(id) as SaveRow,
    );
  },

  findByCharacterId(characterId: string): Save[] {
    const rows = getDb()
      .prepare('SELECT * FROM saves WHERE character_id = ? ORDER BY saved_at DESC')
      .all(characterId) as SaveRow[];
    return rows.map(rowToSave);
  },
};
