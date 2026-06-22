import { EducationRequirement, JobCategory, Major } from '../types/enums.js';
import type { JobDefinition } from '../types/jobs.js';

/**
 * The full job catalogue. Salary ranges are annual USD. Promotion levels
 * interpolate linearly between baseSalary and maxSalary.
 */
export const JOBS: JobDefinition[] = [
  /* ───────────────── No Education Required ───────────────── */
  {
    id: 'fast_food_worker', title: 'Fast Food Worker', category: JobCategory.NoEducation,
    minAge: 16, requiredEducation: EducationRequirement.None,
    baseSalary: 19000, maxSalary: 28000, promotionLevels: 3,
    satisfaction: 35, stressImpact: 6, blurb: 'Flipping burgers and dreaming bigger.',
  },
  {
    id: 'cashier', title: 'Cashier', category: JobCategory.NoEducation,
    minAge: 16, requiredEducation: EducationRequirement.None,
    baseSalary: 21000, maxSalary: 30000, promotionLevels: 3,
    satisfaction: 38, stressImpact: 5, blurb: 'Scanning, smiling, surviving.',
  },
  {
    id: 'warehouse_worker', title: 'Warehouse Worker', category: JobCategory.NoEducation,
    minAge: 18, requiredEducation: EducationRequirement.None,
    baseSalary: 25000, maxSalary: 38000, promotionLevels: 3,
    satisfaction: 40, stressImpact: 7, blurb: 'Heavy lifting, honest pay.',
  },
  {
    id: 'cleaner', title: 'Cleaner', category: JobCategory.NoEducation,
    minAge: 18, requiredEducation: EducationRequirement.None,
    baseSalary: 22000, maxSalary: 32000, promotionLevels: 3,
    satisfaction: 36, stressImpact: 5, blurb: 'Keeping the world spotless.',
  },
  {
    id: 'delivery_driver', title: 'Delivery Driver', category: JobCategory.NoEducation,
    minAge: 18, requiredEducation: EducationRequirement.None,
    baseSalary: 27000, maxSalary: 42000, promotionLevels: 3,
    satisfaction: 45, stressImpact: 6, blurb: 'On the road, on your own time.',
  },

  /* ───────────────── Trade Careers ───────────────── */
  {
    id: 'electrician', title: 'Electrician', category: JobCategory.Trade,
    minAge: 18, requiredEducation: EducationRequirement.Trade,
    baseSalary: 45000, maxSalary: 90000, promotionLevels: 4,
    satisfaction: 60, stressImpact: 6, blurb: 'Wiring the world, one circuit at a time.',
  },
  {
    id: 'mechanic', title: 'Mechanic', category: JobCategory.Trade,
    minAge: 18, requiredEducation: EducationRequirement.Trade,
    baseSalary: 38000, maxSalary: 75000, promotionLevels: 4,
    satisfaction: 58, stressImpact: 6, blurb: 'If it has an engine, you can fix it.',
  },
  {
    id: 'plumber', title: 'Plumber', category: JobCategory.Trade,
    minAge: 18, requiredEducation: EducationRequirement.Trade,
    baseSalary: 45000, maxSalary: 95000, promotionLevels: 4,
    satisfaction: 57, stressImpact: 6, blurb: 'The unsung hero of every household.',
  },
  {
    id: 'carpenter', title: 'Carpenter', category: JobCategory.Trade,
    minAge: 18, requiredEducation: EducationRequirement.Trade,
    baseSalary: 40000, maxSalary: 80000, promotionLevels: 4,
    satisfaction: 62, stressImpact: 5, blurb: 'Building things that last.',
  },

  /* ───────────────── University Careers ───────────────── */
  {
    id: 'software_engineer', title: 'Software Engineer', category: JobCategory.University,
    minAge: 22, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.ComputerScience, Major.SoftwareEngineering],
    minIntelligence: 60, baseSalary: 75000, maxSalary: 170000, promotionLevels: 5,
    satisfaction: 65, stressImpact: 8, blurb: 'Turning caffeine into code.',
  },
  {
    id: 'doctor', title: 'Doctor', category: JobCategory.University,
    minAge: 24, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Medicine], minIntelligence: 70,
    baseSalary: 120000, maxSalary: 260000, promotionLevels: 5,
    satisfaction: 72, stressImpact: 12, blurb: 'Healing lives, losing sleep.',
  },
  {
    id: 'lawyer', title: 'Lawyer', category: JobCategory.University,
    minAge: 24, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Law], minIntelligence: 65,
    baseSalary: 80000, maxSalary: 200000, promotionLevels: 5,
    satisfaction: 60, stressImpact: 11, blurb: 'Objection! And billable hours.',
  },
  {
    id: 'teacher', title: 'Teacher', category: JobCategory.University,
    minAge: 22, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Education], minIntelligence: 50,
    baseSalary: 40000, maxSalary: 72000, promotionLevels: 4,
    satisfaction: 70, stressImpact: 8, blurb: 'Shaping the next generation.',
  },
  {
    id: 'accountant', title: 'Accountant', category: JobCategory.University,
    minAge: 22, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Finance, Major.Business, Major.Economics], minIntelligence: 58,
    baseSalary: 55000, maxSalary: 115000, promotionLevels: 5,
    satisfaction: 55, stressImpact: 7, blurb: 'Making the numbers behave.',
  },
  {
    id: 'architect', title: 'Architect', category: JobCategory.University,
    minAge: 24, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Architecture], minIntelligence: 62,
    baseSalary: 60000, maxSalary: 135000, promotionLevels: 5,
    satisfaction: 68, stressImpact: 8, blurb: 'Designing the skylines of tomorrow.',
  },
  {
    id: 'pharmacist', title: 'Pharmacist', category: JobCategory.University,
    minAge: 24, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Medicine, Major.Chemistry, Major.Biology], minIntelligence: 65,
    baseSalary: 90000, maxSalary: 145000, promotionLevels: 4,
    satisfaction: 62, stressImpact: 7, blurb: 'Precision, prescriptions, patience.',
  },
  {
    id: 'nurse', title: 'Nurse', category: JobCategory.University,
    minAge: 22, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Nursing], minIntelligence: 55,
    baseSalary: 60000, maxSalary: 105000, promotionLevels: 4,
    satisfaction: 68, stressImpact: 10, blurb: 'The heartbeat of every hospital.',
  },
  {
    id: 'marketing_manager', title: 'Marketing Manager', category: JobCategory.University,
    minAge: 24, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Marketing, Major.Business], minIntelligence: 55,
    baseSalary: 60000, maxSalary: 135000, promotionLevels: 5,
    satisfaction: 60, stressImpact: 8, blurb: 'Selling the dream, one campaign at a time.',
  },
  {
    id: 'financial_analyst', title: 'Financial Analyst', category: JobCategory.University,
    minAge: 22, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Finance, Major.Economics], minIntelligence: 62,
    baseSalary: 65000, maxSalary: 135000, promotionLevels: 5,
    satisfaction: 56, stressImpact: 9, blurb: 'Reading the markets like tea leaves.',
  },

  /* ───────────────── Elite Careers ───────────────── */
  {
    id: 'surgeon', title: 'Surgeon', category: JobCategory.Elite,
    minAge: 30, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Medicine], minIntelligence: 85, experienceRequired: 6,
    baseSalary: 250000, maxSalary: 600000, promotionLevels: 4,
    satisfaction: 78, stressImpact: 16, blurb: 'Steady hands, life in the balance.',
  },
  {
    id: 'judge', title: 'Judge', category: JobCategory.Elite,
    minAge: 35, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Law], minIntelligence: 80, experienceRequired: 10,
    baseSalary: 150000, maxSalary: 320000, promotionLevels: 3,
    satisfaction: 75, stressImpact: 10, blurb: 'The final word in the courtroom.',
  },
  {
    id: 'investment_banker', title: 'Investment Banker', category: JobCategory.Elite,
    minAge: 26, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Finance, Major.Economics], minIntelligence: 75, experienceRequired: 4,
    baseSalary: 150000, maxSalary: 500000, promotionLevels: 5,
    satisfaction: 55, stressImpact: 18, blurb: 'Big risks, bigger bonuses.',
  },
  {
    id: 'ceo', title: 'CEO', category: JobCategory.Elite,
    minAge: 35, requiredEducation: EducationRequirement.University,
    requiredMajors: [Major.Business, Major.Economics, Major.Finance], minIntelligence: 70, experienceRequired: 12,
    baseSalary: 200000, maxSalary: 1000000, promotionLevels: 4,
    satisfaction: 70, stressImpact: 15, blurb: 'The buck stops with you.',
  },
  {
    id: 'professor', title: 'Professor', category: JobCategory.Elite,
    minAge: 30, requiredEducation: EducationRequirement.University,
    minIntelligence: 80, experienceRequired: 6,
    baseSalary: 90000, maxSalary: 185000, promotionLevels: 4,
    satisfaction: 76, stressImpact: 7, blurb: 'Tenure, lectures, and lasting impact.',
  },
];

export const JOB_REGISTRY: Map<string, JobDefinition> = new Map(JOBS.map((j) => [j.id, j]));

export function getJobById(id: string): JobDefinition | undefined {
  return JOB_REGISTRY.get(id);
}

/** Salary for a given promotion level (1-indexed). */
export function salaryForLevel(job: JobDefinition, level: number): number {
  if (job.promotionLevels <= 1) return job.baseSalary;
  const clamped = Math.max(1, Math.min(level, job.promotionLevels));
  const step = (job.maxSalary - job.baseSalary) / (job.promotionLevels - 1);
  return Math.round(job.baseSalary + step * (clamped - 1));
}
