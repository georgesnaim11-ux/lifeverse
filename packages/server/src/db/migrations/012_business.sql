-- ---------------------------------------------------------------------------
-- Business system: one company per character. Hot fields as columns; the
-- product line, staff aggregates, consultants, upgrades, and yearly history
-- live in JSON columns (same pattern as sports season_history).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS businesses (
  character_id   TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  industry       TEXT NOT NULL,
  name           TEXT NOT NULL,
  logo           TEXT NOT NULL DEFAULT '🏢',
  brand_color    TEXT NOT NULL DEFAULT '#2563eb',
  hq_country     TEXT NOT NULL DEFAULT 'usa',
  founded_age    INTEGER NOT NULL DEFAULT 18,
  cash           INTEGER NOT NULL DEFAULT 0,
  reputation     INTEGER NOT NULL DEFAULT 30,
  customers      INTEGER NOT NULL DEFAULT 0,
  market_share   REAL NOT NULL DEFAULT 0,
  branches       INTEGER NOT NULL DEFAULT 1,
  supplier_tier  INTEGER NOT NULL DEFAULT 2,
  marketing_level INTEGER NOT NULL DEFAULT 1,
  rnd_level      INTEGER NOT NULL DEFAULT 0,
  products       TEXT NOT NULL DEFAULT '[]',
  staff          TEXT NOT NULL DEFAULT '{}',
  consultants    TEXT NOT NULL DEFAULT '[]',
  upgrades       TEXT NOT NULL DEFAULT '[]',
  history        TEXT NOT NULL DEFAULT '[]',
  last_event     TEXT,
  loss_years     INTEGER NOT NULL DEFAULT 0,
  is_open        INTEGER NOT NULL DEFAULT 1,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
