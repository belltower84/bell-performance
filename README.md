# Bell Performance 11.0.0 — Daily Coach

## Workout Experience Refresh

- Adds a canonical workout metadata model in `js/workout-model.js`.
- Stores one authoritative `duration` when the workout is generated.
- Keeps `prescribedDuration` synchronized for backward compatibility.
- Removes the workout landing page exercise-count time estimate.
- Adds the Mission Briefing with Coach’s Brief, training focus, session breakdown, success criteria, work-set count, intensity, equipment, and next-session preview.
- Preserves existing athlete data, training plans, history, onboarding, and workout execution behavior.

## Test focus

1. Start a planned Strength session and confirm its time matches Home and Plan.
2. Start a planned Engine session and confirm the same duration appears everywhere.
3. Close and reopen an active workout; metadata should remain consistent.
4. Confirm the Mission Briefing collapses to one column on mobile.
5. Complete a workout and confirm history and plan completion still update.

---

# Bell Performance 9.0.3

## Sunday Weekly Debrief

- Opens on Sunday for an active training block.
- Reviews completion, modality balance, readiness, and schedule changes.
- Collects a brief difficulty, pain, energy, and notes check-in.
- Shows a next-week coaching preview before progression.
- Advances the training block only after the athlete confirms **Begin Next Week**.
- The dashboard button opens the same review manually.

# Bell Performance 9.0.1.1

GitHub Pages-ready Bell Performance build.

This focused UI release streamlines page 1 of First Flight by removing the outdated setup label and required-field message, replacing them with a concise mission introduction, and tightening the spacing before the athlete profile fields. No onboarding validation, goal selection, readiness, mission generation, or training logic was changed.


## 9.0.1.1 — First Flight 2.0
- Six-screen onboarding: About You, Training Style, Training Focus, Schedule, Starting Point, Mission Ready.
- Training Focus is now isolated from schedule setup.
- Starting Point combines experience, limitations, and the standard readiness sliders.
- Launch action is now “Launch Training Block.”
- Existing profile and training-block storage keys remain compatible.


## 9.0.1.1 Hotfix
- Restored the missing full-screen Recovery Mobility routine markup.
- Prevented page scroll locking when the mobility modal is unavailable or fails to render.


## 9.0.3 Athlete Lifecycle
- First Flight and Edit Mission/Goal now require a Start Today or Start Following Monday choice.
- Future blocks are stored as Upcoming blocks and activate automatically on their scheduled Monday.
- The dashboard includes an Upcoming Training Block card.
- Complete Week is available any day and uses the same required debrief/check-in/build flow as Sunday.
- Early completion warns about all remaining scheduled sessions.
- Replaced and completed blocks are archived without deleting workout history.


See `RELEASE_NOTES_11_0_0.md` for the Bell 11 dashboard overhaul.
