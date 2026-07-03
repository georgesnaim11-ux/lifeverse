import { Sport, SportsPhase } from '../types/sports.js';
import type { SportDef, ProClub, TrainingDecision } from '../types/sports.js';

/** Minimum age to try out for a school team. */
export const SPORTS_MIN_AGE = 12;
/** Age at which yearly performance starts declining for pros. */
export const SPORTS_DECLINE_AGE = 30;
/** Skill+reputation needed (combined) for a scholarship offer at 17–18. */
export const SCHOLARSHIP_THRESHOLD = 110;
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
  // Soccer
  { id: 'barcelona',  name: 'FC Barcelona',      sportId: Sport.Soccer, prestige: 5, salaryBand: [8_000_000, 30_000_000] },
  { id: 'realmadrid', name: 'Real Madrid',       sportId: Sport.Soccer, prestige: 5, salaryBand: [8_000_000, 30_000_000] },
  { id: 'mancity',    name: 'Manchester City',   sportId: Sport.Soccer, prestige: 5, salaryBand: [7_000_000, 25_000_000] },
  { id: 'ajax',       name: 'Ajax Amsterdam',    sportId: Sport.Soccer, prestige: 3, salaryBand: [900_000, 4_000_000] },
  { id: 'porto',      name: 'FC Porto',          sportId: Sport.Soccer, prestige: 3, salaryBand: [800_000, 3_500_000] },
  { id: 'unionfc',    name: 'Union FC',          sportId: Sport.Soccer, prestige: 1, salaryBand: [60_000, 250_000] },
  // Basketball
  { id: 'lakers',     name: 'Los Angeles Lakers', sportId: Sport.Basketball, prestige: 5, salaryBand: [5_000_000, 40_000_000] },
  { id: 'celtics',    name: 'Boston Celtics',     sportId: Sport.Basketball, prestige: 5, salaryBand: [5_000_000, 40_000_000] },
  { id: 'bulls',      name: 'Chicago Bulls',      sportId: Sport.Basketball, prestige: 4, salaryBand: [2_000_000, 20_000_000] },
  { id: 'gleague',    name: 'Capital City G-League', sportId: Sport.Basketball, prestige: 1, salaryBand: [40_000, 120_000] },
  // Baseball
  { id: 'yankees',    name: 'New York Yankees',  sportId: Sport.Baseball, prestige: 5, salaryBand: [4_000_000, 30_000_000] },
  { id: 'dodgers',    name: 'LA Dodgers',        sportId: Sport.Baseball, prestige: 4, salaryBand: [2_000_000, 20_000_000] },
  { id: 'minors',     name: 'Riverside Minors',  sportId: Sport.Baseball, prestige: 1, salaryBand: [30_000, 90_000] },
  // Football
  { id: 'cowboys',    name: 'Dallas Cowboys',    sportId: Sport.Football, prestige: 5, salaryBand: [3_000_000, 25_000_000] },
  { id: 'packers',    name: 'Green Bay Packers', sportId: Sport.Football, prestige: 4, salaryBand: [1_500_000, 15_000_000] },
  { id: 'arenaball',  name: 'Arena League',      sportId: Sport.Football, prestige: 1, salaryBand: [40_000, 100_000] },
  // Volleyball
  { id: 'modena',     name: 'Modena Volley',     sportId: Sport.Volleyball, prestige: 4, salaryBand: [200_000, 900_000] },
  { id: 'beachtour',  name: 'National Beach Tour', sportId: Sport.Volleyball, prestige: 2, salaryBand: [40_000, 150_000] },
  // Tennis
  { id: 'atptour',    name: 'ATP World Tour',    sportId: Sport.Tennis, prestige: 5, salaryBand: [500_000, 12_000_000] },
  { id: 'challenger', name: 'Challenger Tour',   sportId: Sport.Tennis, prestige: 2, salaryBand: [40_000, 200_000] },
  // Swimming
  { id: 'proswim',    name: 'Pro Swim Series',   sportId: Sport.Swimming, prestige: 4, salaryBand: [100_000, 1_500_000] },
  { id: 'natswim',    name: 'National Swim League', sportId: Sport.Swimming, prestige: 2, salaryBand: [30_000, 120_000] },
  // Track
  { id: 'diamond',    name: 'Diamond League',    sportId: Sport.Track, prestige: 5, salaryBand: [150_000, 3_000_000] },
  { id: 'nattrack',   name: 'National Athletics Circuit', sportId: Sport.Track, prestige: 2, salaryBand: [30_000, 120_000] },
  // Wrestling
  { id: 'prowrestle', name: 'World Wrestling League', sportId: Sport.Wrestling, prestige: 4, salaryBand: [200_000, 3_000_000] },
  { id: 'regionwrestle', name: 'Regional Wrestling Circuit', sportId: Sport.Wrestling, prestige: 1, salaryBand: [25_000, 80_000] },
  // Golf
  { id: 'pgatour',    name: 'PGA Tour',          sportId: Sport.Golf, prestige: 5, salaryBand: [500_000, 10_000_000] },
  { id: 'korntour',   name: 'Korn Ferry Tour',   sportId: Sport.Golf, prestige: 2, salaryBand: [50_000, 250_000] },
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

/** School awards, rolled annually from skill + reputation. */
export const SCHOOL_AWARDS = ['MVP', 'Team Captain', 'Athlete of the Year', 'Championship Winner', 'School Record Holder'];
/** Pro awards. */
export const PRO_AWARDS = ['League Champion', 'Cup Winner', 'MVP', 'Top Scorer', 'Defensive Player of the Year', 'Team Captain'];
