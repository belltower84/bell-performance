# Bell Performance 10 — Foundation Build

This release migrates the Bell Performance 9.0.5 application into the Bell Performance 10 product shell while preserving the existing browser-based programming engine and device storage.

## What changed

- Renamed the product to Bell Performance 10.
- Added the five-part product navigation: Home, Plan, Train, Progress, Control.
- Reframed Training Library as the Train experience.
- Reframed History as Progress with a training-story overview.
- Replaced More with a Control Center dashboard while retaining all detailed settings below it.
- Added dedicated Control Center shortcuts for Athlete, Mission, Training, Coach, Help, and Data.
- Added the Bell 10 dark charcoal and gold visual foundation.
- Added responsive mobile navigation, stronger screen hierarchy, and coach-oriented messaging.
- Preserved onboarding, missions, block generation, workouts, mobility, habits, readiness, weekly debriefs, timeline previews, and local data.

## Test locally

Because this is a static web application, serve the folder rather than opening `index.html` directly:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

Upload the contents of this folder to the repository root. GitHub Pages should be configured to deploy from the selected branch root.

## Next sprint

The next build should make Train a true session-first screen rather than a library-first screen, then convert the detailed Control Center sections into independent editors without changing the underlying storage schema.
