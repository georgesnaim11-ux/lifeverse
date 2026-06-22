import { getDb } from '../db/index.js';
import { newId } from '../utils/id.js';
import type { OwnedAsset } from '@lifeverse/shared';

interface AssetRow {
  id: string;
  character_id: string;
  asset_type: string;
  value: number;
  purchase_age: number | null;
  is_active: number;
  label: string | null;
}

function rowToAsset(row: AssetRow): OwnedAsset {
  return {
    id: row.id,
    characterId: row.character_id,
    assetType: row.asset_type,
    label: row.label ?? row.asset_type,
    value: row.value,
    purchaseAge: row.purchase_age,
    isActive: row.is_active === 1,
  };
}

export interface CreateAssetInput {
  characterId: string;
  assetType: string;
  label: string;
  value: number;
  purchaseAge: number;
}

export const AssetsModel = {
  create(input: CreateAssetInput): OwnedAsset {
    const id = newId();
    getDb()
      .prepare(
        `INSERT INTO assets (id, character_id, asset_type, value, purchase_age, is_active, label)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
      )
      .run(id, input.characterId, input.assetType, input.value, input.purchaseAge, input.label);
    return this.findById(id) as OwnedAsset;
  },

  findById(id: string): OwnedAsset | null {
    const row = getDb().prepare('SELECT * FROM assets WHERE id = ?').get(id) as AssetRow | undefined;
    return row ? rowToAsset(row) : null;
  },

  findByCharacterId(characterId: string): OwnedAsset[] {
    const rows = getDb()
      .prepare('SELECT * FROM assets WHERE character_id = ? AND is_active = 1 ORDER BY purchase_age ASC')
      .all(characterId) as AssetRow[];
    return rows.map(rowToAsset);
  },

  /** Does the character already own an asset of this type? */
  ownsType(characterId: string, assetType: string): boolean {
    const row = getDb()
      .prepare('SELECT id FROM assets WHERE character_id = ? AND asset_type = ? AND is_active = 1')
      .get(characterId, assetType) as { id: string } | undefined;
    return !!row;
  },

  /** Total resale/net-worth value of all active assets. */
  totalValue(characterId: string): number {
    const row = getDb()
      .prepare('SELECT COALESCE(SUM(value), 0) as total FROM assets WHERE character_id = ? AND is_active = 1')
      .get(characterId) as { total: number };
    return row.total;
  },
};
