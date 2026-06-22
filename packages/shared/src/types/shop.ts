import type { PropertyType, VehicleType } from './enums.js';

/** @deprecated Properties are now handled by the housing system; kept for the shop's legacy data. */
export interface ShopPropertyDefinition {
  type: PropertyType;
  label: string;
  description: string;
  price: number;
  /** One-time happiness boost on purchase. */
  happiness: number;
  /** Recurring annual upkeep cost. */
  annualExpense: number;
  /** Counts toward net worth at this value. */
  netWorthValue: number;
}

export interface VehicleDefinition {
  type: VehicleType;
  label: string;
  description: string;
  price: number;
  happiness: number;
  annualExpense: number;
  netWorthValue: number;
}

/** A purchased asset record returned to the client. */
export interface OwnedAsset {
  id: string;
  characterId: string;
  assetType: string;
  label: string;
  value: number;
  purchaseAge: number | null;
  isActive: boolean;
}
