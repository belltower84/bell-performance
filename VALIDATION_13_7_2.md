# Validation — Bell Performance 13.7.2

## Automated mobile fresh-profile flow

A clean isolated Chromium profile was run at a 390 × 844 mobile viewport through:

1. First Flight page 1
2. Bell Coach + Bodybuilding identity
3. Event Preparation
4. Bodybuilding / Physique Competition
5. Availability, experience, limitations, and coaching preferences
6. Launch Review
7. Normal 10-second readiness check-in
8. First guided tour
9. Dashboard completion state
10. Reload and persistence check

## Passed

- Correct 13.7.2 title and runtime version.
- Fresh storage opens First Flight at page 1.
- Sex, desired weight, strength baselines, Olympic-lifting metrics, and endurance metrics are present.
- No duplicate DOM IDs after the First Flight rebuild.
- Continue advances correctly and resets the scroll position to the top.
- Flight Check 03 begins with Continuous Development and Event Preparation.
- Bodybuilding Event Preparation exposes the Physique Competition event.
- Faith-Based, Stoic, and Performance message previews update immediately.
- Launch Review shows the selected event and event name.
- First Flight contains no separate readiness questionnaire.
- Completing First Flight opens the normal dashboard readiness modal.
- Readiness saves using the `quick-v1` data model.
- The guided tour begins after readiness and does not reopen First Flight.
- Guided-tour mobile footer buttons fit within the viewport.
- The tour finishes on Home and persists its completion state.
- Dashboard displays the saved athlete name.
- Bodybuilding / Physique Competition resolves to the `physique` coaching family.
- Dashboard and Bell Coach contain no Tactical & Occupational fallback.
- Opening physique plan contains no Usable Strength fallback.
- Physique partial-week session duration remained within the selected 75-minute availability window.
- No posing or presentation-practice workout was generated.
- Reload does not restart onboarding and preserves the physique mission.
- No JavaScript runtime errors or warnings were observed during the simulated flow.

## Event-family mapping check

- Bodybuilding / Physique Competition → `physique`
- Powerlifting Meet → `strength_competition`
- 10K Race → `running`
- Military / Law-Enforcement Fitness Test → `tactical`
- Cycling Time Trial → `cycling`
- HYROX → `functional`

## Static checks

- All JavaScript files and the service worker pass `node --check`.
- Manifest and project JSON files parse successfully.
- Local HTML `src` and `href` references resolve to packaged files.
- Service-worker core asset references resolve to packaged files.
- Backend regression suite: 28 tests passed.
- ZIP archive integrity passes.

## Not yet claimed

This validation does not represent a full multi-week training-cycle test. Missed workouts, progression weeks, deload behavior, mission changes, partial workout completion, and all athlete identities still require the planned simulated-athlete testing phase.
