# Bell Performance 13.22.7 — GitHub Pages Refresh Repair

## Corrections
- Updated the static Bell Diagnostics card so it no longer falls back to 13.22.3.
- Updated the web app manifest to the current build.
- Added a public `version.json` deployment check.
- Added `.nojekyll` for direct static GitHub Pages publishing.
- Registered the service worker with a versioned URL and `updateViaCache: "none"`.
- Requests an immediate service-worker update after registration.
- Added a final build-identity guard loaded after all feature scripts.
- Retained the 13.22.6 Coach’s Dashboard feature.
