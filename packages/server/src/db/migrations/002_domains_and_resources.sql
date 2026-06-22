CREATE TABLE IF NOT EXISTS domains (
  character_id TEXT PRIMARY KEY REFERENCES characters(id),
  academic INTEGER NOT NULL DEFAULT 10,
  physical INTEGER NOT NULL DEFAULT 10,
  career INTEGER NOT NULL DEFAULT 0,
  social INTEGER NOT NULL DEFAULT 10,
  creative INTEGER NOT NULL DEFAULT 5,
  mental INTEGER NOT NULL DEFAULT 20,
  academic_momentum INTEGER NOT NULL DEFAULT 0,
  physical_momentum INTEGER NOT NULL DEFAULT 0,
  career_momentum INTEGER NOT NULL DEFAULT 0,
  social_momentum INTEGER NOT NULL DEFAULT 0,
  creative_momentum INTEGER NOT NULL DEFAULT 0,
  mental_momentum INTEGER NOT NULL DEFAULT 0,
  academic_neglect INTEGER NOT NULL DEFAULT 0,
  physical_neglect INTEGER NOT NULL DEFAULT 0,
  career_neglect INTEGER NOT NULL DEFAULT 0,
  social_neglect INTEGER NOT NULL DEFAULT 0,
  creative_neglect INTEGER NOT NULL DEFAULT 0,
  mental_neglect INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
  character_id TEXT PRIMARY KEY REFERENCES characters(id),
  total_time_slots INTEGER NOT NULL DEFAULT 3,
  used_time_slots INTEGER NOT NULL DEFAULT 0,
  mental_energy INTEGER NOT NULL DEFAULT 80,
  physical_energy INTEGER NOT NULL DEFAULT 80,
  mental_energy_max INTEGER NOT NULL DEFAULT 100,
  physical_energy_max INTEGER NOT NULL DEFAULT 100,
  consecutive_low_mental_years INTEGER NOT NULL DEFAULT 0,
  burnout_state INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  character_id TEXT REFERENCES characters(id),
  activity_id TEXT NOT NULL,
  age INTEGER NOT NULL,
  time_cost INTEGER NOT NULL DEFAULT 1,
  mental_cost INTEGER NOT NULL DEFAULT 0,
  physical_cost INTEGER NOT NULL DEFAULT 0,
  money_cost INTEGER NOT NULL DEFAULT 0,
  performed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
