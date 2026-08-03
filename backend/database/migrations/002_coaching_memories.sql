CREATE TABLE IF NOT EXISTS coaching_memories (
  id VARCHAR PRIMARY KEY,
  athlete_id VARCHAR NOT NULL REFERENCES athletes(id),
  memory_key VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'athlete_preference',
  observation TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 1.0,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  source_type VARCHAR(80) NOT NULL DEFAULT 'athlete_explicit',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  first_observed TIMESTAMP NOT NULL,
  last_confirmed TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL,
  UNIQUE (athlete_id, memory_key)
);
CREATE INDEX IF NOT EXISTS ix_coaching_memories_athlete_id ON coaching_memories(athlete_id);
