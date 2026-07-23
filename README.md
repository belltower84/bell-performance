# Bell Performance 7.0.5 — First Flight

- Adds a four-step interactive onboarding flow.
- Introduces the Workout Location Editor during setup, including multiple locations, presets, custom equipment, and primary-location selection.
- Preserves existing training, progression, readiness, quotes, history, backup, and PWA functionality.
- Launches the existing guided tour after First Flight is completed.

# Bell Performance 6.9 — Contextual Quote Rotation

Adds a rotating offline quote cache matched to the athlete’s active Strength and Engine goals. The dashboard alternates Strength and Engine emphasis by day, while existing Faith-Based, Mixed, Stoic, and Off preferences remain supported. Scripture uses the King James Version.

# Bell Performance 6.8.2 — Help & Guided Tour

- Fixes the non-responsive guided-tour buttons.
- Moves the guide into a dedicated Help section under More.
- Automatically launches the tour once, immediately after a new athlete completes profile setup.
- Never auto-launches during normal dashboard visits.
- Keeps the full tour and Training & Weight Logging shortcut available in Help.
- Updates the service-worker cache to 6.8.2.

# Bell Performance 6.8.1 — Guided Tour Fix

This maintenance release fixes the dashboard unexpectedly opening a large slideshow image.

## Changes
- The How-To guide no longer opens automatically after dashboard load.
- The guide remains available from **More → How to Use Bell Performance**.
- Slideshow playback only begins after the user presses **Play Slideshow**.
- Updated service-worker and asset cache versions.
- Corrected old-cache cleanup logic.


## 7.0.5 First Flight sequence
Athlete specifics are collected first. The app then opens a live, spotlight-guided dashboard tour before resuming Workout Location and coaching-preference setup.


### 7.0.5 tour repair
- Corrected the tour layer order so the written instruction panel always stays above dashboard highlights.
- Clarified that the guide is text-based and does not require audio.
- Renamed slideshow controls to Auto-Advance.


## 7.0.5 Movement Limitations
First Flight now captures injury history and restricted movement patterns. Workout generation applies conservative injury-aware substitutions after equipment substitutions. Users can review the profile later under Athlete Settings. This feature is not medical diagnosis or treatment.


## 7.0.5 Performance Intelligence
Adds editable engine results, engine-specific debriefs, weekly and block reviews, performance milestones, and adaptive deload triggers.

## Missed Session Management (7.0.5)

Each planned session now includes a Manage action with three choices:

- **Reschedule:** move the workout to another day while preserving its original day in the record.
- **Replace:** convert it to recovery mobility, short Zone 2, or a shortened strength session.
- **Skip and Continue:** record the missed session without cramming it into a later day.

The athlete records a reason (schedule, fatigue, injury, illness, travel/equipment, or other). Decisions feed the weekly review, block history, and adaptive-deload logic. Fatigue-, pain-, or illness-related misses are treated as recovery signals rather than ordinary compliance failures.
