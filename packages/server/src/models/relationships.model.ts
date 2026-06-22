import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { Relationship, RelationshipEvent, RelationType, RelationStage, PartnerMeta } from '@lifeverse/shared';

interface RelationshipRow {
  id: string;
  character_id: string;
  npc_id: string | null;
  name: string;
  type: string;
  bond: number;
  trust: number;
  is_alive: number;
  history: string;
  stage: string | null;
  metadata: string | null;
  created_at: string;
}

function rowToRelationship(row: RelationshipRow): Relationship {
  return {
    id: row.id,
    characterId: row.character_id,
    npcId: row.npc_id,
    name: row.name,
    type: row.type as RelationType,
    bond: row.bond,
    trust: row.trust,
    isAlive: row.is_alive === 1,
    stage: (row.stage as RelationStage | null) ?? null,
    partner: row.metadata ? (JSON.parse(row.metadata) as PartnerMeta) : null,
    history: JSON.parse(row.history) as RelationshipEvent[],
  };
}

export interface CreateRelationshipInput {
  characterId: string;
  name: string;
  type: RelationType;
  bond?: number;
  trust?: number;
  npcId?: string;
  stage?: RelationStage;
  partner?: PartnerMeta;
}

export const RelationshipsModel = {
  create(input: CreateRelationshipInput): Relationship {
    const id = newId();
    getDb()
      .prepare(
        `INSERT INTO relationships (id, character_id, npc_id, name, type, bond, trust, stage, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.characterId,
        input.npcId ?? null,
        input.name,
        input.type,
        input.bond ?? 50,
        input.trust ?? 50,
        input.stage ?? null,
        input.partner ? JSON.stringify(input.partner) : null,
      );
    return this.findById(id) as Relationship;
  },

  /** Update a romantic relationship's stage and/or partner metadata. */
  updatePartner(
    id: string,
    fields: { stage?: RelationStage; partner?: PartnerMeta; bond?: number; trust?: number },
  ): Relationship {
    const current = getDb().prepare('SELECT * FROM relationships WHERE id = ?').get(id) as RelationshipRow | undefined;
    if (!current) throw new Error(`Relationship ${id} not found`);
    const stage = fields.stage ?? current.stage;
    const metadata = fields.partner ? JSON.stringify(fields.partner) : current.metadata;
    const bond = fields.bond ?? current.bond;
    const trust = fields.trust ?? current.trust;
    getDb()
      .prepare('UPDATE relationships SET stage = ?, metadata = ?, bond = ?, trust = ? WHERE id = ?')
      .run(stage, metadata, bond, trust, id);
    return this.findById(id) as Relationship;
  },

  findPartner(characterId: string): Relationship | null {
    const row = getDb()
      .prepare(`SELECT * FROM relationships WHERE character_id = ? AND type = 'partner' AND is_alive = 1 LIMIT 1`)
      .get(characterId) as RelationshipRow | undefined;
    return row ? rowToRelationship(row) : null;
  },

  findById(id: string): Relationship | null {
    const row = getDb()
      .prepare('SELECT * FROM relationships WHERE id = ?')
      .get(id) as RelationshipRow | undefined;
    return row ? rowToRelationship(row) : null;
  },

  findByCharacterId(characterId: string): Relationship[] {
    const rows = getDb()
      .prepare('SELECT * FROM relationships WHERE character_id = ? ORDER BY created_at ASC')
      .all(characterId) as RelationshipRow[];
    return rows.map(rowToRelationship);
  },

  updateBondAndTrust(
    id: string,
    bondDelta: number,
    trustDelta: number,
    historyEvent?: RelationshipEvent,
  ): Relationship {
    const current = this.findById(id);
    if (!current) throw new Error(`Relationship ${id} not found`);
    const newBond = Math.min(100, Math.max(0, current.bond + bondDelta));
    const newTrust = Math.min(100, Math.max(0, current.trust + trustDelta));
    const history = historyEvent ? [...current.history, historyEvent] : current.history;
    getDb()
      .prepare(
        'UPDATE relationships SET bond = ?, trust = ?, history = ? WHERE id = ?',
      )
      .run(newBond, newTrust, JSON.stringify(history), id);
    return { ...current, bond: newBond, trust: newTrust, history };
  },

  decayBonds(characterId: string, decayAmount: number): void {
    getDb()
      .prepare(
        `UPDATE relationships
         SET bond = MAX(0, bond - ?)
         WHERE character_id = ? AND is_alive = 1`,
      )
      .run(decayAmount, characterId);
  },

  markDeceased(id: string): void {
    getDb().prepare('UPDATE relationships SET is_alive = 0 WHERE id = ?').run(id);
  },
};
