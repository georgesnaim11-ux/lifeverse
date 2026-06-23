import { CollectibleCategory, CollectibleCondition } from '../types/collectibles.js';
import type {
  CollectibleItem, CollectibleListing, CollectibleCategory as Category,
  CollectibleCondition as Condition,
} from '../types/collectibles.js';

/** Minimum age to shop for luxury collectibles. */
export const COLLECTIBLE_MIN_AGE = 18;
/** Net worth required before aircraft can be bought. */
export const AIRCRAFT_NET_WORTH_GATE = 1_000_000;
/** "Model year" treated as current; vintage items are older. */
export const CURRENT_COLLECTIBLE_YEAR = 2025;

const C = CollectibleCategory;

/* ─────────────────────────── Catalog ─────────────────────────── */
// appreciation: annual value-change rate. Positive = gains value.
// monthlyMaintenance: boats & aircraft only.

export const COLLECTIBLES: CollectibleItem[] = [
  // ── ⌚ Watches ──
  { key: 'rolex_datejust',   category: C.Watch, brand: 'Rolex',           name: 'Datejust',        msrp: 9000,   appreciation: 0.03 },
  { key: 'rolex_submariner', category: C.Watch, brand: 'Rolex',           name: 'Submariner',      msrp: 14000,  appreciation: 0.06 },
  { key: 'rolex_gmt',        category: C.Watch, brand: 'Rolex',           name: 'GMT-Master II',   msrp: 19000,  appreciation: 0.07 },
  { key: 'rolex_daytona',    category: C.Watch, brand: 'Rolex',           name: 'Daytona',         msrp: 30000,  appreciation: 0.11 },
  { key: 'ap_royaloak',      category: C.Watch, brand: 'Audemars Piguet', name: 'Royal Oak',       msrp: 35000,  appreciation: 0.09 },
  { key: 'ap_offshore',      category: C.Watch, brand: 'Audemars Piguet', name: 'Royal Oak Offshore', msrp: 48000, appreciation: 0.06 },
  { key: 'omega_seamaster',  category: C.Watch, brand: 'Omega',           name: 'Seamaster',       msrp: 5500,   appreciation: -0.02 },
  { key: 'omega_speedmaster',category: C.Watch, brand: 'Omega',           name: 'Speedmaster',     msrp: 7000,   appreciation: 0.01 },
  { key: 'patek_calatrava',  category: C.Watch, brand: 'Patek Philippe',  name: 'Calatrava',       msrp: 35000,  appreciation: 0.06 },
  { key: 'patek_aquanaut',   category: C.Watch, brand: 'Patek Philippe',  name: 'Aquanaut',        msrp: 55000,  appreciation: 0.10 },
  { key: 'patek_nautilus',   category: C.Watch, brand: 'Patek Philippe',  name: 'Nautilus',        msrp: 95000,  appreciation: 0.15 },
  { key: 'rm_011',           category: C.Watch, brand: 'Richard Mille',   name: 'RM 11-03',        msrp: 200000, appreciation: 0.08 },
  { key: 'rm_035',           category: C.Watch, brand: 'Richard Mille',   name: 'RM 035',          msrp: 240000, appreciation: 0.06 },
  { key: 'cartier_tank',     category: C.Watch, brand: 'Cartier',         name: 'Tank',            msrp: 4000,   appreciation: 0.01 },
  { key: 'cartier_santos',   category: C.Watch, brand: 'Cartier',         name: 'Santos',          msrp: 8000,   appreciation: 0.02 },

  // ── 💎 Jewelry ──
  { key: 'gold_14k',         category: C.Jewelry, brand: 'Gold Chains',  name: '14k Gold Chain',     msrp: 3000,  appreciation: 0.01 },
  { key: 'gold_18k',         category: C.Jewelry, brand: 'Gold Chains',  name: '18k Gold Chain',     msrp: 6000,  appreciation: 0.02 },
  { key: 'cuban_link',       category: C.Jewelry, brand: 'Gold Chains',  name: 'Cuban Link Chain',   msrp: 12000, appreciation: 0.02 },
  { key: 'ring_1ct',         category: C.Jewelry, brand: 'Diamond Rings',name: '1ct Diamond Ring',   msrp: 8000,  appreciation: 0.01 },
  { key: 'ring_3ct',         category: C.Jewelry, brand: 'Diamond Rings',name: '3ct Diamond Ring',   msrp: 35000, appreciation: 0.02 },
  { key: 'ring_5ct',         category: C.Jewelry, brand: 'Diamond Rings',name: '5ct Diamond Ring',   msrp: 90000, appreciation: 0.025 },
  { key: 'tennis_bracelet',  category: C.Jewelry, brand: 'Bracelets',    name: 'Tennis Bracelet',    msrp: 15000, appreciation: 0.01 },
  { key: 'diamond_bracelet', category: C.Jewelry, brand: 'Bracelets',    name: 'Diamond Bracelet',   msrp: 40000, appreciation: 0.015 },
  { key: 'diamond_necklace', category: C.Jewelry, brand: 'Necklaces',    name: 'Diamond Necklace',   msrp: 25000, appreciation: 0.01 },
  { key: 'emerald_necklace', category: C.Jewelry, brand: 'Necklaces',    name: 'Emerald Necklace',   msrp: 60000, appreciation: 0.02 },
  { key: 'diamond_studs',    category: C.Jewelry, brand: 'Earrings',     name: 'Diamond Studs',      msrp: 6000,  appreciation: 0.005 },
  { key: 'chandelier_ear',   category: C.Jewelry, brand: 'Earrings',     name: 'Chandelier Earrings',msrp: 22000, appreciation: 0.01 },

  // ── 🎨 Art ──
  { key: 'art_local',        category: C.Art, brand: 'Paintings',     name: 'Local Artist Painting', msrp: 2000,    appreciation: -0.03 },
  { key: 'art_abstract',     category: C.Art, brand: 'Paintings',     name: 'Modern Abstract',       msrp: 15000,   appreciation: 0.02 },
  { key: 'art_bluechip',     category: C.Art, brand: 'Paintings',     name: 'Blue-Chip Painting',    msrp: 120000,  appreciation: 0.06 },
  { key: 'art_masterwork',   category: C.Art, brand: 'Paintings',     name: 'Masterwork',            msrp: 1500000, appreciation: 0.05 },
  { key: 'art_bronze',       category: C.Art, brand: 'Sculptures',    name: 'Bronze Sculpture',      msrp: 8000,    appreciation: 0.01 },
  { key: 'art_marble',       category: C.Art, brand: 'Sculptures',    name: 'Marble Sculpture',      msrp: 40000,   appreciation: 0.03 },
  { key: 'art_installation', category: C.Art, brand: 'Sculptures',    name: 'Contemporary Installation', msrp: 200000, appreciation: 0.04 },
  { key: 'art_print',        category: C.Art, brand: 'Rare Artwork',  name: 'Limited Print',         msrp: 5000,    appreciation: 0.04 },
  { key: 'art_litho',        category: C.Art, brand: 'Rare Artwork',  name: 'Rare Lithograph',       msrp: 25000,   appreciation: 0.05 },
  { key: 'art_original',     category: C.Art, brand: 'Rare Artwork',  name: 'Iconic Original',       msrp: 3000000, appreciation: 0.07 },

  // ── 🛥 Boats ──
  { key: 'boat_fishing',     category: C.Boat, brand: 'Boats', name: 'Fishing Boat',  msrp: 25000,    appreciation: -0.08, monthlyMaintenance: 150 },
  { key: 'boat_speedboat',   category: C.Boat, brand: 'Boats', name: 'Speedboat',     msrp: 80000,    appreciation: -0.09, monthlyMaintenance: 400 },
  { key: 'boat_yacht',       category: C.Boat, brand: 'Boats', name: 'Yacht',         msrp: 600000,   appreciation: -0.07, monthlyMaintenance: 4000 },
  { key: 'boat_luxyacht',    category: C.Boat, brand: 'Boats', name: 'Luxury Yacht',  msrp: 4000000,  appreciation: -0.06, monthlyMaintenance: 25000 },
  { key: 'boat_megayacht',   category: C.Boat, brand: 'Boats', name: 'Mega Yacht',    msrp: 50000000, appreciation: -0.05, monthlyMaintenance: 250000 },

  // ── ✈ Aircraft ──
  { key: 'air_small',        category: C.Aircraft, brand: 'Aircraft', name: 'Small Plane',  msrp: 150000,   appreciation: -0.06, monthlyMaintenance: 2000 },
  { key: 'air_heli',         category: C.Aircraft, brand: 'Aircraft', name: 'Helicopter',   msrp: 1200000,  appreciation: -0.06, monthlyMaintenance: 12000 },
  { key: 'air_jet',          category: C.Aircraft, brand: 'Aircraft', name: 'Private Jet',  msrp: 8000000,  appreciation: -0.05, monthlyMaintenance: 60000 },
  { key: 'air_luxjet',       category: C.Aircraft, brand: 'Aircraft', name: 'Luxury Jet',   msrp: 45000000, appreciation: -0.05, monthlyMaintenance: 300000 },
];

