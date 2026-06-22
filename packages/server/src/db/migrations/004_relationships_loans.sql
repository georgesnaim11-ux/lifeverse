-- ---------------------------------------------------------------------------
-- Relationship progression + itemised debt (loans) system.
-- ---------------------------------------------------------------------------

-- Romantic stage + rich partner metadata on relationships.
ALTER TABLE relationships ADD COLUMN stage TEXT;
ALTER TABLE relationships ADD COLUMN metadata TEXT;

-- Itemised loans (student / mortgage / personal).
CREATE TABLE IF NOT EXISTS loans (
  id                 TEXT PRIMARY KEY,
  character_id       TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  type               TEXT NOT NULL,          -- student | mortgage | personal
  label              TEXT NOT NULL,
  original_principal INTEGER NOT NULL,
  balance            INTEGER NOT NULL,
  interest_rate      REAL NOT NULL DEFAULT 0.05,
  annual_payment     INTEGER NOT NULL DEFAULT 0,
  is_active          INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_loans_character ON loans(character_id);
