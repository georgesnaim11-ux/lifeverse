import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { EarnedAchievement } from '@lifeverse/shared';

interface AchievementRow {
  id: string;
  character_id: string;
  achievement_id: string;
  unlocked_at: string;
}

function rowToAchievement(row: AchievementRow): EarnedAchievement {
  return {
    id: row.id,
    characterId: row.character_id,
    achievementId: row.achievement_id,
    unlockedAt: row.unlocked_at,
  };
}

export const AchievementsModel = {
  grant(characterId: string, achievementId: string): EarnedAchievement | null {
    if (this.hasAchievement(characterId, achievementId)) return null;
    const id = newId();
    getDb()
      .prepare(
        `INSERT OR IGNORE INTO achievements (id, character_id, achievement_id)
         VALUES (?, ?, ?)`,
      )
      .run(id, characterId, achievementId);
    const row = getDb()
      .prepare('SELECT * FROM achievements WHERE character_id = ? AND achievement_id = ?')
      .get(characterId, achievementId) as AchievementRow | undefined;
    return row ? rowToAchievement(row) : null;
  },

  hasAchievement(characterId: string, achievementId: string): boolean {
    const row = getDb()
      .prepare('SELECT id FROM achievements WHERE character_id = ? AND achievement_id = ?')
      .get(characterId, achievementId) as { id: string } | undefined;
    return !!row;
  },

  findByCharacterId(characterId: string): EarnedAchievement[] {
    const rows = getDb()
      .prepare('SELECT * FROM achievements WHERE character_id = ? ORDER BY unlocked_at ASC')
      .all(characterId) as AchievementRow[];
    return rows.map(rowToAchievement);
  },
};
