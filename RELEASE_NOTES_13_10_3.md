# Bell Performance 13.10.3 — Detector Calibration & Diagnostic Evidence

- Powerlifting specificity now validates canonical competition roles from actual meet-preparation plan items rather than cached summary metadata.
- Physique competition preparation uses a discipline-specific final-preparation check instead of a generic strength/endurance taper rule.
- Endurance hard-day detection now counts true quality and race-rehearsal sessions while excluding ordinary long runs, primers, and event-day entries.
- Endurance load-spike detection is phase-aware and excludes taper, event, recovery, post-race, and new-block transitions.
- Duplicate endurance warnings are suppressed when an oversized long run or hard-day cluster already explains the injected abnormal week.
- Every detected warning now includes week-level diagnostic evidence showing the sessions, duration, ratio, or missing canonical roles that triggered it.
