# Bell Performance 13.7.2 — First Flight & Mission Alignment

## Summary

13.7.2 rebuilds First Flight around a clearer athlete profile and Journey decision, moves readiness to the normal dashboard check-in, updates the guided tour, and fixes event-family alignment so the selected athlete and event produce the correct training and Bell Coach direction.

## First Flight

- Renamed **Programming profile** to **Sex**.
- Added desired weight to Athlete Profile.
- Added optional strength baselines for Back Squat, Bench Press, Deadlift, and Overhead Press.
- Added expandable Olympic-lifting and endurance baselines:
  - Snatch
  - Clean and Jerk
  - Power Clean
  - Front Squat
  - One-mile, 5K, and 10K times
  - Cycling FTP and 20K time
  - Row 2K time
- Rebuilt Flight Check 03 as a two-stage decision:
  - Continuous Development
  - Event Preparation
- Added identity-specific objectives and events, including Physique Competition, Powerlifting Meet, running events, Cycling Time Trial, HYROX, and tactical events.
- Added a live example message for every coaching-message style.
- Every Continue and Back action returns the next First Flight page to the top.

## Readiness and guided tour

- Removed the separate readiness questionnaire from First Flight.
- Completing First Flight now opens the same 10-second readiness check-in used on the dashboard.
- The first guided tour begins only after that check-in is saved.
- Updated guided-tour content and styling to match the current Bell Performance experience.
- Fixed mobile guided-tour footer spacing and button clipping.
- Finishing the tour now returns to the dashboard and keeps First Flight complete.
- Replaying the tour no longer resets onboarding.

## Mission and programming alignment

- Event Preparation now stores a recognized event type rather than using the athlete identity as the event type.
- Bodybuilding + Event Preparation maps to **Bodybuilding / Physique Competition** and the **Physique Competition** coaching family.
- Removed the Tactical & Occupational fallback and Usable Strength fallback from the physique path.
- Added Cycling Time Trial event-family support.
- Physique event weeks now fit formal exposures to available training days, preventing a fresh partial week from stacking a 105-minute double session into a 75-minute availability window.
- Removed posing or stage-presentation practice from prescribed physique workouts. Cardio support is paired with mobility and recovery instead.

## Additional fixes

- Fresh-profile startup no longer opens a blocking weekly-debrief alert before a training block exists.
- The commercial dashboard now displays the athlete name saved in First Flight.
- Added current mobile web-app metadata and favicon references.
- Updated service-worker cache versions for all changed assets.

## Next testing phase

This release validates the fresh-profile Bodybuilding event-preparation path and event-family routing. Multi-week simulated athlete cycles, missed-session behavior, workout completion states, and additional athlete pathways remain the next controlled testing phase.
