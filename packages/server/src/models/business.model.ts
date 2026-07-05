import { getDb } from '../db/index.js';
import type {
  BusinessState, Industry, OwnedProduct, StaffBlock, StaffRole, BusinessYear,
} from '@lifeverse/shared';

interface BusinessRow {
  character_id: string;
  industry: string;
  name: string;
  logo: string;
  brand_color: string;
  hq_country: string;
  founded_age: number;
  cash: number;
  reputation: number;
  customers: number;
  market_share: number;
  branches: number;
  supplier_tier: number;
  marketing_level: number;
  rnd_level: number;
  products: string;
  staff: string;
  consultants: string;
  upgrades: string;
  history: string;
  last_event: string | null;
  loss_years: number;
  is_open: number;
}

function parse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

/** Valuation = liquid assets + a growth-weighted multiple of recent profit. */
export function computeValuation(row: {
  cash: number; history: BusinessYear[]; branches: number; reputation: number;
}): number {
  const recent = row.history.slice(-3);
  const avgProfit = recent.length ? recent.reduce((s, y) => s + y.profit, 0) / recent.length : 0;
  const growth = recent.length >= 2 && recent[0]!.revenue > 0
    ? Math.max(0, (recent.at(-1)!.revenue - recent[0]!.revenue) / recent[0]!.revenue)
    : 0;
  const multiple = 3 + Math.min(7, growth * 10) + row.reputation / 25;
  return Math.max(0, Math.round(row.cash + Math.max(0, avgProfit) * multiple + row.branches * 25000));
}

function rowToState(row: BusinessRow): BusinessState {
  const history = parse<BusinessYear[]>(row.history, []);
  return {
    characterId: row.character_id,
    industry: row.industry as Industry,
    name: row.name,
    logo: row.logo,
    brandColor: row.brand_color,
    hqCountry: row.hq_country,
    foundedAge: row.founded_age,
    cash: row.cash,
    reputation: row.reputation,
    customers: row.customers,
    marketShare: row.market_share,
    branches: row.branches,
    supplierTier: row.supplier_tier,
    marketingLevel: row.marketing_level,
    rndLevel: row.rnd_level,
    products: parse<OwnedProduct[]>(row.products, []),
    staff: parse<Partial<Record<StaffRole, StaffBlock>>>(row.staff, {}),
    consultants: parse<string[]>(row.consultants, []),
    upgrades: parse<string[]>(row.upgrades, []),
    history,
    lastEvent: row.last_event,
    lossYears: row.loss_years,
    isOpen: row.is_open === 1,
    valuation: computeValuation({ cash: row.cash, history, branches: row.branches, reputation: row.reputation }),
  };
}

export interface CreateBusinessInput {
  characterId: string;
  industry: string;
  name: string;
  logo: string;
  brandColor: string;
  hqCountry: string;
  foundedAge: number;
  cash: number;
}

export const BusinessModel = {
  create(input: CreateBusinessInput): BusinessState {
    getDb()
      .prepare(
        `INSERT INTO businesses (character_id, industry, name, logo, brand_color, hq_country, founded_age, cash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(input.characterId, input.industry, input.name, input.logo, input.brandColor,
        input.hqCountry, input.foundedAge, input.cash);
    return this.findByCharacterId(input.characterId) as BusinessState;
  },

  findByCharacterId(characterId: string): BusinessState | null {
    const row = getDb().prepare('SELECT * FROM businesses WHERE character_id = ?').get(characterId) as BusinessRow | undefined;
    return row ? rowToState(row) : null;
  },

  update(characterId: string, fields: Partial<Omit<BusinessState, 'characterId' | 'valuation'>>): BusinessState {
    const colMap: Record<string, string> = {
      industry: 'industry', name: 'name', logo: 'logo', brandColor: 'brand_color', hqCountry: 'hq_country',
      foundedAge: 'founded_age', cash: 'cash', reputation: 'reputation', customers: 'customers',
      marketShare: 'market_share', branches: 'branches', supplierTier: 'supplier_tier',
      marketingLevel: 'marketing_level', rndLevel: 'rnd_level', lastEvent: 'last_event',
      lossYears: 'loss_years', isOpen: 'is_open',
    };
    const jsonMap: Record<string, string> = {
      products: 'products', staff: 'staff', consultants: 'consultants', upgrades: 'upgrades', history: 'history',
    };
    const updates: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];
    for (const [key, col] of Object.entries(colMap)) {
      const val = fields[key as keyof typeof fields];
      if (val !== undefined) {
        updates.push(`${col} = ?`);
        values.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
      }
    }
    for (const [key, col] of Object.entries(jsonMap)) {
      const val = fields[key as keyof typeof fields];
      if (val !== undefined) {
        updates.push(`${col} = ?`);
        values.push(JSON.stringify(val));
      }
    }
    values.push(characterId);
    getDb().prepare(`UPDATE businesses SET ${updates.join(', ')} WHERE character_id = ?`).run(...values);
    return this.findByCharacterId(characterId) as BusinessState;
  },

  delete(characterId: string): void {
    getDb().prepare('DELETE FROM businesses WHERE character_id = ?').run(characterId);
  },
};
