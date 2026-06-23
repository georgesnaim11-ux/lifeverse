import {
  CharacterModel, FinanceModel, StatsModel, EventLogModel, CollectibleModel,
} from '../models/index.js';
import { FinanceService } from './finance.service.js';
import {
  COLLECTIBLE_MIN_AGE, AIRCRAFT_NET_WORTH_GATE, COLLECTIBLE_BY_KEY, buildCollectibleListing,
  CollectibleCategory,
} from '@lifeverse/shared';
import type { OwnedCollectible, CollectibleCategory as Category, CollectibleCondition } from '@lifeverse/shared';

function grantHappiness(characterId: string, amount: number): void {
  if (amount === 0) return;
  const stats = StatsModel.findByCharacterId(characterId);
  if (stats) StatsModel.update(characterId, { ...stats, happiness: Math.min(100, Math.max(0, stats.happiness + amount)) });
}

export const ShopService = {
  getCollection(characterId: string): OwnedCollectible[] {
    return CollectibleModel.findByCharacterId(characterId);
  },

  buy(
    characterId: string,
    category: Category,
    itemKey: string,
    year: number,
    condition: CollectibleCondition,
  ): { message: string } {
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    if (c.age < COLLECTIBLE_MIN_AGE) throw new Error(`You must be ${COLLECTIBLE_MIN_AGE} to buy luxury goods.`);

    const item = COLLECTIBLE_BY_KEY.get(itemKey);
    if (!item || item.category !== category) throw new Error('Unknown item.');
    const l = buildCollectibleListing(item, year, condition);

    // Aircraft require real wealth.
    if (category === CollectibleCategory.Aircraft) {
      const netWorth = FinanceService.computeNetWorth(characterId);
      if (netWorth < AIRCRAFT_NET_WORTH_GATE) {
        throw new Error(`You need a net worth of $${AIRCRAFT_NET_WORTH_GATE.toLocaleString()} to own aircraft.`);
      }
    }

    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance) throw new Error('No finances');
    if (finance.cash < l.price) {
      throw new Error(`Not enough cash. That ${l.label} costs $${l.price.toLocaleString()}.`);
    }

    FinanceModel.update(characterId, { cash: finance.cash - l.price });
    CollectibleModel.create({
      characterId, category, itemKey: l.itemKey, label: l.label, brand: l.brand, emoji: l.emoji,
      year: l.year, condition: l.condition, purchasePrice: l.price, currentValue: l.price,
      purchaseAge: c.age, appreciationRate: l.appreciationRate, monthlyMaintenance: l.monthlyMaintenance,
    });
    grantHappiness(characterId, Math.min(20, Math.round(l.price / 50000) + 2));
    EventLogModel.create(characterId, 'milestone:luxury_purchase', c.age, 'milestone',
      `Bought a ${l.brand} ${l.label} for $${l.price.toLocaleString()}.`);
    return { message: `You bought a ${l.brand} ${l.label}! ${l.emoji}` };
  },

  sell(characterId: string, collectibleId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    const item = CollectibleModel.findById(collectibleId);
    if (!c || !item || item.characterId !== characterId) throw new Error('You do not own that item.');
    const finance = FinanceModel.findByCharacterId(characterId);
    if (finance) FinanceModel.update(characterId, { cash: finance.cash + item.currentValue });
    CollectibleModel.delete(collectibleId);
    EventLogModel.create(characterId, 'milestone:luxury_sale', c.age, 'milestone',
      `Sold the ${item.label} for $${item.currentValue.toLocaleString()}.`);
    return { message: `You sold your ${item.label} for $${item.currentValue.toLocaleString()}.` };
  },

  /** Annual step: each collectible appreciates or depreciates at its own rate. */
  annualUpdate(characterId: string): void {
    for (const item of CollectibleModel.findByCharacterId(characterId)) {
      const next = Math.max(0, Math.round(item.currentValue * (1 + item.appreciationRate)));
      if (next !== item.currentValue) CollectibleModel.update(item.id, { currentValue: next });
    }
  },

  /** Annual upkeep across boats & aircraft (for finance). */
  annualMaintenanceCost(characterId: string): number {
    return CollectibleModel.findByCharacterId(characterId).reduce((s, i) => s + i.monthlyMaintenance * 12, 0);
  },

  /** Combined value of every collectible (for the balance sheet). */
  collectiblesValue(characterId: string): number {
    return CollectibleModel.findByCharacterId(characterId).reduce((s, i) => s + i.currentValue, 0);
  },
};
