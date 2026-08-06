# Bell Performance 13.22.1 Validation

## Integrated strength preparation
- Strength-session warm-up blueprint resolves from the adaptive Movement Preparation / Rehab Support prescription.
- Strength preparation uses the detailed movement-card presentation with dosage, cue, purpose, progress, and explicit completion controls.
- Working sets remain locked until every integrated preparation item is completed.
- Completing the preparation records the date in mobility completion history and creates one deduplicated integrated-preparation session log entry.
- Engine and optional-core warm-up behavior remains on the existing warm-up path.

## Daily scheduling
- Strength days remove the duplicate standalone mobility session and identify preparation as included in the strength workout.
- Healthy non-strength days show Optional Movement Prehab.
- Non-strength days with an active injury profile show Required Rehab Support / Injury Support.
- Red-flag safety states pause exercise support instead of unlocking training.

## Automated checks
- Integrated scheduling and warm-up state tests: passed.
- Integrated warm-up rendering fixture: passed.
- Daily role tests: strength-integrated, optional healthy non-strength, required injury non-strength: passed.
- JavaScript syntax: 77/77 files passed.
- HTML local references: 93/93 resolved.
- Service-worker application-shell references: 93/93 resolved.
- Service-worker syntax: passed.
- Manifest JSON: passed.
