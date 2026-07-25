# Bell Performance 8.7.0 Validation

- JavaScript syntax checked with Node.
- HTML IDs checked for duplicates.
- Local script and asset references checked.
- Readiness migration and scoring reviewed for legacy and new values.
- Mission-row selectors verified against equipment and cardio settings.
- ZIP integrity checked.


8.7.0 checks:
- Female physique templates tested across all four rotation weeks.
- Glute-priority profiles include multiple weekly exposures and all three glute stimulus roles.
- Yellow and Red readiness states reduce accessory volume and suppress advanced finishers.


## 8.7.0 pathway validation

- Confirmed all five core pathways resolve from mission and goal metadata.
- Confirmed generated plan entries receive coaching intent, progression method, rotation cadence, and missed-session guidance.
- Confirmed readiness states apply pathway-specific volume and intensity adjustments.
- Confirmed the Coach Briefing reports the active pathway and current block role.
- Confirmed the service worker caches the new coaching-pathways module.

## 8.7.0 event-coaching validation
- Seven event-family definitions and complete event-type coverage.
- Event-specific seven-day plan generation.
- Family-specific phase, taper, simulation, readiness, missed-session, and event-day metadata.
- Existing performance/development pathways remain unchanged outside event missions.

- First Flight mission-first flow and supporting training-background context verified.

## 8.7.0 weekly calendar validation
- Premium weekly calendar renders image-based mini session tiles for strength, engine, and rest days.
- Two-session days display both sessions in the weekly view.
- Weekly calendar buttons still navigate to the selected date and preserve completed-state styling.

## 8.7.0 dashboard visual validation
- Premium dashboard renders with the refined dark / gold / green visual system.
- Weekly schedule shows icon-button session markers and still supports two-session days and date navigation.
- Home dashboard logic, quick selectors, readiness controls, and mission completion behavior remain operational.

## 8.7.0 premium polish validation
- Premium dashboard icons, buttons, and controls render with the updated refined styling.
- Workout modal and exercise cards retain existing behavior while using the upgraded visual treatment.
- First Flight onboarding retains the same flow and controls with the upgraded premium appearance.

## 8.7.0 visual-unification validation
- Secondary screens retain their existing DOM IDs, handlers, and data flows.
- Weekly Plan status classes and controls remain operational.
- Bottom navigation retains the existing screen targets.
- Training Library, History, Settings, Exercise Library, and Habits functionality remains unchanged beneath the unified visual treatment.

## 8.7.0 readiness slider validation
- Slider IDs and live value outputs verified.
- Sleep slider converts total minutes into stored hours and minutes.
- Readiness scoring consumes direct 1–5 values and a positive-direction recovery status.
- Legacy 1–10 readiness values and inverted soreness values migrate to the new 1–5 model.

## 8.7.0 guided tour and artwork validation
- Guided tour still opens, advances, closes, and resumes First Flight correctly.
- Tour targets align with the premium dashboard and current navigation controls.
- Dashboard and workout artwork use curated selections with fallback imagery to avoid broken visual states.

## 8.7.0 artwork curation validation
- Curated artwork selection resolves without errors for dashboard, mission, workout, and quote-card surfaces.
- Event-specific missions map to deliberate visual profiles rather than the default generic rotation.
- Fallback imagery remains in place if any specific asset fails to load.

## 8.7.0 premium guided tour validation
- Guided tour opens, advances, closes, and resumes First Flight with the updated slide set.
- Tour slide targets correctly highlight the current Home, Training, Plan, History, and More surfaces.
- Custom generated artwork assets are packaged in the repo and resolve through the updated curation logic.

## 8.7.0 commercial design validation
- Major screen heroes render and animate without changing screen navigation behavior.
- First Flight artwork and messaging update with each onboarding step.
- Reduced-motion preferences are respected.
- Existing application logic and stored data structures remain unchanged.


## 8.9.1 checks

- Verified future-week dashboard state does not display false rest days.
- Verified current block type, week number, and phase display on the dashboard.
- Verified week-complete prompt appears only after prescribed sessions are completed or explicitly resolved.
- Verified next-week generation continues through the existing adaptive block advancement path.


## 8.9.2 checks
- Confirmed the Engine modality tile uses `custom-airbike.jpg`.
- Confirmed the image contains no baked-in Bell UI text or controls.
- Confirmed the tile uses a right-weighted object position and existing overlay for readability.
- Confirmed the new asset and updated polish stylesheet are included in the service-worker cache.


## 8.9.6 checks

- Engine modality tile uses `custom-ridge-runner.jpg`.
- Air-bike asset is no longer referenced by dashboard CSS or service worker.
- Version and cache identifiers updated to 8.9.6.


## 8.9.6 checks
- Confirmed Today’s Mission no longer references custom-sled-push artwork.
- Confirmed Weekly Schedule no longer references hill-country artwork.
- Confirmed replacement artwork exists and is included in the service-worker cache.
- Version and cache identifiers updated to 8.9.6.


## 8.9.6 checks
- Verified the running-shoe SVG renders in weekly schedule chips and legends.
- Verified the cycle panel handles no block, active week, week complete, and final-block states.
- Version and cache identifiers updated to 8.9.6.


## 8.9.6 checks
- Verified five-day rest anchors are Wednesday and Sunday.
- Verified four-day rest anchors are Tuesday, Thursday, and Sunday.
- Added migration logic for previously generated uncompleted weeks with incorrect rest placement.
- Version and cache identifiers updated to 8.9.6.
