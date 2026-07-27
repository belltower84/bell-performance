# Bell Performance 10.0.0 Foundation — Release Notes

## Implemented

### BP-001 — Unified workout duration
- The generated workout now stores `duration` as its authoritative estimate.
- `prescribedDuration` mirrors `duration` to protect compatibility with the existing dashboard, plan, and history code.
- The workout screen no longer estimates duration from exercise count.

### BP-002 — Standard workout metadata
Every active workout is normalized with:
- duration
- week and phase
- intensity
- work-set count
- training focus
- equipment
- coach brief
- session sections
- success criteria
- next-session preview

### BP-003 — Mission Briefing
The workout landing experience now includes:
- Today’s Mission hero
- Coach’s Brief
- Focus tags
- Session breakdown with synchronized total time
- Success Today checklist
- Work sets and intensity
- Equipment list
- Next session

## Compatibility
- No storage reset or migration is required.
- Existing active workouts are normalized when opened.
- Existing plan and history fields remain supported.

## Known limitation
Section minutes are a presentation breakdown of the authoritative total duration. They are allocated from the exercise blocks and do not yet use exercise-level tempo or historical athlete pace.
