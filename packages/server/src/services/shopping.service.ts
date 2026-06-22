import { AssetsModel, CharacterModel, FinanceModel, StatsModel } from '../models/index.js';
import { FinanceService } from './finance.service.js';
import {
  PROPERTY_REGISTRY, VEHICLE_REGISTRY, SHOP_MIN_AGE,
} from '@lifeverse/shared';
import type { PropertyType, VehicleType, OwnedAsset } from '@lifeverse/shared';

/** Mortgage down-payment fraction. */
const DOWN_PAYMENT = 0.2;

export const ShoppingService = {
  getOwnedAssets(characterId: string): OwnedAsset[] {
    return AssetsModel.findByCharacterId(characterId);
  },

  buyProperty(characterId: string, type: PropertyType): { message: string } {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error('Character not found');
    if (character.age < SHOP_MIN_AGE) throw new Error('You must be 18 or older to access shopping.');

    const def = PROPERTY_REGISTRY.get(type);
    if (!def) throw new Error('Unknown property');

    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance) throw new Error('No finances');

    // Buy with a mortgage: pay a down payment in cash, finance the rest.
    const downPayment = Math.round(def.price * DOWN_PAYMENT);
    if (finance.cash < downPayment) {
      throw new Error(`You need a ${Math.round(DOWN_PAYMENT * 100)}% down payment of $${downPayment.toLocaleString()}.`);
    }
    FinanceModel.update(characterId, { cash: finance.cash - downPayment });
    FinanceService.addMortgage(characterId, def.price - downPayment);
    AssetsModel.create({
      characterId, assetType: type, label: def.label,
      value: def.netWorthValue, purchaseAge: character.age,
    });
    const stats = StatsModel.findByCharacterId(characterId);
    if (stats) {
      StatsModel.update(characterId, { ...stats, happiness: Math.min(100, stats.happiness + def.happiness) });
    }
    return { message: `You bought a ${def.label}!` };
  },

  buyVehicle(characterId: string, type: VehicleType): { message: string } {
    const character = CharacterModel.findById(characterId);
    if (!character) throw new Error('Character not found');
    if (character.age < SHOP_MIN_AGE) throw new Error('You must be 18 or older to access shopping.');

    const def = VEHICLE_REGISTRY.get(type);
    if (!def) throw new Error('Unknown vehicle');

    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance) throw new Error('No finances');
    if (finance.cash < def.price) {
      throw new Error(`Not enough cash. ${def.label} costs $${def.price.toLocaleString()}.`);
    }

    FinanceModel.update(characterId, { cash: finance.cash - def.price });
    AssetsModel.create({
      characterId, assetType: type, label: def.label,
      value: def.netWorthValue, purchaseAge: character.age,
    });
    const stats = StatsModel.findByCharacterId(characterId);
    if (stats) {
      StatsModel.update(characterId, { ...stats, happiness: Math.min(100, stats.happiness + def.happiness) });
    }
    return { message: `You bought a ${def.label}!` };
  },
};
