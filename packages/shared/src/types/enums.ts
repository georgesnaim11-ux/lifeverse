/**
 * Canonical enumerations shared across client and server.
 *
 * These are authored as `const` objects + derived union types rather than TS
 * `enum`s so they erase cleanly under `verbatimModuleSyntax`, serialize as
 * plain strings over the wire, and can be iterated at runtime.
 */

/** Life stages gate which events, careers, and opportunities are available. */
export const LifeStage = {
  Childhood: 'childhood',
  Adolescence: 'adolescence',
  YoungAdult: 'young_adult',
  Adult: 'adult',
  Senior: 'senior',
  Elder: 'elder',
} as const;
export type LifeStage = (typeof LifeStage)[keyof typeof LifeStage];

/** Character biological sex / gender for this version (binary, expandable). */
export const Gender = {
  Male: 'male',
  Female: 'female',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

/** The visible primary stats (0–100). */
export const StatKey = {
  Health: 'health',
  Intelligence: 'intelligence',
  Happiness: 'happiness',
  Looks: 'looks',
} as const;
export type StatKey = (typeof StatKey)[keyof typeof StatKey];

/** Hidden internal stats — never rendered as bars, inferred through events. */
export const HiddenStatKey = {
  Stress: 'stress',
  Willpower: 'willpower',
} as const;
export type HiddenStatKey = (typeof HiddenStatKey)[keyof typeof HiddenStatKey];

/** Relationship categories. */
export const RelationType = {
  Parent: 'parent',
  Sibling: 'sibling',
  Friend: 'friend',
  Partner: 'partner',
  Child: 'child',
  Rival: 'rival',
  Mentor: 'mentor',
  Grandparent: 'grandparent',
  Aunt: 'aunt',
  Uncle: 'uncle',
  Cousin: 'cousin',
  Niece: 'niece',
  Nephew: 'nephew',
} as const;
export type RelationType = (typeof RelationType)[keyof typeof RelationType];

/** Thread categories — used by the (future) consequence engine. */
export const ThreadCategory = {
  Personal: 'personal',
  Career: 'career',
  Trauma: 'trauma',
  Generational: 'generational',
} as const;
export type ThreadCategory =
  (typeof ThreadCategory)[keyof typeof ThreadCategory];

/** Lifecycle of a Thread. */
export const ThreadStatus = {
  Active: 'active',
  Fired: 'fired',
  Expired: 'expired',
} as const;
export type ThreadStatus = (typeof ThreadStatus)[keyof typeof ThreadStatus];

/** Career tracks available in Phase 1. */
export const CareerTrack = {
  Technology: 'technology',
  Business: 'business',
  Healthcare: 'healthcare',
  CreativeArts: 'creative_arts',
  Trades: 'trades',
  Education: 'education',
} as const;
export type CareerTrack = (typeof CareerTrack)[keyof typeof CareerTrack];

/** Education levels. */
export const EducationLevel = {
  Elementary: 'elementary',
  Middle: 'middle',
  High: 'high',
  Trade: 'trade',
  University: 'university',
  Graduate: 'graduate',
} as const;
export type EducationLevel =
  (typeof EducationLevel)[keyof typeof EducationLevel];

/** Asset classes the player can hold. */
export const AssetType = {
  House: 'house',
  Car: 'car',
  Stocks: 'stocks',
  Savings: 'savings',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

/** University majors — gate eligibility for degree-required jobs. */
export const Major = {
  ComputerScience: 'computer_science',
  SoftwareEngineering: 'software_engineering',
  Business: 'business',
  Finance: 'finance',
  Economics: 'economics',
  Marketing: 'marketing',
  Medicine: 'medicine',
  Nursing: 'nursing',
  Law: 'law',
  Psychology: 'psychology',
  Education: 'education',
  Biology: 'biology',
  Chemistry: 'chemistry',
  Architecture: 'architecture',
  GraphicDesign: 'graphic_design',
} as const;
export type Major = (typeof Major)[keyof typeof Major];

/** Job tiers by entry barrier. */
export const JobCategory = {
  NoEducation: 'no_education',
  Trade: 'trade',
  University: 'university',
  Elite: 'elite',
} as const;
export type JobCategory = (typeof JobCategory)[keyof typeof JobCategory];

/** Education requirement a job demands. */
export const EducationRequirement = {
  None: 'none',
  HighSchool: 'high_school',
  Trade: 'trade',
  University: 'university',
} as const;
export type EducationRequirement =
  (typeof EducationRequirement)[keyof typeof EducationRequirement];

/** Purchasable property classes. */
export const PropertyType = {
  Apartment: 'apartment',
  SmallHouse: 'small_house',
  FamilyHouse: 'family_house',
  LuxuryHouse: 'luxury_house',
  Mansion: 'mansion',
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

/** Purchasable vehicle classes. */
export const VehicleType = {
  UsedCar: 'used_car',
  Sedan: 'sedan',
  SUV: 'suv',
  SportsCar: 'sports_car',
  LuxuryCar: 'luxury_car',
} as const;
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];

/** Romantic relationship progression stages. */
export const RelationStage = {
  Friend: 'friend',
  CloseFriend: 'close_friend',
  Dating: 'dating',
  Engaged: 'engaged',
  Married: 'married',
} as const;
export type RelationStage = (typeof RelationStage)[keyof typeof RelationStage];

/** Loan / debt categories. */
export const LoanType = {
  Student: 'student',
  Mortgage: 'mortgage',
  Personal: 'personal',
} as const;
export type LoanType = (typeof LoanType)[keyof typeof LoanType];

/** Wedding tiers — cost vs. happiness payoff. */
export const WeddingTier = {
  Small: 'small',
  Standard: 'standard',
  Luxury: 'luxury',
} as const;
export type WeddingTier = (typeof WeddingTier)[keyof typeof WeddingTier];

/* ------------------------------------------------------------------ *
 * Forward-compatibility enums.
 * Defined now, unused in Phase 1, so the later Fame / Economy / Country
 * systems are additive rather than a schema/type refactor.
 * ------------------------------------------------------------------ */

/** Dynamic economy phases (Phase 4). */
export const EconomyPhase = {
  Boom: 'boom',
  Stable: 'stable',
  Recession: 'recession',
  Crash: 'crash',
  Recovery: 'recovery',
} as const;
export type EconomyPhase = (typeof EconomyPhase)[keyof typeof EconomyPhase];

/** Country archetypes shaping starting conditions (Phase 3). */
export const CountryArchetype = {
  Meridia: 'meridia',
  Norvik: 'norvik',
  Aurelia: 'aurelia',
  Sambara: 'sambara',
  Kaizen: 'kaizen',
  CostaVerde: 'costa_verde',
  Petrov: 'petrov',
  Random: 'random',
} as const;
export type CountryArchetype =
  (typeof CountryArchetype)[keyof typeof CountryArchetype];

/** Fame tiers (Phase 4). */
export const FameTier = {
  Unknown: 'unknown',
  Local: 'local',
  Notable: 'notable',
  Famous: 'famous',
  Iconic: 'iconic',
} as const;
export type FameTier = (typeof FameTier)[keyof typeof FameTier];

/** Runtime-iterable list of the six primary stat keys. */
export const STAT_KEYS: readonly StatKey[] = Object.values(StatKey);

/** Runtime-iterable list of all life stages, in chronological order. */
export const LIFE_STAGES_IN_ORDER: readonly LifeStage[] = [
  LifeStage.Childhood,
  LifeStage.Adolescence,
  LifeStage.YoungAdult,
  LifeStage.Adult,
  LifeStage.Senior,
  LifeStage.Elder,
];
