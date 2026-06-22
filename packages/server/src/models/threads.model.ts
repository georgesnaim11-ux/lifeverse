import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { Thread, ThreadSeed, ThreadStatus } from '@lifeverse/shared';
import { ThreadStatus as TS } from '@lifeverse/shared';

interface ThreadRow {
  id: string;
  bloodline_id: string;
  character_id: string | null;
  thread_key: string;
  category: string;
  payload: string;
  trigger_min_age: number | null;
  trigger_max_age: number | null;
  conditions: string;
  status: string;
  created_age: number;
  is_generational: number;
  created_at: string;
}

function rowToThread(row: ThreadRow): Thread {
  const parsed = JSON.parse(row.conditions) as {
    statConditions?: Thread['statConditions'];
    flagConditions?: Thread['flagConditions'];
  };
  return {
    id: row.id,
    bloodlineId: row.bloodline_id,
    characterId: row.character_id,
    key: row.thread_key,
    category: row.category as Thread['category'],
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    triggerMinAge: row.trigger_min_age,
    triggerMaxAge: row.trigger_max_age,
    statConditions: parsed.statConditions ?? [],
    flagConditions: parsed.flagConditions ?? [],
    status: row.status as ThreadStatus,
    createdAge: row.created_age,
    isGenerational: row.is_generational === 1,
  };
}

export const ThreadsModel = {
  plantSeed(
    bloodlineId: string,
    characterId: string,
    createdAge: number,
    seed: ThreadSeed,
  ): Thread {
    const id = newId();
    const conditions = JSON.stringify({
      statConditions: seed.statConditions ?? [],
      flagConditions: seed.flagConditions ?? [],
    });
    getDb()
      .prepare(
        `INSERT INTO threads
           (id, bloodline_id, character_id, thread_key, category, payload,
            trigger_min_age, trigger_max_age, conditions, created_age, is_generational)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id, bloodlineId, characterId, seed.key, seed.category,
        JSON.stringify(seed.payload ?? {}),
        seed.triggerMinAge ?? null,
        seed.triggerMaxAge ?? null,
        conditions,
        createdAge,
        seed.isGenerational ? 1 : 0,
      );
    return rowToThread(
      getDb().prepare('SELECT * FROM threads WHERE id = ?').get(id) as ThreadRow,
    );
  },

  findActive(bloodlineId: string): Thread[] {
    const rows = getDb()
      .prepare(`SELECT * FROM threads WHERE bloodline_id = ? AND status = '${TS.Active}'`)
      .all(bloodlineId) as ThreadRow[];
    return rows.map(rowToThread);
  },

  markFired(id: string): void {
    getDb()
      .prepare(`UPDATE threads SET status = '${TS.Fired}' WHERE id = ?`)
      .run(id);
  },

  markExpired(id: string): void {
    getDb()
      .prepare(`UPDATE threads SET status = '${TS.Expired}' WHERE id = ?`)
      .run(id);
  },
};
