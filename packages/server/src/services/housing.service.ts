import {
  HousingModel, CharacterModel, FinanceModel, StatsModel, RelationshipsModel,
  EventLogModel, PropertyModel, LoanModel,
} from '../models/index.js';
import { FinanceService } from './finance.service.js';
import {
  HOUSING_MIN_AGE, generateMarket, PROPERTY_BY_KEY, buildListing, annualRentIncome,
  RelationType,
} from '@lifeverse/shared';
import type { HousingState, Listing, OwnedProperty } from '@lifeverse/shared';

const DOWN_PAYMENT = 0.2;

function hasLivingParents(characterId: string): boolean {
  return RelationshipsModel.findByCharacterId(characterId)
    .some((r) => r.type === RelationType.Parent && r.isAlive);
}

/** Mirror an owned residence onto the legacy `housing` row so the residence card stays accurate. */
function syncResidenceToHousing(characterId: string, p: OwnedProperty): void {
  HousingModel.update(characterId, {
    tenure: 'owned', residencePropertyId: p.id,
    propertyKey: p.key, propertyLabel: p.label, tier: p.tier, company: p.company,
    bedrooms: p.bedrooms, bathrooms: p.bathrooms, condition: p.condition,
    monthlyExpense: p.monthlyUpkeep, currentValue: p.currentValue, purchasePrice: p.purchasePrice,
    purchaseAge: p.purchaseAge, appreciationRate: p.appreciationRate,
  });
}

/** Reset the `housing` row to a non-owning living arrangement (renting/parents/homeless). */
function clearResidenceHousing(characterId: string, tenure: HousingState['tenure'], monthlyExpense = 0): void {
  HousingModel.update(characterId, {
    tenure, residencePropertyId: null, propertyKey: null, propertyLabel: null, tier: null,
    company: null, bedrooms: 0, bathrooms: 0, condition: null, monthlyExpense,
    currentValue: 0, purchasePrice: 0, purchaseAge: null, appreciationRate: 0,
  });
}

function grantHappiness(characterId: string, amount: number): void {
  if (amount === 0) return;
  const stats = StatsModel.findByCharacterId(characterId);
  if (stats) StatsModel.update(characterId, { ...stats, happiness: Math.min(100, Math.max(0, stats.happiness + amount)) });
}

