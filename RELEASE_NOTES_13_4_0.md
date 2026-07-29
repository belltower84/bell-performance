# Bell Performance 13.4.0 — Bell Coach Intelligence

## Added

- Bell Coach Brief on Mission Control.
- Structured **Why?** explanations for Mission, Phase, progression, Weekly Plan, recovery, nutrition, milestones, and adaptations.
- Explicit separation of known facts, evidence-based inference, missing information, and confidence.
- Bell Coach center with Now, Why, Memory, and Decisions views.
- Evidence-based local and Bell Core coaching memory.
- Athlete controls to add, review, remove, enable, or disable coaching memory.
- Transparent adaptation history for phase, readiness, schedule, and cloud decisions.
- Bell Core coaching-memory persistence and REST endpoints.
- Database and Alembic migration for `coaching_memories`.

## Memory safeguards

- Inferred durable memory requires repeated evidence.
- Explicit athlete preferences may be recorded immediately.
- Every memory is reviewable and removable.
- Removed inferred memories are not silently reactivated.
- Confidence and evidence remain visible to the athlete.

## Compatibility

Bell remains local-first. Bell Coach works offline from local Journey, readiness, feedback, progression, and schedule data. Bell Core enhances the same interface with synchronized explanations, memory, and decision history.
