/** School sports the player can try out for. */
export const Sport = {
  Football: 'football',
  Basketball: 'basketball',
  Soccer: 'soccer',
  Baseball: 'baseball',
  Volleyball: 'volleyball',
  Tennis: 'tennis',
  Swimming: 'swimming',
  Track: 'track',
  Wrestling: 'wrestling',
  Golf: 'golf',
} as const;
export type Sport = (typeof Sport)[keyof typeof Sport];

/** Where the athletic arc currently stands. */
export const SportsPhase = {
  School: 'school',
  Pro: 'pro',
  Retired: 'retired',
} as const;
export type SportsPhase = (typeof SportsPhase)[keyof typeof SportsPhase];

/** Metadata for a sport in the catalog. */
export interface SportDef {
  id: Sport;
  label: string;
  emoji: string;
  /** What "points" are called for this sport (goals, points, laps won…). */
  scoreNoun: string;
  /** Whether assists are tracked (team ball sports). */
  hasAssists: boolean;
}

/** A professional club/league destination for a sport. */
export interface ProClub {
  id: string;
  name: string;
  sportId: Sport;
  /** 1 (minor) .. 5 (world-famous). Gates on reputation/skill. */
  prestige: number;
  /** Base annual salary at this club [min, max]. */
  salaryBand: [number, number];
}

/** One of the yearly development decisions. */
export interface TrainingDecision {
  id: string;
  label: string;
  emoji: string;
  /** Which phase(s) offer it. */
  phases: SportsPhase[];
  skill: number;
  fitness: number;
  reputation: number;
  coach: number;
  /** 0..1 chance this decision causes an injury. */
  injuryRisk: number;
  /** Side-effects on the character (applied via stat engine). */
  happiness?: number;
  health?: number;
  stress?: number;
  description: string;
}

/** What kind of move a pending offer represents. */
export const OfferType = {
  Transfer: 'transfer',
  Loan: 'loan',
  Renewal: 'renewal',
} as const;
export type OfferType = (typeof OfferType)[keyof typeof OfferType];

/** One professional season's line in the career history. */
export interface SeasonRecord {
  age: number;
  club: string;
  apps: number;
  points: number;
  assists: number;
  cleanSheets: number;
  /** Season average match rating, 4.0–9.9. */
  rating: number;
  trophies: string[];
}

/** The full sports-career state sent to the client. */
export interface SportsCareerState {
  characterId: string;
  sport: Sport;
  phase: SportsPhase;
  teamName: string | null;
  clubId: string | null;
  /** 1..5 school tier (New Member → School Star). */
  tier: number;
  skill: number;
  fitness: number;
  reputation: number;
  coachApproval: number;
  yearsActive: number;
  lastDecisionAge: number;
  injuryYears: number;
  hasScholarship: boolean;
  pendingOfferClub: string | null;
  pendingOfferSalary: number;
  salary: number;
  marketValue: number;
  appearances: number;
  points: number;
  assists: number;
  championships: number;
  careerEarnings: number;
  awards: string[];
  hallOfFame: boolean;
  /** Seasons left on the current contract; 0 while a free agent. */
  contractYears: number;
  /** Career average match rating. */
  avgRating: number;
  cleanSheets: number;
  seasonHistory: SeasonRecord[];
  pendingOfferType: OfferType | null;
  /** Set while out on loan: the parent club to return to. */
  loanReturnClub: string | null;
  loanYears: number;
  captain: boolean;
}
