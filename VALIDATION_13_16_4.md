# Validation 13.16.4

Primary Windows validation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\automation\run-full-stack-athlete-journeys.ps1
```

The report is written to:

`automation\full_stack_journey_reports\latest\index.html`

Acceptance criteria:

- 8/8 full-stack journeys pass.
- Every executable real plan session is processed.
- Steady strength response produces measured progression.
- Rapid hybrid response produces progression or capped acceleration.
- First successful strength exposure does not trigger rebuild.
- Positive strength evidence accumulates from actual prescribed-versus-completed sets, reps, load, and effort.
- Pain, travel, taper, struggling, messy-input, channel, persistence, duplicate, and idempotency protections remain passing.
