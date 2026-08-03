# Bell Performance 13.13.0 — Athlete Response & Adaptive Progression

Bell now records what the athlete actually completed and compares it with the planned prescription before changing future training.

## Structured completion data

Strength sessions can record:

- planned and completed sets;
- planned and completed repetitions;
- planned and used load;
- per-set RPE and reps in reserve;
- exercise feedback, pain, and technique concerns;
- session RPE, overall difficulty, pain severity, and notes.

Engine sessions preserve:

- planned and actual duration;
- distance and unit;
- calculated pace;
- average heart rate;
- elevation gain;
- session RPE and difficulty.

Every completion also stores the available readiness snapshot and an auditable response decision.

## Adaptive progression

Bell classifies the latest response as:

- `observe` — record one exposure without changing the plan;
- `progress` — apply the smallest useful change after repeated success;
- `accelerate` — capped progression after three rapid positive responses;
- `hold` — repeat or slightly trim after one difficult exposure or low readiness;
- `regress` — reduce the next dose after repeated underperformance;
- `rebuild` — restore consistency after interruption or low completion;
- `protect` — block progression when pain or technique is limiting;
- `safety_hold` — stop hard progression for severe pain or red-flag symptoms.

## Guardrails

- No catch-up volume after missed training.
- Pain and technique concerns override performance progression.
- One exceptional session cannot trigger accelerated progression.
- Strength intensity changes are capped at five percent per evaluation.
- Engine duration changes are capped at ten percent per evaluation.
- Readiness is interpreted with completed performance, not used alone for large changes.

## Bell Core

The completion API accepts the structured response contract and stores the latest adaptive state in the athlete profile. The new endpoint is:

```text
GET /api/v1/athletes/{athlete_id}/adaptive-progression
```

No database migration is required because structured completion and adaptive state remain JSON-backed.

## Validation

Run:

```powershell
.\automation\run-athlete-response-validation.ps1
```

The deterministic suite contains 30 response controls plus backend integration tests and JavaScript/Python decision parity.