export const COLLECTIBLE_BY_KEY = new Map<string, CollectibleItem>(COLLECTIBLES.map((c) => [c.key, c]));

export const CATALOG_BY_CATEGORY: Record<Category, CollectibleItem[]> = {
  [C.Watch]: [], [C.Jewelry]: [], [C.Art]: [], [C.Boat]: [], [C.Aircraft]: [],
};
for (const item of COLLECTIBLES) CATALOG_BY_CATEGORY[item.category].push(item);

/* ─────────────────────── Presentation ─────────────────────── */

export const COLLECTIBLE_CATEGORY_ORDER: Category[] = [
  C.Watch, C.Jewelry, C.Art, C.Boat, C.Aircraft,
];
export const COLLECTIBLE_CATEGORY_LABELS: Record<Category, string> = {
  [C.Watch]: 'Watches', [C.Jewelry]: 'Jewelry', [C.Art]: 'Art & Paintings',
  [C.Boat]: 'Boats', [C.Aircraft]: 'Aircraft',
};
export const COLLECTIBLE_CATEGORY_EMOJI: Record<Category, string> = {
  [C.Watch]: '⌚', [C.Jewelry]: '💎', [C.Art]: '🎨', [C.Boat]: '🛥️', [C.Aircraft]: '✈️',
};

