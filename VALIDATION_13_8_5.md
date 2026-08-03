# Bell Performance 13.8.5 Validation

## Static validation

- Checked all 53 JavaScript files plus `sw.js` with `node --check`.
- Confirmed every local script, stylesheet, image, and source reference in `index.html` resolves inside the package.
- Confirmed every local asset listed in the service-worker core cache resolves inside the package.
- Confirmed the 13.8.5 stylesheet and JavaScript modules are included in both `index.html` and `sw.js`.

## Daily mission tests

Synthetic combined-day testing used a 60-minute Daily Readiness budget with Strength and required Engine work.

Expected and observed allocation:

- Strength: 45 minutes
- Engine: 15 minutes
- Required total: 60 minutes
- Core: 8 minutes, optional and outside the required budget
- Mobility: 10 minutes, optional and outside the required budget

The Engine description removed the conflicting template phrase `42 min` while preserving the coaching intent.

Synthetic Recovery Day testing confirmed:

- Mobility is listed first.
- Mobility displays `Recovery Focus · Optional`.
- Core displays `Recovery Core`, not the duplicated `Recovery Core + Mobility` label.
- Neither support session blocks required mission completion.

## Train and workout-flow tests

Desktop and 390 × 844 mobile Chromium rendering checks confirmed:

- The Train page contains no legacy workout-catalog tiles.
- Today’s prescribed sessions and an active workout are surfaced without the full catalog.
- Mission editing opens First Flight Check 02.
- Strength and Engine previews use concise athlete-facing titles.
- Engine launches with the dashboard’s allocated duration.
- The workout briefing does not advertise a cooldown unless one exists in the template.
- The active workout uses the streamlined Bell Performance layout.
- The current-focus display advances to the first exercise when training begins.
- No horizontal overflow was detected on the tested mobile dashboard, Train page, workout briefing, or active workout screen.

## Runtime note

Browser tests used a routed synthetic Bell origin and seeded athlete data in the container. Browser storage restrictions produced expected test-environment storage warnings; no unrelated runtime errors were observed. A final hands-on pass with an existing saved athlete profile on the user’s phone and desktop is still required before wider tester distribution.
