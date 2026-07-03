import {
  CharacterModel, FinanceModel, StatsModel, FlagsModel, EventLogModel, SportsModel,
} from '../models/index.js';
import { applyDeltas } from '../engine/stat.engine.js';
import {
  SPORTS_MIN_AGE, SPORTS_DECLINE_AGE, SCHOLARSHIP_THRESHOLD, PRO_OFFER_THRESHOLD,
  SPORT_BY_ID, SCHOOL_TIER_LABELS, TIER_THRESHOLDS, CLUB_BY_ID, clubsForSport,
  DECISION_BY_ID, SCHOOL_AWARDS, PRO_AWARDS, SportsPhase,
} from '@lifeverse/shared';
import type { Sport, SportsCareerState, StatDelta } from '@lifeverse/shared';

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, Math.round(n)));
const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

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

function pickClub(sport: Sport, score: number, minPrestige = 1): { clubId: string; salary: number } | null {
  const clubs = clubsForSport(sport);
  if (clubs.length === 0) return null;
  // Better score → higher-prestige clubs come into range.
  const maxPrestige = score >= 190 ? 5 : score >= 165 ? 4 : score >= 140 ? 3 : 2;
  const eligible = clubs.filter((c) => c.prestige >= minPrestige && c.prestige <= maxPrestige);
  const pool = eligible.length > 0 ? eligible : clubs.filter((c) => c.prestige <= maxPrestige);
  if (pool.length === 0) return null;
  const club = pool[rand(0, pool.length - 1)]!;
  const [lo, hi] = club.salaryBand;
  const frac = Math.min(1, Math.max(0, (score - 120) / 100));
  const salary = Math.round(lo + (hi - lo) * frac);
  return { clubId: club.id, salary };
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

    // Athleticism/health/confidence/willpower + a little luck.
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
    // Rest heals injuries a year faster.
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

  /** Leave the school team (or walk away from a pro club without retiring honours). */
  quit(characterId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    const career = requireCareer(characterId);
    if (!c) throw new Error('Character not found');
    if (career.phase === SportsPhase.Pro) {
      SportsModel.update(characterId, { phase: SportsPhase.Retired, salary: 0, pendingOfferClub: null, pendingOfferSalary: 0 });
      EventLogModel.create(characterId, 'sports:left_club', c.age, 'milestone', 'Walked away from professional sports.');
      return { message: 'You walked away from the professional game.' };
    }
    SportsModel.delete(characterId);
    EventLogModel.create(characterId, 'sports:quit_team', c.age, 'sports', 'Quit the school team.');
    return { message: 'You handed in your jersey. The locker room feels quieter already.' };
  },

  /** Accept a pending offer: school→pro signing, or a pro transfer. */
  acceptOffer(characterId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    const career = requireCareer(characterId);
    if (!c) throw new Error('Character not found');
    if (!career.pendingOfferClub) throw new Error('There is no offer on the table.');
    const club = CLUB_BY_ID.get(career.pendingOfferClub);
    if (!club) throw new Error('That club no longer exists.');

    SportsModel.update(characterId, {
      phase: SportsPhase.Pro, clubId: club.id, teamName: club.name,
      salary: career.pendingOfferSalary, marketValue: Math.round(career.pendingOfferSalary * 2.5),
      pendingOfferClub: null, pendingOfferSalary: 0,
    });
    grantStats(characterId, [{ stat: 'happiness', amount: 8 }]);
    FlagsModel.set(characterId, 'isProAthlete', true);
    EventLogModel.create(characterId, 'sports:signed_pro', c.age, 'milestone',
      `Signed with ${club.name} for $${career.pendingOfferSalary.toLocaleString()}/yr! 🖊️`);
    return { message: `🖊️ You signed with ${club.name} — $${career.pendingOfferSalary.toLocaleString()} a year!` };
  },

  rejectOffer(characterId: string): { message: string } {
    const career = requireCareer(characterId);
    if (!career.pendingOfferClub) throw new Error('There is no offer on the table.');
    const club = CLUB_BY_ID.get(career.pendingOfferClub);
    SportsModel.update(characterId, { pendingOfferClub: null, pendingOfferSalary: 0 });
    return { message: `You turned down ${club?.name ?? 'the club'}. Betting on yourself.` };
  },

  /** Renegotiate the current contract — reputation-gated. */
  negotiate(characterId: string): { message: string } {
    const career = requireCareer(characterId);
    if (career.phase !== SportsPhase.Pro) throw new Error('You need a professional contract to negotiate.');
    if (career.reputation < 50) {
      SportsModel.update(characterId, { coachApproval: clamp(career.coachApproval - 5) });
      return { message: 'The club laughed you out of the room. Build your reputation first.' };
    }
    const raise = Math.round(career.salary * (0.05 + (career.reputation / 100) * 0.15));
    SportsModel.update(characterId, { salary: career.salary + raise });
    return { message: `💰 New deal! Your salary rises by $${raise.toLocaleString()}/yr.` };
  },

  /** Ask for a move — immediately shops you around. */
  requestTransfer(characterId: string): { message: string } {
    const career = requireCareer(characterId);
    if (career.phase !== SportsPhase.Pro) throw new Error('Transfers are for professionals.');
    const offer = pickClub(career.sport, careerScore(career));
    if (!offer || offer.clubId === career.clubId) {
      return { message: 'Your agent shopped you around — no takers this season. Keep performing.' };
    }
    SportsModel.update(characterId, { pendingOfferClub: offer.clubId, pendingOfferSalary: offer.salary, coachApproval: clamp(career.coachApproval - 8) });
    const club = CLUB_BY_ID.get(offer.clubId)!;
    return { message: `📨 ${club.name} is interested — $${offer.salary.toLocaleString()}/yr. Accept the transfer?` };
  },

  /** Hang up the boots. Hall of Fame for storied careers. */
  retire(characterId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    const career = requireCareer(characterId);
    if (!c) throw new Error('Character not found');
    if (career.phase !== SportsPhase.Pro) throw new Error('Only professionals retire; students just quit the team.');
    const hof = career.championships >= 3 || career.awards.length >= 6 || career.reputation >= 90;
    SportsModel.update(characterId, {
      phase: SportsPhase.Retired, salary: 0, pendingOfferClub: null, pendingOfferSalary: 0, hallOfFame: hof,
    });
    if (hof) FlagsModel.set(characterId, 'sportsHallOfFame', true);
    FlagsModel.set(characterId, 'isProAthlete', false);
    EventLogModel.create(characterId, 'sports:retired', c.age, 'milestone',
      hof ? '🏛️ Retired from professional sports — and entered the Hall of Fame!' : 'Retired from professional sports.');
    return { message: hof ? '🏛️ You retire a legend — welcome to the Hall of Fame!' : '👏 You retire after a solid professional career.' };
  },

  /**
   * Annual step (from age-up): development, tiers, awards, scholarships, offers,
   * pro stats + salary, transfers, decline, and coach patience.
   */
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
      // Passive growth from coaching + fitness; neglect decays approval.
      fields.skill = clamp(career.skill + Math.round(career.coachApproval / 25) + (injured ? -2 : 1));
      fields.coachApproval = clamp(career.coachApproval - 2);
      // Removed for chronically poor commitment.
      if (career.coachApproval <= 8) {
        SportsModel.delete(characterId);
        EventLogModel.create(characterId, 'sports:cut_from_team', age, 'sports', 'Cut from the team for poor commitment.');
        grantStats(characterId, [{ stat: 'happiness', amount: -6 }]);
        return;
      }
      // Tier promotion on sustained skill+reputation.
      const score = (fields.skill ?? career.skill) + career.reputation;
      let tier = career.tier;
      while (tier < 5 && score >= (TIER_THRESHOLDS[tier + 1] ?? Infinity)) tier++;
      if (tier !== career.tier) {
        fields.tier = tier;
        EventLogModel.create(characterId, 'sports:promotion', age, 'milestone', `Became ${SCHOOL_TIER_LABELS[tier]} on the ${sport.label} team! ${sport.emoji}`);
        grantStats(characterId, [{ stat: 'happiness', amount: 4 }]);
      }
      // Awards for standouts.
      if (score >= 100 && Math.random() < 0.35) {
        const award = SCHOOL_AWARDS[rand(0, SCHOOL_AWARDS.length - 1)]!;
        awards.push(`${award} (age ${age})`);
        fields.awards = awards;
        fields.reputation = clamp(career.reputation + 6);
        FlagsModel.set(characterId, 'sportsAward', true);
        EventLogModel.create(characterId, 'sports:award', age, 'milestone', `🏆 Won ${award}!`);
      }
      // Scholarship window.
      if ((age === 17 || age === 18) && !career.hasScholarship && score >= SCHOLARSHIP_THRESHOLD) {
        fields.hasScholarship = true;
        FlagsModel.set(characterId, 'hasScholarship', true);
        EventLogModel.create(characterId, 'sports:scholarship', age, 'milestone', '🎓 Offered an athletic scholarship — university tuition halved!');
      }
      // Pro offers once school age is done.
      if (age >= 18 && !career.pendingOfferClub && score >= PRO_OFFER_THRESHOLD && Math.random() < 0.6) {
        const offer = pickClub(career.sport, score);
        if (offer) {
          fields.pendingOfferClub = offer.clubId;
          fields.pendingOfferSalary = offer.salary;
          const club = CLUB_BY_ID.get(offer.clubId)!;
          EventLogModel.create(characterId, 'sports:pro_offer', age, 'milestone', `📨 ${club.name} wants to sign you — $${offer.salary.toLocaleString()}/yr!`);
        }
      }
      // Age out of school sports without a pro path.
      if (age >= 23 && !career.pendingOfferClub) {
        SportsModel.update(characterId, { ...fields, phase: SportsPhase.Retired });
        EventLogModel.create(characterId, 'sports:school_end', age, 'sports', 'School athletics came to a natural end.');
        return;
      }
      SportsModel.update(characterId, fields);
      return;
    }

    // ── Professional season ──
    const decline = age >= SPORTS_DECLINE_AGE ? (age - SPORTS_DECLINE_AGE + 1) * 2 : 0;
    fields.skill = clamp(career.skill + (injured ? -3 : 1) - Math.round(decline / 2));
    fields.fitness = clamp(career.fitness - (injured ? 8 : 0) - decline + (career.lastDecisionAge >= age - 1 ? 2 : -2));
    const performance = ((fields.skill ?? 0) * 0.5 + (fields.fitness ?? 0) * 0.3 + career.reputation * 0.2) / 100;

    const games = injured ? rand(4, 12) : rand(22, 38);
    fields.appearances = career.appearances + games;
    fields.points = career.points + Math.round(games * performance * (sport.hasAssists ? 0.9 : 0.5));
    if (sport.hasAssists) fields.assists = career.assists + Math.round(games * performance * 0.5);

    // Salary hits the bank; earnings accumulate.
    const fin = FinanceModel.findByCharacterId(characterId);
    if (fin && career.salary > 0) FinanceModel.update(characterId, { cash: fin.cash + career.salary });
    fields.careerEarnings = career.careerEarnings + career.salary;
    fields.marketValue = Math.round(career.salary * (1.5 + performance * 2));
    fields.reputation = clamp(career.reputation + (performance >= 0.7 ? 4 : performance >= 0.5 ? 1 : -3));

    if (performance >= 0.75 && Math.random() < 0.4) {
      const award = PRO_AWARDS[rand(0, PRO_AWARDS.length - 1)]!;
      awards.push(`${award} (age ${age})`);
      fields.awards = awards;
      if (award === 'League Champion' || award === 'Cup Winner') fields.championships = career.championships + 1;
      FlagsModel.set(characterId, 'sportsProAward', true);
      EventLogModel.create(characterId, 'sports:pro_award', age, 'milestone', `🏆 ${award}!`);
      grantStats(characterId, [{ stat: 'happiness', amount: 5 }]);
    }
    // Transfer market: strong seasons attract bigger clubs; decline attracts smaller ones.
    if (!career.pendingOfferClub && Math.random() < 0.3) {
      const offer = pickClub(career.sport, careerScore(career) + (performance >= 0.7 ? 20 : -20));
      if (offer && offer.clubId !== career.clubId) {
        fields.pendingOfferClub = offer.clubId;
        fields.pendingOfferSalary = offer.salary;
        const club = CLUB_BY_ID.get(offer.clubId)!;
        EventLogModel.create(characterId, 'sports:transfer_offer', age, 'sports', `📨 Transfer interest from ${club.name} ($${offer.salary.toLocaleString()}/yr).`);
      }
    }
    // Random season injury.
    if (!injured && Math.random() < 0.08) {
      fields.injuryYears = 1;
      grantStats(characterId, [{ stat: 'health', amount: -6 }]);
      EventLogModel.create(characterId, 'sports:injury', age, 'sports', '🤕 A season-marring injury.');
    }
    SportsModel.update(characterId, fields);
  },
};
