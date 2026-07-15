import {
  CharacterModel, FinanceModel, StatsModel, FlagsModel, EventLogModel, SportsModel,
} from '../models/index.js';
import { applyDeltas } from '../engine/stat.engine.js';
import {
  SPORTS_MIN_AGE, SPORTS_DECLINE_AGE, SCHOLARSHIP_THRESHOLD,
  ELITE_OFFER_SCORE, GOOD_OFFER_SCORE, CONTRACT_YEARS_RANGE,
  RATING_TEAM_OF_YEAR, RATING_PLAYER_OF_SEASON, RATING_BALLON_DOR,
  GOLDEN_BOOT_POINTS, CLUB_RECORD_POINTS, CLEAN_SHEET_SPORTS,
  LOAN_MAX_AGE, LOAN_COACH_THRESHOLD, LOAN_MIN_PRESTIGE, SEASON_HISTORY_CAP,
  SPORT_BY_ID, SCHOOL_TIER_LABELS, TIER_THRESHOLDS, CLUB_BY_ID, clubsForSport,
  DECISION_BY_ID, SCHOOL_AWARDS, SportsPhase, OfferType, incomeTax,
} from '@lifeverse/shared';
import type { Sport, SportsCareerState, StatDelta, SeasonRecord } from '@lifeverse/shared';

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, Math.round(n)));
const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const randF = (min: number, max: number) => min + Math.random() * (max - min);

function grantStats(characterId: string, deltas: StatDelta[]): void {
  if (deltas.length === 0) return;
  const s = StatsModel.findByCharacterId(characterId);
  if (s) StatsModel.update(characterId, applyDeltas(s, deltas));
}

function requireCareer(characterId: string): SportsCareerState {
  const career = SportsModel.findByCharacterId(characterId);
  if (!career) throw new Error('You are not on a team.');
  return career;
}

/** Combined score used for tiers, awards, scholarships, and offers. */
function careerScore(c: SportsCareerState): number {
  return c.skill + c.reputation;
}

/** Pick a destination club for the sport, optionally capped/floored by prestige. */
function pickClub(
  sport: Sport, score: number, opts?: { minPrestige?: number; maxPrestige?: number; excludeClubId?: string | null },
): { clubId: string; salary: number } | null {
  const clubs = clubsForSport(sport);
  if (clubs.length === 0) return null;
  const scoreMax = score >= 190 ? 5 : score >= 165 ? 4 : score >= 140 ? 3 : 2;
  const maxP = Math.min(opts?.maxPrestige ?? 5, scoreMax);
  const minP = opts?.minPrestige ?? 1;
  let pool = clubs.filter((c) => c.prestige >= minP && c.prestige <= maxP && c.id !== opts?.excludeClubId);
  if (pool.length === 0) pool = clubs.filter((c) => c.prestige <= maxP && c.id !== opts?.excludeClubId);
  if (pool.length === 0) return null;
  const club = pool[rand(0, pool.length - 1)]!;
  const [lo, hi] = club.salaryBand;
  const frac = Math.min(1, Math.max(0, (score - 120) / 100));
  const salary = Math.round(lo + (hi - lo) * frac);
  return { clubId: club.id, salary };
}

function contractLengthFor(prestige: number): number {
  const [lo, hi] = CONTRACT_YEARS_RANGE;
  return clamp(lo + Math.round((prestige / 5) * (hi - lo)), lo, hi);
}

