import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { PerformedActivity, ActivityDefinition, DomainKey } from '@lifeverse/shared';

interface ActivityLogRow {
  id: string;
  character_id: string;
  activity_id: string;
  age: number;
  time_cost: number;
  mental_cost: number;
  physical_cost: number;
  money_cost: number;
  performed_at: string;
}

export const ActivityLogModel = {
  record(
    characterId: string,
    activityId: string,
    age: number,
    costs: { timeCost: number; mentalCost: number; physicalCost: number; moneyCost: number },
  ): void {
    getDb()
      .prepare(
        `INSERT INTO activity_log (id, character_id, activity_id, age, time_cost, mental_cost, physical_cost, money_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        newId(),
        characterId,
        activityId,
        age,
        costs.timeCost,
        costs.mentalCost,
        costs.physicalCost,
        costs.moneyCost,
      );
  },

  findByCharacterId(characterId: string): PerformedActivity[] {
    const rows = getDb()
      .prepare('SELECT * FROM activity_log WHERE character_id = ? ORDER BY performed_at DESC')
      .all(characterId) as ActivityLogRow[];
    return rows.map((r) => ({
      activityId: r.activity_id,
      timeCost: r.time_cost,
      mentalCost: r.mental_cost,
      physicalCost: r.physical_cost,
      moneyCost: r.money_cost,
    }));
  },

  getActiveDomainsThisYear(
    characterId: string,
    age: number,
    allActivities: Map<string, ActivityDefinition>,
  ): Set<DomainKey> {
    const rows = getDb()
      .prepare('SELECT activity_id FROM activity_log WHERE character_id = ? AND age = ?')
      .all(characterId, age) as Array<{ activity_id: string }>;

    const domains = new Set<DomainKey>();
    for (const row of rows) {
      const def = allActivities.get(row.activity_id);
      if (def) {
        domains.add(def.domain);
        if (def.secondaryDomain) domains.add(def.secondaryDomain);
      }
    }
    return domains;
  },
};
