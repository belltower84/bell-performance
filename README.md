# Bell Performance 8.7.0 — Seamless Premium Interface

GitHub-ready static PWA.

## Changes
- Actual sleep hours and minutes in Daily Readiness.
- Sleep quality, energy, soreness, and motivation use direct 1–10 inputs.
- Backward migration from legacy 1–5 readiness values.
- Strength-location and Engine-mode selectors restored inside unified mission rows.
- Premium visual system extended across Training, Plan, History, Habits, Settings, workout modal, and First Flight onboarding.
- Existing planning, Core, timers, progression, substitutions, history, and dashboard systems preserved.


## 8.7.0 Female Physique refinement
- Dedicated female physique programming for Body Recomposition and Bodybuilding goals.
- New emphasis choices: Glute Development, Lower Body / Wellness, and Athletic Shape.
- Three weekly glute exposures when glute-priority profiles are selected.
- Exercise roles balance lengthened glute work, shortened-position work, abduction, hamstrings, quads, and upper-body silhouette development.
- Readiness-aware set scaling protects recovery without deleting the primary movement patterns.
- Existing general, male, hybrid, tactical, strength, and endurance programming remains unchanged.


## 8.7.0 discipline-specific coaching pathways

Bell Performance now distinguishes General Fitness, Body Recomposition, Muscle Building, Strength, and Hybrid Performance at the coaching-engine level. Each pathway has its own training promise, weekly intent, progression method, recovery/readiness response, exercise-rotation cadence, missed-session rule, and discipline-specific Coach Briefing language. Existing event, tactical, endurance, female-physique, equipment, readiness, and workout-history systems remain available.

## 8.7.0 expert event coaching
Event missions now resolve through seven dedicated coaching families: running events, multisport endurance, functional competitions, strength competitions, tactical/occupational events, obstacle/loaded endurance, and physique competition. Each family defines its own weekly structure, phase progression, simulations, taper window, readiness response, missed-session policy, and event-day guidance.


## 8.7.0 First Flight flow refinement

## 8.7.0 weekly calendar artwork refinement
- The premium weekly calendar now uses mini image cards that visually match the Today's Mission styling instead of single-letter codes.
- Two-a-day dates render up to two stacked mini session cards so both Strength and Engine remain visible in the weekly view.
- Rest days now render as a dedicated recovery tile instead of a plain letter badge.

- Athlete identity no longer competes with the mission during the opening profile step.
- The mission is selected first and remains the primary programming driver.
- Training background is collected afterward as a supporting preference for coaching language, exercise complexity, and familiar methods.
- The review screen explicitly separates athlete profile, mission, and training background.

## 8.7.0 dashboard visual refinement
- Updated the premium dashboard styling to match the preferred high-fidelity mockup while preserving all recent dashboard logic and controls.
- Weekly schedule now uses compact Strength / Engine icon buttons instead of letter tiles or artwork cards, and two-a-day dates still show both sessions.
- Muted the palette by replacing bright blues with a more cohesive gold / green / graphite system.
- Preserved the shield logo and aligned the header, mission cards, readiness panel, support card, and progress sections to the refined visual system.

## 8.7.0 premium polish pass
- Applied a second visual polish pass to the premium dashboard controls and Strength / Engine icon treatments.
- Refined the workout experience with a more premium workout hero, control cards, and exercise card styling.
- Updated First Flight onboarding to better match the premium dashboard through improved card treatments, step visuals, and mission-selection panels.

## 8.7.0 full-app visual unification
- Extended the premium dark / gold / green design system across the bottom navigation, Weekly Plan, Training Library, History, Performance Review, Settings, Exercise Library, and Habits screens.
- Added clearer status hierarchy for planned, completed, rescheduled, skipped, and replaced training sessions.
- Preserved all existing programming, storage, navigation, logging, mission, and onboarding behavior.

