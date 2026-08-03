# Bell Performance 13.7.3 — Guided Tour Rebuild

## Summary

13.7.3 replaces the legacy slide-style walkthrough with a contextual guided tour built around the current Bell Performance dashboard and navigation. The tour now teaches the daily workflow by spotlighting the actual interface the athlete will use.

## Guided-tour experience

- Replaced the old image carousel and autoplay presentation with an eight-step contextual tour.
- Added direct spotlights for the current:
  - Daily Check-In card
  - Today’s Mission card
  - Bell Coach briefing
  - Weekly Plan
  - Workouts screen
  - Primary navigation
- Rewrote the tour around the intended daily rhythm: check in, understand the direction, execute the work, and record what happened.
- Removed obsolete references to the former readiness sliders and legacy command-dashboard components.
- Added a compact progress bar, step counter, Back, Next, and Skip Tour controls.
- Changed the final action to **Go to Dashboard**.

## Visual and responsive improvements

- Added a dedicated Bell Performance black, charcoal, white, and gold tour style.
- Replaced oversized slide layouts with a focused coaching panel.
- Added steady interface spotlights without distracting pulsing animation.
- Positioned the panel beside the highlighted control on desktop.
- Uses a compact bottom sheet on mobile, with the navigation explanation placed above the bottom navigation.
- Added reduced-motion support.
- Improved mobile sizing, scrolling, safe-area spacing, and button fit.

## Navigation and state repairs

- The tour now targets the visible commercial dashboard rather than hidden legacy elements.
- The Workouts step opens the current Workouts screen and highlights its heading.
- Finishing the first post-onboarding tour keeps First Flight complete and returns to Home.
- Replaying the tour from Help returns the athlete to the screen where the replay began.
- Back navigation restores the correct previous target.
- Escape and Skip Tour close the guide cleanly.
- The old compatibility functions remain harmless so older saved markup does not break.

## Testing boundary

This release validates the guided-tour interface and routing on mobile and desktop. It does not replace the planned multi-week simulated-athlete testing of workout completion, missed sessions, progression, deloads, or mission changes.
