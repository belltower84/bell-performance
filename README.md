# Bell Performance 13.4.0 — Bell Coach Intelligence

Bell Performance is a local-first adaptive coaching application. Version 13.4 adds transparent coaching explanations, evidence-based athlete memory, and an auditable adaptation history while preserving the modern athlete experience introduced in 13.3.

## Product blueprint

Bell 13 and later are governed by [`BELL_PRODUCT_BLUEPRINT.md`](BELL_PRODUCT_BLUEPRINT.md). It defines the product language, coaching architecture, design standards, adaptive-planning rules, and release roadmap.

## Bell 13.3 coaching profile

```text
Athlete Profile
  → Training Identity
  → Current Objective
  → Journey Mode
  → Journey
  → Current Phase
  → Weekly Plan
  → Today's Mission
```

Bell separates who the athlete is becoming from the objective being pursued now. A Powerlifter can pursue Body Recomposition, a Performance & Health athlete can prepare for a race, and any identity can continue purposeful development without a dated event.

## First Flight

The seven-step onboarding flow captures:

- athlete baseline;
- training identity;
- current objective and Journey mode;
- normal training availability;
- experience and strength baselines;
- recovery and Bell Coach preferences;
- final Journey review.

Powerlifting requires squat, bench press, and deadlift maxes. Event Preparation requires a named event and future date.

## Athlete Control Center

Settings is organized into:

- Athlete
- Journey
- Training
- Nutrition
- Recovery
- Bell Coach
- App

Existing equipment, limitation, nutrition, Bell Core, advanced Journey, backup, and help controls remain available inside the new structure.

## Connected experience

- Register or sign in to Bell Core from Settings.
- Create, retrieve, and partially update the normalized athlete profile.
- Sync the current mission, discipline, Journey, and multiweek plan.
- Submit readiness and receive discipline-aware adaptation.
- Start and complete Bell Core sessions in the guided workout player.
- Continue using Bell locally when Bell Core is unavailable.

## Documentation

- [`BELL_ATHLETE_EXPERIENCE_13_3.md`](BELL_ATHLETE_EXPERIENCE_13_3.md)
- [`BELL_COACHING_ENGINE_13_2.md`](BELL_COACHING_ENGINE_13_2.md)
- [`RELEASE_NOTES_13_3_0.md`](RELEASE_NOTES_13_3_0.md)
- [`VALIDATION_13_3_0.md`](VALIDATION_13_3_0.md)

## Local use

Serve the frontend over HTTP:

```bash
python -m http.server 5173
```

Run Bell Core from `backend/`:

```bash
uvicorn app.main:app --reload
```

## Validation

Run backend tests from `backend/`:

```bash
pytest -q
```

Version 13.4.0 ships with **28 passing backend tests**, JavaScript and Python compilation checks, CSS/HTML/manifest validation, profile migration smoke tests, and archive-integrity checks.


## Bell Coach Intelligence (13.4)

Bell Coach now produces structured explanations, separates known facts from inference and missing data, maintains athlete-reviewable coaching memory, and exposes an auditable decision history. See `BELL_COACH_INTELLIGENCE_13_4.md`.
