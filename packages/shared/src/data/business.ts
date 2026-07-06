import {
  Industry, IndustryCategory, StaffRole,
} from '../types/business.js';
import type {
  IndustryDef, ProductDef, SupplierTierDef, ConsultantDef, ExpansionDef,
  BusinessEventDef, TeamBuildingDef, ExpansionQuote, StaffRole as Role,
} from '../types/business.js';

/** Minimum age to register a company. */
export const BUSINESS_MIN_AGE = 18;
/** Selling out returns valuation × this. */
export const BUSINESS_SALE_MULTIPLIER = 0.9;
/** Consecutive loss-making years (with negative cash) before forced bankruptcy. */
export const BANKRUPTCY_YEARS = 2;
/** Cap on stored yearly history. */
export const BUSINESS_HISTORY_CAP = 30;
/** Average base salary per staff role, per year. */
export const ROLE_SALARIES: Record<Role, number> = {
  [StaffRole.Manager]: 65000, [StaffRole.Engineer]: 90000, [StaffRole.Designer]: 70000,
  [StaffRole.Sales]: 50000, [StaffRole.Marketing]: 60000, [StaffRole.HR]: 55000,
  [StaffRole.Finance]: 75000, [StaffRole.Support]: 40000, [StaffRole.FactoryWorker]: 45000,
  [StaffRole.Executive]: 180000, [StaffRole.Intern]: 20000,
};
export const STAFF_ROLE_LABELS: Record<Role, string> = {
  [StaffRole.Manager]: 'Managers', [StaffRole.Engineer]: 'Engineers', [StaffRole.Designer]: 'Designers',
  [StaffRole.Sales]: 'Sales Staff', [StaffRole.Marketing]: 'Marketing', [StaffRole.HR]: 'HR',
  [StaffRole.Finance]: 'Finance', [StaffRole.Support]: 'Customer Support', [StaffRole.FactoryWorker]: 'Factory Workers',
  [StaffRole.Executive]: 'Executives', [StaffRole.Intern]: 'Interns',
};
/** Fee to search out a higher-capacity supplier (unlock the next tier). */
export const SUPPLIER_SEARCH_FEE = 15000;
/** Small businesses pay small-business wages; giants pay corporate rates. */
export function salaryScale(employeeRequirement: number): number {
  return 0.3 + employeeRequirement / 200;
}

/* ───────────────────────── Industries ───────────────────────── */

