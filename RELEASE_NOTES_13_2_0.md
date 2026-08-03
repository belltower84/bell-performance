# Bell Performance 13.2.0 — Discipline Coaching Libraries

Bell 13.2 turns the Journey framework into discipline-aware coaching. Powerlifting, bodybuilding, endurance, tactical, hybrid, functional fitness, and Performance & Health no longer share one generic progression model.

## Athlete-facing changes

- Added a Coaching Library card to the Plan page.
- Mission Control now shows the active Continuous Development cycle.
- The Plan page displays the current discipline philosophy, weekly architecture, progression rule, protected sessions, and next-cycle bias.
- **Why this progression?** explains the rule driving the current phase.
- Continuous Development renews into later cycles without resetting completed history.

## Discipline libraries

Each library includes:

- weekly strength and Engine targets;
- protected session priorities;
- phase progression rules;
- readiness reductions;
- missed-session rules;
- assessment metrics;
- next-cycle emphasis rotation;
- discipline-specific phase sequences.

Distinct Continuous Development structures now exist for:

- Fat Loss and Performance & Health;
- Powerlifting;
- Bodybuilding and Body Recomposition;
- Endurance;
- Hybrid;
- Tactical;
- Functional Fitness.

## Bell Core changes

- Added `intelligence/discipline_library.py`.
- Journey Planner upgraded to 13.2.0.
- Weekly Planner upgraded to 13.2.0.
- Plan snapshots now store the discipline library and weekly coaching rules.
- Coaching state now exposes cycle number, cycle week, current bias, next-cycle bias, discipline, and Continuous Development policy.
- Continuous Development week requests beyond the first cycle resolve into renewable later cycles.
- Added transition evaluation for continue, advance, extend, hold, and recover decisions.

## Programming behavior

- Powerlifting protects competition-lift roles and limits Engine work to low-interference aerobic support.
- Powerlifting top-set progression explicitly preserves automatic back-off calculation from the completed top set.
- Bodybuilding uses double progression, weak-point priority, and recoverable set volume.
- Endurance changes session priority by Aerobic Base, Threshold, VO2, and specific phases.
- Hybrid and Tactical libraries protect key strength, quality Engine, long aerobic, and operational sessions.
- Functional Fitness separates strength, skill, and conditioning progression rather than increasing all stressors together.
- Fat-loss coaching protects strength and muscle before increasing cardio or reducing calories.

## Compatibility

- No database migration is required.
- Existing athlete profiles, max lifts, workout history, training blocks, equipment, readiness, and Bell Core accounts remain compatible.
- Existing powerlifting back-off loading and onboarding max-entry fixes remain included.

## Validation

- Backend test suite: **21 passed**.
- Python compilation passed.
- JavaScript syntax validation passed.
- HTML and manifest parsing passed.
- Discipline smoke tests passed for all seven coaching libraries.
