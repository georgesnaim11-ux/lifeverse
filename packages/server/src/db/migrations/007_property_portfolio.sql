-- ---------------------------------------------------------------------------
-- Real estate portfolio: own many properties, invest, rent out.
--
-- The single `housing` row (006) stays as the residence/tenure pointer. Every
-- OWNED property now lives as its own row in `properties`; the residence is the
-- property whose id == housing.residence_property_id (and is_residence = 1).
-- Mortgages link to the property they financed so selling settles the right debt.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS properties (
  id                TEXT PRIMARY KEY,
  character_id      TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  property_key      TEXT NOT NULL,
  property_label    TEXT NOT NULL,
  tier              TEXT NOT NULL,
  company           TEXT,
  bedrooms          INTEGER NOT NULL DEFAULT 0,
  bathrooms         INTEGER NOT NULL DEFAULT 0,
  condition         TEXT,
  purchase_price    INTEGER NOT NULL DEFAULT 0,
  current_value     INTEGER NOT NULL DEFAULT 0,
  purchase_age      INTEGER,
  appreciation_rate REAL NOT NULL DEFAULT 0,
  monthly_upkeep    INTEGER NOT NULL DEFAULT 0,
  monthly_rent      INTEGER NOT NULL DEFAULT 0,
  happiness         INTEGER NOT NULL DEFAULT 0,
  is_residence      INTEGER NOT NULL DEFAULT 0,
  is_rented_out     INTEGER NOT NULL DEFAULT 0,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_properties_character ON properties(character_id);

-- Link a mortgage to the property it financed (nullable; existing loans stay null).
ALTER TABLE loans ADD COLUMN property_id TEXT;

-- The owned property the character currently lives in (null unless tenure = 'owned').
ALTER TABLE housing ADD COLUMN residence_property_id TEXT;
