-- ---------------------------------------------------------------------------
-- Sports career: one row per character carrying the whole athletic arc
-- (school team -> professional club -> retirement). Yearly development rides
-- the age-up like housing/garage; the yearly decision is guarded by
-- last_decision_age. Awards are a JSON array of strings.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sports_career (
  character_id         TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  sport                TEXT NOT NULL,
  phase                TEXT NOT NULL DEFAULT 'school',   -- school | pro | retired
  team_name            TEXT,
  club_id              TEXT,
  tier                 INTEGER NOT NULL DEFAULT 1,       -- 1..5 school progression
  skill                INTEGER NOT NULL DEFAULT 10,
  fitness              INTEGER NOT NULL DEFAULT 50,
  reputation           INTEGER NOT NULL DEFAULT 5,
  coach_approval       INTEGER NOT NULL DEFAULT 50,
  years_active         INTEGER NOT NULL DEFAULT 0,
  last_decision_age    INTEGER NOT NULL DEFAULT -1,
  injury_years         INTEGER NOT NULL DEFAULT 0,
  has_scholarship      INTEGER NOT NULL DEFAULT 0,
  pending_offer_club   TEXT,
  pending_offer_salary INTEGER NOT NULL DEFAULT 0,
  salary               INTEGER NOT NULL DEFAULT 0,
  market_value         INTEGER NOT NULL DEFAULT 0,
  appearances          INTEGER NOT NULL DEFAULT 0,
  points               INTEGER NOT NULL DEFAULT 0,
  assists              INTEGER NOT NULL DEFAULT 0,
  championships        INTEGER NOT NULL DEFAULT 0,
  career_earnings      INTEGER NOT NULL DEFAULT 0,
  awards               TEXT NOT NULL DEFAULT '[]',
  hall_of_fame         INTEGER NOT NULL DEFAULT 0,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP
);