const C = IndustryCategory;
export const INDUSTRIES: IndustryDef[] = [
  // ── Food & Beverage ──
  { id: Industry.CoffeeShop, label: 'Coffee Shop', emoji: '☕', category: C.Food, startupCost: 25000,
    marketDemand: 80, competition: 85, profitMargin: 45, growthPotential: 45, riskLevel: 30, difficulty: 25,
    customerDemand: 85, employeeRequirement: 15, yearsToProfit: 1,
    pros: ['Low startup cost', 'Fast customer growth', 'Easy to manage'], cons: ['High competition', 'Modest ceilings'] },
  { id: Industry.Cafe, label: 'Café', emoji: '🥐', category: C.Food, startupCost: 40000,
    marketDemand: 75, competition: 80, profitMargin: 48, growthPotential: 50, riskLevel: 32, difficulty: 30,
    customerDemand: 80, employeeRequirement: 20, yearsToProfit: 1,
    pros: ['Loyal regulars', 'Food + drink revenue'], cons: ['High competition', 'Long hours'] },
  { id: Industry.Restaurant, label: 'Restaurant', emoji: '🍽️', category: C.Food, startupCost: 120000,
    marketDemand: 78, competition: 82, profitMargin: 35, growthPotential: 55, riskLevel: 55, difficulty: 60,
    customerDemand: 82, employeeRequirement: 40, yearsToProfit: 2,
    pros: ['Strong demand', 'Reputation compounds'], cons: ['Thin margins', 'Hard to run well'] },
  { id: Industry.Bakery, label: 'Bakery', emoji: '🥖', category: C.Food, startupCost: 45000,
    marketDemand: 70, competition: 65, profitMargin: 50, growthPotential: 45, riskLevel: 30, difficulty: 35,
    customerDemand: 72, employeeRequirement: 18, yearsToProfit: 1,
    pros: ['Great margins on baked goods', 'Morning rush loyalty'], cons: ['4am starts', 'Perishable stock'] },
  { id: Industry.FastFood, label: 'Fast Food Chain', emoji: '🍔', category: C.Food, startupCost: 500000,
    marketDemand: 88, competition: 90, profitMargin: 40, growthPotential: 80, riskLevel: 50, difficulty: 60,
    customerDemand: 90, employeeRequirement: 65, yearsToProfit: 3,
    pros: ['Huge demand', 'Franchise potential'], cons: ['Brutal competition', 'Staff churn'] },
  { id: Industry.FoodTruck, label: 'Food Truck', emoji: '🚚', category: C.Food, startupCost: 15000,
    marketDemand: 65, competition: 60, profitMargin: 52, growthPotential: 35, riskLevel: 25, difficulty: 20,
    customerDemand: 68, employeeRequirement: 8, yearsToProfit: 1,
    pros: ['Cheapest way in', 'Go where the crowd is'], cons: ['Weather-dependent', 'Small ceiling'] },
  // ── Fashion ──
  { id: Industry.ClothingBrand, label: 'Clothing Brand', emoji: '👕', category: C.Fashion, startupCost: 60000,
    marketDemand: 75, competition: 85, profitMargin: 55, growthPotential: 70, riskLevel: 55, difficulty: 50,
    customerDemand: 78, employeeRequirement: 25, yearsToProfit: 2,
    pros: ['Strong margins', 'Brand can explode'], cons: ['Trend-driven', 'Crowded market'] },
  { id: Industry.LuxuryFashion, label: 'Luxury Fashion Brand', emoji: '👗', category: C.Fashion, startupCost: 400000,
    marketDemand: 55, competition: 60, profitMargin: 75, growthPotential: 75, riskLevel: 65, difficulty: 70,
    customerDemand: 55, employeeRequirement: 30, yearsToProfit: 4,
    pros: ['Enormous margins', 'Prestige compounding'], cons: ['Slow to earn trust', 'High risk'] },
  { id: Industry.ShoeCompany, label: 'Shoe Company', emoji: '👟', category: C.Fashion, startupCost: 150000,
    marketDemand: 72, competition: 75, profitMargin: 50, growthPotential: 65, riskLevel: 50, difficulty: 50,
    customerDemand: 75, employeeRequirement: 35, yearsToProfit: 2,
    pros: ['Sneaker culture upside'], cons: ['Manufacturing complexity'] },
  { id: Industry.JewelryBrand, label: 'Jewelry Brand', emoji: '💍', category: C.Fashion, startupCost: 200000,
    marketDemand: 55, competition: 55, profitMargin: 70, growthPotential: 55, riskLevel: 55, difficulty: 55,
    customerDemand: 55, employeeRequirement: 15, yearsToProfit: 3,
    pros: ['High ticket margins', 'Low staff needs'], cons: ['Expensive inventory', 'Luxury cycles'] },
  // ── Technology ──
  { id: Industry.TechStartup, label: 'Technology Startup', emoji: '🚀', category: C.Technology, startupCost: 150000,
    marketDemand: 80, competition: 75, profitMargin: 65, growthPotential: 95, riskLevel: 80, difficulty: 70,
    customerDemand: 75, employeeRequirement: 35, yearsToProfit: 4,
    pros: ['Can scale exponentially', 'High innovation'], cons: ['High failure rate', 'Burn before profit'] },
  { id: Industry.SoftwareCompany, label: 'Software Company', emoji: '💻', category: C.Technology, startupCost: 200000,
    marketDemand: 85, competition: 70, profitMargin: 70, growthPotential: 85, riskLevel: 60, difficulty: 65,
    customerDemand: 80, employeeRequirement: 40, yearsToProfit: 3,
    pros: ['Recurring revenue', 'Great margins'], cons: ['Talent is expensive'] },
  { id: Industry.AICompany, label: 'AI Company', emoji: '🤖', category: C.Technology, startupCost: 1000000,
    marketDemand: 90, competition: 70, profitMargin: 70, growthPotential: 100, riskLevel: 85, difficulty: 85,
    customerDemand: 85, employeeRequirement: 45, yearsToProfit: 5,
    pros: ['Frontier upside', 'World-changing scale'], cons: ['Compute is costly', 'Fierce talent war'] },
  { id: Industry.GameStudio, label: 'Game Development Studio', emoji: '🎮', category: C.Technology, startupCost: 120000,
    marketDemand: 78, competition: 80, profitMargin: 60, growthPotential: 80, riskLevel: 75, difficulty: 65,
    customerDemand: 80, employeeRequirement: 30, yearsToProfit: 3,
    pros: ['Hit games print money'], cons: ['Hit-driven', 'Crunch culture risk'] },
  { id: Industry.MobileApps, label: 'Mobile App Company', emoji: '📱', category: C.Technology, startupCost: 80000,
    marketDemand: 82, competition: 88, profitMargin: 65, growthPotential: 85, riskLevel: 70, difficulty: 55,
    customerDemand: 82, employeeRequirement: 20, yearsToProfit: 2,
    pros: ['Cheap to start', 'Global reach day one'], cons: ['App store gatekeepers', 'Saturated'] },
  // ── Automotive ──
  { id: Industry.CarDealership, label: 'Car Dealership', emoji: '🚗', category: C.Automotive, startupCost: 800000,
    marketDemand: 70, competition: 65, profitMargin: 30, growthPotential: 45, riskLevel: 45, difficulty: 45,
    customerDemand: 70, employeeRequirement: 30, yearsToProfit: 2,
    pros: ['Big-ticket sales', 'Service revenue'], cons: ['Inventory-heavy', 'Cyclical'] },
  { id: Industry.CarManufacturer, label: 'Car Manufacturer', emoji: '🏭', category: C.Automotive, startupCost: 50000000,
    marketDemand: 75, competition: 70, profitMargin: 60, growthPotential: 90, riskLevel: 90, difficulty: 95,
    customerDemand: 75, employeeRequirement: 100, yearsToProfit: 8,
    pros: ['Massive profit at scale', 'Industrial empire'], cons: ['Extreme startup cost', 'Thousands of employees', 'Long development cycles'] },
  { id: Industry.EVManufacturer, label: 'Electric Vehicle Manufacturer', emoji: '⚡', category: C.Automotive, startupCost: 30000000,
    marketDemand: 85, competition: 60, profitMargin: 55, growthPotential: 95, riskLevel: 88, difficulty: 90,
    customerDemand: 85, employeeRequirement: 90, yearsToProfit: 7,
    pros: ['The future of transport', 'Government tailwinds'], cons: ['Capital furnace', 'Battery supply wars'] },
  { id: Industry.MotorcycleCompany, label: 'Motorcycle Company', emoji: '🏍️', category: C.Automotive, startupCost: 5000000,
    marketDemand: 55, competition: 55, profitMargin: 45, growthPotential: 55, riskLevel: 65, difficulty: 70,
    customerDemand: 55, employeeRequirement: 60, yearsToProfit: 5,
    pros: ['Passionate niche', 'Lower cost than cars'], cons: ['Niche demand', 'Heavy manufacturing'] },
  { id: Industry.BicycleCompany, label: 'Bicycle Company', emoji: '🚲', category: C.Automotive, startupCost: 250000,
    marketDemand: 65, competition: 60, profitMargin: 45, growthPotential: 55, riskLevel: 45, difficulty: 45,
    customerDemand: 68, employeeRequirement: 25, yearsToProfit: 2,
    pros: ['Green tailwinds', 'Simple product'], cons: ['Import competition'] },
  // ── Construction & Property ──
  { id: Industry.FurnitureCompany, label: 'Furniture Company', emoji: '🪑', category: C.Property, startupCost: 180000,
    marketDemand: 62, competition: 58, profitMargin: 45, growthPotential: 50, riskLevel: 40, difficulty: 45,
    customerDemand: 65, employeeRequirement: 30, yearsToProfit: 2,
    pros: ['Steady demand', 'Craftsmanship premium'], cons: ['Logistics-heavy'] },
  { id: Industry.Construction, label: 'Construction Company', emoji: '🏗️', category: C.Property, startupCost: 600000,
    marketDemand: 70, competition: 60, profitMargin: 35, growthPotential: 60, riskLevel: 60, difficulty: 65,
    customerDemand: 70, employeeRequirement: 70, yearsToProfit: 3,
    pros: ['Big contracts', 'Asset-backed'], cons: ['Project risk', 'Labor-intensive'] },
  { id: Industry.ArchitectureFirm, label: 'Architecture Firm', emoji: '📐', category: C.Property, startupCost: 100000,
    marketDemand: 55, competition: 50, profitMargin: 60, growthPotential: 50, riskLevel: 40, difficulty: 60,
    customerDemand: 55, employeeRequirement: 20, yearsToProfit: 2,
    pros: ['Prestige work', 'Low overhead'], cons: ['Feast or famine projects'] },
  { id: Industry.RealEstateAgency, label: 'Real Estate Agency', emoji: '🏘️', category: C.Property, startupCost: 80000,
    marketDemand: 68, competition: 70, profitMargin: 55, growthPotential: 55, riskLevel: 45, difficulty: 40,
    customerDemand: 68, employeeRequirement: 15, yearsToProfit: 1,
    pros: ['Commission economics', 'Low startup'], cons: ['Market cycles bite'] },
  { id: Industry.PropertyDeveloper, label: 'Property Development Company', emoji: '🏙️', category: C.Property, startupCost: 5000000,
    marketDemand: 65, competition: 55, profitMargin: 50, growthPotential: 75, riskLevel: 75, difficulty: 80,
    customerDemand: 65, employeeRequirement: 40, yearsToProfit: 5,
    pros: ['Huge project payoffs'], cons: ['Capital-intensive', 'Long cycles'] },
  // ── Hospitality ──
  { id: Industry.HotelChain, label: 'Hotel Chain', emoji: '🏨', category: C.Hospitality, startupCost: 3000000,
    marketDemand: 70, competition: 65, profitMargin: 45, growthPotential: 70, riskLevel: 60, difficulty: 70,
    customerDemand: 72, employeeRequirement: 60, yearsToProfit: 4,
    pros: ['Location moats', 'Brand scales globally'], cons: ['Property costs', 'Seasonal swings'] },
];
export const INDUSTRY_BY_ID = new Map<Industry, IndustryDef>(INDUSTRIES.map((i) => [i.id, i]));
export const INDUSTRY_CATEGORY_LABELS: Record<IndustryCategory, string> = {
  [C.Food]: 'Food & Beverage', [C.Fashion]: 'Fashion', [C.Technology]: 'Technology',
  [C.Automotive]: 'Automotive', [C.Property]: 'Construction & Property', [C.Hospitality]: 'Hospitality',
};
export const INDUSTRY_CATEGORY_ORDER: IndustryCategory[] = [
  C.Food, C.Fashion, C.Technology, C.Automotive, C.Property, C.Hospitality,
];

