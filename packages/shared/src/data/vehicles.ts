import { VehicleClass, VehicleCondition, BodyType } from '../types/vehicles.js';
import type {
  VehicleBrand, VehicleModel, VehicleListing, VehicleCondition as VehicleConditionType,
} from '../types/vehicles.js';

/** Minimum age to buy a vehicle. */
export const VEHICLE_MIN_AGE = 16;

/** The newest model year the dealership sells; used cars go back from here. */
export const CURRENT_MODEL_YEAR = 2025;

/* ───────────────────────── Brands ───────────────────────── */

export const VEHICLE_BRANDS: VehicleBrand[] = [
  // Economy
  { id: 'toyota',   name: 'Toyota',        class: VehicleClass.Economy, color: '#EB0A1E', reliability: 0.95 },
  { id: 'honda',    name: 'Honda',         class: VehicleClass.Economy, color: '#CC0000', reliability: 0.92 },
  { id: 'hyundai',  name: 'Hyundai',       class: VehicleClass.Economy, color: '#002C5F', reliability: 0.88 },
  { id: 'kia',      name: 'Kia',           class: VehicleClass.Economy, color: '#05141F', reliability: 0.87 },
  { id: 'nissan',   name: 'Nissan',        class: VehicleClass.Economy, color: '#C3002F', reliability: 0.85 },
  // Mid-range
  { id: 'vw',       name: 'Volkswagen',    class: VehicleClass.Mid,     color: '#001E50', reliability: 0.82 },
  { id: 'mazda',    name: 'Mazda',         class: VehicleClass.Mid,     color: '#101010', reliability: 0.88 },
  { id: 'ford',     name: 'Ford',          class: VehicleClass.Mid,     color: '#003478', reliability: 0.83 },
  { id: 'chevy',    name: 'Chevrolet',     class: VehicleClass.Mid,     color: '#D1B962', reliability: 0.80 },
  // Luxury
  { id: 'bmw',      name: 'BMW',           class: VehicleClass.Luxury,  color: '#0066B1', reliability: 0.74 },
  { id: 'mercedes', name: 'Mercedes-Benz', class: VehicleClass.Luxury,  color: '#111111', reliability: 0.75 },
  { id: 'audi',     name: 'Audi',          class: VehicleClass.Luxury,  color: '#BB0A30', reliability: 0.73 },
  { id: 'lexus',    name: 'Lexus',         class: VehicleClass.Luxury,  color: '#1A1A1A', reliability: 0.90 },
  // Sports
  { id: 'porsche',  name: 'Porsche',       class: VehicleClass.Sports,  color: '#B12B28', reliability: 0.78 },
  { id: 'ferrari',  name: 'Ferrari',       class: VehicleClass.Sports,  color: '#FF2800', reliability: 0.62 },
  { id: 'lambo',    name: 'Lamborghini',   class: VehicleClass.Sports,  color: '#DDB321', reliability: 0.60 },
  { id: 'mclaren',  name: 'McLaren',       class: VehicleClass.Sports,  color: '#FF8000', reliability: 0.58 },
  // Ultra luxury
  { id: 'rolls',    name: 'Rolls-Royce',   class: VehicleClass.Ultra,   color: '#280A3C', reliability: 0.70 },
  { id: 'bentley',  name: 'Bentley',       class: VehicleClass.Ultra,   color: '#0A3D2E', reliability: 0.68 },
];

export const BRAND_BY_ID = new Map<string, VehicleBrand>(VEHICLE_BRANDS.map((b) => [b.id, b]));

/* ───────────────────────── Models ───────────────────────── */

