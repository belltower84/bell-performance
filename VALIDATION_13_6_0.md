# Bell Performance 13.6.0 Validation

## Passed
- JavaScript syntax validation passed for every file in `js/`, `data/`, and `sw.js`.
- All script and stylesheet paths referenced by `index.html` resolve to files in the build.
- The 13.6.0 service worker cache key and cache-busting references were updated for every modified module.
- Dashboard template IDs are unique and all referenced readiness/dashboard elements exist.
- Readiness scaling is neutral in Workout Planner mode, including daily set/load scaling, event readiness scaling, pathway readiness scaling, time-availability shortening, optional-core recovery substitution, adaptive deload checks, and Bell Core readiness decisions.
- Existing profiles migrate to Bell Coach mode unless the athlete explicitly selects Workout Planner.

## Environment limitation
A Chromium screenshot smoke test could not complete in the container because the headless browser process did not exit normally. The build passed static, syntax, reference, and package-integrity checks, but should still receive the normal post-deployment browser smoke test on desktop and mobile.
