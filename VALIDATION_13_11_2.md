# Validation — Bell Performance 13.11.2

Run from the repository root on Windows:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-discipline-adversarial-validation.ps1
```

Expected report:

```text
automation\discipline_adversarial_reports\latest\index.html
```

## Acceptance criteria

- All seven clean controls produce no warnings.
- The clean powerlifting adversarial fixture is an explicit meet journey containing:
  - `competition_squat`
  - `competition_bench`
  - `competition_deadlift`
  - peak or taper weeks
  - event week
  - post-meet recovery
- Each mutation introduces only its expected new warning beyond the clean baseline.
- Every powerlifting mutation proves that the targeted data changed.
- Full result: **28/28 cases passed**.