const B = BodyType;
export const VEHICLE_MODELS: VehicleModel[] = [
  // Toyota
  { key: 'toyota_corolla',     brandId: 'toyota', name: 'Corolla',      bodyType: B.Sedan,  msrp: 23000 },
  { key: 'toyota_camry',       brandId: 'toyota', name: 'Camry',        bodyType: B.Sedan,  msrp: 28000 },
  { key: 'toyota_prius',       brandId: 'toyota', name: 'Prius',        bodyType: B.Hybrid, msrp: 29000 },
  { key: 'toyota_landcruiser', brandId: 'toyota', name: 'Land Cruiser', bodyType: B.SUV,    msrp: 58000, depreciation: 0.06 },
  // Honda
  { key: 'honda_civic',        brandId: 'honda',  name: 'Civic',        bodyType: B.Sedan,  msrp: 24000 },
  { key: 'honda_accord',       brandId: 'honda',  name: 'Accord',       bodyType: B.Sedan,  msrp: 29000 },
  { key: 'honda_crv',          brandId: 'honda',  name: 'CR-V',         bodyType: B.SUV,    msrp: 32000 },
  // Hyundai
  { key: 'hyundai_elantra',    brandId: 'hyundai', name: 'Elantra',     bodyType: B.Sedan,  msrp: 22000 },
  { key: 'hyundai_tucson',     brandId: 'hyundai', name: 'Tucson',      bodyType: B.SUV,    msrp: 29000 },
  { key: 'hyundai_santafe',    brandId: 'hyundai', name: 'Santa Fe',    bodyType: B.SUV,    msrp: 35000 },
  // Kia
  { key: 'kia_forte',          brandId: 'kia',    name: 'Forte',        bodyType: B.Sedan,  msrp: 21000 },
  { key: 'kia_sportage',       brandId: 'kia',    name: 'Sportage',     bodyType: B.SUV,    msrp: 28000 },
  { key: 'kia_telluride',      brandId: 'kia',    name: 'Telluride',    bodyType: B.SUV,    msrp: 38000 },
  // Nissan
  { key: 'nissan_sentra',      brandId: 'nissan', name: 'Sentra',       bodyType: B.Sedan,  msrp: 21000 },
  { key: 'nissan_altima',      brandId: 'nissan', name: 'Altima',       bodyType: B.Sedan,  msrp: 26000 },
  { key: 'nissan_rogue',       brandId: 'nissan', name: 'Rogue',        bodyType: B.SUV,    msrp: 30000 },
  // Volkswagen
  { key: 'vw_golf',            brandId: 'vw',     name: 'Golf',         bodyType: B.Hatchback, msrp: 27000 },
  { key: 'vw_jetta',           brandId: 'vw',     name: 'Jetta',        bodyType: B.Sedan,  msrp: 25000 },
  { key: 'vw_tiguan',          brandId: 'vw',     name: 'Tiguan',       bodyType: B.SUV,    msrp: 32000 },
  // Mazda
  { key: 'mazda_3',            brandId: 'mazda',  name: 'Mazda3',       bodyType: B.Sedan,  msrp: 25000 },
  { key: 'mazda_cx5',          brandId: 'mazda',  name: 'CX-5',         bodyType: B.SUV,    msrp: 31000 },
  { key: 'mazda_mx5',          brandId: 'mazda',  name: 'MX-5 Miata',   bodyType: B.Sports, msrp: 33000, depreciation: 0.07 },
  // Ford
  { key: 'ford_focus',         brandId: 'ford',   name: 'Focus',        bodyType: B.Hatchback, msrp: 23000 },
  { key: 'ford_mustang',       brandId: 'ford',   name: 'Mustang',      bodyType: B.Coupe,  msrp: 42000, depreciation: 0.08 },
  { key: 'ford_f150',          brandId: 'ford',   name: 'F-150',        bodyType: B.Truck,  msrp: 45000, depreciation: 0.08 },
  { key: 'ford_explorer',      brandId: 'ford',   name: 'Explorer',     bodyType: B.SUV,    msrp: 40000 },
  // Chevrolet
  { key: 'chevy_malibu',       brandId: 'chevy',  name: 'Malibu',       bodyType: B.Sedan,  msrp: 26000 },
  { key: 'chevy_silverado',    brandId: 'chevy',  name: 'Silverado',    bodyType: B.Truck,  msrp: 44000, depreciation: 0.08 },
  { key: 'chevy_corvette',     brandId: 'chevy',  name: 'Corvette',     bodyType: B.Sports, msrp: 70000, depreciation: 0.05 },
  // BMW
  { key: 'bmw_3',              brandId: 'bmw',    name: '3 Series',     bodyType: B.Sedan,  msrp: 46000 },
  { key: 'bmw_5',              brandId: 'bmw',    name: '5 Series',     bodyType: B.Sedan,  msrp: 58000 },
  { key: 'bmw_7',              brandId: 'bmw',    name: '7 Series',     bodyType: B.Sedan,  msrp: 95000 },
  { key: 'bmw_x5',             brandId: 'bmw',    name: 'X5',           bodyType: B.SUV,    msrp: 67000 },
  { key: 'bmw_m3',             brandId: 'bmw',    name: 'M3',           bodyType: B.Sports, msrp: 76000, depreciation: 0.07 },
  // Mercedes-Benz
  { key: 'mb_cclass',          brandId: 'mercedes', name: 'C-Class',    bodyType: B.Sedan,  msrp: 48000 },
  { key: 'mb_eclass',          brandId: 'mercedes', name: 'E-Class',    bodyType: B.Sedan,  msrp: 62000 },
  { key: 'mb_sclass',          brandId: 'mercedes', name: 'S-Class',    bodyType: B.Sedan,  msrp: 115000 },
  { key: 'mb_gwagon',          brandId: 'mercedes', name: 'G-Wagon',    bodyType: B.SUV,    msrp: 140000, depreciation: 0.02 },
  // Audi
  { key: 'audi_a4',            brandId: 'audi',   name: 'A4',           bodyType: B.Sedan,  msrp: 44000 },
  { key: 'audi_a6',            brandId: 'audi',   name: 'A6',           bodyType: B.Sedan,  msrp: 58000 },
  { key: 'audi_q7',            brandId: 'audi',   name: 'Q7',           bodyType: B.SUV,    msrp: 62000 },
  { key: 'audi_r8',            brandId: 'audi',   name: 'R8',           bodyType: B.Sports, msrp: 160000, depreciation: 0.05 },
  // Lexus
  { key: 'lexus_is',           brandId: 'lexus',  name: 'IS',           bodyType: B.Sedan,  msrp: 42000 },
  { key: 'lexus_rx',           brandId: 'lexus',  name: 'RX',           bodyType: B.SUV,    msrp: 50000 },
  { key: 'lexus_lc',           brandId: 'lexus',  name: 'LC 500',       bodyType: B.Coupe,  msrp: 100000, depreciation: 0.06 },
  // Porsche
  { key: 'porsche_macan',      brandId: 'porsche', name: 'Macan',       bodyType: B.SUV,    msrp: 65000 },
  { key: 'porsche_911',        brandId: 'porsche', name: '911 Carrera', bodyType: B.Sports, msrp: 120000, depreciation: 0.04 },
  { key: 'porsche_taycan',     brandId: 'porsche', name: 'Taycan',      bodyType: B.Sports, msrp: 100000, depreciation: 0.09 },
  // Ferrari
  { key: 'ferrari_roma',       brandId: 'ferrari', name: 'Roma',        bodyType: B.Sports, msrp: 250000, depreciation: 0.03 },
  { key: 'ferrari_f8',         brandId: 'ferrari', name: 'F8 Tributo',  bodyType: B.Sports, msrp: 280000, depreciation: 0.02 },
  { key: 'ferrari_296',        brandId: 'ferrari', name: '296 GTB',     bodyType: B.Sports, msrp: 320000, depreciation: 0.01 },
  { key: 'ferrari_sf90',       brandId: 'ferrari', name: 'SF90 Stradale', bodyType: B.Sports, msrp: 520000, depreciation: -0.02 },
  // Lamborghini
  { key: 'lambo_huracan',      brandId: 'lambo',  name: 'Huracán',      bodyType: B.Sports, msrp: 250000, depreciation: 0.02 },
  { key: 'lambo_urus',         brandId: 'lambo',  name: 'Urus',         bodyType: B.SUV,    msrp: 230000, depreciation: 0.04 },
  { key: 'lambo_revuelto',     brandId: 'lambo',  name: 'Revuelto',     bodyType: B.Sports, msrp: 600000, depreciation: -0.01 },
  // McLaren
  { key: 'mclaren_gt',         brandId: 'mclaren', name: 'GT',          bodyType: B.Sports, msrp: 210000, depreciation: 0.06 },
  { key: 'mclaren_750s',       brandId: 'mclaren', name: '750S',        bodyType: B.Sports, msrp: 330000, depreciation: 0.03 },
  { key: 'mclaren_p1',         brandId: 'mclaren', name: 'P1',          bodyType: B.Sports, msrp: 1200000, depreciation: -0.03 },
  // Rolls-Royce
  { key: 'rolls_ghost',        brandId: 'rolls',  name: 'Ghost',        bodyType: B.Sedan,  msrp: 340000, depreciation: 0.04 },
  { key: 'rolls_phantom',      brandId: 'rolls',  name: 'Phantom',      bodyType: B.Sedan,  msrp: 500000, depreciation: 0.03 },
  { key: 'rolls_cullinan',     brandId: 'rolls',  name: 'Cullinan',     bodyType: B.SUV,    msrp: 410000, depreciation: 0.03 },
  // Bentley
  { key: 'bentley_continental', brandId: 'bentley', name: 'Continental GT', bodyType: B.Coupe, msrp: 240000, depreciation: 0.05 },
  { key: 'bentley_bentayga',   brandId: 'bentley', name: 'Bentayga',    bodyType: B.SUV,    msrp: 230000, depreciation: 0.05 },
  { key: 'bentley_flying',     brandId: 'bentley', name: 'Flying Spur', bodyType: B.Sedan,  msrp: 250000, depreciation: 0.05 },
];

