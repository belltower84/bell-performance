CREATE TABLE athletes (id TEXT PRIMARY KEY, name TEXT NOT NULL, profile_json TEXT NOT NULL, created_at TIMESTAMP NOT NULL);
CREATE TABLE missions (id TEXT PRIMARY KEY, athlete_id TEXT NOT NULL REFERENCES athletes(id), request_json TEXT NOT NULL, compiled_json TEXT NOT NULL, created_at TIMESTAMP NOT NULL);
CREATE TABLE plans (id TEXT PRIMARY KEY, athlete_id TEXT NOT NULL REFERENCES athletes(id), mission_id TEXT NOT NULL REFERENCES missions(id), plan_json TEXT NOT NULL, status TEXT NOT NULL, created_at TIMESTAMP NOT NULL);
CREATE TABLE checkins (id TEXT PRIMARY KEY, athlete_id TEXT NOT NULL REFERENCES athletes(id), payload_json TEXT NOT NULL, readiness_score REAL NOT NULL, readiness_band TEXT NOT NULL, created_at TIMESTAMP NOT NULL);
CREATE TABLE athlete_events (id TEXT PRIMARY KEY, athlete_id TEXT NOT NULL REFERENCES athletes(id), event_type TEXT NOT NULL, occurred_at TIMESTAMP NOT NULL, payload_json TEXT NOT NULL);
CREATE TABLE decisions (id TEXT PRIMARY KEY, athlete_id TEXT NOT NULL REFERENCES athletes(id), decision_type TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TIMESTAMP NOT NULL);
