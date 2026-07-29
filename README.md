# Bell Performance 13.3.0 — Athlete Experience

Bell Performance is a local-first adaptive coaching application. Version 13.3 rebuilds First Flight and Settings around a persistent modern athlete profile while preserving the Journey-centered Bell Coaching Engine introduced in Bell 13.1 and the discipline libraries introduced in Bell 13.2.

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

Version 13.3.0 ships with **24 passing backend tests**, JavaScript and Python compilation checks, CSS/HTML/manifest validation, profile migration smoke tests, and archive-integrity checks.
