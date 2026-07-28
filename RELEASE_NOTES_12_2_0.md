# Bell Performance 12.2.0 — Dashboard Command Center

## Dashboard redesign

- Reorders the dashboard around the primary user action: Start Workout.
- Combines Readiness, Today’s Briefing, and Daily Brief into a compact horizontal command banner.
- Adds a large Today’s Mission card with visible Start Workout, View Session, and Modify controls.
- Adds eight compact expanding tiles: Weekly Plan, Recovery, Performance, Nutrition, Mission, Compliance, Coaching, and Training Library.
- Uses a right-side detail drawer on desktop and a bottom sheet on mobile.
- Converts the desktop navigation into a fixed sidebar while preserving the five-item mobile navigation.
- Uses the existing Bell Performance shield asset unchanged.
- Keeps the existing planning, readiness, workout, nutrition, history, storage, and Bell Core logic intact.

## Cloud beta

- Keeps the production Bell Core URL.
- Refreshes dashboard connection and coaching status immediately after sync or disconnect.
- Updates the PWA cache to `bell-performance-12.2.0-command-center`.

## Files changed

- `frontend/index.html`
- `frontend/css/app.css`
- `frontend/js/dashboard-command-center.js`
- `frontend/js/bell-api.js`
- `frontend/sw.js`
- `frontend/assets/logo-shield.svg`
