# Bell Performance 13.7.16 — Completion Reconciliation Repair

## Fixed

- Today’s Mission now recognizes completed Strength and Engine sessions from both the plan completion map and completed workout history.
- Completion display no longer depends on a single fragile session-key write.
- Finished workouts are normalized back to the exact plan ID, session key, and scheduled date.
- Legacy or previously completed sessions can reconcile after reload when the workout history contains the matching plan/session identity.
- Strength and Engine remain independently completable on combined training days.

## Expected behavior

- Completing Strength changes the Strength tile and action to `Completed`; Engine remains actionable.
- Completing Engine changes the Engine tile and action to `Completed`.
- Refreshing or reopening the app preserves both completion states.
