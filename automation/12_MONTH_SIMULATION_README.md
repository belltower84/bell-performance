# Bell Performance 12-Month Journey Simulator

This long-horizon suite advances four deterministic athletes through 52 weeks of Bell Performance programming.

## Included journeys

1. **Powerlifting Meet Journey**
   - 8-week offseason foundation
   - 16-week powerlifting meet preparation
   - 2-week post-meet recovery
   - 12-week weak-point hypertrophy block
   - 14-week strength rebuild

2. **Female Physique Competition Journey**
   - 12-week improvement season
   - 24-week physique-show preparation
   - 4-week post-show recovery
   - 12-week rebuild and body recomposition

3. **10K to Half-Marathon Journey**
   - 8-week aerobic base
   - 12-week 10K preparation
   - 2-week post-race recovery
   - 18-week half-marathon preparation
   - 12-week durability and maintenance

4. **Beginner Body-Recomposition Journey**
   - Four progressive development phases across the year

## Run it

Open PowerShell in the extracted Bell Performance folder.

If scripts are blocked, enable a temporary bypass for the current window:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then run:

```powershell
.\automation\run-year-simulations.ps1
```

The report opens automatically when the run is complete.

## Report location

```text
automation\journey_reports\latest\index.html
```

The report includes:

- Year architecture and phase transitions
- Every week of the 52-week journey
- Daily readiness and time availability
- Required-session adherence
- Missed, shortened, yellow-readiness, and red-readiness days
- Weekly Strength, Engine, Core, and Mobility counts
- Required training minutes and time-budget violations
- Event-specific preparation, taper, and event-week checks
- Post-event recovery and transition into the next phase
- Dashboard screenshots at key points in the journey
- Weekly and daily CSV exports
- Machine-readable JSON exports

## Important distinction

The simulator uses Bell Performance to generate and audit prescriptions. Strength, bodyweight, and race-time projections shown in the report are clearly labeled illustrative scenario assumptions. They are not guarantees and are not direct physiological predictions from the coaching engine.

## Adjusting the athletes

The journeys are defined in:

```text
automation\year_journeys.json
```

You can change event lengths, training days, normal session time, equipment, starting lifts, adherence, or scripted disruptions before running the suite again.
