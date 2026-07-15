import type { LoanType } from './enums.js';

/** An individual debt the character is paying down. */
export interface Loan {
  id: string;
  characterId: string;
  type: LoanType;
  label: string;
  originalPrincipal: number;
  balance: number;
  interestRate: number;
  /** Scheduled payment per year. */
  annualPayment: number;
  isActive: boolean;
}

/** Itemised annual expenses. */
export interface ExpenseBreakdown {
  housing: number;
  vehicle: number;
  education: number;
  family: number;
  lifestyle: number;
  loanPayments: number;
  total: number;
}

/** A full balance-sheet snapshot. */
export interface FinanceSummary {
  // Assets
  cash: number;
  propertyValue: number;
  vehicleValue: number;
  totalAssets: number;
  // Liabilities
  studentDebt: number;
  mortgageDebt: number;
  personalDebt: number;
  totalLiabilities: number;
  // Bottom line
  netWorth: number;
  annualIncome: number;
  /** Net annual rental income from rented-out investment properties. */
  rentalIncome: number;
  /** Combined current value of every owned property (residence + investments). */
  portfolioValue: number;
  /** Combined value of luxury collectibles (watches, jewelry, art, boats, aircraft). */
  collectiblesValue: number;
  /** Value of the character's company (valuation while open). */
  businessEquity: number;
  /** Income tax owed this year on salary + rental income (country-based). */
  annualTax: number;
  /** Blended effective income-tax rate this year, 0–1. */
  effectiveTaxRate: number;
}

/** A single dated moment in a character's life story. */
export interface TimelineEntry {
  age: number;
  text: string;
  /** Category for icon/colour: education | career | family | finance | milestone | death. */
  kind: string;
}

/** Legacy scoring breakdown shown on the tombstone. */
export interface LegacyScore {
  wealth: number;
  education: number;
  happiness: number;
  career: number;
  relationships: number;
  achievements: number;
  total: number;
  /** Ordinary | Successful | Extraordinary | Legendary. */
  rank: string;
}

/** End-of-life tombstone summary. */
export interface LifeSummary {
  name: string;
  birthYear: number;
  deathYear: number;
  ageAtDeath: number;
  causeOfDeath: string;
  netWorth: number;
  careerTitle: string;
  educationLevel: string;
  relationshipStatus: string;
  childrenCount: number;
  epitaph: string;
  legacy: LegacyScore;
  highlights: TimelineEntry[];
}
