# Bell Performance 13.10.0 — Evidence Benchmark & 90% Compliance Validation

This package adds a 16-journey benchmark: Powerlifting, Female Physique, Endurance, and Beginner Recomposition, each simulated at 100%, 90%, 75%, and 60% target compliance.

The 90% scenario is the primary real-world certification condition. Scores cover scientific alignment, discipline legitimacy, progression, fatigue/recovery management, and responsible behavior under the requested compliance level.

Run from the repository root:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-evidence-benchmarks.ps1
```

Report:

```text
automation\evidence_reports\latest\index.html
```

Important limitation: current Bell reports expose session labels, roles, durations, phases, adherence, and readiness. They do not yet expose enough set-level data to directly validate weekly hard sets per muscle, percentage of 1RM, RPE/RIR distribution, or time spent in each running intensity zone. The benchmark marks these as future instrumentation requirements rather than inventing precision.
