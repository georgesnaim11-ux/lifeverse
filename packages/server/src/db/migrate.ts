import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { closeDb, getDb } from './client.js';
import { logger } from '../utils/logger.js';

/**
 * Migration runner.
 *
 * Migrations are plain `.sql` files in ./migrations, named with a sortable
 * numeric prefix (e.g. `001_initial_schema.sql`). Applied versions are tracked
 * in `schema_migrations`; each pending file runs inside its own transaction so
 * a failure leaves the database untouched. Running again is a no-op (idempotent).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(here, 'migrations');

function ensureMigrationsTable(): void {
  getDb()
    .prepare(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         version     TEXT PRIMARY KEY,
         applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
       )`,
    )
    .run();
}

function appliedVersions(): Set<string> {
  const rows = getDb()
    .prepare('SELECT version FROM schema_migrations')
    .all() as Array<{ version: string }>;
  return new Set(rows.map((row) => row.version));
}

function pendingMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
}

/** Apply all pending migrations. Returns the list of versions applied. */
export function runMigrations(): string[] {
  ensureMigrationsTable();
  const already = appliedVersions();
  const applied: string[] = [];
  const db = getDb();

  for (const file of pendingMigrationFiles()) {
    const version = file.replace(/\.sql$/, '');
    if (already.has(version)) continue;

    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    logger.info(`Applying migration: ${version}`);

    // exec() runs multiple statements; wrap the whole file in one transaction.
    const apply = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(
        version,
      );
    });
    apply();
    applied.push(version);
  }

  if (applied.length === 0) {
    logger.info('Database is up to date; no migrations to apply.');
  } else {
    logger.info(`Applied ${applied.length} migration(s).`);
  }
  return applied;
}

// Allow `tsx src/db/migrate.ts` to run migrations directly from the CLI.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runMigrations();
  } catch (error) {
    logger.error('Migration failed.', error);
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}
