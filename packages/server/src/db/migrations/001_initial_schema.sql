-- ============================================================================
-- LifeVerse — Initial Schema (Phase 1)
-- ============================================================================
-- Design notes:
--  * Phase 1 ACTIVE systems: characters, stats (incl. soft-cap-eligible values
--    + hidden stress/willpower), traits, relationships (bond + trust), flags,
--    events, focus, education, careers, finances, assets, achievements, saves.
--  * Forward-compat (tables/columns present but unused in Phase 1, so later
--    phases are additive — no destructive migration):
--      - bloodlines / characters.bloodline_id / parent_id / is_heir  (Phase 3)
--      - characters.fame, fame-related scoring                        (Phase 4)
--      - threads + thread seeding                                     (Phase 2)
--      - npcs + relationships.npc_id                                  (Phase 2)
--      - economy                                                      (Phase 4)
--  * All ids are TEXT (UUID). Timestamps stored as ISO-8601 TEXT via datetime().
--  * Booleans stored as INTEGER 0/1 (SQLite has no native boolean).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Bloodlines — the dynasty container (Phase 3). In Phase 1 every character
-- gets one single-generation bloodline so the FK is always satisfiable.
-- ---------------------------------------------------------------------------
CREATE TABLE bloodlines (
  id            TEXT PRIMARY KEY,
  family_name   TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'meridia',
  generation    INTEGER NOT NULL DEFAULT 1,
  legacy_score  INTEGER NOT NULL DEFAULT 0,        -- Phase 4
  dynasty_goals TEXT,                              -- JSON, Phase 3/4
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Characters — one life within a bloodline.
-- ---------------------------------------------------------------------------
CREATE TABLE characters (
  id            TEXT PRIMARY KEY,
  bloodline_id  TEXT NOT NULL REFERENCES bloodlines(id) ON DELETE CASCADE,
  parent_id     TEXT REFERENCES characters(id) ON DELETE SET NULL, -- Phase 3
  name          TEXT NOT NULL,
  birth_year    INTEGER NOT NULL,
  age           INTEGER NOT NULL DEFAULT 0,
  life_stage    TEXT NOT NULL DEFAULT 'childhood',
  is_alive      INTEGER NOT NULL DEFAULT 1,
  is_heir       INTEGER NOT NULL DEFAULT 0,        -- Phase 3
  fame          INTEGER NOT NULL DEFAULT 0,        -- Phase 4
  country       TEXT NOT NULL DEFAULT 'meridia',   -- Phase 3
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_characters_bloodline ON characters(bloodline_id);
CREATE INDEX idx_characters_parent ON characters(parent_id);

-- ---------------------------------------------------------------------------
-- Stats — six primary (0-100) + hidden stress/willpower. One row per character.
-- Soft-cap logic lives in the stat service; storage is the raw value.
-- ---------------------------------------------------------------------------
CREATE TABLE stats (
  character_id  TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  health        INTEGER NOT NULL DEFAULT 50,
  intelligence  INTEGER NOT NULL DEFAULT 50,
  happiness     INTEGER NOT NULL DEFAULT 50,
  charisma      INTEGER NOT NULL DEFAULT 50,
  discipline    INTEGER NOT NULL DEFAULT 50,
  creativity    INTEGER NOT NULL DEFAULT 50,
  stress        INTEGER NOT NULL DEFAULT 0,        -- hidden
  willpower     INTEGER NOT NULL DEFAULT 50,       -- hidden
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Personality traits attached to a character.
-- ---------------------------------------------------------------------------
CREATE TABLE traits (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  trait_key     TEXT NOT NULL,
  is_hidden     INTEGER NOT NULL DEFAULT 0,
  acquired_age  INTEGER,                           -- NULL = present from birth
  UNIQUE(character_id, trait_key)
);
CREATE INDEX idx_traits_character ON traits(character_id);

-- ---------------------------------------------------------------------------
-- Flags — boolean game state (isMarried, hasDegree, ...).
-- ---------------------------------------------------------------------------
CREATE TABLE flags (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  key           TEXT NOT NULL,
  value         INTEGER NOT NULL DEFAULT 0,
  UNIQUE(character_id, key)
);
CREATE INDEX idx_flags_character ON flags(character_id);

-- ---------------------------------------------------------------------------
-- Focus Points spend log — opportunity-cost engine analytics & balance tuning.
-- ---------------------------------------------------------------------------
CREATE TABLE focus_log (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  age           INTEGER NOT NULL,
  action_key    TEXT NOT NULL,
  fp_cost       INTEGER NOT NULL,
  occurred_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_focus_log_character ON focus_log(character_id);

-- ---------------------------------------------------------------------------
-- Event log — what happened, feeds the life-story feed and event cooldowns.
-- ---------------------------------------------------------------------------
CREATE TABLE event_log (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  event_id      TEXT NOT NULL,
  age_at_event  INTEGER NOT NULL,
  choice_id     TEXT NOT NULL,
  outcome_text  TEXT,
  occurred_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_event_log_character ON event_log(character_id);
CREATE INDEX idx_event_log_event ON event_log(character_id, event_id);

-- ---------------------------------------------------------------------------
-- NPCs — procedurally generated people (Phase 2). Table present now so
-- relationships.npc_id can reference it without a later migration.
-- ---------------------------------------------------------------------------
CREATE TABLE npcs (
  id            TEXT PRIMARY KEY,
  bloodline_id  TEXT NOT NULL REFERENCES bloodlines(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  traits        TEXT,                              -- JSON
  stats         TEXT,                              -- JSON snapshot
  goal          TEXT,
  career_track  TEXT,
  birth_year    INTEGER,
  is_alive      INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_npcs_bloodline ON npcs(bloodline_id);

-- ---------------------------------------------------------------------------
-- Relationships — bond AND trust from day one. npc_id nullable (Phase 2 link).
-- ---------------------------------------------------------------------------
CREATE TABLE relationships (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  npc_id        TEXT REFERENCES npcs(id) ON DELETE SET NULL,  -- Phase 2
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,                     -- parent|sibling|friend|partner|child|rival|mentor
  bond          INTEGER NOT NULL DEFAULT 50,
  trust         INTEGER NOT NULL DEFAULT 50,
  is_alive      INTEGER NOT NULL DEFAULT 1,
  history       TEXT NOT NULL DEFAULT '[]',        -- JSON array of interactions
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_relationships_character ON relationships(character_id);

-- ---------------------------------------------------------------------------
-- Threads — consequence engine (Phase 2). Choices may PLANT threads in Phase 1;
-- the firing engine is built later. Table exists now to receive the data.
-- ---------------------------------------------------------------------------
CREATE TABLE threads (
  id              TEXT PRIMARY KEY,
  bloodline_id    TEXT NOT NULL REFERENCES bloodlines(id) ON DELETE CASCADE,
  character_id    TEXT REFERENCES characters(id) ON DELETE CASCADE, -- NULL = generational
  thread_key      TEXT NOT NULL,
  category        TEXT NOT NULL,                   -- personal|career|trauma|generational
  payload         TEXT NOT NULL DEFAULT '{}',      -- JSON
  trigger_min_age INTEGER,
  trigger_max_age INTEGER,
  conditions      TEXT NOT NULL DEFAULT '{}',      -- JSON (stat + flag conditions)
  status          TEXT NOT NULL DEFAULT 'active',  -- active|fired|expired
  created_age     INTEGER NOT NULL,
  is_generational INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_threads_bloodline ON threads(bloodline_id);
CREATE INDEX idx_threads_active ON threads(character_id, status);

-- ---------------------------------------------------------------------------
-- Education.
-- ---------------------------------------------------------------------------
CREATE TABLE education (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  level         TEXT NOT NULL,                     -- elementary|middle|high|trade|university|graduate
  completed     INTEGER NOT NULL DEFAULT 0,
  gpa           REAL,
  debt_incurred INTEGER NOT NULL DEFAULT 0,
  start_age     INTEGER,
  end_age       INTEGER
);
CREATE INDEX idx_education_character ON education(character_id);

-- ---------------------------------------------------------------------------
-- Careers.
-- ---------------------------------------------------------------------------
CREATE TABLE careers (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  track         TEXT NOT NULL,
  tier          INTEGER NOT NULL DEFAULT 1,
  years_in_role INTEGER NOT NULL DEFAULT 0,
  annual_salary INTEGER NOT NULL DEFAULT 0,
  start_age     INTEGER,
  end_age       INTEGER,
  is_active     INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_careers_character ON careers(character_id);

-- ---------------------------------------------------------------------------
-- Finances — one snapshot row per character, updated each year.
-- ---------------------------------------------------------------------------
CREATE TABLE finances (
  character_id    TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  cash            INTEGER NOT NULL DEFAULT 1000,
  annual_income   INTEGER NOT NULL DEFAULT 0,
  annual_expenses INTEGER NOT NULL DEFAULT 0,
  total_debt      INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- Assets.
-- ---------------------------------------------------------------------------
CREATE TABLE assets (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  asset_type    TEXT NOT NULL,                     -- house|car|stocks|savings
  value         INTEGER NOT NULL DEFAULT 0,
  purchase_age  INTEGER,
  is_active     INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_assets_character ON assets(character_id);

-- ---------------------------------------------------------------------------
-- Achievements.
-- ---------------------------------------------------------------------------
CREATE TABLE achievements (
  id              TEXT PRIMARY KEY,
  character_id    TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  achievement_id  TEXT NOT NULL,
  unlocked_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(character_id, achievement_id)
);
CREATE INDEX idx_achievements_character ON achievements(character_id);

-- ---------------------------------------------------------------------------
-- Economy — living macro layer (Phase 4). One row per bloodline.
-- ---------------------------------------------------------------------------
CREATE TABLE economy (
  bloodline_id  TEXT PRIMARY KEY REFERENCES bloodlines(id) ON DELETE CASCADE,
  phase         TEXT NOT NULL DEFAULT 'stable',    -- boom|stable|recession|crash|recovery
  phase_year    INTEGER NOT NULL DEFAULT 0,
  inflation     REAL NOT NULL DEFAULT 1.0,
  market_index  REAL NOT NULL DEFAULT 100.0
);

-- ---------------------------------------------------------------------------
-- Saves — metadata for the save/load system. The DB file is the save; this
-- table records named save points / autosave bookmarks per character.
-- ---------------------------------------------------------------------------
CREATE TABLE saves (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  save_name     TEXT,
  is_autosave   INTEGER NOT NULL DEFAULT 0,
  saved_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_saves_character ON saves(character_id);