/* ───────────────────────── Products ───────────────────────── */

const FOOD_SHOPS = [Industry.CoffeeShop, Industry.Cafe, Industry.Bakery, Industry.FoodTruck];
const TECH = [Industry.TechStartup, Industry.SoftwareCompany, Industry.AICompany, Industry.MobileApps];
const CARS = [Industry.CarManufacturer, Industry.EVManufacturer, Industry.CarDealership];
const FASHION = [Industry.ClothingBrand, Industry.LuxuryFashion];

export const PRODUCTS: ProductDef[] = [
  // Food & beverage
  { key: 'coffee',      industryIds: [...FOOD_SHOPS, Industry.Restaurant, Industry.FastFood], name: 'Coffee', emoji: '☕', devCost: 500, unitCost: 1, basePrice: 4, tier: 1 },
  { key: 'latte',       industryIds: FOOD_SHOPS, name: 'Latte', emoji: '🥛', devCost: 800, unitCost: 1.5, basePrice: 5.5, tier: 1 },
  { key: 'cappuccino',  industryIds: FOOD_SHOPS, name: 'Cappuccino', emoji: '☕', devCost: 800, unitCost: 1.4, basePrice: 5, tier: 1 },
  { key: 'espresso',    industryIds: FOOD_SHOPS, name: 'Espresso', emoji: '🍶', devCost: 600, unitCost: 0.8, basePrice: 3.5, tier: 1 },
  { key: 'tea',         industryIds: FOOD_SHOPS, name: 'Tea', emoji: '🍵', devCost: 400, unitCost: 0.6, basePrice: 3.5, tier: 1 },
  { key: 'pastries',    industryIds: [...FOOD_SHOPS, Industry.Restaurant], name: 'Pastries', emoji: '🥐', devCost: 1500, unitCost: 1.2, basePrice: 4.5, tier: 1 },
  { key: 'sandwiches',  industryIds: [...FOOD_SHOPS, Industry.Restaurant, Industry.FastFood], name: 'Sandwiches', emoji: '🥪', devCost: 2000, unitCost: 2.5, basePrice: 8, tier: 2 },
  { key: 'signature_dish', industryIds: [Industry.Restaurant], name: 'Signature Dish', emoji: '🍝', devCost: 8000, unitCost: 7, basePrice: 24, tier: 3 },
  { key: 'burger_combo', industryIds: [Industry.FastFood], name: 'Burger Combo', emoji: '🍔', devCost: 5000, unitCost: 3, basePrice: 10, tier: 2 },
  { key: 'artisan_bread', industryIds: [Industry.Bakery], name: 'Artisan Bread', emoji: '🍞', devCost: 2500, unitCost: 1.5, basePrice: 6.5, tier: 2 },
  { key: 'wedding_cakes', industryIds: [Industry.Bakery], name: 'Wedding Cakes', emoji: '🎂', devCost: 6000, unitCost: 60, basePrice: 350, tier: 3 },
  // Fashion
  { key: 'tshirts',     industryIds: [...FASHION, Industry.ShoeCompany], name: 'T-Shirts', emoji: '👕', devCost: 4000, unitCost: 6, basePrice: 25, tier: 1 },
  { key: 'hoodies',     industryIds: FASHION, name: 'Hoodies', emoji: '🧥', devCost: 7000, unitCost: 14, basePrice: 60, tier: 2 },
  { key: 'jackets',     industryIds: FASHION, name: 'Jackets', emoji: '🧥', devCost: 12000, unitCost: 35, basePrice: 140, tier: 2 },
  { key: 'designer_line', industryIds: [Industry.LuxuryFashion], name: 'Designer Line', emoji: '👗', devCost: 120000, unitCost: 180, basePrice: 1200, tier: 3 },
  { key: 'sneakers',    industryIds: [Industry.ShoeCompany, ...FASHION], name: 'Sneakers', emoji: '👟', devCost: 25000, unitCost: 28, basePrice: 110, tier: 2 },
  { key: 'dress_shoes', industryIds: [Industry.ShoeCompany], name: 'Dress Shoes', emoji: '👞', devCost: 18000, unitCost: 40, basePrice: 160, tier: 2 },
  { key: 'gold_jewelry', industryIds: [Industry.JewelryBrand], name: 'Gold Collection', emoji: '📿', devCost: 40000, unitCost: 350, basePrice: 1200, tier: 3 },
  { key: 'diamond_rings_b', industryIds: [Industry.JewelryBrand], name: 'Diamond Rings', emoji: '💍', devCost: 80000, unitCost: 900, basePrice: 3500, tier: 3 },
  // Technology
  { key: 'mobile_app',  industryIds: TECH, name: 'Mobile App', emoji: '📱', devCost: 30000, unitCost: 0.5, basePrice: 6, tier: 1 },
  { key: 'saas',        industryIds: TECH, name: 'SaaS Platform', emoji: '☁️', devCost: 120000, unitCost: 3, basePrice: 30, tier: 2 },
  { key: 'ai_product',  industryIds: [Industry.AICompany, Industry.TechStartup, Industry.SoftwareCompany], name: 'AI Product', emoji: '🤖', devCost: 400000, unitCost: 8, basePrice: 60, tier: 3 },
  { key: 'cloud_service', industryIds: [Industry.SoftwareCompany, Industry.AICompany], name: 'Cloud Services', emoji: '🌩️', devCost: 250000, unitCost: 5, basePrice: 45, tier: 2 },
  { key: 'video_game',  industryIds: [Industry.GameStudio], name: 'Video Game', emoji: '🕹️', devCost: 200000, unitCost: 2, basePrice: 40, tier: 2 },
  { key: 'live_service_game', industryIds: [Industry.GameStudio], name: 'Live-Service Game', emoji: '🎮', devCost: 600000, unitCost: 1, basePrice: 15, tier: 3 },
  { key: 'hardware',    industryIds: [Industry.TechStartup, Industry.AICompany], name: 'Hardware Device', emoji: '🔌', devCost: 500000, unitCost: 120, basePrice: 400, tier: 3 },
  // Automotive
  { key: 'sedan',       industryIds: CARS, name: 'Sedan', emoji: '🚗', devCost: 2000000, unitCost: 18000, basePrice: 30000, tier: 1 },
  { key: 'suv',         industryIds: CARS, name: 'SUV', emoji: '🚙', devCost: 3000000, unitCost: 26000, basePrice: 45000, tier: 2 },
  { key: 'pickup',      industryIds: CARS, name: 'Pickup Truck', emoji: '🛻', devCost: 2800000, unitCost: 24000, basePrice: 42000, tier: 2 },
  { key: 'sports_car',  industryIds: CARS, name: 'Sports Car', emoji: '🏎️', devCost: 6000000, unitCost: 55000, basePrice: 120000, tier: 3 },
  { key: 'luxury_car',  industryIds: CARS, name: 'Luxury Car', emoji: '🚘', devCost: 5000000, unitCost: 48000, basePrice: 100000, tier: 3 },
  { key: 'ev',          industryIds: [Industry.EVManufacturer, Industry.CarManufacturer], name: 'Electric Vehicle', emoji: '⚡', devCost: 5000000, unitCost: 32000, basePrice: 52000, tier: 2 },
  { key: 'hybrid',      industryIds: [Industry.CarManufacturer, Industry.EVManufacturer], name: 'Hybrid Vehicle', emoji: '🔋', devCost: 3500000, unitCost: 26000, basePrice: 40000, tier: 2 },
  { key: 'motorcycle',  industryIds: [Industry.MotorcycleCompany], name: 'Motorcycle', emoji: '🏍️', devCost: 800000, unitCost: 6000, basePrice: 14000, tier: 2 },
  { key: 'ebike',       industryIds: [Industry.BicycleCompany, Industry.MotorcycleCompany], name: 'E-Bike', emoji: '🚲', devCost: 120000, unitCost: 800, basePrice: 2200, tier: 2 },
  { key: 'road_bike',   industryIds: [Industry.BicycleCompany], name: 'Road Bike', emoji: '🚴', devCost: 60000, unitCost: 350, basePrice: 1100, tier: 2 },
  // Property / construction / hospitality
  { key: 'sofa_line',   industryIds: [Industry.FurnitureCompany], name: 'Sofa Line', emoji: '🛋️', devCost: 30000, unitCost: 300, basePrice: 950, tier: 2 },
  { key: 'office_furniture', industryIds: [Industry.FurnitureCompany], name: 'Office Furniture', emoji: '🪑', devCost: 25000, unitCost: 120, basePrice: 380, tier: 1 },
  { key: 'home_builds', industryIds: [Industry.Construction, Industry.PropertyDeveloper], name: 'Home Builds', emoji: '🏠', devCost: 150000, unitCost: 180000, basePrice: 260000, tier: 2 },
  { key: 'commercial_projects', industryIds: [Industry.Construction, Industry.PropertyDeveloper], name: 'Commercial Projects', emoji: '🏢', devCost: 400000, unitCost: 900000, basePrice: 1400000, tier: 3 },
  { key: 'blueprints',  industryIds: [Industry.ArchitectureFirm], name: 'Design Commissions', emoji: '📐', devCost: 15000, unitCost: 4000, basePrice: 18000, tier: 2 },
  { key: 'listings',    industryIds: [Industry.RealEstateAgency], name: 'Property Listings', emoji: '🔑', devCost: 5000, unitCost: 800, basePrice: 7500, tier: 1 },
  { key: 'standard_rooms', industryIds: [Industry.HotelChain], name: 'Standard Rooms', emoji: '🛏️', devCost: 80000, unitCost: 35, basePrice: 140, tier: 1 },
  { key: 'luxury_suites', industryIds: [Industry.HotelChain], name: 'Luxury Suites', emoji: '🏨', devCost: 250000, unitCost: 120, basePrice: 550, tier: 3 },
];
export const PRODUCT_BY_KEY = new Map<string, ProductDef>(PRODUCTS.map((p) => [p.key, p]));
export function productsForIndustry(industry: Industry): ProductDef[] {
  return PRODUCTS.filter((p) => p.industryIds.includes(industry));
}

