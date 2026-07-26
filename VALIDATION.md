# Bell Performance 9.0.1.1 Validation

## Changes verified
- Removed the page 1 setup kicker and outdated required-field guidance.
- Page 1 now moves directly from “Welcome to Bell Performance” and “Let’s build your first mission.” into the athlete profile fields.
- Tightened only the welcome-page spacing.
- Existing required-field validation and all other First Flight logic remain unchanged.

## Static checks
- All JavaScript files pass `node --check`.
- No duplicate HTML IDs detected.
- Service-worker cache and asset query versions updated to 9.0.1.1 / 9010.
- ZIP integrity validated after packaging.


## 9.0.1.1 regression checklist
- First Flight advances through all six screens.
- Training Style repopulates Training Focus cards.
- Target date appears only for date-driven focuses.
- Schedule and environment persist before launch.
- Starting Point saves limitations and readiness.
- Build New Training Block may open at step 2 without clearing profile data.
- No duplicate HTML IDs and all JavaScript files pass syntax checks.


## 9.0.1.1 Mobility hotfix
- Verified `mobilityRoutineModal` and all referenced child IDs exist.
- Verified opening and closing mobility cannot leave `body.workout-open` stuck after a render failure.
