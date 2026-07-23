# Bell Performance 7.0.5 Validation

- Five-step First Flight structure confirmed with unique HTML IDs.
- Athlete profile saves before the Movement Limitations screen.
- Guided tour launches after profile and limitations are saved.
- Guided tour resumes First Flight at the Workout Location Editor.
- Injury profile is persisted, normalized for older saved data, and editable under Athlete Settings.
- Workout generation applies equipment substitutions first, then injury-aware movement adaptation.
- Restricted movements without a compatible unrestricted alternative are omitted and marked for clinician-approved review.
- All JavaScript and service-worker files passed `node --check`.
- ZIP integrity verified.

Bell Performance does not diagnose injury or replace medical or rehabilitation guidance.

## 7.0.5 validation
- All JavaScript files passed `node --check`.
- HTML parsed successfully with no duplicate IDs.
- Engine manual result inputs and engine-specific debrief controls verified.
- Weekly review, block review, milestone, and adaptive deload hooks verified.
- Existing history records remain compatible; new structured fields are optional.

## 7.0.5 Missed Session Management validation

- Existing plan items are normalized to planned/completed status without breaking prior saved data.
- Completed workouts update the corresponding plan item to completed.
- Reschedule, replace, and skip actions create persistent decision records.
- Advancing a block week archives unresolved sessions rather than silently deleting them.
- Weekly review reports rescheduled, replaced, and skipped sessions.
- Repeated fatigue-, injury-, or illness-related misses contribute to adaptive-deload evaluation.
- All JavaScript files passed `node --check`.
- HTML contains no duplicate element IDs and all referenced local assets exist.
