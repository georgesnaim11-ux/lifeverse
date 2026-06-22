/** Vehicle quality/price tiers, low → high. */
export const VehicleClass = {
  Economy: 'economy',
  Mid: 'mid',
  Luxury: 'luxury',
  Sports: 'sports',
  Ultra: 'ultra',
} as const;
export type VehicleClass = (typeof VehicleClass)[keyof typeof VehicleClass];

/** Body styles, used for the on-screen emoji and a little flavour. */
export const BodyType = {
  Sedan: 'sedan',
  Hatchback: 'hatchback',
  SUV: 'suv',
  Truck: 'truck',
  Coupe: 'coupe',
  Sports: 'sports',
  Hybrid: 'hybrid',
} as const;
export type BodyType = (typeof BodyType)[keyof typeof BodyType];

/** Vehicle condition, best → worst. Affects value, maintenance, and happiness. */
export const VehicleCondition = {
  BrandNew: 'brand_new',
  Excellent: 'excellent',
  Good: 'good',
  Fair: 'fair',
  Poor: 'poor',
  Damaged: 'damaged',
} as const;
export type VehicleCondition = (typeof VehicleCondition)[keyof typeof VehicleCondition];

/** A car brand (country-independent catalogue entry). */
export interface VehicleBrand {
  id: string;
  name: string;
  class: VehicleClass;
  /** Badge colour (hex) for the UI. */
  color: string;
  /** 0..1 — higher is cheaper to maintain. */
  reliability: number;
}

/** A model in the catalogue. `depreciation` overrides the class default when set
 * (negative values mean the car APPRECIATES — rare collectibles). */
export interface VehicleModel {
  key: string;
  brandId: string;
  name: string;
  bodyType: BodyType;
  /** Base price of a brand-new current-year example. */
  msrp: number;
  depreciation?: number;
}

/** A concrete, priced car the player can buy (a model at a given year/condition). */
export interface VehicleListing {
  /** Stable composite id: `${modelKey}__${year}__${condition}`. */
  key: string;
  modelKey: string;
  brandId: string;
  brandName: string;
  brandColor: string;
  modelName: string;
  class: VehicleClass;
  bodyType: BodyType;
  emoji: string;
  year: number;
  condition: VehicleCondition;
  price: number;
  monthlyMaintenance: number;
  happiness: number;
  appreciationRate: number;
}

/** A car the character OWNS, sitting in the garage. */
export interface OwnedVehicle {
  id: string;
  characterId: string;
  modelKey: string;
  brandId: string;
  brandName: string;
  brandColor: string;
  modelName: string;
  class: VehicleClass;
  bodyType: BodyType;
  emoji: string;
  year: number;
  condition: VehicleCondition;
  purchasePrice: number;
  currentValue: number;
  purchaseAge: number | null;
  /** Annual value change rate; negative = appreciates. */
  depreciationRate: number;
  monthlyMaintenance: number;
  happiness: number;
  /** The daily driver — there is at most one. */
  isPrimary: boolean;
  /** Years since last serviced; condition drops once this passes a threshold. */
  neglectYears: number;
}
