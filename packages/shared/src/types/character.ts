import type { Gender, LifeStage, Major } from './enums.js';
import type { StatBlock } from './stats.js';
import type { TraitKey } from './traits.js';

/**
 * A character — one life within a bloodline.
 *
 * Forward-compat fields (`bloodlineId`, `parentId`, `isHeir`, `fame`) exist now
 * but are defaulted in Phase 1: every character gets its own single-generation
 * bloodline, no parent, `fame = 0`. Generational play (Phase 3) and the Fame
 * system (Phase 4) activate these without a schema change.
 */
export interface Character {
  id: string;
  bloodlineId: string;
  /** Null in Phase 1; set when a character is born as an heir (Phase 3). */
  parentId: string | null;
  name: string;
  /** In-world birth year (cosmetic in Phase 1). */
  birthYear: number;
  age: number;
  lifeStage: LifeStage;
  isAlive: boolean;
  isHeir: boolean;
  /** Forward-compat (Phase 4). Always 0 in Phase 1. */
  fame: number;
  /** Country of origin (real-country id from the COUNTRIES registry). */
  country: string;
  /** Demonym for the country, e.g. "Egyptian". Derived from country. */
  nationality: string;
  /** Biological sex / gender. */
  gender: Gender;
  /** University major, chosen on enrolment. Null until/unless declared. */
  major: Major | null;
  createdAt: string;
}

/** Full character state assembled for the client. */
export interface CharacterState {
  character: Character;
  stats: StatBlock;
  traits: TraitKey[];
}

/**
 * Input accepted when creating a character.
 * Validation (name length, stat point budget) is enforced server-side.
 */
export interface CharacterCreationInput {
  /** Player's first name. */
  name: string;
  /** Player's last name. If omitted, a surname is generated from the country. */
  lastName?: string;
  /**
   * Optional player-allocated starting stat bias. The creation service applies
   * a fixed point budget; omitted stats default to the baseline.
   */
  statAllocation?: Partial<StatBlock>;
  /** Country id from the COUNTRIES registry. */
  country?: string;
  /** Chosen gender. Defaults to a random choice if omitted. */
  gender?: Gender;
}
