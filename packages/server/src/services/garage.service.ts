import {
  CharacterModel, FinanceModel, StatsModel, EventLogModel, VehicleModel,
} from '../models/index.js';
import {
  VEHICLE_MIN_AGE, generateDealership, MODEL_BY_KEY, buildVehicleListing,
  CONDITION_DATA, CONDITION_ORDER,
} from '@lifeverse/shared';
import type { OwnedVehicle, VehicleListing, VehicleCondition as VehicleConditionType } from '@lifeverse/shared';

/** How many neglected years before a vehicle drops a condition tier. */
const NEGLECT_THRESHOLD = 3;
/** Servicing/repairs can restore a car up to this condition, never Brand New. */
const REFURB_CEILING_INDEX = 1; // 'excellent'

function grantHappiness(characterId: string, amount: number): void {
  if (amount === 0) return;
  const stats = StatsModel.findByCharacterId(characterId);
  if (stats) StatsModel.update(characterId, { ...stats, happiness: Math.min(100, Math.max(0, stats.happiness + amount)) });
}

function condIndex(c: VehicleConditionType): number {
  return CONDITION_ORDER.indexOf(c);
}

/** Move condition toward 'better' (negative steps) or 'worse' (positive steps). */
function shiftCondition(c: VehicleConditionType, steps: number, floorIndex = 0): VehicleConditionType {
  const idx = Math.min(CONDITION_ORDER.length - 1, Math.max(floorIndex, condIndex(c) + steps));
  return CONDITION_ORDER[idx]!;
}

/** Field updates when a vehicle's condition changes: value, maintenance, happiness scale with it. */
function conditionChangeFields(v: OwnedVehicle, next: VehicleConditionType): Partial<OwnedVehicle> {
  const oldC = CONDITION_DATA[v.condition];
  const newC = CONDITION_DATA[next];
  return {
    condition: next,
    currentValue: Math.round(v.currentValue * (newC.valueMult / oldC.valueMult)),
    monthlyMaintenance: Math.round(v.monthlyMaintenance * (newC.maintenanceMult / oldC.maintenanceMult)),
    happiness: v.happiness + (newC.happinessDelta - oldC.happinessDelta),
  };
}