/* ─────────────── Suppliers / consultants / expansions / events ─────────────── */

// Six suppliers on a real ladder: cheaper ones cap your output, dearer ones
// lift quality AND capacity so a growing company must trade up or stall.
export const SUPPLIER_TIERS: SupplierTierDef[] = [
  { tier: 1, label: 'Local Budget Supplier',   costMultiplier: 0.78, qualityBonus: -12, reliability: 0.70, capacity: 20_000 },
  { tier: 2, label: 'Regional Supplier',       costMultiplier: 0.92, qualityBonus: -4,  reliability: 0.85, capacity: 80_000 },
  { tier: 3, label: 'National Supplier',       costMultiplier: 1.05, qualityBonus: 4,   reliability: 0.92, capacity: 300_000 },
  { tier: 4, label: 'Premium Supplier',        costMultiplier: 1.22, qualityBonus: 10,  reliability: 0.97, capacity: 1_200_000 },
  { tier: 5, label: 'Global Supply Network',   costMultiplier: 1.40, qualityBonus: 16,  reliability: 0.99, capacity: 6_000_000 },
  { tier: 6, label: 'Vertically Integrated',   costMultiplier: 1.15, qualityBonus: 22,  reliability: 0.995, capacity: 50_000_000 },
];
export const SUPPLIER_BY_TIER = new Map<number, SupplierTierDef>(SUPPLIER_TIERS.map((s) => [s.tier, s]));
export const MAX_SUPPLIER_TIER = SUPPLIER_TIERS.length;

