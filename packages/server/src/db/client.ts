import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * The SQLite connection — a single, synchronous, process-wide instance.
 *
 * better-sqlite3 is synchronous by design, which is exactly what the turn
 * engine wants: an age-up reads stats, rolls events, applies deltas and commits
 * as one atomic transaction with no async interleaving. We expose the raw
 * Database instance plus a `transaction` helper; repository modules build on it.
 */

let db: Database.Database | null = null;

/** Apply connection-level pragmas. Called once on first connection. */
function configureConnection(connection: Database.Database): void {
  // WAL gives better read/write concurrency and durability for a local game DB.
  connection.pragma('journal_mode = WAL');
  // Enforce declared foreign keys (off by default in SQLite).
  connection.pragma('foreign_keys = ON');
  // Reasonable durability without the full fsync cost on every write.
  connection.pragma('synchronous = NORMAL');
  // Wait up to 5s on a locked DB before throwing, instead of failing instantly.
  connection.pragma('busy_timeout = 5000');
}

/** Get the shared database connection, opening it on first use. */
export function getDb(): Database.Database {
  if (db) return db;

  // Ensure the parent directory exists before SQLite tries to create the file.
  const dir = path.dirname(env.databaseFile);
  mkdirSync(dir, { recursive: true });

  db = new Database(env.databaseFile, {
    // Route better-sqlite3's verbose output through our logger in dev only.
    verbose: env.nodeEnv === 'development' ? (msg) => logger.debug(String(msg)) : undefined,
  });
  configureConnection(db);
  logger.info(`SQLite connected: ${env.databaseFile}`);
  return db;
}

/**
 * Run `fn` inside a transaction. Commits on success, rolls back on any thrown
 * error. better-sqlite3 transactions are synchronous and reentrant-safe.
 */
export function transaction<T>(fn: (db: Database.Database) => T): T {
  const connection = getDb();
  const wrapped = connection.transaction(fn);
  return wrapped(connection);
}

/** Close the connection (tests, graceful shutdown). */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    logger.info('SQLite connection closed.');
  }
}
