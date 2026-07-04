import { Sport, SportsPhase } from '../types/sports.js';
import type { SportDef, ProClub, TrainingDecision } from '../types/sports.js';

/** Minimum age to try out for a school team. */
export const SPORTS_MIN_AGE = 12;
/** Age at which yearly performance starts declining for pros. */
export const SPORTS_DECLINE_AGE = 30;
/** Skill+reputation needed (combined) for a scholarship offer at 17–18. */
export const SCHOLARSHIP_THRESHOLD = 90;
/** Combined skill+reputation floor before any pro offer can appear. */
export const PRO_OFFER_THRESHOLD = 120;

export const SPORTS: SportDef[] = [
  { id: Sport.Football,   label: 'Football',      emoji: '🏈', scoreNoun: 'touchdowns', hasAssists: false },
  { id: Sport.Basketball, label: 'Basketball',    emoji: '🏀', scoreNoun: 'points',     hasAssists: true },
  { id: Sport.Soccer,     label: 'Soccer',        emoji: '⚽', scoreNoun: 'goals',      hasAssists: true },
  { id: Sport.Baseball,   label: 'Baseball',      emoji: '⚾', scoreNoun: 'home runs',  hasAssists: false },
  { id: Sport.Volleyball, label: 'Volleyball',    emoji: '🏐', scoreNoun: 'points',     hasAssists: true },
  { id: Sport.Tennis,     label: 'Tennis',        emoji: '🎾', scoreNoun: 'titles',     hasAssists: false },
  { id: Sport.Swimming,   label: 'Swimming',      emoji: '🏊', scoreNoun: 'race wins',  hasAssists: false },
  { id: Sport.Track,      label: 'Track & Field', emoji: '🏃', scoreNoun: 'race wins',  hasAssists: false },
  { id: Sport.Wrestling,  label: 'Wrestling',     emoji: '🤼', scoreNoun: 'match wins', hasAssists: false },
  { id: Sport.Golf,       label: 'Golf',          emoji: '⛳', scoreNoun: 'tournament wins', hasAssists: false },
];
export const SPORT_BY_ID = new Map<Sport, SportDef>(SPORTS.map((s) => [s.id, s]));

/** School tier progression labels, index 1..5. */
export const SCHOOL_TIER_LABELS = ['', 'New Team Member', 'Regular Player', 'Key Starter', 'Team Captain', 'School Star Athlete'];
/** Skill+reputation thresholds to reach tier 2..5. */
export const TIER_THRESHOLDS = [0, 0, 45, 80, 115, 150];

