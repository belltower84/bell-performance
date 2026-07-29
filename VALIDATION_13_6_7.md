# Validation — Bell Performance 13.6.7

## Automated checks completed
- `js/exercise-library.js` passed `node --check`.
- `index.html` contains no duplicate IDs.
- Required Training Library and exercise guide DOM targets are present.
- Every local script, stylesheet, image, and manifest reference in `index.html` resolves to an existing file.
- The new Back Squat instructional plate is included in the service-worker cache.
- App, CSS, JavaScript, and service-worker asset version strings were updated to 13.6.7.

## Browser validation note
The managed Chromium build in the container blocks local and file URL navigation by administrator policy, so a live screenshot could not be produced in this environment. The deployed build should still receive a normal desktop and mobile smoke test in Chrome.

## Manual smoke-test path
1. Open Training → Exercise Library.
2. Open Back Squat.
3. Confirm it opens as a full app page, not a modal.
4. Confirm the wide Bell instructional squat artwork is visible.
5. Confirm the right information column and three lower coaching cards are readable.
6. Test Save to Favorites and View Similar Lifts.
7. Use Back to Library.
8. Test the page at desktop and mobile widths.
