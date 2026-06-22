/**
 * Database barrel — the only entry point other server layers import from.
 * Keeps the connection lifecycle and migration runner behind one surface.
 */
export { getDb, transaction, closeDb } from './client.js';
export { runMigrations } from './migrate.js';