export const GarageService = {
  getGarage(characterId: string): OwnedVehicle[] {
    return VehicleModel.findByCharacterId(characterId);
  },

  getDealership(_characterId: string): VehicleListing[] {
    return generateDealership();
  },

  private_listing(modelKey: string, year: number, condition: VehicleConditionType): VehicleListing | null {
    const model = MODEL_BY_KEY.get(modelKey);
    if (!model) return null;
    return buildVehicleListing(model, year, condition);
  },

  buy(
    characterId: string,
    modelKey: string,
    year: number,
    condition: VehicleConditionType,
    opts?: { primary?: boolean },
  ): { message: string } {
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    if (c.age < VEHICLE_MIN_AGE) throw new Error(`You must be ${VEHICLE_MIN_AGE} to buy a vehicle.`);
    const l = this.private_listing(modelKey, year, condition);
    if (!l) throw new Error('Unknown vehicle');

    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance) throw new Error('No finances');
    if (finance.cash < l.price) {
      throw new Error(`Not enough cash. That ${l.modelName} costs $${l.price.toLocaleString()}.`);
    }

    const existing = VehicleModel.findByCharacterId(characterId);
    const makePrimary = opts?.primary ?? existing.length === 0;
    if (makePrimary) VehicleModel.clearPrimary(characterId);

    FinanceModel.update(characterId, { cash: finance.cash - l.price });
    VehicleModel.create({
      characterId, modelKey: l.modelKey, brandId: l.brandId, brandName: l.brandName, brandColor: l.brandColor,
      modelName: l.modelName, bodyType: l.bodyType, year: l.year, condition: l.condition, emoji: l.emoji,
      purchasePrice: l.price, currentValue: l.price, purchaseAge: c.age, depreciationRate: l.appreciationRate,
      monthlyMaintenance: l.monthlyMaintenance, happiness: l.happiness, isPrimary: makePrimary,
    });
    grantHappiness(characterId, l.happiness);
    EventLogModel.create(characterId, 'milestone:vehicle_purchase', c.age, 'milestone',
      `Bought a ${l.year} ${l.brandName} ${l.modelName} for $${l.price.toLocaleString()}.`);
    return { message: `You bought a ${l.year} ${l.brandName} ${l.modelName}! ${l.emoji}` };
  },

  sell(characterId: string, vehicleId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    const v = VehicleModel.findById(vehicleId);
    if (!c || !v || v.characterId !== characterId) throw new Error('You do not own that vehicle.');
    const finance = FinanceModel.findByCharacterId(characterId);
    if (finance) FinanceModel.update(characterId, { cash: finance.cash + v.currentValue });
    VehicleModel.delete(vehicleId);
    // If the daily driver was sold, promote the next remaining car.
    if (v.isPrimary) {
      const remaining = VehicleModel.findByCharacterId(characterId);
      if (remaining[0]) VehicleModel.update(remaining[0].id, { isPrimary: true });
    }
    EventLogModel.create(characterId, 'milestone:vehicle_sale', c.age, 'milestone',
      `Sold the ${v.modelName} for $${v.currentValue.toLocaleString()}.`);
    return { message: `You sold your ${v.brandName} ${v.modelName} for $${v.currentValue.toLocaleString()}.` };
  },

  setPrimary(characterId: string, vehicleId: string): { message: string } {
    const v = VehicleModel.findById(vehicleId);
    if (!v || v.characterId !== characterId) throw new Error('You do not own that vehicle.');
    VehicleModel.clearPrimary(characterId);
    VehicleModel.update(vehicleId, { isPrimary: true });
    return { message: `Your ${v.modelName} is now your daily driver. 🔑` };
  },

  /** Routine service — restores condition one tier (max Excellent), clears neglect. */
  service(characterId: string, vehicleId: string): { message: string } {
    return this.maintain(characterId, vehicleId, {
      steps: 1, costMult: 3, minCost: 150, happiness: 2, verb: 'serviced',
    });
  },

  /** Heavier repair — restores up to two tiers, costs more. */
  repair(characterId: string, vehicleId: string): { message: string } {
    return this.maintain(characterId, vehicleId, {
      steps: 2, costMult: 8, minCost: 400, happiness: 4, verb: 'repaired',
    });
  },

  /** Cosmetic wash — small happiness, tiny cost, no condition change. */
  wash(characterId: string, vehicleId: string): { message: string } {
    const v = VehicleModel.findById(vehicleId);
    if (!v || v.characterId !== characterId) throw new Error('You do not own that vehicle.');
    const cost = 40;
    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance || finance.cash < cost) throw new Error('You cannot afford a wash right now.');
    FinanceModel.update(characterId, { cash: finance.cash - cost });
    grantHappiness(characterId, 1);
    return { message: `You washed your ${v.modelName}. Looking clean! ✨` };
  },

  maintain(
    characterId: string,
    vehicleId: string,
    opts: { steps: number; costMult: number; minCost: number; happiness: number; verb: string },
  ): { message: string } {
    const v = VehicleModel.findById(vehicleId);
    if (!v || v.characterId !== characterId) throw new Error('You do not own that vehicle.');
    const cost = Math.max(opts.minCost, Math.round(v.monthlyMaintenance * opts.costMult));
    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance || finance.cash < cost) {
      throw new Error(`That would cost $${cost.toLocaleString()} — not enough cash.`);
    }
    FinanceModel.update(characterId, { cash: finance.cash - cost });

    const next = shiftCondition(v.condition, -opts.steps, REFURB_CEILING_INDEX);
    const fields: Partial<OwnedVehicle> = { neglectYears: 0 };
    if (next !== v.condition) Object.assign(fields, conditionChangeFields(v, next));
    VehicleModel.update(vehicleId, fields);
    grantHappiness(characterId, opts.happiness);
    const note = next !== v.condition ? ` Condition is now ${CONDITION_DATA[next].label}.` : '';
    return { message: `You ${opts.verb} your ${v.modelName} for $${cost.toLocaleString()}.${note}` };
  },

  /**
   * Annual step: every vehicle depreciates (rare ones appreciate); neglected cars
   * slowly lose condition. Returns a happiness delta (negative if a car degraded).
   */
  annualUpdate(characterId: string): { happinessDelta: number } {
    let happinessDelta = 0;
    for (const v of VehicleModel.findByCharacterId(characterId)) {
      const newValue = Math.max(0, Math.round(v.currentValue * (1 - v.depreciationRate)));
      const fields: Partial<OwnedVehicle> = { currentValue: newValue };

      const neglect = v.neglectYears + 1;
      if (neglect >= NEGLECT_THRESHOLD && condIndex(v.condition) < CONDITION_ORDER.length - 1) {
        const worse = shiftCondition(v.condition, 1);
        Object.assign(fields, conditionChangeFields({ ...v, currentValue: newValue }, worse));
        fields.neglectYears = 0;
        happinessDelta -= 2;
      } else {
        fields.neglectYears = neglect;
      }
      VehicleModel.update(v.id, fields);
    }
    return { happinessDelta };
  },

  /** Total annual maintenance across the garage (for finance). */
  annualMaintenanceCost(characterId: string): number {
    return VehicleModel.findByCharacterId(characterId).reduce((s, v) => s + v.monthlyMaintenance * 12, 0);
  },

  /** Combined value of every owned vehicle (for the balance sheet). */
  garageValue(characterId: string): number {
    return VehicleModel.findByCharacterId(characterId).reduce((s, v) => s + v.currentValue, 0);
  },
};
