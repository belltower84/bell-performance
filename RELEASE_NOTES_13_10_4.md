# Bell Performance 13.10.4 — Endurance Detector Final Calibration

## Purpose
Calibrate the remaining endurance adversarial detectors so clean controls remain silent and each injected fault produces only its intended warning.

## Changes
- Untyped endurance classification now uses session names only and no longer inherits generic athlete or block metadata from detail/description fields.
- Strength sessions containing words such as “threshold” in profile metadata are no longer counted as quality runs.
- Hard-endurance detection requires a canonical `quality_run`/`race_rehearsal` role or an explicitly running-specific quality-session name.
- Long-run classification uses canonical roles or explicit session names.
- The load-spike mutation is now injected into adjacent ordinary weeks within the same phase, avoiding legitimate taper, recovery, event-week, and phase-transition exclusions.
- Diagnostic evidence remains attached to every detector warning.

## Expected adversarial result
14/14 cases passed:
- all clean controls: no warnings
- every mutation: exactly its intended detector and no unrelated warning
