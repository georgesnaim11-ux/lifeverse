import { CharacterModel, StatsModel, FinanceModel, FlagsModel, EventLogModel } from '../models/index.js';
import { ActivityLogModel } from '../models/activity-log.model.js';
import { applyDeltas } from '../engine/stat.engine.js';
import {
  LIFE_ACTIVITY_BY_ID, getCountry, VACATION_BASE_COST, VACATION_TYPE_BY_ID, VACATION_MIN_AGE,
  CASINO_GAME_BY_ID, CASINO_MIN_AGE,
} from '@lifeverse/shared';
import type { StatDelta } from '@lifeverse/shared';

function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Light Phase-A random events that can fire after an activity. */
const RANDOM_EVENTS = [
  { msg: 'You made a new friend along the way! 🧑‍🤝‍🧑', deltas: [{ stat: 'happiness', amount: 3 }] as StatDelta[], cash: 0 },
  { msg: 'You found some cash on the ground! 💵', deltas: [] as StatDelta[], cash: rand(50, 400) },
  { msg: 'You caught a nasty bug. 🤧', deltas: [{ stat: 'health', amount: -rand(3, 8) }] as StatDelta[], cash: 0 },
  { msg: 'Someone gave you a lovely compliment. 😊', deltas: [{ stat: 'happiness', amount: 2 }, { stat: 'looks', amount: 1 }] as StatDelta[], cash: 0 },
  { msg: 'You lost your wallet! 😩', deltas: [{ stat: 'happiness', amount: -2 }] as StatDelta[], cash: -rand(50, 500) },
];