export const COLLECTIBLE_CONDITION_LABELS: Record<Condition, string> = {
  [CollectibleCondition.Mint]: 'Mint',
  [CollectibleCondition.Excellent]: 'Excellent',
  [CollectibleCondition.Good]: 'Good',
  [CollectibleCondition.Fair]: 'Fair',
};
const CONDITION_MULT: Record<Condition, number> = {
  [CollectibleCondition.Mint]: 1.0,
  [CollectibleCondition.Excellent]: 0.9,
  [CollectibleCondition.Good]: 0.78,
  [CollectibleCondition.Fair]: 0.6,
};

/** Build a priced listing for a catalogue item at a given year + condition. Deterministic. */
export function buildCollectibleListing(
  item: CollectibleItem,
  year: number,
  condition: Condition,
): CollectibleListing {
  const age = Math.max(0, CURRENT_COLLECTIBLE_YEAR - year);
  let aged = item.msrp * Math.pow(1 + item.appreciation, age);
  if (item.appreciation < 0) aged = Math.max(aged, item.msrp * 0.1); // salvage floor
  const price = Math.round(aged * CONDITION_MULT[condition]);
  return {
    key: `${item.key}__${year}__${condition}`,
    itemKey: item.key,
    category: item.category,
    brand: item.brand,
    name: item.name,
    label: item.name,
    emoji: item.emoji ?? COLLECTIBLE_CATEGORY_EMOJI[item.category],
    year,
    condition,
    price,
    monthlyMaintenance: item.monthlyMaintenance ?? 0,
    appreciationRate: item.appreciation,
  };
}

/** A brand-new (current-year, mint) listing — what the shop displays for sale. */
export function newCollectibleListing(item: CollectibleItem): CollectibleListing {
  return buildCollectibleListing(item, CURRENT_COLLECTIBLE_YEAR, CollectibleCondition.Mint);
}
