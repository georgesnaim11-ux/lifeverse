import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { EventLogEntry } from '@lifeverse/shared';

interface EventLogRow {
  id: string;
  character_id: string;
  event_id: string;
  age_at_event: number;
  choice_id: string;
  outcome_text: string | null;
  occurred_at: string;
}

function rowToEntry(row: EventLogRow): EventLogEntry {
  return {
    id: row.id,
    characterId: row.character_id,
    eventId: row.event_id,
    ageAtEvent: row.age_at_event,
    choiceId: row.choice_id,
    outcomeText: row.outcome_text ?? '',
    occurredAt: row.occurred_at,
  };
}

export const EventLogModel = {
  create(
    characterId: string,
    eventId: string,
    ageAtEvent: number,
    choiceId: string,
    outcomeText: string,
  ): EventLogEntry {
    const id = newId();
    getDb()
      .prepare(
        `INSERT INTO event_log (id, character_id, event_id, age_at_event, choice_id, outcome_text)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, characterId, eventId, ageAtEvent, choiceId, outcomeText);
    return rowToEntry(
      getDb().prepare('SELECT * FROM event_log WHERE id = ?').get(id) as EventLogRow,
    );
  },

  findByCharacterId(characterId: string, limit = 100): EventLogEntry[] {
    const rows = getDb()
      .prepare(
        'SELECT * FROM event_log WHERE character_id = ? ORDER BY age_at_event ASC, occurred_at ASC LIMIT ?',
      )
      .all(characterId, limit) as EventLogRow[];
    return rows.map(rowToEntry);
  },

  /** Returns event IDs seen within the last `withinYears` years. Used to enforce cooldowns. */
  getRecentEventIds(characterId: string, currentAge: number, withinYears: number): Set<string> {
    const minAge = currentAge - withinYears;
    const rows = getDb()
      .prepare(
        'SELECT event_id FROM event_log WHERE character_id = ? AND age_at_event >= ?',
      )
      .all(characterId, minAge) as Array<{ event_id: string }>;
    return new Set(rows.map((r) => r.event_id));
  },
};
