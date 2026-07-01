import { LifeStage } from '@lifeverse/shared';
import type { GameEvent } from '@lifeverse/shared';

/**
 * Milestone & chain events. These fire deterministically at the right age /
 * condition (priority: 'milestone') and route the player to an existing tab
 * instead of resolving in isolation. They form natural progression chains via
 * flags rather than a separate system.
 */
export const milestoneEvents: GameEvent[] = [
  // ── Turn 18 → University decision → Education tab ──
  {
    id: 'ms_university_choice',
    title: 'A Fork in the Road',
    description: "You're 18. The world is asking a big question: is university your next chapter?",
    stages: [LifeStage.YoungAdult],
    minAge: 18, maxAge: 20,
    priority: 'milestone',
    statConditions: [],
    flagConditions: [{ key: 'inUniversity', value: false }, { key: 'hasDegree', value: false }],
    weight: 10,
    cooldownYears: 99,
    choices: [
      {
        id: 'go_uni',
        label: '🎓 Yes — look at universities',
        statDeltas: [{ stat: 'happiness', amount: 2 }],
        flagChanges: [{ key: 'consideredUniversity', value: true }],
        outcome: "Let's find the right program for you.",
        navigateTo: 'education',
      },
      {
        id: 'skip_uni',
        label: 'Not for me — into the workforce',
        statDeltas: [{ stat: 'willpower', amount: 3 }],
        flagChanges: [{ key: 'consideredUniversity', value: true }],
        outcome: 'You decide real-world experience is your classroom.',
      },
    ],
  },

  // ── High stress → Take a vacation → Activities → Vacation ──
  {
    id: 'ms_burnout_vacation',
    title: 'Running on Empty',
    description: "The stress has been piling up. Your body and mind are begging for a real break.",
    stages: [LifeStage.YoungAdult, LifeStage.Adult, LifeStage.Senior],
    minAge: 18,
    priority: 'milestone',
    statConditions: [{ stat: 'stress', operator: 'gte', value: 70 }],
    flagConditions: [],
    weight: 9,
    cooldownYears: 3,
    choices: [
      {
        id: 'take_vacation',
        label: '🏖️ Take a vacation',
        statDeltas: [],
        flagChanges: [],
        outcome: "You need this. Let's plan a getaway.",
        navigateTo: 'activities-vacation',
      },
      {
        id: 'push_through',
        label: 'Push through it',
        statDeltas: [{ stat: 'stress', amount: 4 }, { stat: 'health', amount: -3 }],
        flagChanges: [],
        outcome: 'You grit your teeth and carry on — but the strain shows.',
      },
    ],
  },

  // ── Adult + no job → Find work → Career tab ──
  {
    id: 'ms_find_work',
    title: 'Time to Find Work',
    description: 'The bills are real now. A steady income would change everything.',
    stages: [LifeStage.YoungAdult, LifeStage.Adult],
    minAge: 19,
    priority: 'milestone',
    statConditions: [],
    flagConditions: [{ key: 'isEmployed', value: false }],
    weight: 7,
    cooldownYears: 2,
    choices: [
      {
        id: 'job_hunt',
        label: '💼 Look for a job',
        statDeltas: [{ stat: 'willpower', amount: 2 }],
        flagChanges: [],
        outcome: 'Time to see who\'s hiring.',
        navigateTo: 'career',
      },
      {
        id: 'not_yet',
        label: 'Not just yet',
        statDeltas: [{ stat: 'happiness', amount: 1 }],
        flagChanges: [],
        outcome: 'You put it off a little longer.',
      },
    ],
  },

  // ── Adult, unmarried → Nurture relationships → Family tab ──
  {
    id: 'ms_settle_down',
    title: 'Something Missing',
    description: 'Friends are pairing off and starting families. You wonder about your own path.',
    stages: [LifeStage.YoungAdult, LifeStage.Adult],
    minAge: 25,
    priority: 'milestone',
    statConditions: [],
    flagConditions: [{ key: 'isMarried', value: false }],
    weight: 5,
    cooldownYears: 5,
    choices: [
      {
        id: 'seek_love',
        label: '❤️ Focus on relationships',
        statDeltas: [{ stat: 'happiness', amount: 2 }],
        flagChanges: [],
        outcome: 'You decide to invest in the people around you.',
        navigateTo: 'family',
      },
      {
        id: 'focus_self',
        label: 'Focus on myself for now',
        statDeltas: [{ stat: 'willpower', amount: 2 }],
        flagChanges: [],
        outcome: 'This season is about you.',
      },
    ],
  },

  // ── Chained flavor: only after considering university (shows chaining) ──
  {
    id: 'ms_campus_life',
    title: 'Campus Life',
    description: 'Now that university is on your mind, an open day invites you to explore student life.',
    stages: [LifeStage.YoungAdult],
    minAge: 18, maxAge: 22,
    statConditions: [],
    flagConditions: [{ key: 'consideredUniversity', value: true }, { key: 'inUniversity', value: false }, { key: 'hasDegree', value: false }],
    weight: 2,
    cooldownYears: 2,
    choices: [
      {
        id: 'visit_campus',
        label: 'Visit a campus',
        statDeltas: [{ stat: 'happiness', amount: 3 }, { stat: 'intelligence', amount: 1 }],
        flagChanges: [],
        outcome: 'The energy of campus life is contagious.',
        navigateTo: 'education',
      },
      {
        id: 'stay_home',
        label: 'Maybe another time',
        statDeltas: [],
        flagChanges: [],
        outcome: 'You keep your options open.',
      },
    ],
  },
];
