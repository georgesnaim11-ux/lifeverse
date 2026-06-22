-- Real estate / housing system — one residence row per character.
CREATE TABLE IF NOT EXISTS housing (
  character_id      TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  tenure            TEXT NOT NULL DEFAULT 'parents',  -- homeless | parents | renting | owned
  property_key      TEXT,
  property_label    TEXT,
  tier              TEXT,
  company           TEXT,
  bedrooms          INTEGER NOT NULL DEFAULT 0,
  bathrooms         INTEGER NOT NULL DEFAULT 0,
  condition         TEXT,
  monthly_expense   INTEGER NOT NULL DEFAULT 0,
  current_value     INTEGER NOT NULL DEFAULT 0,
  purchase_price    INTEGER NOT NULL DEFAULT 0,
  purchase_age      INTEGER,
  appreciation_rate REAL NOT NULL DEFAULT 0,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);
