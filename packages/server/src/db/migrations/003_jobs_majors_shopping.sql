-- ---------------------------------------------------------------------------
-- Overhaul migration: looks stat, university major, real job system, shopping.
-- ---------------------------------------------------------------------------

-- New core stat: Looks (replaces charisma/discipline/creativity in the UI;
-- old columns remain in the table, unused, to avoid a destructive rewrite).
ALTER TABLE stats ADD COLUMN looks INTEGER NOT NULL DEFAULT 50;

-- University major declared by the character.
ALTER TABLE characters ADD COLUMN major TEXT;

-- Real job system — one row per job held (active or historical).
CREATE TABLE IF NOT EXISTS jobs (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  job_id        TEXT NOT NULL,         -- references shared JOB_REGISTRY
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  level         INTEGER NOT NULL DEFAULT 1,
  annual_salary INTEGER NOT NULL DEFAULT 0,
  years_in_role INTEGER NOT NULL DEFAULT 0,
  satisfaction  INTEGER NOT NULL DEFAULT 50,
  start_age     INTEGER,
  is_active     INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_jobs_character ON jobs(character_id);

-- Display label for purchased assets (properties / vehicles).
ALTER TABLE assets ADD COLUMN label TEXT;
