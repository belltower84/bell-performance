# Bell Performance 13.6.0 — Readiness & Application Control

## Dashboard
- Removed the Guided / Advanced display toggle.
- Removed the non-functional Low / Ready / Great buttons.
- Added a functional readiness tile with a 0–100 score, Green / Yellow / Red state, clear status language, and an Update Check-In action.
- The Modify action is now directly available without changing display modes.

## Application control modes
First Flight now asks how the athlete wants Bell to operate:

- **Workout Planner** — a straightforward fixed plan. Readiness is visible but does not automatically reduce, replace, shorten, or reschedule the scheduled workout.
- **Bell Coach** — adaptive coaching that can change load, volume, conditioning, recovery, and session direction from readiness and feedback.

Application control is separate from training experience. A Beginner, Intermediate, or Advanced athlete can choose either mode. The selected mode is saved to the athlete profile and can be changed later in **Settings → App Control**. Existing athletes default to Bell Coach so current behavior is preserved.

## Mode-specific behavior
- Bell Coach mode keeps the coaching direction card, readiness-driven messaging, rationale actions, cloud coaching decisions, and Coach navigation.
- Workout Planner mode uses fixed-plan language, hides Coach navigation and coaching-only preferences, keeps readiness informational, ignores cloud readiness adaptations, and requires the athlete to use Modify for changes.
- Time Available remains a Bell Coach input and is hidden in Workout Planner mode so it cannot silently shorten a fixed workout.
- Planned phase progression and normal program structure remain intact in both modes.

## Compatibility
- No athlete history, workout history, Journey data, readiness logs, or equipment settings are reset.
- No backend or database migration is required.
