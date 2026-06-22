import { randomUUID } from 'node:crypto';

/**
 * Generate a unique identifier for a database entity.
 * Centralized so the ID strategy (currently UUID v4) can change in one place.
 */
export function newId(): string {
  return randomUUID();
}
