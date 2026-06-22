import { getDb } from '../db/index.js';
import type { StatBlock } from '@lifeverse/shared';

interface StatsRow {
  character_id: string;
  health: number;
  intelligence: number;
  happiness: number;
  looks: number;
  stress: number;
  willpower: number;
  updated_at: string;
}

function rowToStatBlock(row: StatsRow): StatBlock {
  return {
    health: row.health,
    intelligence: row.intelligence,
    happiness: row.happiness,
    looks: row.looks,
    stress: row.stress,
    willpower: row.willpower,
  };
}

export const StatsModel = {
  create(characterId: string, initial: Partial<StatBlock> = {}): StatBlock {
    const s: StatBlock = {
      health: initial.health ?? 50,
      intelligence: initial.intelligence ?? 50,
      happiness: initial.happiness ?? 50,
      looks: initial.looks ?? 50,
      stress: initial.stress ?? 0,
      willpower: initial.willpower ?? 50,
    };
    getDb()
      .prepare(
        `INSERT INTO stats
           (character_id, health, intelligence, happiness, looks, stress, willpower)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        characterId,
        s.health, s.intelligence, s.happiness,
        s.looks, s.stress, s.willpower,
      );
    return s;
  },

  findByCharacterId(characterId: string): StatBlock | null {
    const row = getDb()
      .prepare('SELECT * FROM stats WHERE character_id = ?')
      .get(characterId) as StatsRow | undefined;
    return row ? rowToStatBlock(row) : null;
  },

  update(characterId: string, stats: StatBlock): StatBlock {
    getDb()
      .prepare(
        `UPDATE stats
         SET health = ?, intelligence = ?, happiness = ?, looks = ?,
             stress = ?, willpower = ?, updated_at = datetime('now')
         WHERE character_id = ?`,
      )
      .run(
        stats.health, stats.intelligence, stats.happiness,
        stats.looks, stats.stress, stats.willpower,
        characterId,
      );
    return stats;
  },
};
