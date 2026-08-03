# Bell Performance 13.17.0

## 52-Week Dynamic Athlete Journey Validation

This release extends the locked 13.16.7 full-stack baseline into six one-year Chromium journeys.

The validation now covers:

- 52 consecutive generated training weeks per athlete.
- Goal changes without deleting prior history.
- Development-to-event and event-to-development transitions.
- Strength, hypertrophy, body-recomposition, hybrid, 5K, 10K, half-marathon, and powerlifting tracks.
- Injury onset, persistent protective coaching, injury clearance, and conservative return.
- Temporary running-to-cycling substitution followed by return to running.
- Multiple goal changes in one athlete year.
- State reloads after weeks 13, 26, and 39.
- Closed-loop application persistence and duplicate protection.

## New automation

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\automation\run-dynamic-52-week-athlete-journeys.ps1
```

The report is written to:

```text
automation\dynamic_52_week_reports\latest\index.html
```

This suite is intentionally separate from the locked eight-journey 13.16.7 baseline. It is a broader long-horizon validation layer, not a replacement for the established baseline.
