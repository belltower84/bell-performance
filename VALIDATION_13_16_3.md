# Bell Performance 13.16.3 Validation

Run on Windows from the extracted repository root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\automation\run-full-stack-athlete-journeys.ps1
```

The full-stack Chromium suite must verify:

- 8/8 journeys pass.
- At least 128 real plan exposures execute.
- Strength personas use real strength sessions.
- Endurance personas use real engine sessions.
- Hybrid personas exercise both channels.
- Steady response produces measured progression.
- Rapid response produces progress or acceleration.
- Pain protection and re-entry remain intact.
- Travel interruption causes rebuilding without catch-up work.
- Taper phases block upward decisions.
- Athlete-response history survives reload.
- Closed-loop application count, IDs, states, channels, and target metadata survive reload.
- Duplicate completions and application IDs remain idempotent.

The container environment cannot complete localhost Chromium navigation because it is blocked by administrator policy. The Windows run is definitive for the browser journey suite.
