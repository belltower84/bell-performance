# Validation — Bell Performance 13.12.1

## Local calibration completed

- `run_event_validation.py` compiles and loads all 16 journey configurations.
- Every configured journey contains exactly 52 weeks.
- Event matrix and journey identifiers match.
- Canonical event-routing test passes for 11 representative routes.
- Undefined custom-event routing returns `SCOPE_LIMITED`.
- Running-event identity and differentiated rehearsal-dose test passes at 63 / 74 / 105 / 120 minutes.
- Context-aware powerlifting, physique, rehearsal, and canonical-dose detector tests pass.
- JavaScript syntax validation passes for the application source.
- Python syntax validation passes for the automation source.
- Backend regression tests pass.
- Archive integrity is verified after packaging.

## Targeted commands

```powershell
node .\automation\test-event-routing-13121.js
node .\automation\test-running-specificity-13121.js
python .\automation\test_event_validator_13121.py
python .\automation\run_event_validation.py --app-root . --config-only
```

## Browser-driven validation

The complete suite requires Chrome or Chromium because it advances the real application through 16 deterministic 52-week journeys, rebuilds weekly prescriptions, applies availability and readiness, and records the actual generated event plans.

The build environment does not permit the full localhost browser run. Run the suite on Windows:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-event-validation.ps1
```

## Acceptance rule

The calibrated clean baseline is accepted when:

1. all 16 journeys generate 52 formal weeks without browser errors;
2. every event maps to its intended family and canonical roles;
3. event-critical sessions survive schedule adaptation;
4. rehearsals are identified only from context-appropriate roles;
5. running events retain distinct identity, pace cues, and dose;
6. taper and post-event recovery remain valid;
7. required sessions fit the athlete's declared time;
8. an undefined custom event reports `SCOPE_LIMITED` rather than unsupported sport-specific validity.

Target: **16/16 clean event journeys pass**.
