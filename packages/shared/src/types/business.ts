/** The 26 industries a company can be founded in. */
export const Industry = {
  CoffeeShop: 'coffee_shop',
  Cafe: 'cafe',
  Restaurant: 'restaurant',
  Bakery: 'bakery',
  FastFood: 'fast_food',
  FoodTruck: 'food_truck',
  ClothingBrand: 'clothing_brand',
  LuxuryFashion: 'luxury_fashion',
  ShoeCompany: 'shoe_company',
  JewelryBrand: 'jewelry_brand',
  TechStartup: 'tech_startup',
  SoftwareCompany: 'software_company',
  AICompany: 'ai_company',
  GameStudio: 'game_studio',
  MobileApps: 'mobile_apps',
  CarDealership: 'car_dealership',
  CarManufacturer: 'car_manufacturer',
  EVManufacturer: 'ev_manufacturer',
  MotorcycleCompany: 'motorcycle_company',
  BicycleCompany: 'bicycle_company',
  FurnitureCompany: 'furniture_company',
  Construction: 'construction',
  ArchitectureFirm: 'architecture_firm',
  RealEstateAgency: 'real_estate_agency',
  PropertyDeveloper: 'property_developer',
  HotelChain: 'hotel_chain',
} as const;
export type Industry = (typeof Industry)[keyof typeof Industry];

/** Industry grouping for the picker UI. */
export const IndustryCategory = {
  Food: 'food',
  Fashion: 'fashion',
  Technology: 'technology',
  Automotive: 'automotive',
  Property: 'property',
  Hospitality: 'hospitality',
} as const;
export type IndustryCategory = (typeof IndustryCategory)[keyof typeof IndustryCategory];

/** An industry definition — the stat card shown before founding. All 0-100 except $. */
export interface IndustryDef {
  id: Industry;
  label: string;
  emoji: string;
  category: IndustryCategory;
  /** Minimum cash needed to register the company. */
  startupCost: number;
  marketDemand: number;
  competition: number;
  profitMargin: number;
  growthPotential: number;
  riskLevel: number;
  difficulty: number;
  customerDemand: number;
  /** How staff-hungry the business is (0-100 → payroll scale). */
  employeeRequirement: number;
  /** Typical years until first profit. */
  yearsToProfit: number;
  pros: string[];
  cons: string[];
}

/** A product the industry can develop. */
export interface ProductDef {
  key: string;
  industryIds: Industry[];
  name: string;
  emoji: string;
  devCost: number;
  unitCost: number;
  basePrice: number;
  /** 1 basic → 3 premium; premium sells fewer units at better margin. */
  tier: number;
}

/** Price positioning for an owned product. */
export const PriceTier = {
  Budget: 'budget',
  Standard: 'standard',
  Premium: 'premium',
} as const;
export type PriceTier = (typeof PriceTier)[keyof typeof PriceTier];

/** A product the company sells. */
export interface OwnedProduct {
  key: string;
  quality: number;         // 0-100
  priceTier: PriceTier;
  satisfaction: number;    // 0-100
  popularity: number;      // 0-100
  unitsSold: number;       // last year
  revenue: number;         // last year
  profit: number;          // last year
}

/** Staff roles (aggregate model: count + skill + morale per role). */
export const StaffRole = {
  Manager: 'manager',
  Engineer: 'engineer',
  Designer: 'designer',
  Sales: 'sales',
  Marketing: 'marketing',
  HR: 'hr',
  Finance: 'finance',
  Support: 'support',
  FactoryWorker: 'factory_worker',
  Executive: 'executive',
  Intern: 'intern',
} as const;
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export interface StaffBlock {
  count: number;
  skill: number;    // 0-100
  morale: number;   // 0-100
}

export interface SupplierTierDef {
  tier: number;               // 1-3
  label: string;
  costMultiplier: number;     // on unit costs
  qualityBonus: number;       // added to product quality effect
  reliability: number;        // 0-1, mitigates supply events
}

export interface ConsultantDef {
  id: string;
  label: string;
  emoji: string;
  annualFee: number;
  description: string;
}

export interface ExpansionDef {
  id: string;
  label: string;
  emoji: string;
  cost: number;
  /** Reputation required. */
  minReputation: number;
  /** Branches required before this unlocks. */
  minBranches: number;
  repeatable: boolean;
  description: string;
}

export interface BusinessEventDef {
  id: string;
  label: string;
  emoji: string;
  weight: number;
  good: boolean;
}

/** One simulated year in the company's books. */
export interface BusinessYear {
  age: number;
  revenue: number;
  expenses: number;
  profit: number;
  customers: number;
  valuation: number;
  event: string | null;
}

/** The full company state sent to the client. */
export interface BusinessState {
  characterId: string;
  industry: Industry;
  name: string;
  logo: string;
  brandColor: string;
  hqCountry: string;
  foundedAge: number;
  cash: number;
  reputation: number;
  customers: number;
  marketShare: number;
  branches: number;
  supplierTier: number;
  marketingLevel: number;
  rndLevel: number;
  products: OwnedProduct[];
  staff: Partial<Record<StaffRole, StaffBlock>>;
  consultants: string[];
  upgrades: string[];
  history: BusinessYear[];
  lastEvent: string | null;
  lossYears: number;
  isOpen: boolean;
  /** Computed on read: assets + profit multiple. */
  valuation: number;
}