export const MODEL_BY_KEY = new Map<string, VehicleModel>(VEHICLE_MODELS.map((m) => [m.key, m]));

/* ─────────────────── Class / condition tuning ─────────────────── */

interface ClassBase { happiness: number; maintenance: number; depreciation: number; }
const CLASS_BASE: Record<VehicleClass, ClassBase> = {
  [VehicleClass.Economy]: { happiness: 6,  maintenance: 80,   depreciation: 0.13 },
  [VehicleClass.Mid]:     { happiness: 11, maintenance: 130,  depreciation: 0.11 },
  [VehicleClass.Luxury]:  { happiness: 22, maintenance: 320,  depreciation: 0.10 },
  [VehicleClass.Sports]:  { happiness: 32, maintenance: 650,  depreciation: 0.06 },
  [VehicleClass.Ultra]:   { happiness: 45, maintenance: 1300, depreciation: 0.05 },
};

interface ConditionData { label: string; valueMult: number; happinessDelta: number; maintenanceMult: number; }
export const CONDITION_DATA: Record<VehicleConditionType, ConditionData> = {
  [VehicleCondition.BrandNew]:  { label: 'Brand New', valueMult: 1.0,  happinessDelta: 6,   maintenanceMult: 0.8 },
  [VehicleCondition.Excellent]: { label: 'Excellent', valueMult: 0.92, happinessDelta: 3,   maintenanceMult: 0.9 },
  [VehicleCondition.Good]:      { label: 'Good',      valueMult: 0.82, happinessDelta: 0,   maintenanceMult: 1.0 },
  [VehicleCondition.Fair]:      { label: 'Fair',      valueMult: 0.70, happinessDelta: -2,  maintenanceMult: 1.3 },
  [VehicleCondition.Poor]:      { label: 'Poor',      valueMult: 0.55, happinessDelta: -5,  maintenanceMult: 1.7 },
  [VehicleCondition.Damaged]:   { label: 'Damaged',   valueMult: 0.40, happinessDelta: -10, maintenanceMult: 2.2 },
};

