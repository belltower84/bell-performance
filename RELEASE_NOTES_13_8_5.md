# Bell Performance 13.8.5 — Training Experience Refinement

This release cleans up the athlete’s daily training experience and focuses the app on the sessions actually prescribed for today.

## Daily mission support work

- Engine descriptions no longer repeat template durations that can conflict with the time allocated by Daily Readiness.
- Daily Mobility is clearly labeled **Optional** and sits outside the required training-time budget.
- On Recovery Days, Mobility moves to the top of Today’s Mission and becomes the primary recovery focus while remaining optional.
- Core / Ab work now follows the same support-session model as Mobility: optional, separate from required mission completion, and outside the required time budget.
- Core duration is scaled from the athlete’s normal First Flight availability rather than the temporary time selected during today’s check-in.

## Focused Train page

- Removed the full workout-catalog list from the Train page.
- Train now shows only today’s prescribed sessions and any workout already in progress.
- The dedicated Exercise Intelligence Library remains available separately for movement guides and substitutions.

## Mission editing

- **Edit Mission / Event** and **Reset / Rebuild Mission** now return directly to First Flight Check 02.
- Existing athlete details, equipment, history, and other saved settings remain intact while the mission is reviewed.

## Workout experience

- Rebuilt the workout briefing and active-session layout to match the rest of Bell Performance.
- Added a compact Bell Coach briefing, today’s plan, session timer, current-focus display, streamlined exercise cards, and a cleaner finish flow.
- Exercise prescription and primary coaching cue stay visible while load guidance, full coaching notes, set logging, and feedback expand only when needed.
- The workout title now uses the concise athlete-facing session name.
- Cooldown appears only when the workout template contains an actual cooldown activity that can be completed in the app.
- Section timing is allocated so the displayed workout plan adds up to the prescribed session duration.

## Version

- App version: `13.8.5-training-experience-refinement`
- Service-worker cache: `bell-performance-13-8-5`
