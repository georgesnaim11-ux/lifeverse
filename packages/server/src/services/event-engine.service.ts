import { ALL_EVENTS, getEventById } from '../events/registry.js';
import { StatsModel, FlagsModel, TraitsModel, EventLogModel, ThreadsModel } from '../models/index.js';
import { applyDeltas } from '../engine/stat.engine.js';
import { GAME_CONSTANTS, LIFE_STAGES_IN_ORDER } from '@lifeverse/shared';
import type { GameEvent, PresentedEvent, StatCondition, StatBlock, LifeStage, NavTarget } from '@lifeverse/shared';

/**
 * Evaluate a single stat condition against the current stat block.
 */
function checkStatCondition(stats: StatBlock, cond: StatCondition): boolean {
  const value: number = (stats as unknown as Record<string, number>)[cond.stat] ?? 0;
  switch (cond.operator) {
    case 'gte': return value >= cond.value;
    case 'lte': return value <= cond.value;
    case 'gt':  return value >  cond.value;
    case 'lt':  return value <  cond.value;
    case 'eq':  return value === cond.value;
    default:    return false;
  }
}

/**
 * Select 1–3 eligible events for the current turn.
 *
 * Eligibility rules (all must pass):
 *  1. Event stage matches the character's current stage.
 *  2. All stat conditions pass.
 *  3. All flag conditions pass.
 *  4. Required traits (if any) are present.
 *  5. Cooldown: the event hasn't occurred within the last `cooldownYears`.
 */
export function selectEventsForTurn(
  characterId: string,
  age: number,
): PresentedEvent[] {
  const stats = StatsModel.findByCharacterId(characterId);
  if (!stats) return [];

  const flags = FlagsModel.getAll(characterId);
  const traits = TraitsModel.findByCharacterId(characterId);
  const traitKeys = new Set(traits.map((t) => t.key));

  // Determine life stage from age
  const { lifeStageAgeThresholds } = GAME_CONSTANTS;
  let stage: LifeStage = 'childhood';
  for (const s of [...LIFE_STAGES_IN_ORDER].reverse()) {
    if (age >= lifeStageAgeThresholds[s]) { stage = s; break; }
  }

  const cooldownMax = Math.max(
    ...ALL_EVENTS.map((e) => e.cooldownYears ?? 0).filter((y) => y < 90),
    5,
  );
  const recentEventIds = EventLogModel.getRecentEventIds(characterId, age, cooldownMax);

  const eligible = ALL_EVENTS.filter((event) => {
    // 1. Stage
    if (!event.stages.includes(stage)) return false;
    // 1b. Exact-age gating (age-appropriate milestones)
    if (event.minAge !== undefined && age < event.minAge) return false;
    if (event.maxAge !== undefined && age > event.maxAge) return false;
    // 2. Cooldown
    const cd = event.cooldownYears ?? 0;
    if (cd > 0 && recentEventIds.has(event.id)) {
      const lastOccurrence = EventLogModel.findByCharacterId(characterId)
        .filter((e) => e.eventId === event.id)
        .at(-1);
      if (lastOccurrence && age - lastOccurrence.ageAtEvent < cd) return false;
    }
    // 3. Stat conditions
    for (const cond of event.statConditions) {
      if (!checkStatCondition(stats, cond)) return false;
    }
    // 4. Flag conditions
    for (const cond of event.flagConditions) {
      if ((flags[cond.key] ?? false) !== cond.value) return false;
    }
    // 5. Required traits
    if (event.requiredTraits) {
      for (const t of event.requiredTraits) {
        if (!traitKeys.has(t)) return false;
      }
    }
    return true;
  });

  // Milestones fire deterministically; the rest of the slot(s) fill from the
  // weighted-random "normal" pool. Total is capped at eventsPerTurn.max (1–2).
  const milestones = eligible.filter((e) => e.priority === 'milestone');
  const normal = eligible.filter((e) => e.priority !== 'milestone');
  const { min, max } = GAME_CONSTANTS.eventsPerTurn;

  const selected: GameEvent[] = [];
  if (milestones.length > 0) {
    // Highest-weight eligible milestone, chosen deterministically.
    const m = [...milestones].sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1))[0]!;
    selected.push(m);
  }

  const targetTotal = min + Math.floor(Math.random() * (max - min + 1));
  const want = Math.min(max, Math.max(selected.length, targetTotal));
  const pool = [...normal];
  while (selected.length < want && pool.length > 0) {
    const totalWeight = pool.reduce((sum, e) => sum + (e.weight ?? 1), 0);
    let roll = Math.random() * totalWeight;
    const idx = pool.findIndex((e) => { roll -= (e.weight ?? 1); return roll <= 0; });
    const pick = pool.splice(idx === -1 ? pool.length - 1 : idx, 1)[0];
    if (pick) selected.push(pick);
  }

  return selected.map((event) => ({ event, ageAtEvent: age }));
}

/**
 * Apply a player's choice to a game event. Returns the updated stat block.
 * Persists the event log entry and plants any Thread seeds.
 */
export function applyChoice(
  bloodlineId: string,
  characterId: string,
  eventId: string,
  choiceId: string,
  age: number,
): { stats: StatBlock; outcomeText: string; navigateTo?: NavTarget } {
  const event = getEventById(eventId);
  if (!event) throw new Error(`Unknown event: ${eventId}`);
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} for event ${eventId}`);

  const current = StatsModel.findByCharacterId(characterId);
  if (!current) throw new Error(`Stats not found for ${characterId}`);

  // Apply stat deltas
  const updated = applyDeltas(current, choice.statDeltas);
  StatsModel.update(characterId, updated);

  // Apply flag changes
  for (const fc of choice.flagChanges) {
    FlagsModel.set(characterId, fc.key, fc.value);
  }

  // Record in event log
  EventLogModel.create(characterId, eventId, age, choiceId, choice.outcome);

  // Plant thread seeds
  if (choice.seedsThreads) {
    for (const seed of choice.seedsThreads) {
      ThreadsModel.plantSeed(bloodlineId, characterId, age, seed);
    }
  }

  return { stats: updated, outcomeText: choice.outcome, ...(choice.navigateTo ? { navigateTo: choice.navigateTo } : {}) };
}