/** Best → worst, for stepping condition up (repair) or down (neglect). */
export const CONDITION_ORDER: VehicleConditionType[] = [
  VehicleCondition.BrandNew, VehicleCondition.Excellent, VehicleCondition.Good,
  VehicleCondition.Fair, VehicleCondition.Poor, VehicleCondition.Damaged,
];

export const CONDITION_LABELS: Record<VehicleConditionType, string> =
  Object.fromEntries(CONDITION_ORDER.map((c) => [c, CONDITION_DATA[c].label])) as Record<VehicleConditionType, string>;

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  [VehicleClass.Economy]: 'Economy',
  [VehicleClass.Mid]: 'Mid-Range',
  [VehicleClass.Luxury]: 'Luxury',
  [VehicleClass.Sports]: 'Sports',
  [VehicleClass.Ultra]: 'Ultra Luxury',
};
export const VEHICLE_CLASS_ORDER: VehicleClass[] = [
  VehicleClass.Economy, VehicleClass.Mid, VehicleClass.Luxury, VehicleClass.Sports, VehicleClass.Ultra,
];

const BODY_EMOJI: Record<BodyType, string> = {
  [BodyType.Sedan]: '🚗',
  [BodyType.Hatchback]: '🚗',
  [BodyType.SUV]: '🚙',
  [BodyType.Truck]: '🛻',
  [BodyType.Coupe]: '🚘',
  [BodyType.Sports]: '🏎️',
  [BodyType.Hybrid]: '🔋',
};

