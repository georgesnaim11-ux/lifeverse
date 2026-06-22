import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { OwnedProperty, PropertyTier } from '@lifeverse/shared';

interface PropertyRow {
  id: string;
  character_id: string;
  property_key: string;
  property_label: string;
  tier: string;
  company: string | null;
  bedrooms: number;
  bathrooms: number;
  condition: string | null;
  purchase_price: number;
  current_value: number;
  purchase_age: number | null;
  appreciation_rate: number;
  monthly_upkeep: number;
  monthly_rent: number;
  happiness: number;
  is_residence: number;
  is_rented_out: number;
  created_at: string;
}

function rowToProperty(row: PropertyRow): OwnedProperty {
  return {
    id: row.id,
    characterId: row.character_id,
    key: row.property_key,
    label: row.property_label,
    tier: row.tier as PropertyTier,
    company: row.company,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    condition: row.condition,
    purchasePrice: row.purchase_price,
    currentValue: row.current_value,
    purchaseAge: row.purchase_age,
    appreciationRate: row.appreciation_rate,
    monthlyUpkeep: row.monthly_upkeep,
    monthlyRent: row.monthly_rent,
    happiness: row.happiness,
    isResidence: row.is_residence === 1,
    isRentedOut: row.is_rented_out === 1,
  };
}

export interface CreatePropertyInput {
  characterId: string;
  key: string;
  label: string;
  tier: string;
  company: string | null;
  bedrooms: number;
  bathrooms: number;
  condition: string | null;
  purchasePrice: number;
  currentValue: number;
  purchaseAge: number | null;
  appreciationRate: number;
  monthlyUpkeep: number;
  monthlyRent: number;
  happiness: number;
  isResidence: boolean;
  isRentedOut: boolean;
}

export const PropertyModel = {
  create(input: CreatePropertyInput): OwnedProperty {
    const id = newId();
    getDb()
      .prepare(
        `INSERT INTO properties
           (id, character_id, property_key, property_label, tier, company,
            bedrooms, bathrooms, condition, purchase_price, current_value,
            purchase_age, appreciation_rate, monthly_upkeep, monthly_rent,
            happiness, is_residence, is_rented_out)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id, input.characterId, input.key, input.label, input.tier, input.company,
        input.bedrooms, input.bathrooms, input.condition, input.purchasePrice, input.currentValue,
        input.purchaseAge, input.appreciationRate, input.monthlyUpkeep, input.monthlyRent,
        input.happiness, input.isResidence ? 1 : 0, input.isRentedOut ? 1 : 0,
      );
    return this.findById(id) as OwnedProperty;
  },

  findById(id: string): OwnedProperty | null {
    const row = getDb().prepare('SELECT * FROM properties WHERE id = ?').get(id) as PropertyRow | undefined;
    return row ? rowToProperty(row) : null;
  },

  findByCharacterId(characterId: string): OwnedProperty[] {
    const rows = getDb()
      .prepare('SELECT * FROM properties WHERE character_id = ? ORDER BY created_at ASC, rowid ASC')
      .all(characterId) as PropertyRow[];
    return rows.map(rowToProperty);
  },

  /** The owned property the character lives in, if any. */
  findResidence(characterId: string): OwnedProperty | null {
    const row = getDb()
      .prepare('SELECT * FROM properties WHERE character_id = ? AND is_residence = 1 LIMIT 1')
      .get(characterId) as PropertyRow | undefined;
    return row ? rowToProperty(row) : null;
  },

  update(id: string, fields: Partial<Omit<OwnedProperty, 'id' | 'characterId' | 'key'>>): OwnedProperty {
    const colMap: Record<string, string> = {
      label: 'property_label', tier: 'tier', company: 'company',
      bedrooms: 'bedrooms', bathrooms: 'bathrooms', condition: 'condition',
      purchasePrice: 'purchase_price', currentValue: 'current_value', purchaseAge: 'purchase_age',
      appreciationRate: 'appreciation_rate', monthlyUpkeep: 'monthly_upkeep', monthlyRent: 'monthly_rent',
      happiness: 'happiness', isResidence: 'is_residence', isRentedOut: 'is_rented_out',
    };
    const updates: string[] = [];
    const values: unknown[] = [];
    for (const [key, col] of Object.entries(colMap)) {
      const val = fields[key as keyof typeof fields];
      if (val !== undefined) {
        updates.push(`${col} = ?`);
        values.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
      }
    }
    if (updates.length > 0) {
      values.push(id);
      getDb().prepare(`UPDATE properties SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    return this.findById(id) as OwnedProperty;
  },

  /** Clear the residence flag on every property of a character (used when switching homes). */
  clearResidence(characterId: string): void {
    getDb().prepare('UPDATE properties SET is_residence = 0 WHERE character_id = ?').run(characterId);
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM properties WHERE id = ?').run(id);
  },
};
