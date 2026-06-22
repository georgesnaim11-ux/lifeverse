import type { EducationRequirement, JobCategory, Major } from './enums.js';

/**
 * A concrete job the player can hold. Jobs are authored as data so both client
 * (eligibility preview) and server (validation + payroll) share one source.
 */
export interface JobDefinition {
  id: string;
  title: string;
  category: JobCategory;
  /** Minimum age to be hired. */
  minAge: number;
  /** Education tier required to be eligible. */
  requiredEducation: EducationRequirement;
  /**
   * If set, the player's university major must be one of these. Empty/undefined
   * means any major (or none) is acceptable.
   */
  requiredMajors?: Major[];
  /** Minimum intelligence stat to be hired. */
  minIntelligence?: number;
  /** Years of prior total work experience required (elite jobs). */
  experienceRequired?: number;
  /** Starting annual salary. */
  baseSalary: number;
  /** Salary at the top promotion level. */
  maxSalary: number;
  /** Number of promotion levels (1 = entry only, no raises). */
  promotionLevels: number;
  /** Base job satisfaction 0–100 (affects happiness each year). */
  satisfaction: number;
  /** Stress added per year worked. */
  stressImpact: number;
  /** Short flavour line shown in the careers list. */
  blurb: string;
}

/** A held job instance for a character. */
export interface JobState {
  id: string;
  characterId: string;
  jobId: string;
  title: string;
  category: JobCategory;
  level: number;
  annualSalary: number;
  yearsInRole: number;
  satisfaction: number;
  startAge: number;
  isActive: boolean;
}

/** Result of checking whether a character can take a job. */
export interface JobEligibility {
  job: JobDefinition;
  eligible: boolean;
  /** Human-readable reasons the player is blocked (empty if eligible). */
  reasons: string[];
}
