# Validation — Bell Performance 13.12.0

## Local static validation completed

- Python compilation for `run_event_validation.py`
- JSON parsing for the event matrix, evidence registry, and 16 journey controls
- Configuration audit confirming one event-preparation phase and exactly 52 weeks per journey
- Matrix/journey ID parity
- Application version update
- Archive-integrity testing

## Browser-driven validation

The full suite requires Chromium or Chrome because it advances the real Bell application day by day, rebuilds every formal week, applies readiness and availability, completes sessions probabilistically around the 90% target, and captures the actual generated plans.

A one-event browser smoke run was attempted in the build environment. Chromium launched, but local application navigation was blocked with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. The browser-driven results therefore must be produced on the user's Windows system.

Run on Windows:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-event-validation.ps1
```

## Acceptance rule

A clean event control passes only when:

1. the app generates all 52 formal weeks without runtime errors;
2. the selected event maps to the intended family;
3. the event-preparation phase contains the declared event-specific concepts;
4. at least one controlled rehearsal appears;
5. event dose meets the conservative threshold declared in the matrix;
6. taper or event-week volume falls meaningfully without deleting specific practice;
7. post-event recovery removes high-stress event simulation;
8. required sessions fit the athlete's declared time availability.

Failures are review findings, not automatic proof that the coaching engine is unsafe. Each failure must be classified as either a true prescription gap or a detector/context problem before 13.12.1 adversarial mutations are introduced.
