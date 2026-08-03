# Validation — Bell Performance 13.10.4

Run on Windows from the repository root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-adversarial-validation.ps1
```

Expected report:

```text
automation\adversarial_reports\latest\index.html
```

Acceptance criterion: **14/14 cases passed**.

The clean endurance control must produce no warning. The three endurance mutations must produce only:

- `ENDURANCE_HIGH_DAYS_CLUSTERED`
- `ENDURANCE_LONG_RUN_SHARE`
- `ENDURANCE_LOAD_SPIKE`

respectively.
