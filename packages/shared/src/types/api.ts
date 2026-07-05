import type { CharacterCreationInput, CharacterState } from './character.js';
import type { EventLogEntry, PresentedEvent, NavTarget } from './events.js';
import type { FocusBudget, FocusAction } from './focus.js';
import type { Relationship } from './relationships.js';
import type { Finance, Career, Education, EarnedAchievement } from './systems.js';
import type { DomainState } from './domains.js';
import type { CharacterResources } from './resources.js';
import type { ActivityDefinition } from './activities.js';
import type { JobState, JobEligibility } from './jobs.js';
import type { OwnedAsset } from './shop.js';
import type { Loan, ExpenseBreakdown, FinanceSummary, LifeSummary, TimelineEntry } from './finance.js';
import type { HousingState, Listing, OwnedProperty } from './housing.js';
import type { OwnedVehicle, VehicleListing } from './vehicles.js';
import type { SportsCareerState } from './sports.js';
import type { BusinessState } from './business.js';
import type { OwnedCollectible } from './collectibles.js';
import type { EducationRequirement, Major, PropertyType, VehicleType, WeddingTier } from './enums.js';

/**
 * The HTTP contract between client and server.
 *
 * Routes are implemented in a later milestone; defining the DTOs now lets the
 * client and server be built against a fixed interface.
 */

/** Standard error envelope returned by all endpoints on failure. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    /** Optional field-level validation details. */
    details?: Record<string, string>;
  };
}

/** Generic success envelope. */
export interface ApiSuccess<T> {
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/* ----------------------------- Endpoints ----------------------------- */

/** POST /api/character */
export type CreateCharacterRequest = CharacterCreationInput;
export interface CreateCharacterResponse {
  state: CharacterState;
}

/** GET /api/character/:id */
export interface GetCharacterResponse {
  state: CharacterState;
  relationships: Relationship[];
  /** @deprecated time-slot/focus system removed; inert. */
  focus?: FocusBudget;
  /** @deprecated */
  availableFocusActions?: FocusAction[];
  finance: Finance;
  careers: Career[];
  education: Education[];
  achievements: EarnedAchievement[];
  eventLog: EventLogEntry[];
  domains: DomainState;
  /** @deprecated time-slot/energy system removed; inert. */
  resources?: CharacterResources;
  /** @deprecated old domain-gated activities replaced by the Activities system. */
  availableActivities?: ActivityDefinition[];
  /** Current active job, if any. */
  job: JobState | null;
  /** All jobs with per-job eligibility for the careers screen. */
  eligibleJobs: JobEligibility[];
  /** Properties and vehicles the character owns. */
  ownedAssets: OwnedAsset[];
  /** Boolean game-state flags (hasHighSchool, inUniversity, isEmployed, …). */
  flags: Record<string, boolean>;
  /** Active loans/debts. */
  loans: Loan[];
  /** Itemised annual expenses. */
  expenses: ExpenseBreakdown;
  /** Full balance-sheet snapshot. */
  financeSummary: FinanceSummary;
  /** Chronological life-story timeline. */
  timeline: TimelineEntry[];
  /** Current housing situation (where the character lives). */
  housing: HousingState;
  /** Available property market listings for the character's country. */
  listings: Listing[];
  /** Every property the character owns (residence + investments). */
  properties: OwnedProperty[];
  /** Every vehicle the character owns (the garage). */
  garage: OwnedVehicle[];
  /** Vehicles available to buy at the dealership. */
  dealership: VehicleListing[];
  /** Luxury collectibles the character owns (watches, jewelry, art, boats, aircraft). */
  collectibles: OwnedCollectible[];
  /** Athletic career (school team → pro club), or null if none. */
  sports: SportsCareerState | null;
  /** The company the character runs, or null. */
  business: BusinessState | null;
}

/** POST /api/game/age-up */
export interface AgeUpRequest {
  characterId: string;
}
export interface AgeUpResponse {
  state: CharacterState;
  /** Events surfaced this year, awaiting player choices. */
  events: PresentedEvent[];
  focus?: FocusBudget;
  availableFocusActions?: FocusAction[];
  finance: Finance;
  isDead: boolean;
  newAchievements: EarnedAchievement[];
  domains: DomainState;
  resources?: CharacterResources;
  availableActivities?: ActivityDefinition[];
  job: JobState | null;
  eligibleJobs: JobEligibility[];
  ownedAssets: OwnedAsset[];
  /** Set when isDead — the tombstone/life summary. */
  causeOfDeath?: string;
  lifeSummary?: LifeSummary;
}

/** POST /api/game/choose */
export interface ChooseRequest {
  characterId: string;
  eventId: string;
  choiceId: string;
}
export interface ChooseResponse {
  state: CharacterState;
  logEntry: EventLogEntry;
  newAchievements: EarnedAchievement[];
  /** If the chosen option routes the player to an existing tab. */
  navigateTo?: NavTarget;
}

/** POST /api/game/focus-action — kept for backwards compat, may be removed later */
export interface FocusActionRequest {
  characterId: string;
  actionKey: string;
}
export interface FocusActionResponse {
  state: CharacterState;
  focus: FocusBudget;
  appliedAction: FocusAction;
}

/** POST /api/activity/perform */
export interface PerformActivityRequest {
  characterId: string;
  activityId: string;
}
export interface PerformActivityResponse {
  state: CharacterState;
  resources: CharacterResources;
  domains: DomainState;
  finance: Finance;
  appliedActivity: ActivityDefinition;
}

/** POST /api/save */
export interface CreateSaveRequest {
  characterId: string;
  saveName?: string;
}
export interface CreateSaveResponse {
  saveId: string;
  savedAt: string;
}

/* ───────────────── Careers ───────────────── */

/** POST /api/career/apply */
export interface ApplyJobRequest { characterId: string; jobId: string; }
/** POST /api/career/promote, /quit, /work-hard */
export interface CareerActionRequest { characterId: string; }
export interface CareerActionResponse {
  state: CharacterState;
  job: JobState | null;
  finance: Finance;
  eligibleJobs: JobEligibility[];
  message: string;
}

/* ───────────────── Education ───────────────── */

/** POST /api/education/enroll */
export interface EnrollRequest {
  characterId: string;
  level: EducationRequirement | 'graduate';
  major?: Major;
}
export interface EducationActionRequest { characterId: string; }
export interface EducationActionResponse {
  state: CharacterState;
  education: Education[];
  finance: Finance;
  message: string;
}

/* ───────────────── Shopping ───────────────── */

/** POST /api/shop/buy-property */
export interface BuyPropertyRequest { characterId: string; propertyType: PropertyType; }
/** POST /api/shop/buy-vehicle */
export interface BuyVehicleRequest { characterId: string; vehicleType: VehicleType; }
export interface ShopResponse {
  state: CharacterState;
  finance: Finance;
  ownedAssets: OwnedAsset[];
  message: string;
}

/* ───────────────── Relationships / Love ───────────────── */

export interface RelationshipActionRequest { characterId: string; }
/** POST /api/relationship/plan-wedding */
export interface PlanWeddingRequest { characterId: string; tier: WeddingTier; }
/** All love actions return just a message; client refetches full state. */
export interface MessageResponse { message: string; }
