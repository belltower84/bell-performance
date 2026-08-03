# Bell Performance 13.3.0 — Athlete Experience

Bell 13.3 redesigns Settings, expands First Flight, and introduces a persistent modern athlete profile shared by the local app and Bell Core.

## Athlete-facing changes

- Rebuilt Settings as the **Athlete Control Center**.
- Added consistent Athlete, Journey, Training, Nutrition, Recovery, Bell Coach, and App panels.
- Added profile-completeness feedback and a concise coaching-profile summary.
- Added age, height, training experience, training age, preferred training time, schedule reliability, sleep target, deload preference, coaching detail, and check-in-frequency controls.
- Added a Journey summary showing planning mode, current phase, phase week, and next milestone.
- Preserved and reorganized existing equipment, movement-limitation, nutrition, Bell Core, backup, and advanced Journey controls.

## First Flight onboarding

- Expanded onboarding from six steps to seven coaching-focused steps.
- Separated Training Identity from Current Objective.
- Added Continuous Development and Event Preparation choices.
- Added dated event name and date requirements for Event Preparation.
- Added optional goal-weight milestones for fat loss and body recomposition.
- Restored required squat, bench press, and deadlift max entry for Powerlifting.
- Added training-age, schedule, recovery, and Bell Coach preferences.
- Added a modern final Journey review.
- Preserved the automatic first-use guided tour.

## Athlete profile modernization

- Added local athlete-profile schema version 1.
- Added automatic migration from existing Bell settings.
- Kept the modern profile synchronized with legacy fields used by existing training and nutrition modules.
- Added connected profile sync without sacrificing local/offline operation.

## Bell Core changes

- Added `intelligence/athlete_profile.py`.
- Athlete creation now normalizes profile data.
- Added athlete-profile GET and PATCH endpoints.
- Partial profile updates preserve unrelated nested sections and lift maxes.
- Added support for legacy and modern field aliases.
- Profile responses include schema version, normalized sections, completeness, and update time.

## Compatibility

- No database migration is required.
- Existing athlete settings, active training blocks, Journey state, max lifts, workout history, readiness, equipment, and Bell Core accounts remain compatible.
- Bell 13.2 discipline libraries and Continuous Development behavior remain included.
- Bell 13.0.1 automatic powerlifting back-off loading remains included.
