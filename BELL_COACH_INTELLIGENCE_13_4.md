# Bell Coach Intelligence 13.4

Bell 13.4 adds a deterministic coaching-intelligence layer on top of the Journey engine and discipline libraries.

## Explanation contract

Every supported explanation contains:

1. **Context** — what Bell currently knows.
2. **Decision** — what Bell selected or changed.
3. **Reason** — why that decision supports the athlete's current objective.
4. **Next focus** — what the athlete should do next.

Bell also separates:

- **Known** information from the athlete profile, Journey, plan, readiness, and completed work.
- **Inferred** patterns supported by repeated evidence.
- **Missing** information that limits confidence.

Supported explanation topics are Mission, Phase, progression, Weekly Plan, recovery, nutrition, milestone, and latest adaptation.

## Coaching memory policy

Inferred durable memory requires repeated evidence. A single workout, missed session, or poor night of sleep cannot create a permanent rule.

Each memory stores:

- observation
- category
- evidence source
- confidence
- first observed
- last confirmed
- whether it is active

Explicit athlete preferences and limitations may be saved immediately. The athlete can review and remove every memory. Removed inferred memories remain inactive when the evidence scanner runs again.

## Transparent decision history

Bell records phase transitions, readiness adaptations, schedule changes, and Bell Core decisions. Each entry includes its source, time, explanation, and material changes.

## Interfaces

Frontend:

- `BellCoachIntelligence.openCenter(tab)`
- `BellCoachIntelligence.openWhy(topic)`
- `BellCoachIntelligence.explain(topic)`
- `BellCoachIntelligence.summary()`
- `BellCoachIntelligence.analyze()`

Bell Core:

- `GET /api/v1/athletes/{athlete_id}/coach`
- `GET /api/v1/athletes/{athlete_id}/memories`
- `POST /api/v1/athletes/{athlete_id}/memories`
- `POST /api/v1/athletes/{athlete_id}/memories/refresh`
- `DELETE /api/v1/athletes/{athlete_id}/memories/{memory_id}`
