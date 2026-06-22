import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';

interface FlagRow {
  id: string;
  character_id: string;
  key: string;
  value: number;
}

export const FlagsModel = {
  getAll(characterId: string): Record<string, boolean> {
    const rows = getDb()
      .prepare('SELECT key, value FROM flags WHERE character_id = ?')
      .all(characterId) as Array<{ key: string; value: number }>;
    const result: Record<string, boolean> = {};
    for (const row of rows) {
      result[row.key] = row.value === 1;
    }
    return result;
  },

  get(characterId: string, key: string): boolean {
    const row = getDb()
      .prepare('SELECT value FROM flags WHERE character_id = ? AND key = ?')
      .get(characterId, key) as FlagRow | undefined;
    return row ? row.value === 1 : false;
  },

  set(characterId: string, key: string, value: boolean): void {
    const existing = getDb()
      .prepare('SELECT id FROM flags WHERE character_id = ? AND key = ?')
      .get(characterId, key) as { id: string } | undefined;
    if (existing) {
      getDb()
        .prepare('UPDATE flags SET value = ? WHERE character_id = ? AND key = ?')
        .run(value ? 1 : 0, characterId, key);
    } else {
      getDb()
        .prepare('INSERT INTO flags (id, character_id, key, value) VALUES (?, ?, ?, ?)')
        .run(newId(), characterId, key, value ? 1 : 0);
    }
  },

  setMany(characterId: string, flags: Record<string, boolean>): void {
    for (const [key, value] of Object.entries(flags)) {
      this.set(characterId, key, value);
    }
  },
};
