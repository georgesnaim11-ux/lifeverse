import type { RelationStage, RelationType } from './enums.js';

/**
 * Rich metadata stored as JSON on a relationship. Used for partners AND for
 * generated family members (parents, siblings, extended family, children).
 */
export interface PartnerMeta {
  age: number;
  occupation: string;
  education: string;
  /** This person's own happiness 0–100. */
  happiness: number;
  /** Health status 0–100 (for family members). */
  health?: number;
  /** 'male' | 'female' — used for children and family. */
  gender?: string;
  /** Age the relationship became dating (partners only). */
  datingStartAge?: number;
  engagementAge?: number;
  marriageAge?: number;
  /** Shared assets acquired together (labels). */
  sharedAssets?: string[];
}

/**
 * A relationship between the player character and another person.
 *
 * Bond and Trust move independently — you can love someone you don't trust.
 * `npcId` links to a procedurally generated NPC once that system lands
 * (Phase 2); it is nullable now for relationships seeded from flat event data.
 */
export interface Relationship {
  id: string;
  characterId: string;
  npcId: string | null;
  name: string;
  type: RelationType;
  /** Closeness, 0–100. */
  bond: number;
  /** Reliability/faith, 0–100. */
  trust: number;
  isAlive: boolean;
  /** Romantic progression stage (null for non-romantic relationships). */
  stage: RelationStage | null;
  /** Rich partner metadata for romantic relationships (null otherwise). */
  partner: PartnerMeta | null;
  /**
   * Compact log of shared moments, consumed by the Thread engine later to
   * build callback events. Stored as JSON; opaque in Phase 1.
   */
  history: RelationshipEvent[];
}

/** A single recorded interaction within a relationship's history. */
export interface RelationshipEvent {
  age: number;
  /** Short machine key describing what happened (e.g. "betrayal", "wedding"). */
  kind: string;
  bondDelta: number;
  trustDelta: number;
}
