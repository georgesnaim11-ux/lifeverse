import type { ActivityDefinition } from '@lifeverse/shared';
import { childhoodActivities } from './childhood.activities.js';
import { adolescenceActivities } from './adolescence.activities.js';
import { youngAdultActivities } from './young-adult.activities.js';
import { adultActivities } from './adult.activities.js';
import { seniorActivities } from './senior.activities.js';

export const ALL_ACTIVITIES: ActivityDefinition[] = [
  ...childhoodActivities,
  ...adolescenceActivities,
  ...youngAdultActivities,
  ...adultActivities,
  ...seniorActivities,
];

export const ACTIVITY_REGISTRY: Map<string, ActivityDefinition> = new Map(
  ALL_ACTIVITIES.map((a) => [a.id, a]),
);

export function getActivityById(id: string): ActivityDefinition | undefined {
  return ACTIVITY_REGISTRY.get(id);
}
