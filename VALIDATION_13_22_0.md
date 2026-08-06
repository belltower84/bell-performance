# Bell Performance 13.22.0 Validation

## Static validation
- 76 JavaScript files passed `node --check`.
- Service worker passed `node --check`.
- Manifest JSON parsed successfully.
- 91 HTML asset references resolved.
- 92 service-worker shell references resolved.

## Adaptive prescription logic
Passed deterministic runtime checks for:
- Strength lower / posterior-chain preparation
- Endurance interval / speed preparation
- Bodybuilding upper-body preparation
- Olympic-lifting preparation
- Hybrid strength + running preparation
- Tactical performance preparation
- 6-, 10-, and 15-minute movement counts
- Date-based routine rotation with stable same-day prescriptions

## Injury-aware support
Passed runtime checks for:
- Active limitation automatically replacing Movement Preparation
- Undiagnosed shoulder symptoms using conservative Injury Support
- Clinician-diagnosed patellofemoral pain using Build Capacity Rehab Support
- Patellofemoral module containing both hip- and knee-targeted exercise categories
- Red-flag symptoms blocking the exercise prescription
- Supported condition, side, phase, severity, restriction, and red-flag data migration

## Completion
Passed runtime checks for:
- Finishing with incomplete movements prompts the mark-remaining path
- All remaining movements are recorded complete after confirmation
- Completion date is saved
- Prescription mode, title, phase, condition, and movement IDs are written to the mobility session log

## Regression preservation
13.22.0 was built from the 13.21.9 feature baseline and retains:
- Superset shared Complete Round behavior
- Superset rest timing
- Full-width equipment-change notices
- Exercise exchange
- Readiness transparency

The 13.21.10 bottom action-row balance CSS was carried forward into this build.
