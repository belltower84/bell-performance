# Bell Performance 13.16.2 Validation

## Full-stack replay acceptance criteria

- 8/8 browser journeys pass.
- Every generated week discovers at least one executable strength or engine session.
- At least 100 real plan exposures are processed across the suite.
- Completions originate from real generated prescriptions.
- Athlete-response and longitudinal decisions are produced.
- Closed-loop applications are created and applied.
- Mid-journey reload retains nonzero history and application state.
- Duplicate, pain, travel, taper, and messy-data paths execute.
- Any zero-exposure week fails preflight with `JOURNEY_SESSION_DISCOVERY_FAILED`.

Run on Windows:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\automation\run-full-stack-athlete-journeys.ps1
```

Expected report:

`automation\full_stack_journey_reports\latest\index.html`

The Chromium suite could not be executed in the packaging environment because localhost browser navigation is blocked by administrator policy. The Windows result is definitive.
