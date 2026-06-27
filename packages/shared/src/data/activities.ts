import { ActivityCategory } from '../types/activities.js';
import type {
  LifeActivity, VacationType, VacationActivityOption, CasinoGame, ActivityCategory as Category,
} from '../types/activities.js';

const A = ActivityCategory;

/* ───────────────────────── Activity catalog ───────────────────────── */
// Effects are ranges; the server rolls a value and scales it by diminishing
// returns (repeating the same activity in one year helps less and less).

export const LIFE_ACTIVITIES: LifeActivity[] = [
  // ── ❤️ Health & Wellness ──
  { id: 'walk',      category: A.Health, label: 'Go For A Walk',  emoji: '🚶', description: 'A relaxing stroll.', effects: [{ stat: 'health', min: 1, max: 2 }, { stat: 'happiness', min: 1, max: 2 }, { stat: 'stress', min: -2, max: -1 }] },
  { id: 'run',       category: A.Health, label: 'Go For A Run',   emoji: '🏃', description: 'Get the blood pumping.', effects: [{ stat: 'health', min: 2, max: 4 }, { stat: 'happiness', min: 1, max: 3 }, { stat: 'stress', min: -3, max: -1 }] },
  { id: 'join_gym',  category: A.Health, label: 'Join A Gym',     emoji: '🏋️', description: 'Sign up for a membership.', moneyCost: 600, minAge: 14, effects: [{ stat: 'health', min: 1, max: 2 }, { stat: 'happiness', min: 2, max: 4 }] },
  { id: 'workout',   category: A.Health, label: 'Workout',        emoji: '💪', description: 'Lift, push, sweat.', effects: [{ stat: 'health', min: 2, max: 4 }, { stat: 'looks', min: 0, max: 1 }, { stat: 'stress', min: -2, max: -1 }] },
  { id: 'swimming',  category: A.Health, label: 'Go Swimming',    emoji: '🏊', description: 'Laps at the pool.', effects: [{ stat: 'health', min: 2, max: 3 }, { stat: 'happiness', min: 1, max: 2 }, { stat: 'stress', min: -2, max: -1 }] },
  { id: 'yoga',      category: A.Health, label: 'Yoga',           emoji: '🧘', description: 'Stretch and breathe.', moneyCost: 30, effects: [{ stat: 'health', min: 1, max: 2 }, { stat: 'stress', min: -4, max: -2 }, { stat: 'happiness', min: 1, max: 2 }] },
  { id: 'spa',       category: A.Health, label: 'Visit Spa',      emoji: '💆', description: 'Pamper yourself.', moneyCost: 250, minAge: 16, effects: [{ stat: 'happiness', min: 3, max: 6 }, { stat: 'stress', min: -6, max: -3 }] },
  { id: 'meditation',category: A.Health, label: 'Meditation',     emoji: '🕉️', description: 'Quiet the mind.', effects: [{ stat: 'stress', min: -5, max: -2 }, { stat: 'happiness', min: 1, max: 3 }] },
  { id: 'doctor',    category: A.Health, label: 'Visit Doctor',   emoji: '🩺', description: 'Get checked out.', moneyCost: 200, effects: [{ stat: 'health', min: 2, max: 5 }] },
  { id: 'checkup',   category: A.Health, label: 'Annual Checkup', emoji: '🏥', description: 'Routine physical.', moneyCost: 150, effects: [{ stat: 'health', min: 1, max: 4 }] },
  { id: 'physio',    category: A.Health, label: 'Physical Therapy', emoji: '🦵', description: 'Recover and rebuild.', moneyCost: 400, effects: [{ stat: 'health', min: 3, max: 6 }] },

  // ── 📚 Education ──
  { id: 'learn_skill',  category: A.Education, label: 'Learn New Skill',       emoji: '💡', description: 'Pick up something new.', effects: [{ stat: 'intelligence', min: 1, max: 3 }, { stat: 'happiness', min: 0, max: 1 }] },
  { id: 'certification',category: A.Education, label: 'Complete Certification', emoji: '📜', description: 'Earn a credential.', moneyCost: 500, minAge: 16, effects: [{ stat: 'intelligence', min: 2, max: 4 }] },
  { id: 'online_course',category: A.Education, label: 'Take Online Course',     emoji: '🖥️', description: 'Study online.', moneyCost: 200, effects: [{ stat: 'intelligence', min: 1, max: 3 }] },

  // ── 💼 Career ──
  { id: 'network',     category: A.Career, label: 'Network',           emoji: '🤝', description: 'Make connections.', minAge: 16, effects: [{ stat: 'happiness', min: 1, max: 2 }, { stat: 'stress', min: 0, max: 1 }] },
  { id: 'conference',  category: A.Career, label: 'Attend Conference', emoji: '🎤', description: 'Learn and connect.', moneyCost: 300, minAge: 16, effects: [{ stat: 'intelligence', min: 1, max: 2 }, { stat: 'happiness', min: 1, max: 2 }] },
  { id: 'freelance',   category: A.Career, label: 'Freelance',         emoji: '💻', description: 'Take a side gig for cash.', minAge: 16, moneyReward: { min: 300, max: 2000 }, effects: [{ stat: 'stress', min: 1, max: 3 }] },
  { id: 'side_hustle', category: A.Career, label: 'Side Hustle',       emoji: '⚡', description: 'Hustle for extra income.', minAge: 16, moneyReward: { min: 500, max: 3000 }, effects: [{ stat: 'stress', min: 2, max: 4 }, { stat: 'happiness', min: -1, max: 1 }] },

  // ── 👨‍👩‍👧 Relationships ──
  { id: 'call_parents',    category: A.Relationships, label: 'Call Parents',        emoji: '📞', description: 'Check in with mom and dad.', effects: [{ stat: 'happiness', min: 1, max: 3 }] },
  { id: 'visit_parents',   category: A.Relationships, label: 'Visit Parents',       emoji: '🏠', description: 'Spend the day with family.', effects: [{ stat: 'happiness', min: 2, max: 4 }, { stat: 'stress', min: -2, max: 0 }] },
  { id: 'siblings_time',   category: A.Relationships, label: 'Time With Siblings',  emoji: '👫', description: 'Hang out with your siblings.', effects: [{ stat: 'happiness', min: 1, max: 3 }] },
  { id: 'visit_grandparents', category: A.Relationships, label: 'Visit Grandparents', emoji: '👵', description: 'Wisdom and warmth.', effects: [{ stat: 'happiness', min: 2, max: 4 }] },
  { id: 'meet_people',     category: A.Relationships, label: 'Meet New People',     emoji: '🧑‍🤝‍🧑', description: 'Put yourself out there.', minAge: 12, effects: [{ stat: 'happiness', min: 1, max: 3 }] },

  // ── 🎬 Entertainment ──
  { id: 'movie',       category: A.Entertainment, label: 'Watch A Movie',  emoji: '🎬', description: 'Catch the latest film.', moneyCost: 30, effects: [{ stat: 'happiness', min: 1, max: 3 }, { stat: 'stress', min: -2, max: -1 }] },
  { id: 'sports',      category: A.Entertainment, label: 'Watch Sports',   emoji: '🏟️', description: 'Cheer on your team.', moneyCost: 80, effects: [{ stat: 'happiness', min: 1, max: 3 }] },
  { id: 'video_games', category: A.Entertainment, label: 'Play Video Games', emoji: '🎮', description: 'Game for hours.', effects: [{ stat: 'happiness', min: 1, max: 3 }, { stat: 'stress', min: -2, max: -1 }] },
  { id: 'concert',     category: A.Entertainment, label: 'Attend Concert', emoji: '🎸', description: 'Live music night.', moneyCost: 150, minAge: 12, effects: [{ stat: 'happiness', min: 3, max: 6 }, { stat: 'stress', min: -3, max: -1 }] },
  { id: 'festival',    category: A.Entertainment, label: 'Attend Festival', emoji: '🎪', description: 'A weekend of fun.', moneyCost: 120, minAge: 12, effects: [{ stat: 'happiness', min: 3, max: 6 }] },
  { id: 'theme_park',  category: A.Entertainment, label: 'Go To Theme Park', emoji: '🎢', description: 'Rides and thrills.', moneyCost: 200, effects: [{ stat: 'happiness', min: 3, max: 7 }, { stat: 'stress', min: -4, max: -2 }] },
  { id: 'read_book',   category: A.Entertainment, label: 'Read A Book',     emoji: '📖', description: 'Lose yourself in a story.', effects: [{ stat: 'happiness', min: 1, max: 2 }, { stat: 'intelligence', min: 0, max: 1 }, { stat: 'stress', min: -2, max: -1 }] },

  // ── 🍽️ Lifestyle ──
  { id: 'restaurant',  category: A.Lifestyle, label: 'Visit Restaurant', emoji: '🍽️', description: 'A nice meal out.', moneyCost: 120, effects: [{ stat: 'happiness', min: 1, max: 3 }] },
  { id: 'cafe',        category: A.Lifestyle, label: 'Visit Café',       emoji: '☕', description: 'Coffee and calm.', moneyCost: 25, effects: [{ stat: 'happiness', min: 1, max: 2 }, { stat: 'stress', min: -1, max: 0 }] },
  { id: 'host_party',  category: A.Lifestyle, label: 'Host A Party',     emoji: '🎉', description: 'Throw a bash.', moneyCost: 800, minAge: 16, effects: [{ stat: 'happiness', min: 3, max: 6 }] },
  { id: 'gala',        category: A.Lifestyle, label: 'Attend A Gala',    emoji: '🥂', description: 'Black-tie evening.', moneyCost: 2500, minAge: 18, effects: [{ stat: 'happiness', min: 4, max: 7 }, { stat: 'looks', min: 0, max: 1 }] },
  { id: 'night_market',category: A.Lifestyle, label: 'Visit Night Market', emoji: '🏮', description: 'Street food and stalls.', moneyCost: 60, effects: [{ stat: 'happiness', min: 1, max: 3 }] },

  // ── 🎨 Hobbies (Phase A: simple) ──
  { id: 'photography', category: A.Hobbies, label: 'Photography', emoji: '📷', description: 'Capture the world.', effects: [{ stat: 'happiness', min: 1, max: 3 }, { stat: 'looks', min: 0, max: 1 }] },
  { id: 'painting',    category: A.Hobbies, label: 'Painting',    emoji: '🖼️', description: 'Express yourself.', effects: [{ stat: 'happiness', min: 1, max: 3 }, { stat: 'stress', min: -2, max: 0 }] },
  { id: 'writing',     category: A.Hobbies, label: 'Writing',     emoji: '✍️', description: 'Put words to paper.', effects: [{ stat: 'happiness', min: 1, max: 2 }, { stat: 'intelligence', min: 0, max: 1 }] },
  { id: 'music',       category: A.Hobbies, label: 'Play Music',  emoji: '🎵', description: 'Make some noise.', effects: [{ stat: 'happiness', min: 1, max: 3 }] },
  { id: 'cooking',     category: A.Hobbies, label: 'Cooking',     emoji: '🍳', description: 'Whip up a dish.', effects: [{ stat: 'happiness', min: 1, max: 2 }, { stat: 'health', min: 0, max: 1 }] },
  { id: 'gardening',   category: A.Hobbies, label: 'Gardening',   emoji: '🌱', description: 'Tend your plants.', effects: [{ stat: 'happiness', min: 1, max: 3 }, { stat: 'stress', min: -2, max: -1 }] },
];

