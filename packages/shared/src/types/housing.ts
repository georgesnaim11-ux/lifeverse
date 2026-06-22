/** Property quality tiers, low → high. */
export const PropertyTier = {
  Entry: 'entry',
  Mid: 'mid',
  Family: 'family',
  Luxury: 'luxury',
  Ultra: 'ultra',
} as const;
export type PropertyTier = (typeof PropertyTier)[keyof typeof PropertyTier];

/** Where the character currently lives. */
export const HousingTenure = {
  Homeless: 'homeless',
  Parents: 'parents',
  Renting: 'renting',
  Owned: 'owned',
} as const;
export type HousingTenure = (typeof HousingTenure)[keyof typeof HousingTenure];

/** A property template in the catalogue (country-independent base stats). */
export interface PropertyDefinition {
  key: string;
  label: string;
  tier: PropertyTier;
  /** Baseline buy price before country cost-of-living + condition adjustments. */
  basePrice: number;
  /** Annual value appreciation rate (e.g. 0.04 = +4%/yr). */
  appreciation: number;
  bedrooms: number;
  bathrooms: number;
  /** Happiness granted while living here. */
  happiness: number;
  /** Whether this can be rented / bought. */
  rentable: boolean;
  buyable: boolean;
}

export interface RealEstateCompany {
  id: string;
  name: string;
}

/** A concrete, priced market listing the player can rent or buy. */
export interface Listing {
  key: string;
  label: string;
  tier: PropertyTier;
  company: string;
  bedrooms: number;
  bathrooms: number;
  condition: string;
  /** Buy price (country + condition adjusted). */
  price: number;
  /** Monthly rent. */
  monthlyRent: number;
  /** Monthly upkeep if owned (taxes/maintenance). */
  monthlyUpkeep: number;
  appreciation: number;
  happiness: number;
  rentable: boolean;
  buyable: boolean;
}

/** The character's current housing situation (where they live). */
export interface HousingState {
  characterId: string;
  tenure: HousingTenure;
  propertyKey: string | null;
  propertyLabel: string | null;
  tier: PropertyTier | null;
  company: string | null;
  bedrooms: number;
  bathrooms: number;
  condition: string | null;
  /** Monthly cost (rent if renting, upkeep if owned residence). */
  monthlyExpense: number;
  /** Current market value (owned only; appreciates yearly). */
  currentValue: number;
  purchasePrice: number;
  purchaseAge: number | null;
  appreciationRate: number;
  /** The owned property the character lives in (null unless tenure = 'owned'). */
  residencePropertyId: string | null;
}

/**
 * A property the character OWNS. The residence is the owned property with
 * `isResidence = true`; the rest are investments (optionally `isRentedOut`).
 */
export interface OwnedProperty {
  id: string;
  characterId: string;
  key: string;
  label: string;
  tier: PropertyTier;
  company: string | null;
  bedrooms: number;
  bathrooms: number;
  condition: string | null;
  purchasePrice: number;
  /** Current market value; appreciates yearly. */
  currentValue: number;
  purchaseAge: number | null;
  appreciationRate: number;
  /** Monthly upkeep (taxes/maintenance) paid while owned. */
  monthlyUpkeep: number;
  /** Monthly rent collected while rented out. */
  monthlyRent: number;
  /** Happiness granted while this is the residence. */
  happiness: number;
  /** True for the one property the character lives in. */
  isResidence: boolean;
  /** True when held as an investment generating rental income. */
  isRentedOut: boolean;
}
