# Bell Performance 13.16.0 Validation

Run on Windows:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\automation\run-real-world-chaos-validation.ps1
```

Acceptance target:

- 120/120 deterministic athlete journeys pass;
- at least 2,000 exposures processed;
- 6/6 Python guard checks pass;
- no unsafe progression during taper, event week, recovery, pain, or contradictory input;
- no duplicate application compounding;
- no channel crossover or event-role loss;
- no cumulative ceiling violation;
- no endless deload or regression spiral.

Report: `automation/real_world_chaos_reports/latest/index.html`.
