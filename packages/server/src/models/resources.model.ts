import { getDb } from '../db/index.js';
import type { CharacterResources } from '@lifeverse/shared';

interface ResourceRow {
  character_id: string;
  total_time_slots: number;
  used_time_slots: number;
  mental_energy: number;
  physical_energy: number;
  mental_energy_max: number;
  physical_energy_max: number;
  consecutive_low_mental_years: number;
  burnout_state: number;
  updated_at: string;
}

function rowToResources(row: ResourceRow): CharacterResources {
  return {
    characterId: row.character_id,
    totalTimeSlots: row.total_time_slots,
    usedTimeSlots: row.used_time_slots,
    mentalEnergy: row.mental_energy,
    physicalEnergy: row.physical_energy,
    mentalEnergyMax: row.mental_energy_max,
    physicalEnergyMax: row.physical_energy_max,
    consecutiveLowMentalYears: row.consecutive_low_mental_years,
    burnoutState: row.burnout_state === 1,
    updatedAt: row.updated_at,
  };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export const ResourcesModel = {
  create(characterId: string, totalSlots = 3): CharacterResources {
    getDb()
      .prepare(
        `INSERT INTO resources (character_id, total_time_slots) VALUES (?, ?)`,
      )
      .run(characterId, totalSlots);
    return this.findByCharacterId(characterId) as CharacterResources;
  },

  findByCharacterId(characterId: string): CharacterResources | null {
    const row = getDb()
      .prepare('SELECT * FROM resources WHERE character_id = ?')
      .get(characterId) as ResourceRow | undefined;
    return row ? rowToResources(row) : null;
  },

  update(
    characterId: string,
    fields: Partial<Omit<CharacterResources, 'characterId' | 'updatedAt'>>,
  ): CharacterResources {
    const colMap: Record<string, string> = {
      totalTimeSlots: 'total_time_slots',
      usedTimeSlots: 'used_time_slots',
      mentalEnergy: 'mental_energy',
      physicalEnergy: 'physical_energy',
      mentalEnergyMax: 'mental_energy_max',
      physicalEnergyMax: 'physical_energy_max',
      consecutiveLowMentalYears: 'consecutive_low_mental_years',
      burnoutState: 'burnout_state',
    };

    const updates: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];

    for (const [key, col] of Object.entries(colMap)) {
      const val = fields[key as keyof typeof fields];
      if (val !== undefined) {
        updates.push(`${col} = ?`);
        // Convert boolean to integer for SQLite
        values.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
      }
    }

    values.push(characterId);
    getDb()
      .prepare(`UPDATE resources SET ${updates.join(', ')} WHERE character_id = ?`)
      .run(...values);

    return this.findByCharacterId(characterId) as CharacterResources;
  },

  spendTimeSlot(characterId: string, cost: number): CharacterResources {
    const current = this.findByCharacterId(characterId);
    if (!current) throw new Error(`Resources not found for ${characterId}`);
    if (current.usedTimeSlots + cost > current.totalTimeSlots) {
      throw new Error('Not enough time slots remaining');
    }
    return this.update(characterId, { usedTimeSlots: current.usedTimeSlots + cost });
  },

  spendEnergy(characterId: string, mental: number, physical: number): CharacterResources {
    const current = this.findByCharacterId(characterId);
    if (!current) throw new Error(`Resources not found for ${characterId}`);
    return this.update(characterId, {
      mentalEnergy: clamp(current.mentalEnergy - mental, 0, current.mentalEnergyMax),
      physicalEnergy: clamp(current.physicalEnergy - physical, 0, current.physicalEnergyMax),
    });
  },

  ensureExists(characterId: string, totalSlots = 3): CharacterResources {
    const existing = this.findByCharacterId(characterId);
    if (existing) return existing;
    return this.create(characterId, totalSlots);
  },
};
