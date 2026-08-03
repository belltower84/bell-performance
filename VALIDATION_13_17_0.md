# Validation 13.17.0

## Dynamic one-year journeys

Six full-stack athlete profiles run for 52 weeks each:

1. Strength to hypertrophy.
2. Hybrid to 10K preparation.
3. Half-marathon runner with knee injury, cycling substitution, recovery, and return to running.
4. Body recomposition to powerlifting meet preparation.
5. Strength athlete with shoulder injury, re-entry, and later hybrid transition.
6. Multi-goal athlete changing from strength to body recomposition, then 5K preparation, then hybrid development.

## Required invariants

- All 52 weeks produce executable real sessions.
- History survives every transition.
- Goal changes update athlete identity, mission, and training configuration.
- Track changes update the active engine modality.
- Active injuries produce protective decisions.
- Cleared injuries do not immediately accelerate.
- Prescription factors remain bounded.
- Reloads preserve history and application IDs.
- Application IDs remain unique.
- Repeating a real scheduled session in another week remains valid evidence.
- Resubmitting the same scheduled occurrence remains a duplicate.

The Chromium report produced on the user's Windows machine is the definitive result.