## 8.7.0 readiness check-in refinement
- Replaced number-entry readiness fields with fast native sliders.
- Sleep duration uses one slider in 15-minute increments.
- Sleep quality, energy, recovery status, motivation, and available time use consistent 1–5 scales.
- Every 1–5 input now runs in the same direction: 1 is worst and 5 is best.
- Replaced the inverted soreness input with a direct muscle-and-joint recovery score, where 5 means fresh and pain-free.
- Existing readiness history is migrated into the new model.

## 8.7.0 guided tour and artwork refinement
- Reworked the guided tour to match the premium app aesthetic and current dashboard architecture.
- Updated the tour content so it explains the new readiness sliders, unified mission module, weekly icon calendar, and current navigation model.
- Refined artwork usage across the app by curating cleaner Strength and Engine image rotations and adding deterministic fallback artwork for dashboard and workout imagery.

## 8.7.0 true artwork curation pass
- Added a dedicated artwork-categorization layer so visuals now match the athlete's actual training path instead of rotating from generic pools.
- Strength visuals now differentiate powerlifting / strength, hybrid athletic, tactical, functional, male physique, female physique, and endurance-support contexts.
- Engine visuals now differentiate recovery, aerobic base, speed-oriented endurance, long-endurance, trail / loaded endurance, multisport, and mixed-modal conditioning.
- Event missions now inherit more intentional visual identities using the event-family architecture.
- Premium quote-card background now follows the curated Engine artwork theme, and dashboard / workout surfaces retain deterministic fallback imagery.

## 8.7.0 premium guided tour redesign
- Rebuilt the guided tour to align with the approved premium artwork direction and the current full-app design system.
- Expanded the tour so it now walks through Home, Readiness, Today's Mission, Weekly Schedule, Training Library, Workout logging, Weekly Plan, History, and More/Settings.
- Added custom in-repo artwork assets generated for Bell Performance and used them in both the tour and the broader artwork curation system.
- Refined artwork curation by folding the new custom premium images into strength, hybrid, tactical, endurance, and mixed-modal visual pools.

## 8.7.0 commercial design system
- Added screen-specific hero identities for Training, Weekly Plan, Performance Review, More, and Exercise Library.
- Added a reusable Bell commercial design system covering typography, graphite/brass surfaces, motion, card hierarchy, and interaction states.
- Rebuilt First Flight into a cinematic split-layout onboarding experience with artwork and messaging that changes by onboarding step.
- Preserved all training, readiness, planning, storage, workout, and progression logic.


## 8.9.0 Adaptive Training Engine
- Enforces Wednesday and Sunday recovery days for five-day schedules.
- Enforces Tuesday, Thursday, and Sunday recovery days for four-day schedules.
- Uses seven-day readiness trends, post-session feedback, completion rate, RPE, and fatigue-related misses to choose BUILD, HOLD, RECOVER, or REBUILD status.
- Scales strength volume, calculated working loads, and Engine duration automatically.
- Converts quality Engine sessions to recovery work when fatigue signals require it.
- Stores the adaptive decision with each completed session for future coaching review.


## 8.9.1 Week Completion Flow

- Future ungenerated calendar weeks now show a clear locked-state message instead of appearing to be empty rest weeks.
- The dashboard identifies the active training cycle, current block week, and current phase.
- When all prescribed sessions are completed or resolved, the dashboard displays a prominent prompt to close the week and generate the next adaptive week.
- The final week displays a block-complete review prompt rather than attempting to generate a nonexistent week.


## 8.9.2 Engine Tile Artwork

Replaced the dashboard Engine modality tile with a premium close-up air-bike image composed and graded to match the Strength tile. The tile retains native Bell typography and controls, uses a right-weighted crop for clear text space, and is cached for offline use.


## 8.9.6 Dashboard Refinement

