/** Luxury asset categories sold in the Shopping marketplace. */
export const CollectibleCategory = {
  Watch: 'watch',
  Jewelry: 'jewelry',
  Art: 'art',
  Boat: 'boat',
  Aircraft: 'aircraft',
} as const;
export type CollectibleCategory = (typeof CollectibleCategory)[keyof typeof CollectibleCategory];

/** Condition of a collectible, best → worst. Affects value. */
export const CollectibleCondition = {
  Mint: 'mint',
  Excellent: 'excellent',
  Good: 'good',
  Fair: 'fair',
} as const;
export type CollectibleCondition = (typeof CollectibleCondition)[keyof typeof CollectibleCondition];

/** A catalogue entry. `appreciation` is the annual value-change rate
 * (positive = gains value, negative = loses value). */
export interface CollectibleItem {
  key: string;
  category: CollectibleCategory;
  /** Brand (watches/jewelry) or type/collection grouping (art/boats/aircraft). */
  brand: string;
  name: string;
  msrp: number;
  appreciation: number;
  /** Monthly upkeep — boats & aircraft only; 0 otherwise. */
  monthlyMaintenance?: number;
  emoji?: string;
}

/** A concrete, priced item the player can buy (item at a year + condition). */
export interface CollectibleListing {
  /** Stable composite id: `${itemKey}__${year}__${condition}`. */
  key: string;
  itemKey: string;
  category: CollectibleCategory;
  brand: string;
  name: string;
  label: string;
  emoji: string;
  year: number;
  condition: CollectibleCondition;
  price: number;
  monthlyMaintenance: number;
  appreciationRate: number;
}

/** A collectible the character OWNS. */
export interface OwnedCollectible {
  id: string;
  characterId: string;
  category: CollectibleCategory;
  itemKey: string;
  label: string;
  brand: string | null;
  emoji: string;
  year: number;
  condition: CollectibleCondition;
  purchasePrice: number;
  currentValue: number;
  purchaseAge: number | null;
  /** Annual value-change rate; positive = appreciates. */
  appreciationRate: number;
  monthlyMaintenance: number;
}
