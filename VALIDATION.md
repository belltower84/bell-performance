# Bell Performance 8.0.2 Validation

## Automated checks

- JavaScript syntax checked with Node for every file in `js/`, `data/`, and `sw.js`.
- Internal script and asset references checked for missing local files.
- ZIP structure checked to ensure `index.html`, `manifest.json`, `sw.js`, CSS, JavaScript, data, and assets are present at the project root.
- Version strings verified as 8.0.2 in HTML, app runtime, manifest, and service-worker cache.

## Functional scenarios reviewed

1. Today with no training does not fall forward to another weekday.
2. Manual previous/next navigation changes the displayed schedule date; Today restores the local current date.
3. Local date change resets the dashboard to Today and re-enables the daily readiness prompt.
4. A two-session plan day remains incomplete after session one and completes after session two.
5. An active workout reconstructs elapsed time from `timerStartedAt` plus accumulated seconds after reload.
6. Library-started optional workouts remain supported and do not incorrectly complete a planned session.
7. Goal/sex accessory adjustments do not replace primary lifts or engine programming.


## 8.0.2 warm-up validation
- Verified Strength warm-up renders without a recommended weight.
- Verified Engine warm-up renders for running, rowing, swimming, cycling, and rucking patterns.
- Verified ramp sets remain available when a primary lift has a numeric recommendation.


## 8.0.2 optional Core validation
- Verified Core A → B → C rotation from completed History records.
- Verified rest-day Recovery Core selection.
- Verified Core appears only when the selected day has zero or one prescribed session.
- Verified optional Core completion does not modify plan completion status.
- Verified Core templates pass through the standard timer, set logger, History, readiness, and exercise-replacement flows.
