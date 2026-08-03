# Bell Performance 13.6.1 — 10-Second Daily Check-In

## Daily readiness
- Replaced the six-slider daily readiness form with a fast tile-based check-in.
- The athlete now answers three readiness questions: **Sleep**, **Body**, and **Energy**.
- Added a separate **Pain or injury concern** question so pain is not confused with normal training soreness.
- Added five clear time choices: **20**, **30**, **45**, **60**, and **75+ minutes**.
- The submit action stays disabled until the required answers are complete. A short note is required when pain is flagged.

## Scoring and coaching behavior
- Readiness is calculated only from sleep, body recovery, and energy.
- Time available does not lower the readiness score; in Bell Coach mode it only controls the session-length target.
- A reported pain concern acts as a safety override and keeps the daily status in the red recovery range.
- Workout Planner mode continues to show readiness without automatically changing the scheduled workout.
- Existing readiness history and older check-ins remain compatible.

## Dashboard language
- Replaced motivation and soreness-oriented display language with clearer **Body** and **Pain** labels.
- Quick-check-in answers are displayed as plain language such as **Good**, **Normal**, **Steady**, and **Review** rather than artificial 1–5 values.

## Compatibility
- No backend or database migration is required.
- Existing athlete profiles, Journey data, training history, equipment, and readiness logs are preserved.
