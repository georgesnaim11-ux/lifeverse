import {
  CharacterModel, FinanceModel, FlagsModel, EventLogModel, BusinessModel,
} from '../models/index.js';
import { computeValuation } from '../models/business.model.js';
import {
  BUSINESS_MIN_AGE, BUSINESS_SALE_MULTIPLIER, BANKRUPTCY_YEARS, BUSINESS_HISTORY_CAP,
  ROLE_SALARIES, salaryScale, SUPPLIER_SEARCH_FEE, MAX_SUPPLIER_TIER,
  INDUSTRY_BY_ID, PRODUCT_BY_KEY, productsForIndustry, SUPPLIER_TIERS, SUPPLIER_BY_TIER,
  CONSULTANT_BY_ID, EXPANSION_BY_ID, BUSINESS_EVENTS, TEAM_BUILDING_BY_ID,
  estimateProductUnits, locationCost, industryMarketSize,
  staffingRequirement, staffingShortfall, STAFF_ROLE_LABELS,
  StaffRole,
} from '@lifeverse/shared';
import type {
  BusinessState, Industry, OwnedProduct, StaffBlock, StaffRole as Role,
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

function payroll(staff: Partial<Record<Role, StaffBlock>>, scale: number): number {
  return (Object.entries(staff) as Array<[Role, StaffBlock]>)
    .reduce((sum, [role, blk]) => sum + Math.round(blk.count * (ROLE_SALARIES[role] ?? 40000) * scale), 0);
}

/** Per-unit production cost from base cost, supplier, improvements, and upgrades. */
function unitProductionCost(baseUnit: number, improveLevel: number, supplierMult: number, upgrades: string[], hasMfg: boolean): number {
  let cost = baseUnit * (1 + improveLevel * 0.08) * supplierMult;
  if (upgrades.includes('factory')) cost *= 0.85;
  if (upgrades.includes('warehouse')) cost *= 0.95;
  if (hasMfg) cost *= 0.93;
  return cost;
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

    // Seed the two cheapest products (priced at base, no ad spend) + a skeleton team.
    const line = productsForIndustry(input.industry).sort((a, b) => a.devCost - b.devCost);
    const starters: OwnedProduct[] = line.slice(0, 2).map((p) => ({
      key: p.key, quality: 50, price: p.basePrice, marketingBudget: 0, productionCost: p.unitCost,
      satisfaction: 50, popularity: 20, unitsSold: 0, inventory: 0, revenue: 0, profit: 0, improveLevel: 0,
    }));
    // Seed a realistic role mix for the first location, so the founder starts
    // with the right kinds of employees (not just warm bodies).
    const seedReq = staffingRequirement(ind, 1);
    const staff: Partial<Record<Role, StaffBlock>> = {};
    for (const [role, n] of Object.entries(seedReq) as Array<[Role, number]>) {
      staff[role] = { count: n, skill: role === StaffRole.Manager ? 50 : 45, morale: 70 };
    }
    BusinessModel.update(characterId, { products: starters, staff });

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
    BusinessModel.update(characterId, {
      cash: b.cash - def.devCost,
      products: [...b.products, {
        key, quality: 45, price: def.basePrice, marketingBudget: 0, productionCost: def.unitCost,
        satisfaction: 50, popularity: 15, unitsSold: 0, inventory: 0, revenue: 0, profit: 0, improveLevel: 0,
      }],
    });
    return { message: `${def.emoji} ${def.name} developed and launched for ${fmt$(def.devCost)}!` };
  },

  /** Freely set a product's selling price ($). */
  setProductPrice(characterId: string, key: string, price: number): { message: string } {
    const b = requireBusiness(characterId);
    const def = PRODUCT_BY_KEY.get(key);
    if (!def || !b.products.some((p) => p.key === key)) throw new Error('You don\'t sell that.');
    const min = def.basePrice * 0.2, max = def.basePrice * 8;
    const clamped = Math.min(max, Math.max(min, price));
    BusinessModel.update(characterId, {
      products: b.products.map((p) => (p.key === key ? { ...p, price: Math.round(clamped * 100) / 100 } : p)),
    });
    return { message: `${def.name} now sells for ${fmt$(clamped)}.` };
  },

  /** Set a product's annual advertising budget. */
  setProductMarketing(characterId: string, key: string, budget: number): { message: string } {
    const b = requireBusiness(characterId);
    const def = PRODUCT_BY_KEY.get(key);
    if (!def || !b.products.some((p) => p.key === key)) throw new Error('You don\'t sell that.');
    const clamped = Math.max(0, Math.min(budget, 5_000_000_000));
    BusinessModel.update(characterId, {
      products: b.products.map((p) => (p.key === key ? { ...p, marketingBudget: Math.round(clamped) } : p)),
    });
    return { message: clamped === 0 ? `Marketing paused for ${def.name}.` : `${def.name} marketing set to ${fmt$(clamped)}/yr.` };
  },

  /** R&D: raise quality — but each improvement costs more and lifts production cost. */
  improveProduct(characterId: string, key: string): { message: string } {
    const b = requireBusiness(characterId);
    const prod = b.products.find((p) => p.key === key);
    const def = PRODUCT_BY_KEY.get(key);
    if (!prod || !def) throw new Error('You don\'t sell that.');
    const cost = Math.max(1000, Math.round(def.devCost * 0.25 * (1 + prod.improveLevel * 0.5)));
    if (b.cash < cost) throw new Error(`The next R&D round costs ${fmt$(cost)}.`);
    const products = b.products.map((p) => (p.key === key
      ? { ...p, quality: clamp(p.quality + rand(6, 12)), improveLevel: p.improveLevel + 1 }
      : p));
    BusinessModel.update(characterId, { cash: b.cash - cost, products });
    return { message: `${def.emoji} ${def.name} improved for ${fmt$(cost)} — higher quality, higher production cost.` };
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
    if (count < 1 || count > 5000) throw new Error('Invalid head-count.');
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

  /** A morale-boosting team activity — cost scales with headcount. */
  teamBuilding(characterId: string, id: string): { message: string } {
    const b = requireBusiness(characterId);
    const def = TEAM_BUILDING_BY_ID.get(id);
    if (!def) throw new Error('Unknown activity.');
    const headcount = totalStaff(b.staff);
    if (headcount === 0) throw new Error('Hire someone before hosting a team event.');
    const cost = def.costPerHead * headcount;
    if (b.cash < cost) throw new Error(`${def.label} for ${headcount} staff costs ${fmt$(cost)}.`);
    const staff = Object.fromEntries(
      (Object.entries(b.staff) as Array<[Role, StaffBlock]>).map(([r, blk]) =>
        [r, { ...blk, morale: clamp(blk.morale + def.moraleGain), skill: clamp(blk.skill + (id === 'training' ? 2 : 0)) }]),
    ) as Partial<Record<Role, StaffBlock>>;
    BusinessModel.update(characterId, { cash: b.cash - cost, staff });
    return { message: `${def.emoji} ${def.label} for ${fmt$(cost)} — morale +${def.moraleGain}.` };
  },

  /* ── Suppliers ── */

  findBetterSupplier(characterId: string): { message: string } {
    const b = requireBusiness(characterId);
    if (b.supplierUnlocked >= MAX_SUPPLIER_TIER) throw new Error('You already have access to the best suppliers.');
    if (b.cash < SUPPLIER_SEARCH_FEE) throw new Error(`The supplier search costs ${fmt$(SUPPLIER_SEARCH_FEE)}.`);
    const next = SUPPLIER_BY_TIER.get(b.supplierUnlocked + 1)!;
    BusinessModel.update(characterId, { cash: b.cash - SUPPLIER_SEARCH_FEE, supplierUnlocked: b.supplierUnlocked + 1 });
    return { message: `🔎 Found a higher-capacity partner: ${next.label} (capacity ${next.capacity.toLocaleString()} units/yr). Switch to them in Suppliers.` };
  },

  setSupplier(characterId: string, tier: number): { message: string } {
    const b = requireBusiness(characterId);
    const def = SUPPLIER_BY_TIER.get(tier);
    if (!def) throw new Error('Unknown supplier tier.');
    if (tier > b.supplierUnlocked) throw new Error(`You haven't found that supplier yet — use Find Better Supplier first.`);
    BusinessModel.update(characterId, { supplierTier: tier });
    return { message: `Switched to ${def.label}.` };
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

  /** One-off strategic upgrades (warehouse/factory/international/franchise/acquire). */
  expand(characterId: string, id: string): { message: string } {
    const b = requireBusiness(characterId);
    const def = EXPANSION_BY_ID.get(id);
    if (!def) throw new Error('Unknown expansion.');
    if (!def.repeatable && b.upgrades.includes(id)) throw new Error('Already done.');
    if (b.reputation < def.minReputation) throw new Error(`Needs reputation ${def.minReputation}+ (you have ${b.reputation}).`);
    if (b.branches < def.minBranches) throw new Error(`Needs ${def.minBranches}+ locations first.`);
    if (b.cash < def.cost) throw new Error(`${def.label} costs ${fmt$(def.cost)}.`);
    const fields: Partial<BusinessState> = { cash: b.cash - def.cost, upgrades: [...b.upgrades, id] };
    if (id === 'acquire') fields.marketShare = Math.min(100, b.marketShare + randF(2, 5));
    BusinessModel.update(characterId, fields);
    const c = CharacterModel.findById(characterId)!;
    EventLogModel.create(characterId, `business:expand_${id}`, c.age, 'milestone', `${def.emoji} ${b.name}: ${def.label} (${fmt$(def.cost)}).`);
    return { message: `${def.emoji} ${def.label} complete for ${fmt$(def.cost)}!` };
  },

  /** Open N new locations at once — gated by cash AND a realistic role mix. */
  expandLocations(characterId: string, count: number): { message: string } {
    const b = requireBusiness(characterId);
    if (count < 1 || count > 50) throw new Error('Choose between 1 and 50 locations.');
    const ind = INDUSTRY_BY_ID.get(b.industry)!;
    if (b.reputation < 35) throw new Error(`Build your reputation to 35+ before expanding (you have ${b.reputation}).`);
    let totalCost = 0;
    for (let i = 0; i < count; i++) totalCost += locationCost(ind, b.branches, i);
    // Every location needs a proper blend of roles — not just warm bodies.
    const short = staffingShortfall(ind, b.branches + count, b.staff);
    const shortRoles = Object.entries(short) as Array<[Role, number]>;
    if (shortRoles.length > 0) {
      const list = shortRoles.map(([role, n]) => `${n} more ${STAFF_ROLE_LABELS[role]}`).join(', ');
      throw new Error(`To run ${b.branches + count} locations you need to hire: ${list}.`);
    }
    if (b.cash < totalCost) throw new Error(`Opening ${count} location(s) costs ${fmt$(totalCost)} — the company has ${fmt$(b.cash)}.`);
    BusinessModel.update(characterId, { cash: b.cash - totalCost, branches: b.branches + count });
    const c = CharacterModel.findById(characterId)!;
    EventLogModel.create(characterId, 'business:expand_locations', c.age, 'milestone',
      `${ind.emoji} ${b.name} opened ${count} new location${count > 1 ? 's' : ''} (now ${b.branches + count}).`);
    return { message: `🏗️ Opened ${count} location${count > 1 ? 's' : ''} for ${fmt$(totalCost)} — ${b.branches + count} total.` };
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
    const supplier = SUPPLIER_BY_TIER.get(b.supplierTier) ?? SUPPLIER_TIERS[1]!;
    const has = (cid: string) => b.consultants.includes(cid);
    const upgraded = (id: string) => b.upgrades.includes(id);

    // ── Staff: morale is load-bearing (productivity, turnover, satisfaction). ──
    const staffTotal = totalStaff(b.staff);
    const blocks = Object.values(b.staff) as StaffBlock[];
    const avgSkill = blocks.length ? blocks.reduce((s, x) => s + x.skill, 0) / blocks.length : 50;
    const avgMorale = blocks.length ? blocks.reduce((s, x) => s + x.morale, 0) / blocks.length : 50;
    const needed = b.branches * Math.max(2, Math.round(ind.employeeRequirement / 4));
    const coverage = Math.min(1.15, 0.45 + (staffTotal / Math.max(1, needed)) * 0.6);
    // Morale below 55 drags productivity; above lifts it.
    const moraleFactor = 0.6 + avgMorale / 140;
    const productivity = coverage * (0.7 + avgSkill / 250) * moraleFactor * (has('operations') ? 1.1 : 1);

    // ── Shared yearly demand base (industry, reputation, reach, execution). ──
    const demandBase =
      (ind.marketDemand / 100) * (ind.customerDemand / 100 + 0.5) *
      (0.6 + b.reputation / 125) * (1 - ind.competition / 320) *
      (upgraded('international') ? 1.8 : 1) * b.branches * productivity * randF(0.88, 1.12);

    // ── Per-product demand, capped by shared supplier capacity. ──
    const capacity = supplier.capacity * b.branches;
    const demandUnits = b.products.map((p) => {
      const def = PRODUCT_BY_KEY.get(p.key);
      if (!def) return 0;
      return estimateProductUnits(def,
        { quality: p.quality, price: p.price, popularity: p.popularity, marketingBudget: p.marketingBudget },
        { industry: ind, reputation: b.reputation, demandBase, supplierQualityBonus: supplier.qualityBonus });
    });
    const totalDemand = demandUnits.reduce((s, u) => s + u, 0);
    const capFactor = totalDemand > capacity && totalDemand > 0 ? capacity / totalDemand : 1;
    const capped = capFactor < 1;

    let revenue = 0;
    let cogs = 0;
    let marketingSpend = 0;
    let unitsTotal = 0;
    const products: OwnedProduct[] = b.products.map((p, i) => {
      const def = PRODUCT_BY_KEY.get(p.key);
      if (!def) return p;
      const qualityEff = clamp(p.quality + supplier.qualityBonus, 1, 100);
      const producible = Math.floor(demandUnits[i]! * capFactor); // capacity share
      const available = producible + p.inventory;
      const unitsSold = Math.min(demandUnits[i]!, available);
      const inventory = Math.max(0, available - unitsSold);       // overstock carries
      const lostSales = Math.max(0, demandUnits[i]! - unitsSold);  // couldn't supply
      const prodCost = unitProductionCost(def.unitCost, p.improveLevel, supplier.costMultiplier, b.upgrades, has('manufacturing'));
      const rev = Math.round(unitsSold * p.price);
      const unitProfit = p.price - prodCost;
      revenue += rev;
      cogs += Math.round(unitsSold * prodCost);
      marketingSpend += p.marketingBudget;
      unitsTotal += unitsSold;

      // Satisfaction: quality vs price fairness, dented by unmet demand.
      const overpricePenalty = Math.max(0, (p.price / def.basePrice - 1) * 22);
      const satTarget = clamp(qualityEff * 0.95 - overpricePenalty - (lostSales > 0 ? 12 : 0) + (avgMorale < 40 ? -8 : 0));
      const satisfaction = clamp(p.satisfaction + Math.sign(satTarget - p.satisfaction) * rand(3, 8));
      // Popularity chases satisfaction, boosted by marketing reach.
      const mktPop = p.marketingBudget > 0 ? Math.min(6, Math.sqrt(p.marketingBudget / Math.max(2000, industryMarketSize(ind) * 0.01))) : 0;
      const popularity = clamp(p.popularity + Math.sign(satisfaction - p.popularity) * rand(1, 4) + mktPop);
      const quality = clamp(p.quality - 1 + (avgMorale > 65 ? 1 : 0)); // slow decay unless morale high; R&D via Improve
      return {
        ...p, quality, satisfaction, popularity, productionCost: Math.round(prodCost * 100) / 100,
        unitsSold, inventory, revenue: rev, profit: Math.round(unitsSold * unitProfit),
      };
    });

    // ── Operating expenses ──
    let opex = payroll(b.staff, salaryScale(ind.employeeRequirement));
    opex += marketingSpend;
    opex += b.consultants.reduce((s, id) => s + (CONSULTANT_BY_ID.get(id)?.annualFee ?? 0), 0);
    opex += Math.round(ind.startupCost * 0.04 * b.branches); // rent/upkeep per location
    if (has('finance')) opex = Math.round(opex * 0.92);
    if (upgraded('franchise')) revenue += Math.round(revenue * 0.06);

    let profit = revenue - cogs - opex;

    // ── One weighted random event (55%/yr) with mitigations ──
    let eventNote: string | null = null;
    let eventRepDelta = 0;
    if (Math.random() < 0.55) {
      const totalW = BUSINESS_EVENTS.reduce((s, e) => s + e.weight, 0);
      let roll = Math.random() * totalW;
      const ev = BUSINESS_EVENTS.find((e) => { roll -= e.weight; return roll <= 0; }) ?? BUSINESS_EVENTS[0]!;
      const mitigated =
        ((ev.id === 'lawsuit' || ev.id === 'regulation') && has('legal')) ||
        ((ev.id === 'shortage' || ev.id === 'recall') && supplier.reliability >= 0.97) ||
        (ev.id === 'strike' && has('hr'));
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
        eventRepDelta = ev.good ? rand(3, 8) : -rand(3, 8);
        if (ev.id === 'breakthrough') for (const p of products) p.quality = clamp(p.quality + 10);
        if (ev.id === 'strike') for (const blk of Object.values(b.staff) as StaffBlock[]) blk.morale = clamp(blk.morale - 15);
      }
      EventLogModel.create(characterId, `business:event_${ev.id}`, age, 'business', `${b.name}: ${eventNote}`);
    }
    if (capped && !eventNote) {
      eventNote = `⚠️ Demand outstripped supply — ${supplier.label} capped output. Find a bigger supplier.`;
    }

    profit = Math.round(profit);
    const cash = b.cash + profit;
    const customers = Math.max(0, Math.round(unitsTotal * randF(0.55, 0.75)));
    const marketShare = Math.min(100, Math.max(0,
      b.marketShare + (profit > 0 ? randF(0.1, 0.6) : -randF(0.1, 0.5)) * (100 - ind.competition) / 50));
    const avgSat = products.length ? products.reduce((s, p) => s + p.satisfaction, 0) / products.length : 50;
    const reputation = clamp(b.reputation + eventRepDelta + (avgSat > 65 ? 2 : avgSat < 40 ? -3 : 0) + (profit > 0 ? 1 : -1));

    // ── Staff evolution: turnover from low morale, slow skill growth, morale decay. ──
    const staff = Object.fromEntries(
      (Object.entries(b.staff) as Array<[Role, StaffBlock]>).map(([r, blk]) => {
        const decay = has('hr') ? 1 : 3;
        const morale = clamp(blk.morale - decay);
        // Unhappy teams shed people — the lower the morale, the faster they walk.
        const quitRate = blk.morale < 45 ? (50 - blk.morale) / 100 * 0.7 : 0;
        const count = Math.max(0, blk.count - Math.round(blk.count * quitRate));
        return [r, { count, skill: clamp(blk.skill + 1), morale }];
      }),
    ) as Partial<Record<Role, StaffBlock>>;
    const quitters = staffTotal - totalStaff(staff);
    if (quitters > 0) {
      EventLogModel.create(characterId, 'business:turnover', age, 'business', `${b.name}: ${quitters} staff quit over low morale.`);
    }

    const yearHistory = [...b.history];
    const valuation = computeValuation({ cash, history: yearHistory, branches: b.branches, reputation });
    yearHistory.push({ age, revenue: Math.round(revenue), expenses: Math.round(cogs + opex), profit, customers, valuation, event: eventNote });

    const lossYears = cash < 0 ? b.lossYears + 1 : 0;
    BusinessModel.update(characterId, {
      cash, customers, marketShare, reputation, staff, products,
      history: yearHistory.slice(-BUSINESS_HISTORY_CAP), lastEvent: eventNote, lossYears,
    });

    if (valuation >= 1_000_000) FlagsModel.set(characterId, 'businessMillionaire', true);
    if (valuation >= 100_000_000) FlagsModel.set(characterId, 'businessEmpire', true);

    if (lossYears >= BANKRUPTCY_YEARS) {
      BusinessModel.update(characterId, { isOpen: false, cash: 0, lastEvent: 'Went bankrupt' });
      EventLogModel.create(characterId, 'business:bankrupt', age, 'milestone', `${b.name} went bankrupt. 💔`);
    }
  },
};
