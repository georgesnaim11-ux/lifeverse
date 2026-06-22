import type {
  ActivityDefinition,
  Character,
  StatBlock,
  DomainState,
  CharacterResources,
} from '@lifeverse/shared';
import { LIFE_STAGES_IN_ORDER } from '@lifeverse/shared';

/**
 * Determine which activities are currently available to a character.
 * Filters by stage, age, domain level, flags, stats, and available resources.
 */
export function filterAvailableActivities(
  allActivities: ActivityDefinition[],
  character: Character,
  stats: StatBlock,
  domains: DomainState,
  resources: CharacterResources,
  flags: Record<string, boolean>,
): ActivityDefinition[] {
  const remaining = resources.totalTimeSlots - resources.usedTimeSlots;

  return allActivities.filter((a) => {
    // Stage filter
    if (a.stages && a.stages.length > 0) {
      if (!a.stages.includes(character.lifeStage)) return false;
    }

    // Age range
    if (a.minAge !== undefined && character.age < a.minAge) return false;
    if (a.maxAge !== undefined && character.age > a.maxAge) return false;

    // Must have enough time slots
    if (a.timeCost > remaining) return false;

    // Energy checks (warn but still show; energy checks happen at perform-time)
    // We only hide if COMPLETELY out of both energies and the activity costs both
    const mentalOk = (a.mentalCost ?? 0) <= resources.mentalEnergy + 20;
    const physicalOk = (a.physicalCost ?? 0) <= resources.physicalEnergy + 20;
    if (!mentalOk && !physicalOk) return false;

    // Burnout blocks high-effort activities
    if (resources.burnoutState && (a.burnoutRisk ?? 0) > 0.2) return false;

    // Domain level requirements
    if (a.minDomainLevel) {
      for (const [domain, minLevel] of Object.entries(a.minDomainLevel)) {
        const actual = domains[domain as keyof DomainState] as number;
        if (actual < minLevel) return false;
      }
    }

    // Required flags
    if (a.requiredFlags) {
      for (const flag of a.requiredFlags) {
        if (!flags[flag]) return false;
      }
    }

    // Blocked flags
    if (a.blockedFlags) {
      for (const flag of a.blockedFlags) {
        if (flags[flag]) return false;
      }
    }

    // Required stat conditions
    if (a.requiredStats) {
      for (const cond of a.requiredStats) {
        const val = stats[cond.stat as keyof StatBlock] as number ?? 0;
        if (cond.operator === 'gte' && val < cond.value) return false;
        if (cond.operator === 'lte' && val > cond.value) return false;
        if (cond.operator === 'gt' && val <= cond.value) return false;
        if (cond.operator === 'lt' && val >= cond.value) return false;
        if (cond.operator === 'eq' && val !== cond.value) return false;
      }
    }

    return true;
  });
}

/**
 * Check if a specific activity CAN be performed right now (resource validation).
 * Returns null if OK, or an error string if not.
 */
export function validateActivityPerform(
  activity: ActivityDefinition,
  resources: CharacterResources,
  finance: { cash: number },
): string | null {
  const remaining = resources.totalTimeSlots - resources.usedTimeSlots;
  if (activity.timeCost > remaining) {
    return `Not enough time slots (need ${activity.timeCost}, have ${remaining})`;
  }
  if ((activity.mentalCost ?? 0) > resources.mentalEnergy) {
    return `Not enough mental energy (need ${activity.mentalCost}, have ${Math.floor(resources.mentalEnergy)})`;
  }
  if ((activity.physicalCost ?? 0) > resources.physicalEnergy) {
    return `Not enough physical energy (need ${activity.physicalCost}, have ${Math.floor(resources.physicalEnergy)})`;
  }
  if ((activity.moneyCost ?? 0) > finance.cash) {
    return `Not enough money (need $${activity.moneyCost}, have $${Math.floor(finance.cash)})`;
  }
  return null;
}

/** Clamp a value between 0 and 100. */
function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Apply an activity's resource costs and gains to the current state.
 * Returns updated resources and the domain deltas to persist.
 * Does NOT write to DB — the service layer does that.
 */
export function computeActivityOutcome(
  activity: ActivityDefinition,
  resources: CharacterResources,
): {
  updatedResources: CharacterResources;
  domainGains: ActivityDefinition['domainGains'];
} {
  const newUsed = resources.usedTimeSlots + activity.timeCost;
  const newMental = clamp(
    resources.mentalEnergy
    - (activity.mentalCost ?? 0)
    + (activity.energyRestore?.mental ?? 0),
    0,
    resources.mentalEnergyMax,
  );
  const newPhysical = clamp(
    resources.physicalEnergy
    - (activity.physicalCost ?? 0)
    + (activity.energyRestore?.physical ?? 0),
    0,
    resources.physicalEnergyMax,
  );

  return {
    updatedResources: {
      ...resources,
      usedTimeSlots: newUsed,
      mentalEnergy: newMental,
      physicalEnergy: newPhysical,
    },
    domainGains: activity.domainGains,
  };
}

// re-export for convenience
export { LIFE_STAGES_IN_ORDER };