export const HousingService = {
  init(characterId: string): void {
    HousingModel.ensureExists(characterId, 'parents');
  },

  get(characterId: string): HousingState {
    return HousingModel.ensureExists(characterId, 'parents');
  },

  /** Every property the character owns (residence + investments). */
  getProperties(characterId: string): OwnedProperty[] {
    return PropertyModel.findByCharacterId(characterId);
  },

  /** Property market for the character's country. */
  getMarket(characterId: string): Listing[] {
    const c = CharacterModel.findById(characterId);
    if (!c) return [];
    return generateMarket(c.country);
  },

  /** Rebuild a fresh listing (country + condition priced) for a property key. */
  private_listing(characterId: string, key: string): Listing | null {
    const c = CharacterModel.findById(characterId);
    const def = PROPERTY_BY_KEY.get(key);
    if (!c || !def) return null;
    return buildListing(def, c.country);
  },

  rent(characterId: string, key: string, listing?: Listing): { message: string } {
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    if (c.age < HOUSING_MIN_AGE) throw new Error('You must be 18 to sign a rental agreement.');
    const l = listing ?? this.private_listing(characterId, key);
    if (!l) throw new Error('Unknown property');
    if (!l.rentable) throw new Error('This property is not available to rent.');

    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance || finance.cash < l.monthlyRent) {
      throw new Error(`You can't afford the first month's rent ($${l.monthlyRent.toLocaleString()}).`);
    }
    // Moving into a rental means you no longer live in any owned property.
    PropertyModel.clearResidence(characterId);
    HousingModel.update(characterId, {
      tenure: 'renting', residencePropertyId: null, propertyKey: l.key, propertyLabel: l.label,
      tier: l.tier, company: l.company, bedrooms: l.bedrooms, bathrooms: l.bathrooms,
      condition: l.condition, monthlyExpense: l.monthlyRent, currentValue: 0, purchasePrice: 0,
      purchaseAge: c.age, appreciationRate: 0,
    });
    EventLogModel.create(characterId, 'milestone:rent', c.age, 'milestone', `Started renting a ${l.label} from ${l.company}.`);
    return { message: `You rented a ${l.label}. Rent is $${l.monthlyRent.toLocaleString()}/mo.` };
  },

  /**
   * Buy a property. `moveIn` makes it the residence; otherwise it is held as an
   * investment and rented out for income. Funded by a down payment + mortgage.
   */
  buy(characterId: string, key: string, opts?: { moveIn?: boolean }, listing?: Listing): { message: string } {
    const moveIn = opts?.moveIn ?? true;
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    if (c.age < HOUSING_MIN_AGE) throw new Error('You must be 18 to buy property.');
    const l = listing ?? this.private_listing(characterId, key);
    if (!l) throw new Error('Unknown property');
    if (!l.buyable) throw new Error('This property is not for sale.');

    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance) throw new Error('No finances');
    const downPayment = Math.round(l.price * DOWN_PAYMENT);
    if (finance.cash < downPayment) {
      throw new Error(`You need a ${Math.round(DOWN_PAYMENT * 100)}% down payment of $${downPayment.toLocaleString()}.`);
    }

    if (moveIn) PropertyModel.clearResidence(characterId);
    const property = PropertyModel.create({
      characterId, key: l.key, label: l.label, tier: l.tier, company: l.company,
      bedrooms: l.bedrooms, bathrooms: l.bathrooms, condition: l.condition,
      purchasePrice: l.price, currentValue: l.price, purchaseAge: c.age,
      appreciationRate: l.appreciation, monthlyUpkeep: l.monthlyUpkeep, monthlyRent: l.monthlyRent,
      happiness: l.happiness, isResidence: moveIn, isRentedOut: !moveIn,
    });

    FinanceModel.update(characterId, { cash: finance.cash - downPayment });
    FinanceService.addMortgage(characterId, l.price - downPayment, property.id);

    if (moveIn) {
      syncResidenceToHousing(characterId, property);
      grantHappiness(characterId, l.happiness);
      EventLogModel.create(characterId, 'milestone:home_purchase', c.age, 'milestone', `Bought a ${l.label} for $${l.price.toLocaleString()}.`);
      return { message: `You bought a ${l.label} to live in! 🏠` };
    }
    EventLogModel.create(characterId, 'milestone:investment_property', c.age, 'milestone', `Bought a ${l.label} as an investment for $${l.price.toLocaleString()}.`);
    return { message: `You bought a ${l.label} as a rental investment. 📈` };
  },

  /** Move into an owned property, swapping it in as the residence. */
  setResidence(characterId: string, propertyId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    const property = PropertyModel.findById(propertyId);
    if (!property || property.characterId !== characterId) throw new Error('You do not own that property.');
    if (property.isResidence) return { message: `You already live in your ${property.label}.` };

    PropertyModel.clearResidence(characterId);
    const updated = PropertyModel.update(propertyId, { isResidence: true, isRentedOut: false });
    syncResidenceToHousing(characterId, updated);
    grantHappiness(characterId, updated.happiness);
    EventLogModel.create(characterId, 'milestone:move_home', c.age, 'milestone', `Moved into the ${updated.label}.`);
    return { message: `You moved into your ${updated.label}.` };
  },

  /** Toggle whether a non-residence property is rented out for income. */
  toggleRentOut(characterId: string, propertyId: string): { message: string } {
    const property = PropertyModel.findById(propertyId);
    if (!property || property.characterId !== characterId) throw new Error('You do not own that property.');
    if (property.isResidence) throw new Error('You cannot rent out the home you live in.');
    const updated = PropertyModel.update(propertyId, { isRentedOut: !property.isRentedOut });
    return {
      message: updated.isRentedOut
        ? `You listed your ${updated.label} for rent.`
        : `You took your ${updated.label} off the rental market.`,
    };
  },

  /** Sell an owned property — clears its mortgage, banks the net proceeds. */
  sell(characterId: string, propertyId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    const property = PropertyModel.findById(propertyId);
    if (!c || !property || property.characterId !== characterId) throw new Error('You do not own that property.');

    const mortgageCleared = LoanModel.settleByProperty(propertyId);
    const net = property.currentValue - mortgageCleared;
    const finance = FinanceModel.findByCharacterId(characterId);
    if (finance) FinanceModel.update(characterId, { cash: Math.max(0, finance.cash + net) });

    const wasResidence = property.isResidence;
    PropertyModel.delete(propertyId);

    if (wasResidence) {
      const tenure = hasLivingParents(characterId) ? 'parents' : 'homeless';
      clearResidenceHousing(characterId, tenure);
    }
    EventLogModel.create(characterId, 'milestone:home_sale', c.age, 'milestone', `Sold the ${property.label} for $${property.currentValue.toLocaleString()}.`);
    const note = mortgageCleared > 0 ? ` (after clearing a $${mortgageCleared.toLocaleString()} mortgage)` : '';
    return { message: `You sold your ${property.label} for $${property.currentValue.toLocaleString()}${note}.` };
  },

  /** Move back in with parents (if any are alive). */
  moveInWithParents(characterId: string): { message: string } {
    if (!hasLivingParents(characterId)) throw new Error('You have no living parents to move in with.');
    PropertyModel.clearResidence(characterId);
    clearResidenceHousing(characterId, 'parents');
    return { message: 'You moved back in with your parents.' };
  },

  /**
   * Annual housing step: appreciate every owned property, age-gate minors,
   * trigger homelessness when parents die, and apply homelessness penalties.
   */
  annualUpdate(characterId: string, age: number): { happinessDelta: number; healthDelta: number } {
    const housing = HousingModel.ensureExists(characterId, 'parents');

    // Appreciate every owned property at its own fixed rate.
    let residence: OwnedProperty | null = null;
    for (const p of PropertyModel.findByCharacterId(characterId)) {
      if (p.appreciationRate > 0) {
        const newValue = Math.round(p.currentValue * (1 + p.appreciationRate));
        PropertyModel.update(p.id, { currentValue: newValue });
      }
      if (p.isResidence) residence = PropertyModel.findById(p.id);
    }
    // Keep the residence card's value/upkeep in sync after appreciation.
    if (residence) syncResidenceToHousing(characterId, residence);

    // Minors always live with parents (if any), else homeless.
    if (age < HOUSING_MIN_AGE) {
      const desired = hasLivingParents(characterId) ? 'parents' : 'homeless';
      if (housing.tenure !== desired && (housing.tenure === 'parents' || housing.tenure === 'homeless')) {
        HousingModel.update(characterId, { tenure: desired });
      }
    }

    // Living with parents but they've all died → homeless.
    if (housing.tenure === 'parents' && !hasLivingParents(characterId)) {
      HousingModel.update(characterId, { tenure: 'homeless' });
      return { happinessDelta: -8, healthDelta: -3 };
    }

    // Homelessness penalties.
    if (housing.tenure === 'homeless') {
      return { happinessDelta: -10, healthDelta: -5 };
    }
    return { happinessDelta: 0, healthDelta: 0 };
  },

  /** Net annual rental income across rented-out investment properties (upkeep billed separately). */
  annualRentalIncome(characterId: string): number {
    return PropertyModel.findByCharacterId(characterId)
      .filter((p) => p.isRentedOut)
      .reduce((sum, p) => sum + annualRentIncome(p.monthlyRent), 0);
  },

  /** Annual upkeep across every owned property (residence + investments). */
  annualPortfolioUpkeep(characterId: string): number {
    return PropertyModel.findByCharacterId(characterId)
      .reduce((sum, p) => sum + p.monthlyUpkeep * 12, 0);
  },

  /** Annual housing cost for the finance system: residence rent + portfolio upkeep. */
  annualHousingCost(characterId: string): number {
    const h = HousingModel.findByCharacterId(characterId);
    const rent = h && h.tenure === 'renting' ? h.monthlyExpense * 12 : 0;
    return rent + this.annualPortfolioUpkeep(characterId);
  },

  /** Combined value of every owned property for the balance sheet. */
  propertyValue(characterId: string): number {
    return PropertyModel.findByCharacterId(characterId)
      .reduce((sum, p) => sum + p.currentValue, 0);
  },
};
