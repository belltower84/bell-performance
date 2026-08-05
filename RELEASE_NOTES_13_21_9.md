# Bell Performance 13.21.9 — Superset Round Completion & Rest Timing

## Corrected behavior

Supersets are now logged as rounds rather than as unrelated exercise sets.

- A1 and B1 share one **Complete Round** action.
- Completing A1 alone no longer starts a rest timer.
- The timer begins after the full round has been recorded.
- Bell uses the explicit superset rest prescription, including the 45-second rest assigned to Rear-Delt Fly + Band Pressdown.
- Each exercise still retains separate weight, reps, RPE, and passive status fields.
- Completed or skipped rounds can be undone as a single unit.
- The final round transitions to the superset feedback prompt without starting another timer.

Single-exercise logging remains unchanged.