export const SportsService = {
  get(characterId: string): SportsCareerState | null {
    return SportsModel.findByCharacterId(characterId);
  },

  /** Try out for a school team. Two outcomes: make it, or don't. */
  tryout(characterId: string, sportId: Sport): { message: string } {
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    if (c.age < SPORTS_MIN_AGE) throw new Error(`You must be ${SPORTS_MIN_AGE} to try out for a team.`);
    if (c.age >= 19) throw new Error('School tryouts are for students. That ship has sailed.');
    if (SportsModel.findByCharacterId(characterId)) throw new Error('You already have an athletic career.');
    const sport = SPORT_BY_ID.get(sportId);
    if (!sport) throw new Error('Unknown sport.');

    const flags = FlagsModel.getAll(characterId);
    if (flags['sportsTriedOutThisYear']) throw new Error('You already tried out this year. Train up and try again after your birthday.');
    FlagsModel.set(characterId, 'sportsTriedOutThisYear', true);

    const stats = StatsModel.findByCharacterId(characterId);
    if (!stats) throw new Error('Stats not found');
    const score =
      stats.health * 0.35 + stats.willpower * 0.25 + stats.happiness * 0.2 -
      stats.stress * 0.1 + rand(0, 25);

    if (score < 45) {
      grantStats(characterId, [{ stat: 'happiness', amount: -3 }]);
      EventLogModel.create(characterId, 'sports:tryout_fail', c.age, 'sports', `Tried out for the ${sport.label} team but didn't make the cut.`);
      return { message: `${sport.emoji} You didn't make the ${sport.label} team this year. Train hard and try again after you age up!` };
    }

    SportsModel.create(characterId, sportId, `School ${sport.label} Team`);
    grantStats(characterId, [{ stat: 'happiness', amount: 5 }]);
    EventLogModel.create(characterId, 'sports:joined_team', c.age, 'milestone', `Made the school ${sport.label} team! ${sport.emoji}`);
    return { message: `${sport.emoji} You made the ${sport.label} team! Welcome aboard, ${SCHOOL_TIER_LABELS[1]}.` };
  },

  /** One meaningful development decision per year. */
  decide(characterId: string, decisionId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    const career = requireCareer(characterId);
    if (career.phase === SportsPhase.Retired) throw new Error('Your playing days are behind you.');
    if (career.lastDecisionAge >= c.age) throw new Error('You already made this year\'s decision. Age up for a new season.');
    const d = DECISION_BY_ID.get(decisionId);
    if (!d || !d.phases.includes(career.phase)) throw new Error('Unknown decision.');

    let injuryNote = '';
    const fields: Partial<SportsCareerState> = {
      skill: clamp(career.skill + d.skill),
      fitness: clamp(career.fitness + d.fitness),
      reputation: clamp(career.reputation + d.reputation),
      coachApproval: clamp(career.coachApproval + d.coach),
      lastDecisionAge: c.age,
    };
    if (d.id === 'rest' && career.injuryYears > 0) fields.injuryYears = career.injuryYears - 1;
    if (Math.random() < d.injuryRisk) {
      fields.injuryYears = rand(1, 2);
      fields.fitness = clamp((fields.fitness ?? career.fitness) - 12);
      injuryNote = ' 🤕 You picked up an injury — it will take time to fully heal.';
      grantStats(characterId, [{ stat: 'health', amount: -5 }]);
    }
    SportsModel.update(characterId, fields);

    const deltas: StatDelta[] = [];
    if (d.happiness) deltas.push({ stat: 'happiness', amount: d.happiness });
    if (d.health) deltas.push({ stat: 'health', amount: d.health });
    if (d.stress) deltas.push({ stat: 'stress', amount: d.stress });
    grantStats(characterId, deltas);

    EventLogModel.create(characterId, `sports:decision_${d.id}`, c.age, 'sports', `${d.emoji} ${d.label} this season.`);
    return { message: `${d.emoji} ${d.label}: ${d.description}${injuryNote}` };
  },

  quit(characterId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    const career = requireCareer(characterId);
    if (!c) throw new Error('Character not found');
    if (career.phase === SportsPhase.Pro) {
      SportsModel.update(characterId, { phase: SportsPhase.Retired, salary: 0, pendingOfferClub: null, pendingOfferSalary: 0, pendingOfferType: null });
      EventLogModel.create(characterId, 'sports:left_club', c.age, 'milestone', 'Walked away from professional sports.');
      return { message: 'You walked away from the professional game.' };
    }
    SportsModel.delete(characterId);
    EventLogModel.create(characterId, 'sports:quit_team', c.age, 'sports', 'Quit the school team.');
    return { message: 'You handed in your jersey. The locker room feels quieter already.' };
  },

  /** Accept the pending offer — transfer, loan spell, or contract renewal. */
  acceptOffer(characterId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    const career = requireCareer(characterId);
    if (!c) throw new Error('Character not found');
    if (!career.pendingOfferClub) throw new Error('There is no offer on the table.');
    const club = CLUB_BY_ID.get(career.pendingOfferClub);
    if (!club) throw new Error('That club no longer exists.');
    const type = career.pendingOfferType ?? OfferType.Transfer;

    if (type === OfferType.Renewal) {
      const years = rand(2, 3);
      SportsModel.update(characterId, {
        salary: career.pendingOfferSalary, contractYears: years,
        pendingOfferClub: null, pendingOfferSalary: 0, pendingOfferType: null,
      });
      EventLogModel.create(characterId, 'sports:renewed', c.age, 'milestone',
        `Renewed with ${club.name} — ${years} more years at $${career.pendingOfferSalary.toLocaleString()}/yr.`);
      return { message: `🖊️ You re-signed with ${club.name} for ${years} more years!` };
    }

    if (type === OfferType.Loan) {
      SportsModel.update(characterId, {
        clubId: club.id, teamName: club.name, loanReturnClub: career.clubId, loanYears: 1,
        pendingOfferClub: null, pendingOfferSalary: 0, pendingOfferType: null,
        coachApproval: 60,
      });
      EventLogModel.create(characterId, 'sports:loan_out', c.age, 'milestone', `Joined ${club.name} on a season-long loan for playing time.`);
      return { message: `🔁 Off on loan to ${club.name} — go earn those minutes.` };
    }

    // Transfer (also school → first pro contract).
    const years = contractLengthFor(club.prestige);
    SportsModel.update(characterId, {
      phase: SportsPhase.Pro, clubId: club.id, teamName: club.name,
      salary: career.pendingOfferSalary, marketValue: Math.round(career.pendingOfferSalary * 2.5),
      contractYears: years, captain: false, coachApproval: 55,
      loanReturnClub: null, loanYears: 0,
      pendingOfferClub: null, pendingOfferSalary: 0, pendingOfferType: null,
    });
    grantStats(characterId, [{ stat: 'happiness', amount: 8 }]);
    FlagsModel.set(characterId, 'isProAthlete', true);
    EventLogModel.create(characterId, 'sports:signed_pro', c.age, 'milestone',
      `Signed a ${years}-year deal with ${club.name} for $${career.pendingOfferSalary.toLocaleString()}/yr! 🖊️`);
    return { message: `🖊️ ${years}-year contract with ${club.name} — $${career.pendingOfferSalary.toLocaleString()} a year!` };
  },

  rejectOffer(characterId: string): { message: string } {
    const career = requireCareer(characterId);
    if (!career.pendingOfferClub) throw new Error('There is no offer on the table.');
    const club = CLUB_BY_ID.get(career.pendingOfferClub);
    SportsModel.update(characterId, { pendingOfferClub: null, pendingOfferSalary: 0, pendingOfferType: null });
    return { message: `You turned down ${club?.name ?? 'the club'}. Betting on yourself.` };
  },

  /** Extend the current contract early — only inside the final two years. */
  negotiate(characterId: string): { message: string } {
    const career = requireCareer(characterId);
    if (career.phase !== SportsPhase.Pro) throw new Error('You need a professional contract to negotiate.');
    if (career.contractYears > 2) throw new Error(`The club won't renegotiate yet — ${career.contractYears} years still on your deal.`);
    if (career.reputation < 50) {
      SportsModel.update(characterId, { coachApproval: clamp(career.coachApproval - 5) });
      return { message: 'The club laughed you out of the room. Build your reputation first.' };
    }
    const raise = Math.round(career.salary * (0.05 + (career.reputation / 100) * 0.15));
    const years = career.contractYears + rand(2, 3);
    SportsModel.update(characterId, { salary: career.salary + raise, contractYears: years });
    return { message: `💰 Extended! +$${raise.toLocaleString()}/yr, ${years} years on the new deal.` };
  },

  requestTransfer(characterId: string): { message: string } {
    const career = requireCareer(characterId);
    if (career.phase !== SportsPhase.Pro) throw new Error('Transfers are for professionals.');
    const offer = pickClub(career.sport, careerScore(career), { excludeClubId: career.clubId });
    if (!offer) {
      return { message: 'Your agent shopped you around — no takers this season. Keep performing.' };
    }
    SportsModel.update(characterId, {
      pendingOfferClub: offer.clubId, pendingOfferSalary: offer.salary,
      pendingOfferType: OfferType.Transfer, coachApproval: clamp(career.coachApproval - 8),
    });
    const club = CLUB_BY_ID.get(offer.clubId)!;
    return { message: `📨 ${club.name} is interested — $${offer.salary.toLocaleString()}/yr. Accept the transfer?` };
  },

  retire(characterId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    const career = requireCareer(characterId);
    if (!c) throw new Error('Character not found');
    if (career.phase !== SportsPhase.Pro) throw new Error('Only professionals retire; students just quit the team.');
    const hof = career.championships >= 3 || career.awards.length >= 6 || career.reputation >= 90 || career.avgRating >= 8;
    SportsModel.update(characterId, {
      phase: SportsPhase.Retired, salary: 0, contractYears: 0,
      pendingOfferClub: null, pendingOfferSalary: 0, pendingOfferType: null, hallOfFame: hof,
    });
    if (hof) FlagsModel.set(characterId, 'sportsHallOfFame', true);
    FlagsModel.set(characterId, 'isProAthlete', false);
    EventLogModel.create(characterId, 'sports:retired', c.age, 'milestone',
      hof ? '🏛️ Retired from professional sports — and entered the Hall of Fame!' : 'Retired from professional sports.');
    return { message: hof ? '🏛️ You retire a legend — welcome to the Hall of Fame!' : '👏 You retire after a solid professional career.' };
  },

  /** Annual step (from age-up). */
  annualUpdate(characterId: string, age: number): void {
    FlagsModel.set(characterId, 'sportsTriedOutThisYear', false);
    const career = SportsModel.findByCharacterId(characterId);
    if (!career || career.phase === SportsPhase.Retired) return;
    const sport = SPORT_BY_ID.get(career.sport)!;
    const fields: Partial<SportsCareerState> = { yearsActive: career.yearsActive + 1 };
    if (career.injuryYears > 0) fields.injuryYears = career.injuryYears - 1;
    const injured = career.injuryYears > 0;
    const awards = [...career.awards];

    if (career.phase === SportsPhase.School) {
      fields.skill = clamp(career.skill + Math.round(career.coachApproval / 25) + (injured ? -2 : 1));
      // Visibility grows with seniority: scouts notice starters and captains.
      fields.reputation = clamp(career.reputation + 1 + Math.round(career.tier / 2));
      fields.coachApproval = clamp(career.coachApproval - 2);
      if (career.coachApproval <= 8) {
        SportsModel.delete(characterId);
        EventLogModel.create(characterId, 'sports:cut_from_team', age, 'sports', 'Cut from the team for poor commitment.');
        grantStats(characterId, [{ stat: 'happiness', amount: -6 }]);
        return;
      }
      const score = (fields.skill ?? career.skill) + career.reputation;
      let tier = career.tier;
      while (tier < 5 && score >= (TIER_THRESHOLDS[tier + 1] ?? Infinity)) tier++;
      if (tier !== career.tier) {
        fields.tier = tier;
        EventLogModel.create(characterId, 'sports:promotion', age, 'milestone', `Became ${SCHOOL_TIER_LABELS[tier]} on the ${sport.label} team! ${sport.emoji}`);
        grantStats(characterId, [{ stat: 'happiness', amount: 4 }]);
      }
      if (score >= 100 && Math.random() < 0.35) {
        const award = SCHOOL_AWARDS[rand(0, SCHOOL_AWARDS.length - 1)]!;
        awards.push(`${award} (age ${age})`);
        fields.awards = awards;
        fields.reputation = clamp(career.reputation + 6);
        FlagsModel.set(characterId, 'sportsAward', true);
        EventLogModel.create(characterId, 'sports:award', age, 'milestone', `🏆 Won ${award}!`);
      }
      if ((age === 17 || age === 18) && !career.hasScholarship && score >= SCHOLARSHIP_THRESHOLD) {
        fields.hasScholarship = true;
        FlagsModel.set(characterId, 'hasScholarship', true);
        EventLogModel.create(characterId, 'sports:scholarship', age, 'milestone', '🎓 Offered an athletic scholarship — university tuition halved!');
      }
      // Performance-tiered post-school outcomes.
      if (age >= 18 && !career.pendingOfferClub) {
        if (score >= ELITE_OFFER_SCORE && Math.random() < 0.85) {
          const offer = pickClub(career.sport, score);
          if (offer) {
            fields.pendingOfferClub = offer.clubId;
            fields.pendingOfferSalary = offer.salary;
            fields.pendingOfferType = OfferType.Transfer;
            const club = CLUB_BY_ID.get(offer.clubId)!;
            EventLogModel.create(characterId, 'sports:pro_offer', age, 'milestone', `📨 ${club.name} wants to sign you — $${offer.salary.toLocaleString()}/yr!`);
          }
        } else if (score >= GOOD_OFFER_SCORE && Math.random() < 0.65) {
          const offer = pickClub(career.sport, score, { maxPrestige: 2 });
          if (offer) {
            fields.pendingOfferClub = offer.clubId;
            fields.pendingOfferSalary = offer.salary;
            fields.pendingOfferType = OfferType.Transfer;
            const club = CLUB_BY_ID.get(offer.clubId)!;
            EventLogModel.create(characterId, 'sports:pro_offer', age, 'sports', `📨 A lower-tier chance: ${club.name} offers $${offer.salary.toLocaleString()}/yr.`);
          }
        } else if (age === 18 && score < GOOD_OFFER_SCORE) {
          EventLogModel.create(characterId, 'sports:no_offers', age, 'sports', 'No professional offers came. The dream needs more work.');
        }
      }
      // Final window: any committed athlete gets one guaranteed semi-pro shot
      // before the school career ends, so careers don't dead-end silently.
      if (age >= 22 && !career.pendingOfferClub && !fields.pendingOfferClub && score >= 60) {
        const offer = pickClub(career.sport, Math.max(score, 60), { maxPrestige: 1 });
        if (offer) {
          fields.pendingOfferClub = offer.clubId;
          fields.pendingOfferSalary = offer.salary;
          fields.pendingOfferType = OfferType.Transfer;
          const club = CLUB_BY_ID.get(offer.clubId)!;
          EventLogModel.create(characterId, 'sports:pro_offer', age, 'sports', `📨 Last chance: ${club.name} offers a semi-pro deal — $${offer.salary.toLocaleString()}/yr.`);
        }
      }
      if (age >= 24 && !career.pendingOfferClub && !fields.pendingOfferClub) {
        SportsModel.update(characterId, { ...fields, phase: SportsPhase.Retired });
        EventLogModel.create(characterId, 'sports:school_end', age, 'sports', 'School athletics came to a natural end.');
        return;
      }
      SportsModel.update(characterId, fields);
      return;
    }

    // ── Professional season ──
    const club = CLUB_BY_ID.get(career.clubId ?? '');
    const prestige = club?.prestige ?? 1;
    const decline = age >= SPORTS_DECLINE_AGE ? (age - SPORTS_DECLINE_AGE + 1) * 2 : 0;
    fields.skill = clamp(career.skill + (injured ? -3 : 1) - Math.round(decline / 2));
    fields.fitness = clamp(career.fitness - (injured ? 8 : 0) - decline + (career.lastDecisionAge >= age - 1 ? 2 : -2));
    const performance = ((fields.skill ?? 0) * 0.5 + (fields.fitness ?? 0) * 0.3 + career.reputation * 0.2) / 100;

    // Season rating (4.0–9.9), the spine of honours and transfers.
    const rating = Math.min(9.9, Math.max(4.0, Math.round((4.5 + performance * 5 + randF(-0.7, 0.7)) * 10) / 10));

    const games = injured ? rand(4, 12) : rand(22, 38);
    const seasonPoints = Math.round(games * performance * (sport.hasAssists ? 0.9 : 0.5));
    const seasonAssists = sport.hasAssists ? Math.round(games * performance * 0.5) : 0;
    const seasonCleanSheets = CLEAN_SHEET_SPORTS.includes(career.sport) && rating >= 6.5
      ? Math.round(games * (rating - 6) * 0.12) : 0;

    fields.appearances = career.appearances + games;
    fields.points = career.points + seasonPoints;
    if (sport.hasAssists) fields.assists = career.assists + seasonAssists;
    fields.cleanSheets = career.cleanSheets + seasonCleanSheets;

    const seasonsPlayed = career.seasonHistory.length;
    fields.avgRating = Math.round(((career.avgRating * seasonsPlayed + rating) / (seasonsPlayed + 1)) * 100) / 100;

    // Salary hits the bank, net of country income tax (free agents earn nothing).
    const fin = FinanceModel.findByCharacterId(characterId);
    if (fin && career.salary > 0) {
      const country = CharacterModel.findById(characterId)?.country;
      const tax = incomeTax(country, career.salary);
      FinanceModel.update(characterId, { cash: fin.cash + career.salary - tax });
    }
    fields.careerEarnings = career.careerEarnings + career.salary; // lifetime gross earnings
    fields.marketValue = Math.round(Math.max(career.salary, 50_000) * (1.5 + performance * 2));
    fields.reputation = clamp(career.reputation + (rating >= 7.5 ? 4 : rating >= 6 ? 1 : -3));

    // ── Team trophies ──
    const seasonTrophies: string[] = [];
    const titleChance = Math.max(0, (prestige / 5) * 0.15 + (rating - 6) * 0.08);
    if (Math.random() < titleChance) {
      const label = prestige <= 2 ? 'Won Promotion' : 'League Champion';
      seasonTrophies.push(label);
      fields.championships = (fields.championships ?? career.championships) + 1;
      FlagsModel.set(characterId, 'sportsLeagueChampion', true);
      if (label === 'Won Promotion') fields.reputation = clamp((fields.reputation ?? career.reputation) + 8);
    }
    if (Math.random() < titleChance * 0.9) {
      seasonTrophies.push('Domestic Cup Winner');
      fields.championships = (fields.championships ?? career.championships) + 1;
    }
    if (prestige >= 4 && rating >= 7.5 && Math.random() < 0.12) {
      seasonTrophies.push('Continental Champion');
      fields.championships = (fields.championships ?? career.championships) + 1;
      fields.reputation = clamp((fields.reputation ?? career.reputation) + 6);
    }

    // ── Individual honours ──
    const gbThreshold = GOLDEN_BOOT_POINTS[career.sport];
    if (gbThreshold !== undefined && seasonPoints >= gbThreshold) seasonTrophies.push('Golden Boot');
    if (rating >= RATING_PLAYER_OF_SEASON) seasonTrophies.push('Player of the Season');
    else if (rating >= RATING_TEAM_OF_YEAR) seasonTrophies.push('Team of the Year');
    if (rating >= RATING_BALLON_DOR && prestige >= 4 && Math.random() < 0.5) {
      seasonTrophies.push("Ballon d'Or");
      FlagsModel.set(characterId, 'ballonDor', true);
      grantStats(characterId, [{ stat: 'happiness', amount: 10 }]);
    }
    const recordThreshold = CLUB_RECORD_POINTS[career.sport];
    if (recordThreshold !== undefined && seasonPoints >= recordThreshold) seasonTrophies.push('Club Record Season');
    if (!career.captain && (fields.reputation ?? career.reputation) >= 75 && career.coachApproval >= 70) {
      fields.captain = true;
      seasonTrophies.push('Named Team Captain');
      FlagsModel.set(characterId, 'sportsCaptain', true);
    }
    for (const t of seasonTrophies) {
      awards.push(`${t} (age ${age})`);
      EventLogModel.create(characterId, 'sports:honour', age, 'milestone', `🏆 ${t}!`);
    }
    if (seasonTrophies.length > 0) {
      fields.awards = awards;
      FlagsModel.set(characterId, 'sportsProAward', true);
      grantStats(characterId, [{ stat: 'happiness', amount: Math.min(8, seasonTrophies.length * 3) }]);
    }

    // ── Season record ──
    const record: SeasonRecord = {
      age, club: career.teamName ?? 'Free Agent', apps: games, points: seasonPoints,
      assists: seasonAssists, cleanSheets: seasonCleanSheets, rating, trophies: seasonTrophies,
    };
    fields.seasonHistory = [...career.seasonHistory, record].slice(-SEASON_HISTORY_CAP);

    // ── Loan return ──
    if (career.loanYears > 0) {
      const remaining = career.loanYears - 1;
      if (remaining <= 0 && career.loanReturnClub) {
        const parent = CLUB_BY_ID.get(career.loanReturnClub);
        if (parent) {
          fields.clubId = parent.id;
          fields.teamName = parent.name;
          fields.loanReturnClub = null;
          fields.loanYears = 0;
          fields.skill = clamp((fields.skill ?? career.skill) + 4);
          fields.reputation = clamp((fields.reputation ?? career.reputation) + 4);
          fields.coachApproval = 65;
          EventLogModel.create(characterId, 'sports:loan_return', age, 'milestone', `Returned to ${parent.name} sharper from the loan spell.`);
        }
      } else {
        fields.loanYears = remaining;
      }
    }

    // ── Contract countdown → renewal or free agency ──
    if (career.contractYears > 0 && career.loanYears === 0) {
      const left = career.contractYears - 1;
      fields.contractYears = left;
      if (left === 0 && club) {
        if (rating >= 6.5) {
          const raise = Math.round(career.salary * (0.1 + performance * 0.2));
          fields.pendingOfferClub = club.id;
          fields.pendingOfferSalary = career.salary + raise;
          fields.pendingOfferType = OfferType.Renewal;
          EventLogModel.create(characterId, 'sports:renewal_offer', age, 'sports', `${club.name} offered a contract renewal.`);
        } else {
          fields.salary = 0;
          const fa = pickClub(career.sport, careerScore(career) - 20, { excludeClubId: career.clubId });
          if (fa) {
            fields.pendingOfferClub = fa.clubId;
            fields.pendingOfferSalary = fa.salary;
            fields.pendingOfferType = OfferType.Transfer;
            EventLogModel.create(characterId, 'sports:free_agent', age, 'sports', 'Contract expired — a free agent weighing options.');
          }
        }
      }
    }

    // ── Loan offer for benched young talent at a big club ──
    if (!fields.pendingOfferClub && !career.pendingOfferClub && career.loanYears === 0 &&
        age <= LOAN_MAX_AGE && prestige >= LOAN_MIN_PRESTIGE && career.coachApproval < LOAN_COACH_THRESHOLD) {
      const loan = pickClub(career.sport, careerScore(career), { maxPrestige: Math.max(1, prestige - 2), excludeClubId: career.clubId });
      if (loan) {
        fields.pendingOfferClub = loan.clubId;
        fields.pendingOfferSalary = career.salary;
        fields.pendingOfferType = OfferType.Loan;
        const lc = CLUB_BY_ID.get(loan.clubId)!;
        EventLogModel.create(characterId, 'sports:loan_offer', age, 'sports', `${lc.name} offers a season-long loan for playing time.`);
      }
    }

    // ── Transfer market interest ──
    if (!fields.pendingOfferClub && !career.pendingOfferClub && Math.random() < 0.3) {
      const offer = pickClub(career.sport, careerScore(career) + (rating >= 7.5 ? 20 : -20), { excludeClubId: career.clubId });
      if (offer) {
        fields.pendingOfferClub = offer.clubId;
        fields.pendingOfferSalary = offer.salary;
        fields.pendingOfferType = OfferType.Transfer;
        const tc = CLUB_BY_ID.get(offer.clubId)!;
        EventLogModel.create(characterId, 'sports:transfer_offer', age, 'sports', `📨 Transfer interest from ${tc.name} ($${offer.salary.toLocaleString()}/yr).`);
      }
    }

    // ── Injuries: severity tiers, worse odds with age ──
    if (!injured) {
      const injuryRoll = Math.random();
      const ageFactor = age > 32 ? 0.04 : 0;
      if (injuryRoll < 0.02 + ageFactor) {
        fields.injuryYears = 3;
        fields.skill = clamp((fields.skill ?? career.skill) - 8);
        grantStats(characterId, [{ stat: 'health', amount: -12 }, { stat: 'happiness', amount: -6 }]);
        EventLogModel.create(characterId, 'sports:injury', age, 'milestone', '🚑 A career-threatening injury. The road back will be long.');
      } else if (injuryRoll < 0.05 + ageFactor) {
        fields.injuryYears = 2;
        grantStats(characterId, [{ stat: 'health', amount: -8 }]);
        EventLogModel.create(characterId, 'sports:injury', age, 'sports', '🤕 A serious injury ends the season early.');
      } else if (injuryRoll < 0.10 + ageFactor) {
        fields.injuryYears = 1;
        grantStats(characterId, [{ stat: 'health', amount: -4 }]);
        EventLogModel.create(characterId, 'sports:injury', age, 'sports', '🩹 A niggling injury disrupts the season.');
      }
    }

    SportsModel.update(characterId, fields);
  },
};
