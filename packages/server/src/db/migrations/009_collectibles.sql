-- ---------------------------------------------------------------------------
-- Collectibles: a unified luxury-asset table for watches, jewelry, art, boats,
-- and aircraft. One row per owned item (mirrors vehicles/properties). Each item
-- appreciates or depreciates yearly and counts toward net worth; boats and
-- aircraft also carry annual maintenance.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS collectibles (
  id                  TEXT PRIMARY KEY,
  character_id        TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  category            TEXT NOT NULL,            -- watch | jewelry | art | boat | aircraft
  item_key            TEXT NOT NULL,
  label               TEXT NOT NULL,
  brand               TEXT,
  emoji               TEXT,
  year                INTEGER NOT NULL,
  condition           TEXT NOT NULL,
  purchase_price      INTEGER NOT NULL DEFAULT 0,
  current_value       INTEGER NOT NULL DEFAULT 0,
  purchase_age        INTEGER,
  appreciation_rate   REAL NOT NULL DEFAULT 0,  -- annual; negative = appreciates
  monthly_maintenance INTEGER NOT NULL DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_collectibles_character ON collectibles(character_id);
