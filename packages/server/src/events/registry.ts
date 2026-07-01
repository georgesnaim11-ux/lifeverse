import type { GameEvent } from '@lifeverse/shared';
import { childhoodEvents } from './childhood.js';
import { adolescenceEvents } from './adolescence.js';
import { youngAdultEvents } from './young-adult.js';
import { adultEvents } from './adult.js';
import { seniorEvents } from './senior.js';
import { milestoneEvents } from './milestones.js';

/** All authored event definitions — the canonical pool. */
export const EVENT_REGISTRY: Map<string, GameEvent> = new Map(
  [
    ...milestoneEvents,
    ...childhoodEvents,
    ...adolescenceEvents,
    ...youngAdultEvents,
    ...adultEvents,
    ...seniorEvents,
  ].map((event) => [event.id, event]),
);

/** All events as an array, for selector logic. */
export const ALL_EVENTS: GameEvent[] = Array.from(EVENT_REGISTRY.values());

export function getEventById(id: string): GameEvent | undefined {
  return EVENT_REGISTRY.get(id);
}

export const EVENT_COUNT = EVENT_REGISTRY.size;
