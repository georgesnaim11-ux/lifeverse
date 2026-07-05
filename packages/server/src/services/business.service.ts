import {
  CharacterModel, FinanceModel, FlagsModel, EventLogModel, BusinessModel,
} from '../models/index.js';
import { computeValuation } from '../models/business.model.js';
import {
  BUSINESS_MIN_AGE, BUSINESS_SALE_MULTIPLIER, BANKRUPTCY_YEARS, BUSINESS_HISTORY_CAP,
  ROLE_SALARIES, MARKETING_COSTS, RND_COSTS, PRICE_TIER_DATA,
  INDUSTRY_BY_ID, PRODUCT_BY_KEY, productsForIndustry, SUPPLIER_TIERS,
  CONSULTANT_BY_ID, EXPANSION_BY_ID, BUSINESS_EVENTS,
  StaffRole, PriceTier,
} from '@lifeverse/shared';
import type {
  BusinessState, Industry, OwnedProduct, StaffBlock, StaffRole as Role,
  PriceTier as PriceTierType,
} from '@lifeverse/shared';

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, Math.round(n)));
const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const randF = (min: number, max: number) => min + Math.random() * (max - min);

function requireBusiness(characterId: string): BusinessState {
  const b = BusinessModel.findByCharacterId(characterId);
  if (!b || !b.isOpen) throw new Error("You don't run a company right now.");
  return b;
}

function totalStaff(staff: Partial<Record<Role, StaffBlock>>): number {
  return Object.values(staff).reduce((s, blk) => s + (blk?.count ?? 0), 0);
}

/** Small businesses pay small-business wages; industrial giants pay corporate rates.
 * Scales ROLE_SALARIES by the industry's employee requirement (coffee shop ~0.38×,
 * car manufacturer ~0.8×). */
function salaryScale(employeeRequirement: number): number {
  return 0.3 + employeeRequirement / 200;
}

