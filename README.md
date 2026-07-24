# Bell Performance 8.0.2 — Date-Aware Multi-Session Training

GitHub-ready static progressive web app. Open `index.html` locally or deploy the folder root to GitHub Pages.

## 8.0.2 changes

- Dashboard defaults to the current local calendar day and never pulls a future unfinished session forward.
- Previous/next-day navigation and one-click return to Today.
- Automatic local-midnight rollover, including resume after the app was backgrounded.
- Multi-session days track Strength and Engine completion independently; the plan day completes only when every prescribed session is finished.
- Workout timers are derived from persisted timestamps, so refreshes, PWA suspension, and tab closure no longer lose elapsed time.
- Core accessory volume now responds to the active strength goal and saved sex profile while preserving primary lifts, readiness scaling, equipment substitutions, injury logic, and engine prescriptions.
- Existing history, progression, nutrition, habits, readiness, equipment, First Flight, mission builder, and service-worker support are preserved.

## Deployment

1. Upload the contents of this folder to the repository root.
2. In GitHub Pages, deploy from the desired branch and `/ (root)`.
3. After deployment, hard-refresh once so the 8.0.2 service worker replaces older caches.


### Warm-up correction
- Every Strength session now displays a required 8–12 minute Raise–Mobilize–Activate–Ramp sequence.
- Every Engine session now displays modality-specific preparation and progressive pickups.
- Warm-ups no longer disappear when a numeric starting weight is unavailable.


## 8.0.2 optional Core system
- Adds rotating Core A, B, and C sessions on days with zero or one prescribed workout.
- Rest days receive a separate low-fatigue Recovery Core + Mobility option.
- Core sessions are logged in History and use persistent timers, set tracking, readiness scaling, and equipment replacement.
- Optional Core never blocks prescribed-day completion and never turns a rest day into an incomplete day.
