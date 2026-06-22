/**
 * @lifeverse/shared — public barrel.
 *
 * Everything the client and server agree on lives here: enums, domain types,
 * the API contract, and balance constants. Import from `@lifeverse/shared`,
 * never from deep paths, so the public surface stays intentional.
 */

// Types
export * from './types/enums.js';
export * from './types/stats.js';
export * from './types/character.js';
export * from './types/traits.js';
export * from './types/relationships.js';
export * from './types/focus.js';
export * from './types/events.js';
export * from './types/threads.js';
export * from './types/systems.js';
export * from './types/api.js';
export * from './types/domains.js';
export * from './types/resources.js';
export * from './types/activities.js';
export * from './types/jobs.js';
export * from './types/shop.js';
export * from './types/finance.js';
export * from './types/housing.js';
export * from './types/vehicles.js';

// Constants
export * from './constants/game.js';
export * from './constants/traits.js';

// Data
export * from './data/jobs.js';
export * from './data/majors.js';
export * from './data/shop.js';
export * from './data/countries.js';
export * from './data/realestate.js';
export * from './data/vehicles.js';
