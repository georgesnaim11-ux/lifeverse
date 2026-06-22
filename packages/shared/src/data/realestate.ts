import { PropertyTier } from '../types/housing.js';
import type { PropertyDefinition, Listing, RealEstateCompany } from '../types/housing.js';
import { getCountry, DEFAULT_COUNTRY_ID } from './countries.js';

/** Minimum age to rent or buy property. Under this, the player lives with parents. */
export const HOUSING_MIN_AGE = 18;

/**
 * Country-independent property catalogue. Prices are baselines; the market
 * multiplies them by the country's cost-of-living and a condition factor.
 */
export const PROPERTY_CATALOG: PropertyDefinition[] = [
  // ── Entry level ──
  { key: 'shared_room',     label: 'Shared Room',        tier: PropertyTier.Entry,  basePrice: 28000,  appreciation: 0.010, bedrooms: 0, bathrooms: 0, happiness: 3,  rentable: true,  buyable: false },
  { key: 'studio',          label: 'Studio Apartment',   tier: PropertyTier.Entry,  basePrice: 90000,  appreciation: 0.020, bedrooms: 1, bathrooms: 1, happiness: 6,  rentable: true,  buyable: true },
  { key: 'loft',            label: 'Loft Apartment',     tier: PropertyTier.Entry,  basePrice: 130000, appreciation: 0.025, bedrooms: 1, bathrooms: 1, happiness: 9,  rentable: true,  buyable: true },
  // ── Mid tier ──
  { key: 'one_bed',         label: 'One Bedroom Apartment', tier: PropertyTier.Mid, basePrice: 165000, appreciation: 0.030, bedrooms: 1, bathrooms: 1, happiness: 11, rentable: true,  buyable: true },
  { key: 'two_bed',         label: 'Two Bedroom Apartment', tier: PropertyTier.Mid, basePrice: 235000, appreciation: 0.030, bedrooms: 2, bathrooms: 1, happiness: 14, rentable: true,  buyable: true },
  { key: 'townhouse',       label: 'Townhouse',          tier: PropertyTier.Mid,    basePrice: 320000, appreciation: 0.035, bedrooms: 3, bathrooms: 2, happiness: 17, rentable: true,  buyable: true },
  { key: 'duplex',          label: 'Duplex',             tier: PropertyTier.Mid,    basePrice: 385000, appreciation: 0.035, bedrooms: 4, bathrooms: 2, happiness: 18, rentable: true,  buyable: true },
  // ── Family housing ──
  { key: 'small_house',     label: 'Small House',        tier: PropertyTier.Family, basePrice: 260000, appreciation: 0.035, bedrooms: 2, bathrooms: 1, happiness: 16, rentable: true,  buyable: true },
  { key: 'family_house',    label: 'Family House',       tier: PropertyTier.Family, basePrice: 430000, appreciation: 0.040, bedrooms: 3, bathrooms: 2, happiness: 22, rentable: false, buyable: true },
  { key: 'large_family',    label: 'Large Family House', tier: PropertyTier.Family, basePrice: 610000, appreciation: 0.040, bedrooms: 4, bathrooms: 3, happiness: 26, rentable: false, buyable: true },
  // ── Luxury ──
  { key: 'luxury_apt',      label: 'Luxury Apartment',   tier: PropertyTier.Luxury, basePrice: 720000,  appreciation: 0.050, bedrooms: 2, bathrooms: 2, happiness: 28, rentable: true,  buyable: true },
  { key: 'penthouse',       label: 'Penthouse',          tier: PropertyTier.Luxury, basePrice: 1250000, appreciation: 0.055, bedrooms: 3, bathrooms: 3, happiness: 34, rentable: false, buyable: true },
  { key: 'villa',           label: 'Villa',              tier: PropertyTier.Luxury, basePrice: 1850000, appreciation: 0.050, bedrooms: 5, bathrooms: 4, happiness: 38, rentable: false, buyable: true },
  { key: 'waterfront',      label: 'Waterfront Home',    tier: PropertyTier.Luxury, basePrice: 2600000, appreciation: 0.060, bedrooms: 4, bathrooms: 4, happiness: 42, rentable: false, buyable: true },
  // ── Ultra luxury ──
  { key: 'estate',          label: 'Estate',             tier: PropertyTier.Ultra,  basePrice: 4200000,  appreciation: 0.060, bedrooms: 6,  bathrooms: 5, happiness: 48, rentable: false, buyable: true },
  { key: 'mansion',         label: 'Mansion',            tier: PropertyTier.Ultra,  basePrice: 7000000,  appreciation: 0.065, bedrooms: 8,  bathrooms: 7, happiness: 55, rentable: false, buyable: true },
  { key: 'luxury_mansion',  label: 'Luxury Mansion',     tier: PropertyTier.Ultra,  basePrice: 12000000, appreciation: 0.070, bedrooms: 10, bathrooms: 9, happiness: 62, rentable: false, buyable: true },
];

export const PROPERTY_BY_KEY: Map<string, PropertyDefinition> = new Map(PROPERTY_CATALOG.map((p) => [p.key, p]));

