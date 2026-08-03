# Bell Performance 13.11.0

## Discipline-Wide Scientific Validation

- Added seven 52-week discipline controls at a 90% target-compliance condition.
- Added a canonical validation matrix for every coaching discipline.
- Added a complete catalog of supported event families and event types.
- Added a PowerShell runner for the discipline-wide browser simulation.
- Preserved the calibrated 13.10.5 adversarial detector suite.

Run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-discipline-validation.ps1
```

Reports are written to `automation\journey_reports\latest\index.html`.