/** Morale-boosting team activities. Cost scales with headcount. */
export const TEAM_BUILDING: TeamBuildingDef[] = [
  { id: 'dinner',   label: 'Company Dinner',   emoji: '🍽️', costPerHead: 120,  moraleGain: 5,  note: 'A nice night out — a small, cheap lift.' },
  { id: 'party',    label: 'Holiday Party',    emoji: '🎉', costPerHead: 250,  moraleGain: 9,  note: 'End-of-year celebration everyone remembers.' },
  { id: 'training', label: 'Training Event',   emoji: '📚', costPerHead: 400,  moraleGain: 7,  note: 'Morale + a little skill across the company.' },
  { id: 'bonus',    label: 'Surprise Bonuses', emoji: '💵', costPerHead: 1500, moraleGain: 16, note: 'Cash talks — the biggest morale jump.' },
  { id: 'retreat',  label: 'Company Retreat',  emoji: '🏝️', costPerHead: 2200, moraleGain: 20, note: 'A getaway that resets and re-energizes the team.' },
];
export const TEAM_BUILDING_BY_ID = new Map<string, TeamBuildingDef>(TEAM_BUILDING.map((t) => [t.id, t]));

export const CONSULTANTS: ConsultantDef[] = [
  { id: 'finance',   label: 'Finance Consultant',       emoji: '📊', annualFee: 40000,  description: 'Trims operating expenses by ~8%.' },
  { id: 'marketing', label: 'Marketing Consultant',     emoji: '📣', annualFee: 50000,  description: 'Boosts demand as if marketing were one level higher.' },
  { id: 'operations',label: 'Operations Consultant',    emoji: '⚙️', annualFee: 45000,  description: 'Raises staff productivity ~10%.' },
  { id: 'manufacturing', label: 'Manufacturing Consultant', emoji: '🏭', annualFee: 60000, description: 'Cuts unit production costs ~7%.' },
  { id: 'hr',        label: 'HR Consultant',            emoji: '🧑‍💼', annualFee: 35000, description: 'Keeps morale up and strikes rare.' },
  { id: 'legal',     label: 'Legal Consultant',         emoji: '⚖️', annualFee: 55000,  description: 'Shields against lawsuits and regulation shocks.' },
  { id: 'technology',label: 'Technology Consultant',    emoji: '🖥️', annualFee: 50000,  description: 'R&D acts one level higher.' },
];
export const CONSULTANT_BY_ID = new Map<string, ConsultantDef>(CONSULTANTS.map((c) => [c.id, c]));

