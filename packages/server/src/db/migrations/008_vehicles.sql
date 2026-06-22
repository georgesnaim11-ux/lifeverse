-- ---------------------------------------------------------------------------
-- Vehicle garage: own many cars, each with brand/model/year/condition that
-- depreciates and needs maintenance. One row per OWNED vehicle (mirrors the
-- properties portfolio in 007). New purchases use this table; the legacy
-- `assets`-based vehicles remain valid and still count toward net worth.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vehicles (
  id                 TEXT PRIMARY KEY,
  character_id       TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  model_key          TEXT NOT NULL,
  brand_id           TEXT NOT NULL,
  brand_name         TEXT NOT NULL,
  brand_color        TEXT,
  model_name         TEXT NOT NULL,
  body_type          TEXT NOT NULL,
  year               INTEGER NOT NULL,
  condition          TEXT NOT NULL,
  emoji              TEXT,
  purchase_price     INTEGER NOT NULL DEFAULT 0,
  current_value      INTEGER NOT NULL DEFAULT 0,
  purchase_age       INTEGER,
  depreciation_rate  REAL NOT NULL DEFAULT 0,
  monthly_maintenance INTEGER NOT NULL DEFAULT 0,
  happiness          INTEGER NOT NULL DEFAULT 0,
  is_primary         INTEGER NOT NULL DEFAULT 0,
  neglect_years      INTEGER NOT NULL DEFAULT 0,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vehicles_character ON vehicles(character_id);