export const ActivitiesService = {
  /** Perform a life activity — randomized effects scaled by diminishing returns. */
  perform(characterId: string, activityId: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    if (!c.isAlive) throw new Error('Character is dead');
    const act = LIFE_ACTIVITY_BY_ID.get(activityId);
    if (!act) throw new Error('Unknown activity');
    if (act.minAge !== undefined && c.age < act.minAge) throw new Error(`You're too young for that yet.`);
    if (act.maxAge !== undefined && c.age > act.maxAge) throw new Error(`You're past the age for that.`);
    const flags = FlagsModel.getAll(characterId);
    for (const f of act.requiredFlags ?? []) if (!flags[f]) throw new Error('You can’t do that right now.');
    for (const f of act.blockedFlags ?? []) if (flags[f]) throw new Error('You can’t do that right now.');

    const finance = FinanceModel.findByCharacterId(characterId);
    if (act.moneyCost && (!finance || finance.cash < act.moneyCost)) {
      throw new Error(`You can't afford that ($${act.moneyCost.toLocaleString()}).`);
    }

    // Diminishing returns: each repeat this year is worth less.
    const prior = ActivityLogModel.countThisYear(characterId, activityId, c.age);
    const factor = Math.max(0.15, 1 - 0.35 * prior);

    const stats = StatsModel.findByCharacterId(characterId);
    if (stats) {
      const deltas: StatDelta[] = act.effects.map((e) => ({
        stat: e.stat as StatDelta['stat'],
        amount: Math.round(rand(e.min, e.max) * factor),
      }));
      StatsModel.update(characterId, applyDeltas(stats, deltas));
    }

    // Money in/out.
    let cashDelta = -(act.moneyCost ?? 0);
    let extra = '';
    if (act.moneyReward) {
      const earned = rand(act.moneyReward.min, act.moneyReward.max);
      cashDelta += earned;
      extra = ` You earned $${earned.toLocaleString()}.`;
    }
    const fin = FinanceModel.findByCharacterId(characterId);
    if (fin && cashDelta !== 0) FinanceModel.update(characterId, { cash: Math.max(0, fin.cash + cashDelta) });

    ActivityLogModel.record(characterId, activityId, c.age, { timeCost: 0, mentalCost: 0, physicalCost: 0, moneyCost: act.moneyCost ?? 0 });

    // ~10% random event.
    let eventMsg = '';
    if (Math.random() < 0.1) {
      const ev = RANDOM_EVENTS[rand(0, RANDOM_EVENTS.length - 1)]!;
      const s = StatsModel.findByCharacterId(characterId);
      if (s && ev.deltas.length) StatsModel.update(characterId, applyDeltas(s, ev.deltas));
      if (ev.cash !== 0) {
        const f2 = FinanceModel.findByCharacterId(characterId);
        if (f2) FinanceModel.update(characterId, { cash: Math.max(0, f2.cash + ev.cash) });
      }
      eventMsg = ` ${ev.msg}`;
      EventLogModel.create(characterId, `event:${activityId}`, c.age, 'event', ev.msg);
    }

    return { message: `${act.emoji} ${act.label}.${extra}${eventMsg}` };
  },

  /** Take a vacation: choose country + type + activity. Costs cash, lifts mood. */
  vacation(characterId: string, countryId: string, typeId: string, _activityKey: string): { message: string } {
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    if (c.age < VACATION_MIN_AGE) throw new Error(`You must be ${VACATION_MIN_AGE} to travel on your own.`);
    const country = getCountry(countryId);
    const type = VACATION_TYPE_BY_ID.get(typeId);
    if (!country || !type) throw new Error('Invalid vacation choice.');

    const cost = Math.round(VACATION_BASE_COST * country.costOfLiving * type.costMultiplier);
    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance || finance.cash < cost) throw new Error(`That trip costs $${cost.toLocaleString()} — you can't afford it.`);
    FinanceModel.update(characterId, { cash: finance.cash - cost });

    const tier = Math.round(type.costMultiplier); // budget 1, standard 3, luxury 6
    const stats = StatsModel.findByCharacterId(characterId);
    if (stats) {
      StatsModel.update(characterId, applyDeltas(stats, [
        { stat: 'happiness', amount: 6 + tier + rand(0, 4) },
        { stat: 'stress', amount: -(5 + tier + rand(0, 3)) },
        { stat: 'health', amount: rand(0, 2) },
      ]));
    }
    EventLogModel.create(characterId, 'milestone:vacation', c.age, 'milestone',
      `Took a ${type.label.toLowerCase()} vacation to ${country.label}.`);
    return { message: `${country.flag} You took a ${type.label} vacation to ${country.label}! Cost $${cost.toLocaleString()}.` };
  },

  /** Gamble at the casino. Negative expected value — never guaranteed profit. */
  casino(characterId: string, gameId: string, bet: number): { message: string } {
    const c = CharacterModel.findById(characterId);
    if (!c) throw new Error('Character not found');
    if (c.age < CASINO_MIN_AGE) throw new Error(`You must be ${CASINO_MIN_AGE} to gamble.`);
    const game = CASINO_GAME_BY_ID.get(gameId);
    if (!game) throw new Error('Unknown game.');
    if (bet < game.minBet) throw new Error(`Minimum bet is $${game.minBet}.`);
    const finance = FinanceModel.findByCharacterId(characterId);
    if (!finance || finance.cash < bet) throw new Error('You don’t have enough cash for that bet.');

    const won = Math.random() < game.winChance;
    const stats = StatsModel.findByCharacterId(characterId);
    if (won) {
      const winnings = Math.round(bet * game.winMultiplier);
      FinanceModel.update(characterId, { cash: finance.cash + winnings });
      if (stats) StatsModel.update(characterId, applyDeltas(stats, [{ stat: 'happiness', amount: 3 }, { stat: 'stress', amount: 1 }]));
      EventLogModel.create(characterId, 'event:casino_win', c.age, 'event', `Won $${winnings.toLocaleString()} at ${game.label}.`);
      return { message: `${game.emoji} You won $${winnings.toLocaleString()} at ${game.label}! 🎉` };
    }
    FinanceModel.update(characterId, { cash: Math.max(0, finance.cash - bet) });
    if (stats) StatsModel.update(characterId, applyDeltas(stats, [{ stat: 'happiness', amount: -2 }, { stat: 'stress', amount: 2 }]));
    EventLogModel.create(characterId, 'event:casino_loss', c.age, 'event', `Lost $${bet.toLocaleString()} at ${game.label}.`);
    return { message: `${game.emoji} You lost $${bet.toLocaleString()} at ${game.label}.` };
  },
};