// One-off strategic upgrades. Opening locations is handled separately by the
// expansion slider (see expansionQuote / expandLocations).
export const EXPANSIONS: ExpansionDef[] = [
  { id: 'warehouse',     label: 'Open Warehouse',        emoji: '📦', cost: 250000,   minReputation: 40, minBranches: 2, repeatable: false, description: 'Cuts logistics costs and supply-shortage damage.' },
  { id: 'factory',       label: 'Build Factory',         emoji: '🏭', cost: 2000000,  minReputation: 45, minBranches: 2, repeatable: false, description: 'Slashes unit costs for manufactured goods.' },
  { id: 'international', label: 'Expand Internationally',emoji: '🌍', cost: 1500000,  minReputation: 60, minBranches: 3, repeatable: false, description: 'Opens global demand — a big revenue multiplier.' },
  { id: 'franchise',     label: 'Franchise the Business',emoji: '📜', cost: 800000,   minReputation: 65, minBranches: 4, repeatable: false, description: 'Franchisees pay you royalties every year.' },
  { id: 'acquire',       label: 'Acquire Competitor',    emoji: '🤝', cost: 3000000,  minReputation: 55, minBranches: 3, repeatable: true,  description: 'Buys market share and silences a rival.' },
];
export const EXPANSION_BY_ID = new Map<string, ExpansionDef>(EXPANSIONS.map((e) => [e.id, e]));

export const BUSINESS_EVENTS: BusinessEventDef[] = [
  { id: 'viral',        label: 'Viral social media moment', emoji: '📈', weight: 3, good: true },
  { id: 'award',        label: 'Industry award won',        emoji: '🏆', weight: 2, good: true },
  { id: 'breakthrough', label: 'Technology breakthrough',   emoji: '💡', weight: 2, good: true },
  { id: 'investor',     label: 'Investor cash injection',   emoji: '💰', weight: 2, good: true },
  { id: 'recall',       label: 'Product recall',            emoji: '⚠️', weight: 2, good: false },
  { id: 'recession',    label: 'Economic recession',        emoji: '📉', weight: 2, good: false },
  { id: 'shortage',     label: 'Supply shortage',           emoji: '🚧', weight: 2, good: false },
  { id: 'strike',       label: 'Employee strike',           emoji: '✊', weight: 2, good: false },
  { id: 'price_war',    label: 'Competitor price war',      emoji: '⚔️', weight: 2, good: false },
  { id: 'regulation',   label: 'New government regulation', emoji: '🏛️', weight: 2, good: false },
  { id: 'lawsuit',      label: 'Lawsuit filed',             emoji: '⚖️', weight: 1, good: false },
  { id: 'new_competitor', label: 'Aggressive new competitor', emoji: '🥊', weight: 2, good: false },
  { id: 'acquisition_offer', label: 'Acquisition interest',  emoji: '🤝', weight: 1, good: true },
];

