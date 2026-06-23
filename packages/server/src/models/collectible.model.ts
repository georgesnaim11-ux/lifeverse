import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { OwnedCollectible, CollectibleCategory, CollectibleCondition } from '@lifeverse/shared';

interface CollectibleRow {
  id: string;
  character_id: string;
  category: string;
  item_key: string;
  label: string;
  brand: string | null;
  emoji: string | null;
  year: number;
  condition: string;
  purchase_price: number;
  current_value: number;
  purchase_age: number | null;
  appreciation_rate: number;
  monthly_maintenance: number;
  created_at: string;
}

function rowToCollectible(row: CollectibleRow): OwnedCollectible {
  return {
    id: row.id,
    characterId: row.character_id,
    category: row.category as CollectibleCategory,
    itemKey: row.item_key,
    label: row.label,
    brand: row.brand,
    emoji: row.emoji ?? '✨',
    year: row.year,
    condition: row.condition as CollectibleCondition,
    purchasePrice: row.purchase_price,
    currentValue: row.current_value,
    purchaseAge: row.purchase_age,
    appreciationRate: row.appreciation_rate,
    monthlyMaintenance: row.monthly_maintenance,
  };
}

export interface CreateCollectibleInput {
  characterId: string;
  category: string;
  itemKey: string;
  label: string;
  brand: string;
  emoji: string;
  year: number;
  condition: string;
  purchasePrice: number;
  currentValue: number;
  purchaseAge: number;
  appreciationRate: number;
  monthlyMaintenance: number;
}

export const CollectibleModel = {
  create(input: CreateCollectibleInput): OwnedCollectible {
    const id = newId();
    getDb()
      .prepare(
        `INSERT INTO collectibles
           (id, character_id, category, item_key, label, brand, emoji, year, condition,
            purchase_price, current_value, purchase_age, appreciation_rate, monthly_maintenance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id, input.characterId, input.category, input.itemKey, input.label, input.brand,
        input.emoji, input.year, input.condition, input.purchasePrice, input.currentValue,
        input.purchaseAge, input.appreciationRate, input.monthlyMaintenance,
      );
    return this.findById(id) as OwnedCollectible;
  },

  findById(id: string): OwnedCollectible | null {
    const row = getDb().prepare('SELECT * FROM collectibles WHERE id = ?').get(id) as CollectibleRow | undefined;
    return row ? rowToCollectible(row) : null;
  },

  findByCharacterId(characterId: string): OwnedCollectible[] {
    const rows = getDb()
      .prepare('SELECT * FROM collectibles WHERE character_id = ? ORDER BY created_at ASC, rowid ASC')
      .all(characterId) as CollectibleRow[];
    return rows.map(rowToCollectible);
  },

  update(id: string, fields: Partial<Pick<OwnedCollectible, 'currentValue'>>): OwnedCollectible {
    if (fields.currentValue !== undefined) {
      getDb().prepare('UPDATE collectibles SET current_value = ? WHERE id = ?').run(fields.currentValue, id);
    }
    return this.findById(id) as OwnedCollectible;
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM collectibles WHERE id = ?').run(id);
  },
};
