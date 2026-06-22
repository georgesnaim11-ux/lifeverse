import { Major } from '../types/enums.js';

export interface MajorDefinition {
  key: Major;
  label: string;
  description: string;
  /** Intelligence recommended to thrive (not a hard gate). */
  difficulty: number;
}

export const MAJORS: MajorDefinition[] = [
  { key: Major.ComputerScience,    label: 'Computer Science',    description: 'Algorithms, systems, and the logic that runs the world.', difficulty: 65 },
  { key: Major.SoftwareEngineering, label: 'Software Engineering', description: 'Building large software systems that actually ship.',      difficulty: 62 },
  { key: Major.Business,           label: 'Business',            description: 'Management, strategy, and the art of the deal.',          difficulty: 50 },
  { key: Major.Finance,            label: 'Finance',             description: 'Markets, investments, and the flow of money.',            difficulty: 60 },
  { key: Major.Economics,          label: 'Economics',           description: 'Incentives, markets, and how societies allocate.',        difficulty: 60 },
  { key: Major.Marketing,          label: 'Marketing',           description: 'Brands, psychology, and the science of persuasion.',      difficulty: 48 },
  { key: Major.Medicine,          label: 'Medicine',            description: 'The long road to healing the human body.',                difficulty: 80 },
  { key: Major.Nursing,            label: 'Nursing',             description: 'Frontline care and clinical compassion.',                 difficulty: 58 },
  { key: Major.Law,                label: 'Law',                 description: 'Statutes, precedent, and the art of argument.',           difficulty: 68 },
  { key: Major.Psychology,         label: 'Psychology',          description: 'The science of mind and behaviour.',                      difficulty: 52 },
  { key: Major.Education,          label: 'Education',           description: 'Pedagogy and the craft of teaching.',                     difficulty: 48 },
  { key: Major.Biology,            label: 'Biology',             description: 'Life, from cells to ecosystems.',                         difficulty: 60 },
  { key: Major.Chemistry,          label: 'Chemistry',           description: 'Matter, reactions, and molecular design.',                difficulty: 64 },
  { key: Major.Architecture,       label: 'Architecture',        description: 'Where art meets engineering and habitation.',             difficulty: 66 },
  { key: Major.GraphicDesign,      label: 'Graphic Design',      description: 'Visual communication and creative craft.',                difficulty: 45 },
];

export const MAJOR_REGISTRY: Map<Major, MajorDefinition> = new Map(MAJORS.map((m) => [m.key, m]));

export function getMajorLabel(key: Major | null | undefined): string {
  if (!key) return '';
  return MAJOR_REGISTRY.get(key)?.label ?? key;
}
