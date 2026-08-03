# Bell Performance 13.16.4

## Positive Response Calibration & Strength Evidence Repair

This release repairs the final two failures found by the full-stack journey replay.

### Athlete-response calibration

- Structured strength completions now read both `sessionRpe` and the legacy `rpe` field.
- Actual load is compared with planned load at the set and exercise level.
- Strength performance now combines set completion, rep execution, load execution, and effort reserve.
- Successful work performed above the planned load with clear reserve can produce rapid-positive evidence.
- Normal successful work remains a measured success rather than an automatic acceleration.

### Full-plan journey replay

- Every executable session in each generated week is completed or missed by the simulated athlete.
- The test no longer samples two sessions while leaving the rest of the week falsely incomplete.
- Strength diagnostics report planned sets, completed sets, completion ratio, rep ratio, load ratio, performance ratio, RPE, readiness, input gate, raw decision, and final decision.
- Positive journeys verify that the first successful strength exposure does not trigger `rebuild`.
- Steady and rapid responders must earn `progress` or `accelerate` through the production response engine.

Protective pain, travel, taper, deload, persistence, channel isolation, duplicate, and idempotency behavior remains under regression coverage.
