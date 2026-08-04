# Bell Performance 13.21.0

## Workout UX Source Consolidation

- Consolidates workout preview and warm-up rendering inside `js/workouts.js`.
- Removes the legacy `version-8.js` warm-up override.
- Adds a real preview overlay above the active workout.
- Adds persistent mobility-style warm-up items with complete/skip state.
- Gates working sets until all warm-up items are completed or skipped.
- Adds a visible build identifier in Settings.
- Uses a network-first service worker for app code during the pilot.