export const PRO_CLUBS: ProClub[] = [
  // ── Soccer (full ladder 1–5) ──
  { id: 'barcelona',  name: 'FC Barcelona',      sportId: Sport.Soccer, prestige: 5, salaryBand: [8_000_000, 30_000_000] },
  { id: 'realmadrid', name: 'Real Madrid',       sportId: Sport.Soccer, prestige: 5, salaryBand: [8_000_000, 30_000_000] },
  { id: 'mancity',    name: 'Manchester City',   sportId: Sport.Soccer, prestige: 5, salaryBand: [7_000_000, 25_000_000] },
  { id: 'psg',        name: 'Paris Saint-Germain', sportId: Sport.Soccer, prestige: 5, salaryBand: [7_000_000, 28_000_000] },
  { id: 'bayern',     name: 'Bayern Munich',     sportId: Sport.Soccer, prestige: 5, salaryBand: [6_000_000, 24_000_000] },
  { id: 'liverpool',  name: 'Liverpool FC',      sportId: Sport.Soccer, prestige: 4, salaryBand: [4_000_000, 18_000_000] },
  { id: 'inter',      name: 'Inter Milan',       sportId: Sport.Soccer, prestige: 4, salaryBand: [3_000_000, 14_000_000] },
  { id: 'dortmund',   name: 'Borussia Dortmund', sportId: Sport.Soccer, prestige: 4, salaryBand: [2_500_000, 12_000_000] },
  { id: 'ajax',       name: 'Ajax Amsterdam',    sportId: Sport.Soccer, prestige: 3, salaryBand: [900_000, 4_000_000] },
  { id: 'porto',      name: 'FC Porto',          sportId: Sport.Soccer, prestige: 3, salaryBand: [800_000, 3_500_000] },
  { id: 'sevilla',    name: 'Sevilla FC',        sportId: Sport.Soccer, prestige: 3, salaryBand: [900_000, 4_500_000] },
  { id: 'celtic',     name: 'Celtic FC',         sportId: Sport.Soccer, prestige: 2, salaryBand: [250_000, 1_500_000] },
  { id: 'leedsutd',   name: 'Leeds United',      sportId: Sport.Soccer, prestige: 2, salaryBand: [300_000, 1_800_000] },
  { id: 'unionfc',    name: 'Union FC',          sportId: Sport.Soccer, prestige: 1, salaryBand: [60_000, 250_000] },
  // ── Basketball ──
  { id: 'lakers',     name: 'Los Angeles Lakers', sportId: Sport.Basketball, prestige: 5, salaryBand: [5_000_000, 40_000_000] },
  { id: 'celtics',    name: 'Boston Celtics',     sportId: Sport.Basketball, prestige: 5, salaryBand: [5_000_000, 40_000_000] },
  { id: 'warriors',   name: 'Golden State Warriors', sportId: Sport.Basketball, prestige: 5, salaryBand: [4_500_000, 38_000_000] },
  { id: 'heat',       name: 'Miami Heat',        sportId: Sport.Basketball, prestige: 4, salaryBand: [2_500_000, 22_000_000] },
  { id: 'knicks',     name: 'New York Knicks',   sportId: Sport.Basketball, prestige: 4, salaryBand: [2_500_000, 22_000_000] },
  { id: 'bulls',      name: 'Chicago Bulls',     sportId: Sport.Basketball, prestige: 4, salaryBand: [2_000_000, 20_000_000] },
  { id: 'euromadrid', name: 'Real Madrid Baloncesto', sportId: Sport.Basketball, prestige: 3, salaryBand: [500_000, 3_000_000] },
  { id: 'euroleague', name: 'EuroLeague Athens', sportId: Sport.Basketball, prestige: 2, salaryBand: [120_000, 800_000] },
  { id: 'gleague',    name: 'Capital City G-League', sportId: Sport.Basketball, prestige: 1, salaryBand: [40_000, 120_000] },
  // ── Baseball ──
  { id: 'yankees',    name: 'New York Yankees',  sportId: Sport.Baseball, prestige: 5, salaryBand: [4_000_000, 30_000_000] },
  { id: 'dodgers',    name: 'LA Dodgers',        sportId: Sport.Baseball, prestige: 5, salaryBand: [3_500_000, 28_000_000] },
  { id: 'redsox',     name: 'Boston Red Sox',    sportId: Sport.Baseball, prestige: 4, salaryBand: [2_000_000, 18_000_000] },
  { id: 'giantsbb',   name: 'SF Giants',         sportId: Sport.Baseball, prestige: 3, salaryBand: [900_000, 8_000_000] },
  { id: 'aaa',        name: 'Triple-A Sounds',   sportId: Sport.Baseball, prestige: 2, salaryBand: [60_000, 200_000] },
  { id: 'minors',     name: 'Riverside Minors',  sportId: Sport.Baseball, prestige: 1, salaryBand: [30_000, 90_000] },
  // ── Football ──
  { id: 'cowboys',    name: 'Dallas Cowboys',    sportId: Sport.Football, prestige: 5, salaryBand: [3_000_000, 25_000_000] },
  { id: 'chiefs',     name: 'Kansas City Chiefs', sportId: Sport.Football, prestige: 5, salaryBand: [3_000_000, 26_000_000] },
  { id: 'packers',    name: 'Green Bay Packers', sportId: Sport.Football, prestige: 4, salaryBand: [1_500_000, 15_000_000] },
  { id: 'ninersfb',   name: 'SF 49ers',          sportId: Sport.Football, prestige: 4, salaryBand: [1_500_000, 16_000_000] },
  { id: 'usfl',       name: 'Spring League',     sportId: Sport.Football, prestige: 2, salaryBand: [60_000, 220_000] },
  { id: 'arenaball',  name: 'Arena League',      sportId: Sport.Football, prestige: 1, salaryBand: [40_000, 100_000] },
  // ── Volleyball ──
  { id: 'modena',     name: 'Modena Volley',     sportId: Sport.Volleyball, prestige: 4, salaryBand: [200_000, 900_000] },
  { id: 'zenitvb',    name: 'Zenit Kazan',       sportId: Sport.Volleyball, prestige: 3, salaryBand: [120_000, 500_000] },
  { id: 'beachtour',  name: 'National Beach Tour', sportId: Sport.Volleyball, prestige: 2, salaryBand: [40_000, 150_000] },
  { id: 'regionvb',   name: 'Regional Volley League', sportId: Sport.Volleyball, prestige: 1, salaryBand: [20_000, 70_000] },
  // ── Tennis ──
  { id: 'atptour',    name: 'ATP World Tour',    sportId: Sport.Tennis, prestige: 5, salaryBand: [500_000, 12_000_000] },
  { id: 'atp250',     name: 'ATP 250 Circuit',   sportId: Sport.Tennis, prestige: 3, salaryBand: [120_000, 900_000] },
  { id: 'challenger', name: 'Challenger Tour',   sportId: Sport.Tennis, prestige: 2, salaryBand: [40_000, 200_000] },
  { id: 'futures',    name: 'ITF Futures',       sportId: Sport.Tennis, prestige: 1, salaryBand: [15_000, 60_000] },
  // ── Swimming ──
  { id: 'islswim',    name: 'International Swim League', sportId: Sport.Swimming, prestige: 5, salaryBand: [250_000, 2_500_000] },
  { id: 'proswim',    name: 'Pro Swim Series',   sportId: Sport.Swimming, prestige: 4, salaryBand: [100_000, 1_500_000] },
  { id: 'natswim',    name: 'National Swim League', sportId: Sport.Swimming, prestige: 2, salaryBand: [30_000, 120_000] },
  { id: 'clubswim',   name: 'Metro Aquatics Club', sportId: Sport.Swimming, prestige: 1, salaryBand: [15_000, 50_000] },
  // ── Track ──
  { id: 'diamond',    name: 'Diamond League',    sportId: Sport.Track, prestige: 5, salaryBand: [150_000, 3_000_000] },
  { id: 'contgold',   name: 'Continental Gold Tour', sportId: Sport.Track, prestige: 3, salaryBand: [60_000, 400_000] },
  { id: 'nattrack',   name: 'National Athletics Circuit', sportId: Sport.Track, prestige: 2, salaryBand: [30_000, 120_000] },
  { id: 'clubtrack',  name: 'City Track Club',   sportId: Sport.Track, prestige: 1, salaryBand: [12_000, 45_000] },
  // ── Wrestling ──
  { id: 'prowrestle', name: 'World Wrestling League', sportId: Sport.Wrestling, prestige: 4, salaryBand: [200_000, 3_000_000] },
  { id: 'natwrestle', name: 'National Wrestling Alliance', sportId: Sport.Wrestling, prestige: 3, salaryBand: [80_000, 500_000] },
  { id: 'regionwrestle', name: 'Regional Wrestling Circuit', sportId: Sport.Wrestling, prestige: 1, salaryBand: [25_000, 80_000] },
  // ── Golf ──
  { id: 'pgatour',    name: 'PGA Tour',          sportId: Sport.Golf, prestige: 5, salaryBand: [500_000, 10_000_000] },
  { id: 'dpworld',    name: 'DP World Tour',     sportId: Sport.Golf, prestige: 4, salaryBand: [200_000, 3_000_000] },
  { id: 'korntour',   name: 'Korn Ferry Tour',   sportId: Sport.Golf, prestige: 2, salaryBand: [50_000, 250_000] },
  { id: 'minigolf',   name: 'Regional Q-School', sportId: Sport.Golf, prestige: 1, salaryBand: [15_000, 60_000] },
];
export const CLUB_BY_ID = new Map<string, ProClub>(PRO_CLUBS.map((c) => [c.id, c]));
export function clubsForSport(sport: Sport): ProClub[] {
  return PRO_CLUBS.filter((c) => c.sportId === sport);
}

