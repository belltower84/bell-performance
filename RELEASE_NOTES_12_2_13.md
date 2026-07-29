# Bell Performance 12.2.13 — Powerlifting Meet Prep

## Competition-date behavior
Selecting a Powerlifting Meet and entering a competition date now activates a dedicated meet-prep pathway. Bell calculates time remaining and automatically changes the training phase.

- More than 10 weeks: Meet Base Building
- 6–10 weeks: Meet Strength Block
- 3–5 weeks: Competition Peak
- 8–14 days: Taper & Openers
- 0–7 days: Meet Week

## Programming changes
- Squat, bench, and deadlift prescriptions become increasingly competition-specific.
- Peak weeks use clean competition singles without missed lifts.
- Taper weeks prescribe planned opener practice and sharply reduce volume.
- Meet week replaces normal deadlift work with recovery, equipment checks, command review, rack-height verification, and attempt planning.
- Engine work is limited to one easy recovery exposure during base/strength/peak phases.
- Engine work is removed during taper and meet week.

## Scope
- Frontend/local programming templates
- Bell Core mission classification and phase resolution
- Bell Core exposure restrictions
- Backend validation tests

## Validation performed
- JavaScript syntax check
- Python compilation
- Rulebook JSON parse
- Added backend meet-prep test cases; the partial patch package does not contain the full backend test fixture needed to execute them independently