export const LIFE_ACTIVITY_BY_ID = new Map<string, LifeActivity>(LIFE_ACTIVITIES.map((a) => [a.id, a]));

export const ACTIVITIES_BY_CATEGORY: Record<Category, LifeActivity[]> = {
  [A.Health]: [], [A.Education]: [], [A.Career]: [], [A.Relationships]: [],
  [A.Entertainment]: [], [A.Travel]: [], [A.Casino]: [], [A.Lifestyle]: [], [A.Hobbies]: [],
};
for (const a of LIFE_ACTIVITIES) ACTIVITIES_BY_CATEGORY[a.category].push(a);

export const ACTIVITY_CATEGORY_ORDER: Category[] = [
  A.Health, A.Education, A.Career, A.Relationships, A.Entertainment, A.Travel, A.Casino, A.Lifestyle, A.Hobbies,
];
export const ACTIVITY_CATEGORY_LABELS: Record<Category, string> = {
  [A.Health]: 'Health & Wellness', [A.Education]: 'Education', [A.Career]: 'Career',
  [A.Relationships]: 'Relationships', [A.Entertainment]: 'Entertainment', [A.Travel]: 'Travel',
  [A.Casino]: 'Casino', [A.Lifestyle]: 'Lifestyle', [A.Hobbies]: 'Hobbies',
};
export const ACTIVITY_CATEGORY_EMOJI: Record<Category, string> = {
  [A.Health]: '❤️', [A.Education]: '📚', [A.Career]: '💼', [A.Relationships]: '👨‍👩‍👧',
  [A.Entertainment]: '🎬', [A.Travel]: '✈️', [A.Casino]: '🎰', [A.Lifestyle]: '🍽️', [A.Hobbies]: '🎨',
};

