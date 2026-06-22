import { PropertyType, VehicleType } from '../types/enums.js';
import type { ShopPropertyDefinition, VehicleDefinition } from '../types/shop.js';

/** Minimum age to access the shop. */
export const SHOP_MIN_AGE = 18;

export const PROPERTIES: ShopPropertyDefinition[] = [
  {
    type: PropertyType.Apartment, label: 'Apartment',
    description: 'A modest place to call your own.',
    price: 85000, happiness: 8, annualExpense: 6000, netWorthValue: 85000,
  },
  {
    type: PropertyType.SmallHouse, label: 'Small House',
    description: 'A cozy starter home with a little yard.',
    price: 180000, happiness: 14, annualExpense: 9000, netWorthValue: 180000,
  },
  {
    type: PropertyType.FamilyHouse, label: 'Family House',
    description: 'Room to grow, in a good neighbourhood.',
    price: 350000, happiness: 22, annualExpense: 14000, netWorthValue: 350000,
  },
  {
    type: PropertyType.LuxuryHouse, label: 'Luxury House',
    description: 'High-end finishes, pool, and a view.',
    price: 750000, happiness: 32, annualExpense: 28000, netWorthValue: 750000,
  },
  {
    type: PropertyType.Mansion, label: 'Mansion',
    description: 'An estate that announces you have arrived.',
    price: 2000000, happiness: 45, annualExpense: 70000, netWorthValue: 2000000,
  },
];

export const VEHICLES: VehicleDefinition[] = [
  {
    type: VehicleType.UsedCar, label: 'Used Car',
    description: 'It runs. Mostly.',
    price: 8000, happiness: 5, annualExpense: 1500, netWorthValue: 6000,
  },
  {
    type: VehicleType.Sedan, label: 'Sedan',
    description: 'Reliable, comfortable, sensible.',
    price: 25000, happiness: 10, annualExpense: 2500, netWorthValue: 20000,
  },
  {
    type: VehicleType.SUV, label: 'SUV',
    description: 'Space and presence for the whole family.',
    price: 40000, happiness: 14, annualExpense: 3500, netWorthValue: 32000,
  },
  {
    type: VehicleType.SportsCar, label: 'Sports Car',
    description: 'Fast, loud, and impossible to ignore.',
    price: 90000, happiness: 24, annualExpense: 7000, netWorthValue: 70000,
  },
  {
    type: VehicleType.LuxuryCar, label: 'Luxury Car',
    description: 'Refined power and unmistakable status.',
    price: 150000, happiness: 30, annualExpense: 10000, netWorthValue: 120000,
  },
];

export const PROPERTY_REGISTRY = new Map<PropertyType, ShopPropertyDefinition>(PROPERTIES.map((p) => [p.type, p]));
export const VEHICLE_REGISTRY = new Map<VehicleType, VehicleDefinition>(VEHICLES.map((v) => [v.type, v]));
