import { getDb } from '../db/index.js';
import type { DomainState, DomainDelta, DomainKey } from '@lifeverse/shared';

interface DomainRow {
  character_id: string;
  academic: number;
  physical: number;
  career: number;
  social: number;
  creative: number;
  mental: number;
  academic_momentum: number;
  physical_momentum: number;
  career_momentum: number;
  social_momentum: number;
  creative_momentum: number;
  mental_momentum: number;
  academic_neglect: number;
  physical_neglect: number;
  career_neglect: number;
  social_neglect: number;
  creative_neglect: number;
  mental_neglect: number;
  updated_at: string;
}

function rowToDomain(row: DomainRow): DomainState {
  return {
    characterId: row.character_id,
    academic: row.academic,
    physical: row.physical,
    career: row.career,
    social: row.social,
    creative: row.creative,
    mental: row.mental,
    academicMomentum: row.academic_momentum,
    physicalMomentum: row.physical_momentum,
    careerMomentum: row.career_momentum,
    socialMomentum: row.social_momentum,
    creativeMomentum: row.creative_momentum,
    mentalMomentum: row.mental_momentum,
    academicNeglect: row.academic_neglect,
    physicalNeglect: row.physical_neglect,
    careerNeglect: row.career_neglect,
    socialNeglect: row.social_neglect,
    creativeNeglect: row.creative_neglect,
    mentalNeglect: row.mental_neglect,
    updatedAt: row.updated_at,
  };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export const DomainsModel = {
  create(characterId: string): DomainState {
    getDb()
      .prepare(
        `INSERT INTO domains (character_id) VALUES (?)`,
      )
      .run(characterId);
    return this.findByCharacterId(characterId) as DomainState;
  },

  findByCharacterId(characterId: string): DomainState | null {
    const row = getDb()
      .prepare('SELECT * FROM domains WHERE character_id = ?')
      .get(characterId) as DomainRow | undefined;
    return row ? rowToDomain(row) : null;
  },

  update(
    characterId: string,
    fields: Partial<Omit<DomainState, 'characterId' | 'updatedAt'>>,
  ): DomainState {
    const colMap: Record<string, string> = {
      academic: 'academic',
      physical: 'physical',
      career: 'career',
      social: 'social',
      creative: 'creative',
      mental: 'mental',
      academicMomentum: 'academic_momentum',
      physicalMomentum: 'physical_momentum',
      careerMomentum: 'career_momentum',
      socialMomentum: 'social_momentum',
      creativeMomentum: 'creative_momentum',
      mentalMomentum: 'mental_momentum',
      academicNeglect: 'academic_neglect',
      physicalNeglect: 'physical_neglect',
      careerNeglect: 'career_neglect',
      socialNeglect: 'social_neglect',
      creativeNeglect: 'creative_neglect',
      mentalNeglect: 'mental_neglect',
    };

    const updates: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];

    for (const [key, col] of Object.entries(colMap)) {
      const val = fields[key as keyof typeof fields];
      if (val !== undefined) {
        updates.push(`${col} = ?`);
        values.push(val);
      }
    }

    values.push(characterId);
    getDb()
      .prepare(`UPDATE domains SET ${updates.join(', ')} WHERE character_id = ?`)
      .run(...values);

    return this.findByCharacterId(characterId) as DomainState;
  },

  applyDomainDeltas(characterId: string, deltas: DomainDelta[]): DomainState {
    const current = this.findByCharacterId(characterId);
    if (!current) throw new Error(`Domains not found for ${characterId}`);

    const patch: Partial<Omit<DomainState, 'characterId' | 'updatedAt'>> = {};
    for (const { domain, amount } of deltas) {
      const key = domain as keyof DomainState;
      const currentVal = current[key] as number;
      patch[domain as keyof typeof patch] = clamp(currentVal + amount) as never;
    }

    return this.update(characterId, patch);
  },

  markDomainsActive(characterId: string, activeDomains: DomainKey[]): void {
    const current = this.findByCharacterId(characterId);
    if (!current) throw new Error(`Domains not found for ${characterId}`);

    const neglectKeys: DomainKey[] = ['academic', 'physical', 'career', 'social', 'creative', 'mental'];
    const patch: Partial<Omit<DomainState, 'characterId' | 'updatedAt'>> = {};

    for (const domain of neglectKeys) {
      const neglectKey = `${domain}Neglect` as keyof DomainState;
      if (activeDomains.includes(domain)) {
        patch[neglectKey as keyof typeof patch] = 0 as never;
      } else {
        const current_neglect = current[neglectKey] as number;
        patch[neglectKey as keyof typeof patch] = (current_neglect + 1) as never;
      }
    }

    this.update(characterId, patch);
  },

  ensureExists(characterId: string): DomainState {
    const existing = this.findByCharacterId(characterId);
    if (existing) return existing;
    return this.create(characterId);
  },
};