/* ───────────────────────── Travel / Vacation ───────────────────────── */

export const VACATION_MIN_AGE = 18;
export const VACATION_BASE_COST = 3000;

export const VACATION_TYPES: VacationType[] = [
  { id: 'budget',   label: 'Budget',   emoji: '🎒', costMultiplier: 1 },
  { id: 'standard', label: 'Standard', emoji: '🧳', costMultiplier: 2.5 },
  { id: 'luxury',   label: 'Luxury',   emoji: '🥂', costMultiplier: 6 },
];
export const VACATION_TYPE_BY_ID = new Map(VACATION_TYPES.map((t) => [t.id, t]));

export const VACATION_ACTIVITIES: VacationActivityOption[] = [
  { id: 'beach',      label: 'Beach Resort',       emoji: '🏖️' },
  { id: 'sightseeing',label: 'Sightseeing',        emoji: '📸' },
  { id: 'museums',    label: 'Museum Tours',       emoji: '🏛️' },
  { id: 'adventure',  label: 'Adventure Activities', emoji: '🧗' },
  { id: 'shopping',   label: 'Shopping',           emoji: '🛍️' },
  { id: 'resort',     label: 'Luxury Resort',      emoji: '🏝️' },
  { id: 'cruise',     label: 'Cruise',             emoji: '🛳️' },
];

/* ───────────────────────── Casino ───────────────────────── */

export const CASINO_MIN_AGE = 18;

export const CASINO_GAMES: CasinoGame[] = [
  { id: 'slots',     label: 'Slot Machines', emoji: '🎰', winChance: 0.26, winMultiplier: 2.6, minBet: 20 },
  { id: 'blackjack', label: 'Blackjack',     emoji: '🃏', winChance: 0.46, winMultiplier: 1.0, minBet: 50 },
  { id: 'roulette',  label: 'Roulette',      emoji: '🎡', winChance: 0.47, winMultiplier: 1.0, minBet: 25 },
  { id: 'poker',     label: 'Poker',         emoji: '♠️', winChance: 0.40, winMultiplier: 1.4, minBet: 100 },
];
export const CASINO_GAME_BY_ID = new Map(CASINO_GAMES.map((g) => [g.id, g]));
