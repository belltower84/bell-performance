# Bell Core v0.3.0 — Full Intelligence Integration

Bell Core v0.3.0 replaces the earlier hardcoded workout and simplified state shortcuts with the complete Bell coaching pipeline.

## Runtime architecture

```text
Authenticated API
  → Mission Compiler + Bell Coaching Language
  → Intelligence Orchestrator
  → Adaptive Journey Planning
  → Periodization + Block Programming
  → Forecast + Goal Probability
  → Competition + Nutrition
  → Pattern Recognition + Digital Twin
  → Weekly Planner
  → Session Builder
  → Exercise Selection
  → Adaptive Coaching
  → Coaching Reasoning
  → Athlete State projection
  → Learning update
  → SQL persistence and decision audit
```

Long-horizon planning and daily coaching are separated deliberately. A plan-generation decision and each daily adaptation decision can be inspected independently.

## Included engines

- Mission Compiler
- Journey Planning Engine
- Bell Coaching Language
- Periodization Engine
- Block Programming Engine
- Performance Forecast Engine
- Goal Probability Engine
- Competition Intelligence Engine
- Nutrition Periodization Engine
- Pattern Recognition Engine
- Digital Twin Simulation Engine
- Weekly Planning Engine
- Session Builder
- Exercise Selection Engine
- Adaptive Coaching Engine
- Athlete State Engine
- Coaching Reasoning Engine
- Learning Engine
- Intelligence Orchestrator

The exercise knowledge base is bundled at `database/bckb_v1.3.0.sqlite`.

## Run locally with SQLite

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

```bash
# Windows PowerShell
$env:BELL_DATABASE_URL="sqlite:///./bell_core.db"
$env:BELL_JWT_SECRET="replace-with-a-long-random-development-secret"
$env:BELL_AUTO_CREATE_SCHEMA="true"
uvicorn app.main:app --reload
```

```bash
# macOS/Linux
export BELL_DATABASE_URL='sqlite:///./bell_core.db'
export BELL_JWT_SECRET='replace-with-a-long-random-development-secret'
export BELL_AUTO_CREATE_SCHEMA='true'
uvicorn app.main:app --reload
```

Open `http://localhost:8000/docs`.

## Run with Docker and PostgreSQL

```bash
cp .env.example .env
pip install -r requirements-postgres.txt
alembic upgrade head
docker compose up --build
```

The Compose service uses PostgreSQL 16. The bundled migration establishes the application schema; the intelligence knowledge-base SQLite file remains a read-only catalog for exercise selection.

## Authentication

1. `POST /api/v1/auth/register`
2. Use the returned access token as `Authorization: Bearer <token>`
3. Call protected endpoints under `/api/v1`

Login is also available through `POST /api/v1/auth/token` using OAuth2 form fields `username` and `password`.

## Primary API

- `POST /api/v1/athletes`
- `POST /api/v1/athletes/{athlete_id}/missions`
- `POST /api/v1/athletes/{athlete_id}/plans`
- `GET /api/v1/athletes/{athlete_id}/plan`
- `GET /api/v1/athletes/{athlete_id}/coaching-state`
- `GET /api/v1/athletes/{athlete_id}/today`
- `POST /api/v1/athletes/{athlete_id}/check-ins`
- `POST /api/v1/athletes/{athlete_id}/sessions/{session_id}/complete`
- `GET /api/v1/athletes/{athlete_id}/state`
- `GET /api/v1/athletes/{athlete_id}/intelligence`
- `GET /api/v1/decisions/{decision_id}`
- `GET /health`
- `GET /ready`

### Mission input additions

A mission can optionally include:

```json
{
  "competition_type": "10k",
  "competition_date": "2026-10-10",
  "coaching_language": "MISSION Faster10K\nPRIORITY aerobic_base > strength\nCONSTRAINT\ntraining_days = 4"
}
```

When no Bell Coaching Language is supplied, Bell generates a safe default program from the mission and constraints.

### Completion idempotency

Send a stable `Idempotency-Key` header with completion requests. Retrying the same request with the same key returns the original result instead of logging the workout twice.

## Persistence model

- Athlete, mission, plan, check-in, completion, and decision records are stored in the application database.
- Athlete history is represented as immutable events.
- The Athlete State Engine projects the current state from that event stream.
- Plans and decision traces are stored as immutable JSON snapshots for auditability.
- Learning parameters are bounded and persisted in the athlete profile after completed sessions.

## Tests

```bash
pytest -q
python -m compileall -q app intelligence
```

Current result: **16 tests passed**.

## Production requirements

Before deployment:

- change `BELL_JWT_SECRET`;
- use PostgreSQL;
- run `alembic upgrade head`;
- keep `BELL_AUTO_CREATE_SCHEMA=false`;
- restrict `BELL_CORS_ORIGINS`;
- use HTTPS;
- add rate limiting, monitoring, structured logs, backups, and a managed secrets solution.

External identity providers, refresh-token rotation, distributed jobs, scientific model calibration, the Bell Validation Framework, and the Coach Debate Engine are outside v0.3.0.