function payroll(staff: Partial<Record<Role, StaffBlock>>, scale: number): number {
  return (Object.entries(staff) as Array<[Role, StaffBlock]>)
    .reduce((sum, [role, blk]) => sum + Math.round(blk.count * (ROLE_SALARIES[role] ?? 40000) * scale), 0);
}

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString()}`;

export const BusinessService = {
  get(characterId: string): BusinessState | null {
    return BusinessModel.findByCharacterId(characterId);
  },

  create(characterId: string, input: {
    industry: Industry; name: string; logo: string; brandColor: string;
    hqCountry: string; investment: number;
  }): { message: string } {
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    if (c.age < BUSINESS_MIN_AGE) throw new Error(`You must be ${BUSINESS_MIN_AGE} to register a company.`);
    const existing = BusinessModel.findByCharacterId(characterId);
    if (existing?.isOpen) throw new Error('You already run a company. Sell or close it first.');
    const ind = INDUSTRY_BY_ID.get(input.industry);
    if (!ind) throw new Error('Unknown industry.');
    const name = input.name.trim();
    if (name.length < 2 || name.length > 40) throw new Error('Company name must be 2–40 characters.');
    if (input.investment < ind.startupCost) {
      throw new Error(`${ind.label} needs at least ${fmt$(ind.startupCost)} to start.`);
    }
    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance || finance.cash < input.investment) {
      throw new Error(`You don't have ${fmt$(input.investment)} to invest.`);
    }

    FinanceModel.update(characterId, { cash: finance.cash - input.investment });
    if (existing) BusinessModel.delete(characterId);
    BusinessModel.create({
      characterId, industry: input.industry, name, logo: input.logo || ind.emoji,
      brandColor: input.brandColor || '#2563eb', hqCountry: input.hqCountry || 'usa',
      foundedAge: c.age, cash: input.investment,
    });

    // Seed the two cheapest products in the line + a skeleton team.
    const line = productsForIndustry(input.industry).sort((a, b) => a.devCost - b.devCost);
    const starters: OwnedProduct[] = line.slice(0, 2).map((p) => ({
      key: p.key, quality: 50, priceTier: PriceTier.Standard,
      satisfaction: 50, popularity: 20, unitsSold: 0, revenue: 0, profit: 0,
    }));
    const baseCrew = Math.max(1, Math.round(ind.employeeRequirement / 10));
    const staff: Partial<Record<Role, StaffBlock>> = {
      [StaffRole.Manager]: { count: 1, skill: 50, morale: 70 },
      [StaffRole.Sales]: { count: baseCrew, skill: 45, morale: 70 },
      [StaffRole.Support]: { count: Math.max(1, Math.round(baseCrew / 2)), skill: 45, morale: 70 },
    };
    // Lean start: no paid marketing until the owner opts in (keeps year-one costs sane).
    BusinessModel.update(characterId, { products: starters, staff, marketingLevel: 0 });

    FlagsModel.set(characterId, 'foundedBusiness', true);
    EventLogModel.create(characterId, 'business:founded', c.age, 'milestone',
      `Founded ${name} — a ${ind.label.toLowerCase()}! ${input.logo || ind.emoji}`);
    return { message: `${input.logo || ind.emoji} ${name} is officially registered! Company account: ${fmt$(input.investment)}.` };
  },

  /* ── Products ── */

  launchProduct(characterId: string, key: string): { message: string } {
    const b = requireBusiness(characterId);
    const def = PRODUCT_BY_KEY.get(key);
    if (!def || !def.industryIds.includes(b.industry)) throw new Error('That product doesn\'t fit your industry.');
    if (b.products.some((p) => p.key === key)) throw new Error('You already sell that.');
    if (b.cash < def.devCost) throw new Error(`Development costs ${fmt$(def.devCost)} — the company can't afford it.`);
    const rndBoost = b.rndLevel * 5;
    BusinessModel.update(characterId, {
      cash: b.cash - def.devCost,
      products: [...b.products, {
        key, quality: clamp(45 + rndBoost), priceTier: PriceTier.Standard,
        satisfaction: 50, popularity: 15, unitsSold: 0, revenue: 0, profit: 0,
      }],
    });
    return { message: `${def.emoji} ${def.name} developed and launched for ${fmt$(def.devCost)}!` };
  },

  setProductPrice(characterId: string, key: string, tier: PriceTierType): { message: string } {
    const b = requireBusiness(characterId);
    const products = b.products.map((p) => (p.key === key ? { ...p, priceTier: tier } : p));
    if (!b.products.some((p) => p.key === key)) throw new Error('You don\'t sell that.');
    BusinessModel.update(characterId, { products });
    return { message: `Pricing set to ${PRICE_TIER_DATA[tier].label}.` };
  },

  improveProduct(characterId: string, key: string): { message: string } {
    const b = requireBusiness(characterId);
    const prod = b.products.find((p) => p.key === key);
    const def = PRODUCT_BY_KEY.get(key);
    if (!prod || !def) throw new Error('You don\'t sell that.');
    const cost = Math.max(1000, Math.round(def.devCost * 0.25));
    if (b.cash < cost) throw new Error(`Improving it costs ${fmt$(cost)}.`);
    const products = b.products.map((p) => (p.key === key ? { ...p, quality: clamp(p.quality + rand(6, 12)) } : p));
    BusinessModel.update(characterId, { cash: b.cash - cost, products });
    return { message: `${def.emoji} ${def.name} improved for ${fmt$(cost)} — quality is up.` };
  },

  discontinueProduct(characterId: string, key: string): { message: string } {
    const b = requireBusiness(characterId);
    if (!b.products.some((p) => p.key === key)) throw new Error('You don\'t sell that.');
    if (b.products.length <= 1) throw new Error('A company needs at least one product.');
    BusinessModel.update(characterId, { products: b.products.filter((p) => p.key !== key) });
    return { message: 'Product discontinued.' };
  },

  /* ── Staff ── */

  hire(characterId: string, role: Role, count: number): { message: string } {
    const b = requireBusiness(characterId);
    if (count < 1 || count > 1000) throw new Error('Invalid head-count.');
    const scale = salaryScale(INDUSTRY_BY_ID.get(b.industry)?.employeeRequirement ?? 40);
    const hireCost = Math.round((ROLE_SALARIES[role] ?? 40000) * scale * 0.15) * count;
    if (b.cash < hireCost) throw new Error(`Recruiting costs ${fmt$(hireCost)}.`);
    const blk = b.staff[role] ?? { count: 0, skill: 45, morale: 65 };
    const staff = { ...b.staff, [role]: { ...blk, count: blk.count + count } };
    BusinessModel.update(characterId, { cash: b.cash - hireCost, staff });
    return { message: `Hired ${count} ${role.replace('_', ' ')}${count > 1 ? 's' : ''} (${fmt$(hireCost)} recruiting).` };
  },

  fire(characterId: string, role: Role, count: number): { message: string } {
    const b = requireBusiness(characterId);
    const blk = b.staff[role];
    if (!blk || blk.count < count) throw new Error('Not that many on the books.');
    const scale = salaryScale(INDUSTRY_BY_ID.get(b.industry)?.employeeRequirement ?? 40);
    const severance = Math.round((ROLE_SALARIES[role] ?? 40000) * scale * 0.1) * count;
    const staff = { ...b.staff, [role]: { ...blk, count: blk.count - count, morale: clamp(blk.morale - 8) } };
    BusinessModel.update(characterId, { cash: b.cash - severance, staff });
    return { message: `Let ${count} go (${fmt$(severance)} severance). Morale took a hit.` };
  },

  train(characterId: string, role: Role): { message: string } {
    const b = requireBusiness(characterId);
    const blk = b.staff[role];
    if (!blk || blk.count === 0) throw new Error('No one in that role to train.');
    const cost = 2000 * blk.count;
    if (b.cash < cost) throw new Error(`Training costs ${fmt$(cost)}.`);
    const staff = { ...b.staff, [role]: { ...blk, skill: clamp(blk.skill + rand(5, 10)), morale: clamp(blk.morale + 3) } };
    BusinessModel.update(characterId, { cash: b.cash - cost, staff });
    return { message: `Training complete for ${fmt$(cost)} — sharper and happier.` };
  },

  raiseSalaries(characterId: string): { message: string } {
    const b = requireBusiness(characterId);
    const scale = salaryScale(INDUSTRY_BY_ID.get(b.industry)?.employeeRequirement ?? 40);
    const bonus = Math.round(payroll(b.staff, scale) * 0.05);
    if (b.cash < bonus) throw new Error(`A 5% company-wide bonus costs ${fmt$(bonus)}.`);
    const staff = Object.fromEntries(
      (Object.entries(b.staff) as Array<[Role, StaffBlock]>)
        .map(([r, blk]) => [r, { ...blk, morale: clamp(blk.morale + 10) }]),
    ) as Partial<Record<Role, StaffBlock>>;
    BusinessModel.update(characterId, { cash: b.cash - bonus, staff });
    return { message: `Bonuses paid (${fmt$(bonus)}). The whole company is smiling.` };
  },

  /* ── Operations ── */

  setSupplier(characterId: string, tier: number): { message: string } {
    requireBusiness(characterId);
    const def = SUPPLIER_TIERS.find((s) => s.tier === tier);
    if (!def) throw new Error('Unknown supplier tier.');
    BusinessModel.update(characterId, { supplierTier: tier });
    return { message: `Switched to ${def.label}.` };
  },

  setMarketing(characterId: string, level: number): { message: string } {
    requireBusiness(characterId);
    if (level < 0 || level >= MARKETING_COSTS.length) throw new Error('Invalid marketing level.');
    BusinessModel.update(characterId, { marketingLevel: level });
    return { message: level === 0 ? 'Marketing paused.' : `Marketing set to level ${level} (${fmt$(MARKETING_COSTS[level]!)}/yr).` };
  },

  setRnd(characterId: string, level: number): { message: string } {
    requireBusiness(characterId);
    if (level < 0 || level >= RND_COSTS.length) throw new Error('Invalid R&D level.');
    BusinessModel.update(characterId, { rndLevel: level });
    return { message: level === 0 ? 'R&D paused.' : `R&D set to level ${level} (${fmt$(RND_COSTS[level]!)}/yr).` };
  },

  hireConsultant(characterId: string, id: string): { message: string } {
    const b = requireBusiness(characterId);
    const def = CONSULTANT_BY_ID.get(id);
    if (!def) throw new Error('Unknown consultant.');
    if (b.consultants.includes(id)) throw new Error('Already retained.');
    BusinessModel.update(characterId, { consultants: [...b.consultants, id] });
    return { message: `${def.emoji} ${def.label} retained (${fmt$(def.annualFee)}/yr).` };
  },

  dropConsultant(characterId: string, id: string): { message: string } {
    const b = requireBusiness(characterId);
    if (!b.consultants.includes(id)) throw new Error('Not retained.');
    BusinessModel.update(characterId, { consultants: b.consultants.filter((cId) => cId !== id) });
    return { message: 'Consultant contract ended.' };
  },

  /* ── Expansion ── */

  expand(characterId: string, id: string): { message: string } {
    const b = requireBusiness(characterId);
    const def = EXPANSION_BY_ID.get(id);
    if (!def) throw new Error('Unknown expansion.');
    if (!def.repeatable && b.upgrades.includes(id)) throw new Error('Already done.');
    if (b.reputation < def.minReputation) throw new Error(`Needs reputation ${def.minReputation}+ (you have ${b.reputation}).`);
    if (b.branches < def.minBranches) throw new Error(`Needs ${def.minBranches}+ branches first.`);
    const ind = INDUSTRY_BY_ID.get(b.industry)!;
    const cost = id === 'branch'
      ? Math.round(ind.startupCost * 0.6 * Math.pow(1.2, b.branches - 1))
      : def.cost;
    if (b.cash < cost) throw new Error(`${def.label} costs ${fmt$(cost)}.`);

    const fields: Partial<BusinessState> = { cash: b.cash - cost, upgrades: [...b.upgrades, id] };
    if (id === 'branch') fields.branches = b.branches + 1;
    if (id === 'acquire') fields.marketShare = Math.min(100, b.marketShare + randF(2, 5));
    BusinessModel.update(characterId, fields);
    const c = CharacterModel.findById(characterId)!;
    EventLogModel.create(characterId, `business:expand_${id}`, c.age, 'milestone', `${def.emoji} ${b.name}: ${def.label} (${fmt$(cost)}).`);
    return { message: `${def.emoji} ${def.label} complete for ${fmt$(cost)}!` };
  },

  /* ── Owner money movement ── */

  invest(characterId: string, amount: number): { message: string } {
    const b = requireBusiness(characterId);
    if (amount <= 0) throw new Error('Invalid amount.');
    const fin = FinanceModel.findByCharacterId(characterId);
    if (!fin || fin.cash < amount) throw new Error('You don\'t have that much personally.');
    FinanceModel.update(characterId, { cash: fin.cash - amount });
    BusinessModel.update(characterId, { cash: b.cash + amount });
    return { message: `Invested ${fmt$(amount)} of personal money into ${b.name}.` };
  },

  withdraw(characterId: string, amount: number): { message: string } {
    const b = requireBusiness(characterId);
    if (amount <= 0 || b.cash < amount) throw new Error('The company doesn\'t have that much.');
    const fin = FinanceModel.findByCharacterId(characterId);
    if (fin) FinanceModel.update(characterId, { cash: fin.cash + amount });
    BusinessModel.update(characterId, { cash: b.cash - amount });
    return { message: `Withdrew ${fmt$(amount)} from ${b.name} as owner pay.` };
  },

  sellBusiness(characterId: string): { message: string } {
    const b = requireBusiness(characterId);
    const c = CharacterModel.findById(characterId)!;
    const price = Math.round(b.valuation * BUSINESS_SALE_MULTIPLIER);
    const fin = FinanceModel.findByCharacterId(characterId);
    if (fin) FinanceModel.update(characterId, { cash: fin.cash + price });
    BusinessModel.update(characterId, { isOpen: false, cash: 0, lastEvent: `Sold for ${fmt$(price)}` });
    EventLogModel.create(characterId, 'business:sold', c.age, 'milestone', `Sold ${b.name} for ${fmt$(price)}! 🤝`);
    return { message: `🤝 You sold ${b.name} for ${fmt$(price)}.` };
  },

  closeBusiness(characterId: string): { message: string } {
    const b = requireBusiness(characterId);
    const c = CharacterModel.findById(characterId)!;
    const fin = FinanceModel.findByCharacterId(characterId);
    if (fin && b.cash > 0) FinanceModel.update(characterId, { cash: fin.cash + b.cash });
    BusinessModel.update(characterId, { isOpen: false, cash: 0, lastEvent: 'Closed by the founder' });
    EventLogModel.create(characterId, 'business:closed', c.age, 'milestone', `Closed ${b.name} down.`);
    return { message: `You closed ${b.name}. Whatever was in the account (${fmt$(Math.max(0, b.cash))}) is yours.` };
  },

  /* ── Annual simulation ── */

  annualUpdate(characterId: string, age: number): void {
    const b = BusinessModel.findByCharacterId(characterId);
    if (!b || !b.isOpen) return;
    const ind = INDUSTRY_BY_ID.get(b.industry)!;
    const supplier = SUPPLIER_TIERS.find((s) => s.tier === b.supplierTier) ?? SUPPLIER_TIERS[1]!;
    const has = (cid: string) => b.consultants.includes(cid);
    const upgraded = (id: string) => b.upgrades.includes(id);

    // Staff productivity: coverage vs branch needs × skill × morale (+ops consultant).
    const staffTotal = totalStaff(b.staff);
    const blocks = Object.values(b.staff) as StaffBlock[];
    const avgSkill = blocks.length ? blocks.reduce((s, x) => s + x.skill, 0) / blocks.length : 50;
    const avgMorale = blocks.length ? blocks.reduce((s, x) => s + x.morale, 0) / blocks.length : 50;
    // Staff-hungry industries (car plants, hotels) genuinely need headcount to run.
    const needed = b.branches * Math.max(2, Math.round(ind.employeeRequirement / 4));
    const coverage = Math.min(1.15, 0.45 + (staffTotal / Math.max(1, needed)) * 0.6);
    const productivity = coverage * (0.7 + avgSkill / 250) * (0.7 + avgMorale / 250) * (has('operations') ? 1.1 : 1);

    // Demand multipliers shared across products.
    const marketingEff = b.marketingLevel + (has('marketing') ? 1 : 0);
    const demandMult =
      (ind.marketDemand / 100) * (ind.customerDemand / 100 + 0.5) *
      (1 + marketingEff * 0.18) * (0.6 + b.reputation / 125) *
      (1 - ind.competition / 320) * (upgraded('international') ? 1.8 : 1) *
      b.branches * productivity * randF(0.85, 1.15);

    // Per-product economics. Volume is driven by the *market size* of the industry
    // (proxied by its startup cost) rather than a flat unit count, so a $4 coffee and
    // a $30k car can share one model: revenue potential is market-driven, and it's the
    // margin that differs. Premium/tier lower volume; higher tier = smaller niche.
    const marketSize = 70000 + ind.startupCost * 1.1;
    let revenue = 0;
    let productProfit = 0;
    let unitsTotal = 0;
    const rndEff = b.rndLevel + (has('technology') ? 1 : 0);
    const products: OwnedProduct[] = b.products.map((p) => {
      const def = PRODUCT_BY_KEY.get(p.key);
      if (!def) return p;
      const priceData = PRICE_TIER_DATA[p.priceTier];
      const price = def.basePrice * priceData.priceMult;
      let unitCost = def.unitCost * supplier.costMultiplier;
      if (upgraded('factory')) unitCost *= 0.85;
      if (upgraded('warehouse')) unitCost *= 0.95;
      if (has('manufacturing')) unitCost *= 0.93;

      const qualityEff = clamp(p.quality + supplier.qualityBonus, 1, 100);
      const productMarket = marketSize / Math.pow(def.tier, 1.4) * demandMult *
        (0.4 + qualityEff / 120) * (0.6 + p.popularity / 150) * priceData.volumeMult;
      const units = Math.max(0, Math.round(productMarket / price));
      const rev = Math.round(units * price);
      const prof = Math.round(units * (price - unitCost));
      revenue += rev;
      productProfit += prof;
      unitsTotal += units;

      // Drift: satisfaction toward quality (premium pricing expects more); popularity toward satisfaction.
      const satTarget = clamp(qualityEff - (p.priceTier === PriceTier.Premium ? 8 : 0) + (p.priceTier === PriceTier.Budget ? 5 : 0));
      const satisfaction = clamp(p.satisfaction + Math.sign(satTarget - p.satisfaction) * rand(3, 8));
      const popularity = clamp(p.popularity + Math.sign(satisfaction - p.popularity) * rand(2, 6) + marketingEff);
      const quality = clamp(p.quality + rndEff * 2 - 1); // R&D counteracts slow decay
      return { ...p, quality, satisfaction, popularity, unitsSold: units, revenue: rev, profit: prof };
    });

    // Fixed costs.
    let expenses = payroll(b.staff, salaryScale(ind.employeeRequirement));
    expenses += MARKETING_COSTS[b.marketingLevel] ?? 0;
    expenses += RND_COSTS[b.rndLevel] ?? 0;
    expenses += b.consultants.reduce((s, id) => s + (CONSULTANT_BY_ID.get(id)?.annualFee ?? 0), 0);
    expenses += Math.round(ind.startupCost * 0.04 * b.branches); // rent/upkeep per branch
    if (has('finance')) expenses = Math.round(expenses * 0.92);
    // Franchise royalties count as revenue.
    if (upgraded('franchise')) revenue += Math.round(revenue * 0.06);

    expenses += Math.max(0, revenue - productProfit); // cost of goods sold
    let profit = revenue - expenses;

    // ── One weighted random event (55%/yr) with mitigations ──
    let eventNote: string | null = null;
    if (Math.random() < 0.55) {
      const totalW = BUSINESS_EVENTS.reduce((s, e) => s + e.weight, 0);
      let roll = Math.random() * totalW;
      const ev = BUSINESS_EVENTS.find((e) => { roll -= e.weight; return roll <= 0; }) ?? BUSINESS_EVENTS[0]!;
      const mitigated =
        (ev.id === 'lawsuit' || ev.id === 'regulation') && has('legal') ||
        (ev.id === 'shortage' || ev.id === 'recall') && supplier.reliability >= 0.99 ||
        ev.id === 'strike' && has('hr');
      if (mitigated) {
        eventNote = `${ev.emoji} ${ev.label} — deflected by your advisors/suppliers.`;
      } else {
        const swing = Math.max(10000, Math.abs(profit) * randF(0.15, 0.4));
        switch (ev.id) {
          case 'viral': profit += swing * 1.5; eventNote = `${ev.emoji} ${ev.label}! Sales exploded (+${fmt$(swing * 1.5)}).`; break;
          case 'award': eventNote = `${ev.emoji} ${ev.label} — reputation soars.`; break;
          case 'breakthrough': eventNote = `${ev.emoji} ${ev.label} — product quality leaps.`; break;
          case 'investor': profit += swing * 2; eventNote = `${ev.emoji} ${ev.label} (+${fmt$(swing * 2)}).`; break;
          case 'acquisition_offer': eventNote = `${ev.emoji} ${ev.label} — buyers are circling. Sell if the price is right.`; break;
          default: profit -= swing; eventNote = `${ev.emoji} ${ev.label} (−${fmt$(swing)}).`; break;
        }
        // Stat side-effects.
        const repDelta = ev.good ? rand(3, 8) : -rand(3, 8);
        BusinessModel.update(characterId, { reputation: clamp(b.reputation + repDelta) });
        if (ev.id === 'breakthrough') {
          for (const p of products) p.quality = clamp(p.quality + 10);
        }
        if (ev.id === 'strike') {
          for (const blk of Object.values(b.staff) as StaffBlock[]) blk.morale = clamp(blk.morale - 15);
        }
      }
      EventLogModel.create(characterId, `business:event_${ev.id}`, age, 'business', `${b.name}: ${eventNote}`);
    }

    profit = Math.round(profit);
    const fresh = BusinessModel.findByCharacterId(characterId)!; // reputation may have changed
    const cash = fresh.cash + profit;
    const customers = Math.max(0, Math.round(unitsTotal * randF(0.55, 0.75)));
    const marketShare = Math.min(100, Math.max(0,
      fresh.marketShare + (profit > 0 ? randF(0.1, 0.6) : -randF(0.1, 0.5)) * (100 - ind.competition) / 50));
    const avgSat = products.length ? products.reduce((s, p) => s + p.satisfaction, 0) / products.length : 50;
    const reputation = clamp(fresh.reputation + (avgSat > 65 ? 2 : avgSat < 40 ? -3 : 0) + (profit > 0 ? 1 : -1));
    // Morale drifts down slightly each year without raises (HR consultant slows it).
    const staff = Object.fromEntries(
      (Object.entries(fresh.staff) as Array<[Role, StaffBlock]>).map(([r, blk]) =>
        [r, { ...blk, morale: clamp(blk.morale - (has('hr') ? 1 : 3)), skill: clamp(blk.skill + 1) }]),
    ) as Partial<Record<Role, StaffBlock>>;

    const yearHistory = [...fresh.history];
    const valuation = computeValuation({ cash, history: yearHistory, branches: fresh.branches, reputation });
    yearHistory.push({ age, revenue: Math.round(revenue), expenses: Math.round(expenses), profit, customers, valuation, event: eventNote });

    const lossYears = cash < 0 ? fresh.lossYears + 1 : 0;
    BusinessModel.update(characterId, {
      cash, customers, marketShare, reputation, staff, products,
      history: yearHistory.slice(-BUSINESS_HISTORY_CAP), lastEvent: eventNote, lossYears,
    });

    // Achievements.
    if (valuation >= 1_000_000) FlagsModel.set(characterId, 'businessMillionaire', true);
    if (valuation >= 100_000_000) FlagsModel.set(characterId, 'businessEmpire', true);

    // Bankruptcy: two consecutive years in the red closes the doors.
    if (lossYears >= BANKRUPTCY_YEARS) {
      BusinessModel.update(characterId, { isOpen: false, cash: 0, lastEvent: 'Went bankrupt' });
      EventLogModel.create(characterId, 'business:bankrupt', age, 'milestone', `${b.name} went bankrupt. 💔`);
    }
  },
};