const S = SportsPhase;
export const TRAINING_DECISIONS: TrainingDecision[] = [
  { id: 'train_harder', label: 'Train Harder',        emoji: '🔥', phases: [S.School, S.Pro], skill: 6,  fitness: 3,  reputation: 2, coach: 4,  injuryRisk: 0.10, stress: 4, description: 'Push your limits. Big gains, some burnout risk.' },
  { id: 'fitness',      label: 'Focus On Fitness',    emoji: '💪', phases: [S.School, S.Pro], skill: 2,  fitness: 7,  reputation: 1, coach: 3,  injuryRisk: 0.04, health: 3, description: 'Build the engine. Fewer injuries down the road.' },
  { id: 'teamwork',     label: 'Practice With Teammates', emoji: '🤝', phases: [S.School, S.Pro], skill: 4, fitness: 2, reputation: 4, coach: 4, injuryRisk: 0.05, happiness: 3, description: 'Chemistry wins games — and friends.' },
  { id: 'technique',    label: 'Work On Technique',   emoji: '🎯', phases: [S.School, S.Pro], skill: 7,  fitness: 1,  reputation: 2, coach: 3,  injuryRisk: 0.03, description: 'Precision over power.' },
  { id: 'rest',         label: 'Rest And Recover',    emoji: '😴', phases: [S.School, S.Pro], skill: 0,  fitness: 4,  reputation: 0, coach: 1,  injuryRisk: 0.0,  health: 4, stress: -6, description: 'Recovery is training too. Heals injuries faster.' },
  { id: 'film',         label: 'Study Game Film',     emoji: '🎬', phases: [S.School, S.Pro], skill: 5,  fitness: 0,  reputation: 1, coach: 5,  injuryRisk: 0.0,  description: 'See the game before it happens.' },
  { id: 'skip',         label: 'Skip Practice',       emoji: '🙈', phases: [S.School, S.Pro], skill: -4, fitness: -3, reputation: -3, coach: -10, injuryRisk: 0.0, happiness: 2, description: 'The coach will notice. They always notice.' },
  { id: 'party',        label: 'Party Instead',       emoji: '🎉', phases: [S.School, S.Pro], skill: -3, fitness: -5, reputation: -2, coach: -8, injuryRisk: 0.06, happiness: 6, stress: -4, description: 'Great night. Rough morning. Angry coach.' },
  // Pro-only extras
  { id: 'media',        label: 'Handle Media Well',   emoji: '🎙️', phases: [S.Pro], skill: 0, fitness: 0, reputation: 6, coach: 2, injuryRisk: 0.0, description: 'Charm the press, grow the brand.' },
  { id: 'trainer',      label: 'Hire Elite Trainer',  emoji: '🧑‍🏫', phases: [S.Pro], skill: 5, fitness: 5, reputation: 1, coach: 2, injuryRisk: 0.02, description: 'Costs nothing here but sweat — world-class guidance.' },
];
export const DECISION_BY_ID = new Map<string, TrainingDecision>(TRAINING_DECISIONS.map((d) => [d.id, d]));

