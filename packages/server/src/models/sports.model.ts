import { getDb } from '../db/index.js';
import type { SportsCareerState, Sport, SportsPhase, SeasonRecord, OfferType } from '@lifeverse/shared';

interface SportsRow {
  character_id: string;
  sport: string;
  phase: string;
  team_name: string | null;
  club_id: string | null;
  tier: number;
  skill: number;
  fitness: number;
  reputation: number;
  coach_approval: number;
  years_active: number;
  last_decision_age: number;
  injury_years: number;
  has_scholarship: number;
  pending_offer_club: string | null;
  pending_offer_salary: number;
  salary: number;
  market_value: number;
  appearances: number;
  points: number;
  assists: number;
  championships: number;
  career_earnings: number;
  awards: string;
  hall_of_fame: number;
  contract_years: number;
  avg_rating: number;
  clean_sheets: number;
  season_history: string;
  pending_offer_type: string | null;
  loan_return_club: string | null;
  loan_years: number;
  captain: number;
}

function rowToState(row: SportsRow): SportsCareerState {
  let awards: string[] = [];
  try { awards = JSON.parse(row.awards) as string[]; } catch { /* keep [] */ }
  let history: SeasonRecord[] = [];
  try { history = JSON.parse(row.season_history) as SeasonRecord[]; } catch { /* keep [] */ }
  return {
    characterId: row.character_id,
    sport: row.sport as Sport,
    phase: row.phase as SportsPhase,
    teamName: row.team_name,
    clubId: row.club_id,
    tier: row.tier,
    skill: row.skill,
    fitness: row.fitness,
    reputation: row.reputation,
    coachApproval: row.coach_approval,
    yearsActive: row.years_active,
    lastDecisionAge: row.last_decision_age,
    injuryYears: row.injury_years,
    hasScholarship: row.has_scholarship === 1,
    pendingOfferClub: row.pending_offer_club,
    pendingOfferSalary: row.pending_offer_salary,
    salary: row.salary,
    marketValue: row.market_value,
    appearances: row.appearances,
    points: row.points,
    assists: row.assists,
    championships: row.championships,
    careerEarnings: row.career_earnings,
    awards,
    hallOfFame: row.hall_of_fame === 1,
    contractYears: row.contract_years,
    avgRating: row.avg_rating,
    cleanSheets: row.clean_sheets,
    seasonHistory: history,
    pendingOfferType: (row.pending_offer_type as OfferType | null) ?? null,
    loanReturnClub: row.loan_return_club,
    loanYears: row.loan_years,
    captain: row.captain === 1,
  };
}

export const SportsModel = {
  create(characterId: string, sport: string, teamName: string): SportsCareerState {
    getDb()
      .prepare(`INSERT INTO sports_career (character_id, sport, team_name) VALUES (?, ?, ?)`)
      .run(characterId, sport, teamName);
    return this.findByCharacterId(characterId) as SportsCareerState;
  },

  findByCharacterId(characterId: string): SportsCareerState | null {
    const row = getDb().prepare('SELECT * FROM sports_career WHERE character_id = ?').get(characterId) as SportsRow | undefined;
    return row ? rowToState(row) : null;
  },

  update(characterId: string, fields: Partial<Omit<SportsCareerState, 'characterId'>>): SportsCareerState {
    const colMap: Record<string, string> = {
      sport: 'sport', phase: 'phase', teamName: 'team_name', clubId: 'club_id', tier: 'tier',
      skill: 'skill', fitness: 'fitness', reputation: 'reputation', coachApproval: 'coach_approval',
      yearsActive: 'years_active', lastDecisionAge: 'last_decision_age', injuryYears: 'injury_years',
      hasScholarship: 'has_scholarship', pendingOfferClub: 'pending_offer_club',
      pendingOfferSalary: 'pending_offer_salary', salary: 'salary', marketValue: 'market_value',
      appearances: 'appearances', points: 'points', assists: 'assists', championships: 'championships',
      careerEarnings: 'career_earnings', hallOfFame: 'hall_of_fame',
      contractYears: 'contract_years', avgRating: 'avg_rating', cleanSheets: 'clean_sheets',
      pendingOfferType: 'pending_offer_type', loanReturnClub: 'loan_return_club',
      loanYears: 'loan_years', captain: 'captain',
    };
    const updates: string[] = ["updated_at = datetime('now')"];
    const values: unknown[] = [];
    for (const [key, col] of Object.entries(colMap)) {
      const val = fields[key as keyof typeof fields];
      if (val !== undefined) {
        updates.push(`${col} = ?`);
        values.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
      }
    }
    if (fields.awards !== undefined) {
      updates.push('awards = ?');
      values.push(JSON.stringify(fields.awards));
    }
    if (fields.seasonHistory !== undefined) {
      updates.push('season_history = ?');
      values.push(JSON.stringify(fields.seasonHistory));
    }
    values.push(characterId);
    getDb().prepare(`UPDATE sports_career SET ${updates.join(', ')} WHERE character_id = ?`).run(...values);
    return this.findByCharacterId(characterId) as SportsCareerState;
  },

  delete(characterId: string): void {
    getDb().prepare('DELETE FROM sports_career WHERE character_id = ?').run(characterId);
  },
};