- Replaced the dashboard Engine air-bike artwork with a trail-running hero.
- Matched Strength and Engine card borders, overlays, contrast, and interaction treatment.
- Reduced saturation and increased text-safe shadowing so the imagery feels integrated rather than generated or pasted on.


## 8.9.6 Dashboard Artwork Correction
Replaced the visibly synthetic Today’s Mission and Weekly Schedule backgrounds. Today’s Mission now uses a clean close-up plate-and-bar composition; Weekly Schedule uses a restrained, equipment-focused training-space image. Both cards use stronger integrated overlays and right-weighted crops so live UI remains readable without distorted athletes or disconnected objects.


## 8.9.6 Dashboard Cycle Status
- Replaced the Engine schedule glyph with a connected running-shoe icon.
- Added an always-visible Current Training Cycle panel to the premium dashboard.
- Added block progress, current phase, week progress, completed-workout indicators, and the correct next action.
- The panel shows Complete Week & Build Next only when all required sessions are resolved.


## 8.9.6 Schedule Anchor Correction
- Five-day schedules now enforce Wednesday and Sunday as recovery anchors.
- Four-day schedules now enforce Tuesday, Thursday, and Sunday as recovery anchors.
- Existing uncompleted weeks generated with Friday as a rest day are migrated automatically without deleting completed sessions.
- New weeks continue to use the corrected schedule protocol.

## 8.9.8 Exercise Intelligence Library

- Rebuilt exercise entries as practical teaching guides rather than generic descriptions.
- Added movement purpose, detailed setup, step-by-step execution, coaching cues, common mistakes, breathing and bracing, regressions, progressions, substitution guidance, and stop/modify guidance.
- Added exercise-specific teaching templates for squat, hinge, presses, pulls, single-leg work, arms, running, conditioning machines, jumps, core, carries, calves, and shoulder isolation.
- Added media-ready fields for thumbnails, looping animations, and full coaching videos.
- Added a movement-demonstration placeholder in every exercise detail page so future media can be added without rebuilding the interface or data model.


## 8.9.9 Mission editor reliability

- Edit Mission / Event now uses a direct button handler and always opens First Flight at the Mission step.
- The editor is made visible before saved mission data is hydrated, preventing malformed legacy values from making the control appear unresponsive.
- Reopening an already active First Flight modal now honors the requested step instead of returning early.
- Added guarded field hydration and console diagnostics while keeping the editor usable.


## 8.9.10 Mobile First Flight controls
- First Flight now uses the mobile dynamic viewport height.
- The artwork panel is hidden on narrow phones so the form and navigation controls fit reliably.
- The Continue and Back controls remain in a dedicated footer while the form body scrolls independently.
- Safe-area padding supports mobile Chrome and installed PWAs.


## 8.9.11 Mission Builder reliability
- Rebuilt First Flight mission selection as a state-driven three-path controller.
- Specific Event, Performance, and Body Composition now each reveal the correct goal-entry panel.
- Performance and Body Composition use their own filtered goal lists.
- Added delegated mobile-safe click/change handling and saved-profile migration.
- Updated the service-worker cache to prevent stale mission logic from being served.


## 8.9.12 Two-path coaching model

First Flight now presents exactly two mission choices: Specific Event or Performance / Body Composition. The second path asks the athlete to select one primary discipline from the combined performance and body-composition disciplines, with an optional secondary dated goal when useful. Existing saved performance or body-composition missions migrate into the combined path.


## 8.9.14 Mission path expansion
- First Flight initially displays exactly two mission choices: Train for an Event and Performance / Body Composition.
- Selecting a choice hides the other choice and expands only the selected mission path.
- Change Mission Type returns to the original two-choice screen without deleting saved mission fields.
- Existing event and development mission data hydrates the correct selected path in Edit Mission / Event.
- Service-worker cache version advanced to 8.9.14.

## 8.9.14 Mission selection hotfix
Mission-path selection now directly initializes and reveals the appropriate question panel, with native and CSS visibility state kept in sync.