export function bodyEmoji(bodyType: BodyType): string {
  return BODY_EMOJI[bodyType] ?? '🚗';
}

/** Salvage floor — a normal car never drops below this fraction of MSRP. */
const SALVAGE_FLOOR = 0.08;

/** Build a concrete, priced listing for a model at a given year + condition. Deterministic. */
export function buildVehicleListing(
  model: VehicleModel,
  year: number,
  condition: VehicleConditionType,
): VehicleListing {
  const brand = BRAND_BY_ID.get(model.brandId)!;
  const base = CLASS_BASE[brand.class];
  const depr = model.depreciation ?? base.depreciation;
  const age = Math.max(0, CURRENT_MODEL_YEAR - year);
  const cond = CONDITION_DATA[condition];

  // Age the value by compounding the depreciation rate (negative = appreciate).
  let aged = model.msrp * Math.pow(1 - depr, age);
  if (depr > 0) aged = Math.max(aged, model.msrp * SALVAGE_FLOOR);

  const price = Math.round(aged * cond.valueMult);
  const monthlyMaintenance = Math.round(base.maintenance * cond.maintenanceMult * (2 - brand.reliability));
  const happiness = Math.max(0, base.happiness + cond.happinessDelta);

  return {
    key: `${model.key}__${year}__${condition}`,
    modelKey: model.key,
    brandId: brand.id,
    brandName: brand.name,
    brandColor: brand.color,
    modelName: model.name,
    class: brand.class,
    bodyType: model.bodyType,
    emoji: bodyEmoji(model.bodyType),
    year,
    condition,
    price,
    monthlyMaintenance,
    happiness,
    appreciationRate: depr,
  };
}

/** Deterministic small hash from a string (stable used-car generation). */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * The dealership: for every model, a brand-new listing plus one deterministic
 * used listing (older year + lower condition), so the lot is varied but stable
 * across fetches.
 */
export function generateDealership(): VehicleListing[] {
  const usedConditions: VehicleConditionType[] = [
    VehicleCondition.Excellent, VehicleCondition.Good, VehicleCondition.Fair, VehicleCondition.Poor,
  ];
  const listings: VehicleListing[] = [];
  for (const model of VEHICLE_MODELS) {
    listings.push(buildVehicleListing(model, CURRENT_MODEL_YEAR, VehicleCondition.BrandNew));
    const h = hash(model.key);
    const usedAge = 3 + (h % 10); // 3–12 years old
    const usedYear = CURRENT_MODEL_YEAR - usedAge;
    const usedCond = usedConditions[h % usedConditions.length]!;
    listings.push(buildVehicleListing(model, usedYear, usedCond));
  }
  return listings;
}