/* ─────────────── Pure economic helpers (shared by sim + client previews) ─────────────── */

const clampN = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Total dollar market a product competes for, per branch. Bigger industries, bigger markets. */
export function industryMarketSize(ind: IndustryDef): number {
  return 70000 + ind.startupCost * 1.1;
}

/** How much advertising moves sales (0-100). Derived from category when not set. */
export function marketingEffectiveness(ind: IndustryDef): number {
  if (ind.marketingEffectiveness !== undefined) return ind.marketingEffectiveness;
  const byCat: Record<IndustryCategory, number> = {
    [IndustryCategory.Food]: 55, [IndustryCategory.Fashion]: 80, [IndustryCategory.Technology]: 82,
    [IndustryCategory.Automotive]: 45, [IndustryCategory.Property]: 32, [IndustryCategory.Hospitality]: 62,
  };
  return byCat[ind.category];
}

/** Staff needed to fully run one location. Scales with staff-hunger and industry size. */
export function locationEmployees(ind: IndustryDef): number {
  if (ind.locationEmployees !== undefined) return ind.locationEmployees;
  const sizeFactor = Math.max(1, Math.log10(ind.startupCost / 10000));
  return Math.max(3, Math.round((ind.employeeRequirement / 6) * sizeFactor));
}

/** Cost of the first extra location. Derived from startup cost when not set. */
export function baseLocationCost(ind: IndustryDef): number {
  return ind.baseLocationCost ?? Math.round(ind.startupCost * 0.6);
}

/* ── Staffing role mix: every industry needs a realistic blend of roles ── */

/** Role weights per staffing archetype (each ~sums to 1). */
const STAFFING_PRESETS: Record<string, Partial<Record<Role, number>>> = {
  foodservice:   { [StaffRole.Manager]: 0.15, [StaffRole.Sales]: 0.55, [StaffRole.Support]: 0.30 },
  retail:        { [StaffRole.Manager]: 0.15, [StaffRole.Sales]: 0.50, [StaffRole.Support]: 0.20, [StaffRole.Marketing]: 0.15 },
  creative:      { [StaffRole.Manager]: 0.12, [StaffRole.Designer]: 0.30, [StaffRole.Marketing]: 0.18, [StaffRole.Sales]: 0.30, [StaffRole.Support]: 0.10 },
  software:      { [StaffRole.Manager]: 0.12, [StaffRole.Engineer]: 0.46, [StaffRole.Designer]: 0.18, [StaffRole.Sales]: 0.14, [StaffRole.Support]: 0.10 },
  manufacturing: { [StaffRole.Manager]: 0.08, [StaffRole.Engineer]: 0.17, [StaffRole.FactoryWorker]: 0.60, [StaffRole.Sales]: 0.08, [StaffRole.Finance]: 0.07 },
  hospitality:   { [StaffRole.Manager]: 0.12, [StaffRole.Support]: 0.45, [StaffRole.Sales]: 0.20, [StaffRole.Marketing]: 0.13, [StaffRole.Finance]: 0.10 },
};

/** Which archetype each industry uses. */
const INDUSTRY_STAFFING: Record<Industry, keyof typeof STAFFING_PRESETS> = {
  [Industry.CoffeeShop]: 'foodservice', [Industry.Cafe]: 'foodservice', [Industry.Restaurant]: 'foodservice',
  [Industry.Bakery]: 'foodservice', [Industry.FastFood]: 'foodservice', [Industry.FoodTruck]: 'foodservice',
  [Industry.ClothingBrand]: 'creative', [Industry.LuxuryFashion]: 'creative', [Industry.ShoeCompany]: 'creative',
  [Industry.JewelryBrand]: 'creative', [Industry.ArchitectureFirm]: 'creative',
  [Industry.TechStartup]: 'software', [Industry.SoftwareCompany]: 'software', [Industry.AICompany]: 'software',
  [Industry.GameStudio]: 'software', [Industry.MobileApps]: 'software',
  [Industry.CarDealership]: 'retail', [Industry.RealEstateAgency]: 'retail',
  [Industry.CarManufacturer]: 'manufacturing', [Industry.EVManufacturer]: 'manufacturing',
  [Industry.MotorcycleCompany]: 'manufacturing', [Industry.BicycleCompany]: 'manufacturing',
  [Industry.FurnitureCompany]: 'manufacturing', [Industry.Construction]: 'manufacturing',
  [Industry.PropertyDeveloper]: 'manufacturing',
  [Industry.HotelChain]: 'hospitality',
};

/** The role blend a company of `branches` locations must employ. */
export function staffingRequirement(ind: IndustryDef, branches: number): Partial<Record<Role, number>> {
  const total = locationEmployees(ind) * Math.max(1, branches);
  const weights = STAFFING_PRESETS[INDUSTRY_STAFFING[ind.id] ?? 'retail']!;
  const req: Partial<Record<Role, number>> = {};
  for (const [role, w] of Object.entries(weights) as Array<[Role, number]>) {
    const n = Math.round(total * w);
    if (n > 0) req[role] = n;
  }
  // Any real company needs at least one manager.
  if (!req[StaffRole.Manager]) req[StaffRole.Manager] = 1;
  return req;
}

