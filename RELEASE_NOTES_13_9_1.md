# Bell Performance 13.9.1 — Formal Week Wiring & Endurance Event Repair

## Fixed

- Preserves the active training-block object while formal weeks are generated, so `trainingBlock.weeks` remains attached to the live block instead of being written to a detached object.
- Creates one formal week record for every configured block week.
- Running event blocks now guarantee four canonical roles when four training days are available:
  - Runner Strength
  - Quality Run
  - Easy Aerobic Run
  - Long Run / Race Rehearsal
- Running prescriptions change by phase from hills and economy work through threshold, goal pace, rehearsal, taper, and event week.
- Added canonical endurance roles: `runner_strength`, `quality_run`, `easy_run`, `long_run`, and `race_rehearsal`.
- Updated the 12-month simulator to validate canonical endurance roles rather than relying only on display titles.

## Preserved

Powerlifting, Female Physique, beginner foundation, event-recovery, time-budget, Core, Mobility, and daily-session behavior remain based on 13.9.0.
