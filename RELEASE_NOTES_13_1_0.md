# Bell Performance 13.1.0 — Adaptive Journey Planning Engine

Bell 13.1 introduces the first working version of the Bell Coaching Engine's long-horizon planning layer. Bell now maintains a Journey-centered coaching state instead of treating the active training block as the entire plan.

## Athlete-facing changes

- Mission Control now reads a canonical Journey state.
- Current Phase and Phase Week are calculated independently from the total Journey week.
- The Plan page now shows a phase timeline with completed, current, and upcoming phases.
- Every Journey displays its identity, objective, planning mode, next phase, and next milestone.
- A **Why this phase?** action explains the purpose of the current phase.
- Local/offline athletes receive the same Journey structure as cloud-connected athletes.

## Planning behavior

- Dated events use the event date to determine the active planning horizon instead of defaulting to 12 weeks.
- Bell supports active horizons up to 52 weeks. Events farther away preserve their full countdown while Bell generates a renewable 52-week active horizon.
- Event Preparation and Continuous Development are separate planning modes.
- Continuous Development creates purposeful repeating development cycles rather than an indefinite numbered program.
- Fat loss, body recomposition, muscle gain, powerlifting, endurance, hybrid, tactical, functional fitness, bodybuilding, and general development receive appropriate baseline phase sequences.

## Bell Core changes

- Added `intelligence/journey_planner.py`.
- Plan snapshots now include a canonical `journey` object.
- Every generated week and session includes Journey phase metadata.
- Added `GET /api/v1/athletes/{athlete_id}/coaching-state`.
- Plan-generation decisions now preserve the Journey and its priorities.
- Added `journey_created` events and `journey_planner` to the engine manifest.
- Cloud sync now retrieves the authoritative Bell Core Journey state.

## Compatibility

- No database migration is required. Journey state is stored inside immutable plan JSON snapshots.
- Existing local athlete data, workout history, max lifts, equipment, readiness, and mission settings are preserved.
- Existing weekly scheduling and workout-generation logic remains active beneath the new Journey layer.

## Validation

- JavaScript syntax validation passed for all modified modules.
- HTML parsing passed.
- Python compilation passed.
- Backend test suite: **16 passed**.
- Local Journey-engine smoke tests passed for event preparation and phase progression.

## Next milestone

Bell 13.2 will deepen the discipline-specific coaching libraries. The 13.1 engine provides the shared contract those libraries will plug into.