/** Roles you're short on for a given branch count, given current staff counts. */
export function staffingShortfall(
  ind: IndustryDef, branches: number, staff: Partial<Record<Role, { count: number }>>,
): Partial<Record<Role, number>> {
  const req = staffingRequirement(ind, branches);
  const short: Partial<Record<Role, number>> = {};
  for (const [role, need] of Object.entries(req) as Array<[Role, number]>) {
    const have = staff[role]?.count ?? 0;
    if (have < need) short[role] = need - have;
  }
  return short;
}

/** Cost of one location, escalating as the company already has more branches.
 *  `index` is the 0-based offset within a batch being opened at once. */
export function locationCost(ind: IndustryDef, currentBranches: number, index = 0): number {
  return Math.round(baseLocationCost(ind) * Math.pow(1.25, Math.max(0, currentBranches - 1 + index)));
}

/**
 * Demand response to price. Returns a multiplier on nominal demand.
 * There's a "sweet spot" price ratio that rises with quality + reputation and falls
 * with competition; price below it lifts demand (>1), above it crushes demand (<1).
 */
export function priceAppeal(
  price: number, def: ProductDef, qualityEff: number, reputation: number, competition: number,
): number {
  const ratio = price / def.basePrice;
  const sweetSpot = 0.75 + qualityEff / 300 + reputation / 300 - competition / 500;
  const elasticity = 1.1 + competition / 200;
  return clampN(1 - (ratio - sweetSpot) * elasticity, 0.04, 1.7);
}

/** The price ratio (× basePrice) where demand is "fair" — the revenue sweet spot. */
export function optimalPrice(def: ProductDef, qualityEff: number, reputation: number, competition: number): number {
  const sweetSpot = 0.75 + qualityEff / 300 + reputation / 300 - competition / 500;
  // A touch above the fairness point maximizes revenue (price × appeal).
  return Math.round(def.basePrice * (sweetSpot + 0.15) * 100) / 100;
}

/** Advertising multiplier on demand — diminishing returns, industry-dependent.
 *  `ref` is the spend that yields a solid boost; kept modest so marketing is
 *  affordable across industries (a small shop needn't spend a fortune). */
export function marketingMultiplier(budget: number, ind: IndustryDef): number {
  if (budget <= 0) return 1;
  const eff = marketingEffectiveness(ind) / 100;
  const ref = Math.max(2500, industryMarketSize(ind) * 0.012);
  return 1 + eff * Math.sqrt(budget / ref);
}

/** A sensible max marketing budget for a product slider — proportionate & affordable. */
export function marketingBudgetMax(ind: IndustryDef): number {
  return Math.max(8000, Math.round(industryMarketSize(ind) * 0.12));
}

/**
 * Uncapped annual units for one product given the shared yearly demand base.
 * `demandBase` folds in industry demand, reputation, branches, productivity and noise;
 * it's computed once per sim year and passed here so client hints match the server.
 */
export function estimateProductUnits(
  def: ProductDef,
  product: { quality: number; price: number; popularity: number; marketingBudget: number },
  ctx: { industry: IndustryDef; reputation: number; demandBase: number; supplierQualityBonus: number },
): number {
  const qualityEff = clampN(product.quality + ctx.supplierQualityBonus, 1, 100);
  const appeal = priceAppeal(product.price, def, qualityEff, ctx.reputation, ctx.industry.competition);
  const mkt = marketingMultiplier(product.marketingBudget, ctx.industry);
  const productMarket = industryMarketSize(ctx.industry) / Math.pow(def.tier, 1.4) *
    ctx.demandBase * (0.4 + qualityEff / 120) * (0.6 + product.popularity / 150) * appeal * mkt;
  return Math.max(0, Math.round(productMarket / Math.max(0.01, product.price)));
}

/** Preview for opening `count` new locations at once. Pure — client & server agree. */
export function expansionQuote(
  ind: IndustryDef, branches: number, count: number,
  staff: Partial<Record<Role, { count: number }>>,
  perBranchRevenue: number, perBranchOpex: number,
): ExpansionQuote {
  let totalCost = 0;
  for (let i = 0; i < count; i++) totalCost += locationCost(ind, branches, i);
  const requiredByRole = staffingRequirement(ind, branches + count);
  const shortByRole = staffingShortfall(ind, branches + count, staff);
  const employeesRequired = Object.values(requiredByRole).reduce((s, n) => s + (n ?? 0), 0);
  const employeesShort = Object.values(shortByRole).reduce((s, n) => s + (n ?? 0), 0);
  const expectedRevenueDelta = Math.round(perBranchRevenue * count);
  const expectedOpexDelta = Math.round(perBranchOpex * count);
  const annualGain = expectedRevenueDelta - expectedOpexDelta;
  const roiPct = totalCost > 0 ? Math.round((annualGain / totalCost) * 100) : 0;
  return { count, totalCost, employeesRequired, employeesShort, requiredByRole, shortByRole, expectedRevenueDelta, expectedOpexDelta, roiPct };
}