/** At least two real estate companies per supported country. */
export const COMPANIES_BY_COUNTRY: Record<string, RealEstateCompany[]> = {
  egypt:    [{ id: 'nile', name: 'Nile Properties' }, { id: 'cairo', name: 'Cairo Homes' }],
  usa:      [{ id: 'liberty', name: 'Liberty Realty' }, { id: 'amhomes', name: 'American Homes' }],
  uk:       [{ id: 'crown', name: 'Crown Estates' }, { id: 'london', name: 'London Living' }],
  canada:   [{ id: 'maple', name: 'Maple Realty' }, { id: 'truenorth', name: 'True North Homes' }],
  germany:  [{ id: 'rhein', name: 'Rhein Estates' }, { id: 'berlin', name: 'Berlin Property Group' }],
  france:   [{ id: 'belle', name: 'Belle Maison' }, { id: 'paris', name: 'Paris Habitat' }],
  italy:    [{ id: 'roma', name: 'Roma Immobiliare' }, { id: 'bella', name: 'Bella Casa' }],
  spain:    [{ id: 'sol', name: 'Sol Inmobiliaria' }, { id: 'iberia', name: 'Iberia Homes' }],
  turkey:   [{ id: 'bosphorus', name: 'Bosphorus Estates' }, { id: 'anadolu', name: 'Anadolu Konut' }],
  saudi:    [{ id: 'kingdom', name: 'Kingdom Properties' }, { id: 'oasis', name: 'Oasis Homes' }],
  uae:      [{ id: 'emaar', name: 'Emirates Estates' }, { id: 'palm', name: 'Palm Properties' }],
  india:    [{ id: 'taj', name: 'Taj Realty' }, { id: 'lotus', name: 'Lotus Homes' }],
  china:    [{ id: 'dragon', name: 'Dragon Properties' }, { id: 'great', name: 'Great Wall Realty' }],
  japan:    [{ id: 'sakura', name: 'Sakura Realty' }, { id: 'tokyo', name: 'Tokyo Property Group' }],
  korea:    [{ id: 'hanil', name: 'Hanil Realty' }, { id: 'seoul', name: 'Seoul Living' }],
  brazil:   [{ id: 'tropic', name: 'Tropical Imóveis' }, { id: 'rio', name: 'Rio Homes' }],
  mexico:   [{ id: 'azteca', name: 'Azteca Propiedades' }, { id: 'sol_mx', name: 'Casa Sol' }],
  australia:[{ id: 'outback', name: 'Outback Realty' }, { id: 'harbour', name: 'Harbour Homes' }],
};

const DEFAULT_COMPANIES: RealEstateCompany[] = [
  { id: 'national', name: 'National Realty' }, { id: 'hometown', name: 'Hometown Properties' },
];

export function companiesForCountry(countryId: string): RealEstateCompany[] {
  return COMPANIES_BY_COUNTRY[countryId] ?? DEFAULT_COMPANIES;
}

const CONDITIONS: Array<{ label: string; priceMult: number; happinessDelta: number }> = [
  { label: 'Excellent', priceMult: 1.12, happinessDelta: 3 },
  { label: 'Good',      priceMult: 1.0,  happinessDelta: 0 },
  { label: 'Fair',      priceMult: 0.88, happinessDelta: -2 },
  { label: 'Needs Work', priceMult: 0.75, happinessDelta: -5 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Build a single listing for a catalogue property in a given country. */
export function buildListing(def: PropertyDefinition, countryId: string): Listing {
  const country = getCountry(countryId) ?? getCountry(DEFAULT_COUNTRY_ID)!;
  const cond = pick(CONDITIONS);
  const companies = companiesForCountry(countryId);
  const price = Math.round(def.basePrice * country.costOfLiving * cond.priceMult);
  return {
    key: def.key,
    label: def.label,
    tier: def.tier,
    company: pick(companies).name,
    bedrooms: def.bedrooms,
    bathrooms: def.bathrooms,
    condition: cond.label,
    price,
    monthlyRent: Math.round((price * 0.005)),
    monthlyUpkeep: Math.round((price * 0.0015)),
    appreciation: def.appreciation,
    happiness: Math.max(0, def.happiness + cond.happinessDelta),
    rentable: def.rentable,
    buyable: def.buyable,
  };
}

/** Generate a full market of listings for a country (one per catalogue entry). */
export function generateMarket(countryId: string): Listing[] {
  return PROPERTY_CATALOG.map((def) => buildListing(def, countryId));
}

/**
 * Average occupancy for a rented-out investment property. Annual rent is
 * discounted by vacancy to reflect gaps between tenants.
 */
export const VACANCY_FACTOR = 0.92;

/**
 * Annual rental income for a rented-out property: a year of rent scaled by
 * occupancy. Upkeep is NOT subtracted here — it is charged once for every owned
 * property (residence + investments) on the expense side, so it isn't double
 * counted for rentals.
 */
export function annualRentIncome(monthlyRent: number): number {
  return Math.round(monthlyRent * 12 * VACANCY_FACTOR);
}

export const TIER_LABELS: Record<PropertyTier, string> = {
  [PropertyTier.Entry]: 'Entry Level',
  [PropertyTier.Mid]: 'Mid Tier',
  [PropertyTier.Family]: 'Family Housing',
  [PropertyTier.Luxury]: 'Luxury',
  [PropertyTier.Ultra]: 'Ultra Luxury',
};
