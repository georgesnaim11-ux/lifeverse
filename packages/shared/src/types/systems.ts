import type { AssetType, CareerTrack, EducationLevel } from './enums.js';

/**
 * Domain types for game systems that must be visible to both client and server.
 * These complement the character/stats types and are returned by the API.
 */

export interface Finance {
  characterId: string;
  cash: number;
  annualIncome: number;
  annualExpenses: number;
  totalDebt: number;
  updatedAt: string;
}

export interface Career {
  id: string;
  characterId: string;
  track: CareerTrack;
  tier: number;
  yearsInRole: number;
  annualSalary: number;
  startAge: number | null;
  endAge: number | null;
  isActive: boolean;
}

export interface Education {
  id: string;
  characterId: string;
  level: EducationLevel;
  completed: boolean;
  gpa: number | null;
  debtIncurred: number;
  startAge: number | null;
  endAge: number | null;
}

export interface Asset {
  id: string;
  characterId: string;
  assetType: AssetType;
  value: number;
  purchaseAge: number | null;
  isActive: boolean;
}

export interface EarnedAchievement {
  id: string;
  characterId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface Save {
  id: string;
  characterId: string;
  saveName: string | null;
  isAutosave: boolean;
  savedAt: string;
}
