import { getDb } from '../db/index.js';
import type { HousingState, HousingTenure, PropertyTier } from '@lifeverse/shared';

interface HousingRow {
  character_id: string;
  tenure: string;
  property_key: string | null;
  property_label: string | null;
  tier: string | null;
  company: string | null;
  bedrooms: number;
  bathrooms: number;
  condition: string | null;
  monthly_expense: number;
  current_value: number;
  purchase_price: number;
  purchase_age: number | null;
  appreciation_rate: number;
  residence_property_id: string | null;
  updated_at: string;
}

function rowToHousing(row: HousingRow): HousingState {
  return {
    characterId: row.character_id,
    tenure: row.tenure as HousingTenure,
    propertyKey: row.property_key,
    propertyLabel: row.property_label,
    tier: (row.tier as PropertyTier | null) ?? null,
    company: row.company,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    condition: row.condition,
    monthlyExpense: row.monthly_expense,
    currentValue: row.current_value,
    purchasePrice: row.purchase_price,
    purchaseAge: row.purchase_age,
    appreciationRate: row.appreciation_rate,
    residencePropertyId: row.residence_property_id ?? null,
  };
}

export const HousingModel = {
  create(characterId: string, tenure: HousingTenure = 'parents'): HousingState {
    getDb()
      .prepare(`INSERT INTO housing (character_id, tenure) VALUES (?, ?)`)
      .run(characterId, tenure);
    return this.findByCharacterId(characterId) as HousingState;
  },

  findByCharacterId(characterId: string): HousingState | null {
    const row = getDb()
      .prepare('SELECT * FROM housing WHERE character_id = ?')
      .get(characterId) as HousingRow | undefined;
    return row ? rowToHousing(row) : null;
  },

  ensureExists(characterId: string, tenure: HousingTenure = 'parents'): HousingState {
    return this.findByCharacterId(characterId) ?? this.create(characterId, tenure);
  },

  update(
    characterId: string,
    fields: Partial<Omit<HousingState, 'characterId'>>,
  ): HousingState {
    const colMap: Record<string, string> = {
      tenure: 'tenure', propertyKey: 'property_key', propertyLabel: 'property_label',
      tier: 'tier', company: 'company', bedrooms: 'bedrooms', bathrooms: 'bathrooms',
      condition: 'condition', monthlyExpense: 'monthly_expense', currentValue: 'current_value',
      purchasePrice: 'purchase_price', purchaseAge: 'purchase_age', appreciationRate: 'appreciation_rate',
      residencePropertyId: 'residence_property_id',
    };
    const updates: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];
    for (const [key, col] of Object.entries(colMap)) {
      const val = fields[key as keyof typeof fields];
      if (val !== undefined) { updates.push(`${col} = ?`); values.push(val); }
    }
    values.push(characterId);
    getDb().prepare(`UPDATE housing SET ${updates.join(', ')} WHERE character_id = ?`).run(...values);
    return this.findByCharacterId(characterId) as HousingState;
  },
};
