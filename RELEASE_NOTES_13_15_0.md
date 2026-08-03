# Bell Performance 13.15.0 — Closed-Loop Prescription Application

## Purpose

13.14.0 proved that Bell could stabilize coaching decisions across complete athlete trajectories. 13.15.0 closes the remaining implementation gap: the stabilized decision now rewrites the next comparable future workout rather than existing only as an explanation or recommendation.

## Closed-loop behavior

- Every stabilized response creates a deterministic prescription-application record.
- Strength applications target the next comparable strength exposure without changing engine work.
- Engine applications target the next comparable engine exposure without changing strength work.
- Progress and acceleration modify the intended load, volume, effort, or duration within the locked longitudinal ceilings.
- Hold, regress, rebuild, deload, and re-entry decisions reduce the appropriate prescription without compounding the same application twice.
- Exercise-level decisions can hold, regress, or protect a single movement while leaving unrelated movements intact.
- Moderate pain and technique concerns substitute a pain-free protected variation for the affected exercise.
- Safety holds replace the next hard exposure with a recovery prescription.
- Completed targets are skipped when an application must be retargeted.
- Canonical event, session, and exercise-role metadata remains present after dose rewriting.

## Persistence and auditability

Each application records:

- its deterministic application ID;
- the source completion and coaching decision;
- the intended training channel;
- the target session;
- the exact factors and exercise-level changes;
- identity-preservation assertions;
- application and consumption state.

The browser stores the application on the assigned plan session. Bell Core stores the same application in adaptive progression state and rewrites the active plan. Reapplying the same application ID is idempotent.

## Bell Core

The adaptive-progression profile schema is now version 3. The plan engine manifest exposes `prescription_application: 13.15.0`. No database migration is required because the state remains in the existing athlete profile and plan JSON documents.