/* ─────────────── Pro-career depth tuning ─────────────── */

/** Combined skill+reputation for offers straight out of school.
 * Tuned for ORGANIC play: a dedicated athlete (good yearly decisions from 13)
 * reaches ~85–120 by 18–20 — don't calibrate these against test-pumped stats. */
export const ELITE_OFFER_SCORE = 115;   // offers up to prestige 5
export const GOOD_OFFER_SCORE = 85;     // offers capped at prestige 2
/** Contract length by club prestige: [minYears, maxYears]. */
export const CONTRACT_YEARS_RANGE: [number, number] = [2, 5];
/** Season rating thresholds for individual honours. */
export const RATING_TEAM_OF_YEAR = 8.0;
export const RATING_PLAYER_OF_SEASON = 8.3;
export const RATING_BALLON_DOR = 8.5;   // + club prestige >= 4
/** Season points needed for the Golden Boot / top-scorer award, by sport. */
export const GOLDEN_BOOT_POINTS: Partial<Record<Sport, number>> = {
  [Sport.Soccer]: 25, [Sport.Basketball]: 800, [Sport.Football]: 14,
  [Sport.Baseball]: 35, [Sport.Volleyball]: 300,
};
/** Single-season points that set a new club record, by sport. */
export const CLUB_RECORD_POINTS: Partial<Record<Sport, number>> = {
  [Sport.Soccer]: 40, [Sport.Basketball]: 1200, [Sport.Football]: 20,
  [Sport.Baseball]: 50, [Sport.Volleyball]: 450, [Sport.Tennis]: 8,
  [Sport.Swimming]: 12, [Sport.Track]: 12, [Sport.Wrestling]: 25, [Sport.Golf]: 5,
};
/** Sports where a "clean sheet" defensive stat makes sense. */
export const CLEAN_SHEET_SPORTS: Sport[] = [Sport.Soccer, Sport.Football, Sport.Volleyball];
/** Loan trigger: young + benched at a big club. */
export const LOAN_MAX_AGE = 22;
export const LOAN_COACH_THRESHOLD = 40;
export const LOAN_MIN_PRESTIGE = 4;
/** History cap so the JSON column stays small. */
export const SEASON_HISTORY_CAP = 25;

/** School awards, rolled annually from skill + reputation. */
export const SCHOOL_AWARDS = ['MVP', 'Team Captain', 'Athlete of the Year', 'Championship Winner', 'School Record Holder'];
/** Pro awards. */
export const PRO_AWARDS = ['League Champion', 'Cup Winner', 'MVP', 'Top Scorer', 'Defensive Player of the Year', 'Team Captain'];
