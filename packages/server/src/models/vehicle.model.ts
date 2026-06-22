import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import { BRAND_BY_ID, VehicleClass } from '@lifeverse/shared';
import type { OwnedVehicle, VehicleClass as VehicleClassType, BodyType, VehicleCondition } from '@lifeverse/shared';

interface VehicleRow {
  id: string;
  character_id: string;
  model_key: string;
  brand_id: string;
  brand_name: string;
  brand_color: string | null;
  model_name: string;
  body_type: string;
  year: number;
  condition: string;
  emoji: string | null;
  purchase_price: number;
  current_value: number;
  purchase_age: number | null;
  depreciation_rate: number;
  monthly_maintenance: number;
  happiness: number;
  is_primary: number;
  neglect_years: number;
  created_at: string;
}

function rowToVehicle(row: VehicleRow): OwnedVehicle {
  return {
    id: row.id,
    characterId: row.character_id,
    modelKey: row.model_key,
    brandId: row.brand_id,
    brandName: row.brand_name,
    brandColor: row.brand_color ?? '#444',
    modelName: row.model_name,
    class: (BRAND_BY_ID.get(row.brand_id)?.class ?? VehicleClass.Economy) as VehicleClassType,
    bodyType: row.body_type as BodyType,
    emoji: row.emoji ?? '🚗',
    year: row.year,
    condition: row.condition as VehicleCondition,
    purchasePrice: row.purchase_price,
    currentValue: row.current_value,
    purchaseAge: row.purchase_age,
    depreciationRate: row.depreciation_rate,
    monthlyMaintenance: row.monthly_maintenance,
    happiness: row.happiness,
    isPrimary: row.is_primary === 1,
    neglectYears: row.neglect_years,
  };
}

export interface CreateVehicleInput {
  characterId: string;
  modelKey: string;
  brandId: string;
  brandName: string;
  brandColor: string;
  modelName: string;
  bodyType: string;
  year: number;
  condition: string;
  emoji: string;
  purchasePrice: number;
  currentValue: number;
  purchaseAge: number;
  depreciationRate: number;
  monthlyMaintenance: number;
  happiness: number;
  isPrimary: boolean;
}

export const VehicleModel = {
  create(input: CreateVehicleInput): OwnedVehicle {
    const id = newId();
    getDb()
      .prepare(
        `INSERT INTO vehicles
           (id, character_id, model_key, brand_id, brand_name, brand_color, model_name, body_type,
            year, condition, emoji, purchase_price, current_value, purchase_age, depreciation_rate,
            monthly_maintenance, happiness, is_primary, neglect_years)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      )
      .run(
        id, input.characterId, input.modelKey, input.brandId, input.brandName, input.brandColor,
        input.modelName, input.bodyType, input.year, input.condition, input.emoji, input.purchasePrice,
        input.currentValue, input.purchaseAge, input.depreciationRate, input.monthlyMaintenance,
        input.happiness, input.isPrimary ? 1 : 0,
      );
    return this.findById(id) as OwnedVehicle;
  },

  findById(id: string): OwnedVehicle | null {
    const row = getDb().prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as VehicleRow | undefined;
    return row ? rowToVehicle(row) : null;
  },

  findByCharacterId(characterId: string): OwnedVehicle[] {
    const rows = getDb()
      .prepare('SELECT * FROM vehicles WHERE character_id = ? ORDER BY is_primary DESC, created_at ASC, rowid ASC')
      .all(characterId) as VehicleRow[];
    return rows.map(rowToVehicle);
  },

  update(id: string, fields: Partial<Omit<OwnedVehicle, 'id' | 'characterId' | 'modelKey'>>): OwnedVehicle {
    const colMap: Record<string, string> = {
      brandId: 'brand_id', brandName: 'brand_name', brandColor: 'brand_color', modelName: 'model_name',
      bodyType: 'body_type', emoji: 'emoji', year: 'year', condition: 'condition',
      purchasePrice: 'purchase_price', currentValue: 'current_value', purchaseAge: 'purchase_age',
      depreciationRate: 'depreciation_rate', monthlyMaintenance: 'monthly_maintenance', happiness: 'happiness',
      isPrimary: 'is_primary', neglectYears: 'neglect_years',
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
      getDb().prepare(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    return this.findById(id) as OwnedVehicle;
  },

  clearPrimary(characterId: string): void {
    getDb().prepare('UPDATE vehicles SET is_primary = 0 WHERE character_id = ?').run(characterId);
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM vehicles WHERE id = ?').run(id);
  },
};
