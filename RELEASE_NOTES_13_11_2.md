# Bell Performance 13.11.2 — Powerlifting Context & Differential Mutation Repair

Repairs the final three failures in the discipline-wide adversarial suite without changing the six already-passing discipline branches.

## Changes

- Uses the explicit 52-week Powerlifting Meet Journey as the powerlifting adversarial control.
- Requires the clean meet fixture to contain competition squat, competition bench, competition deadlift, a peak/taper phase, event week, and post-meet recovery before mutations are scored.
- Applies powerlifting specificity, taper, and recovery rules only to an explicit meet-preparation context.
- Compares every corrupted journey against its clean baseline so inherited warnings cannot produce a false pass.
- Verifies that each powerlifting mutation actually removed the intended roles, taper structure, or recovery prescription.
- Adds control-precondition and mutation-difference evidence to the HTML and JSON reports.
- Leaves the 13.11.0 non-event Powerlifting Discipline Journey unchanged for broad year-round discipline validation.

## Acceptance

The complete discipline adversarial suite must report **28/28 cases passed**.
