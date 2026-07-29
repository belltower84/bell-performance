# Bell Performance 13.6.4 Validation

## Passed
- JavaScript syntax validation passed for all **46** files in `js/`, `data/`, and `sw.js`.
- All **51** local HTML script, stylesheet, image, and manifest references resolve correctly.
- All **63** service-worker cache entries resolve correctly.
- All **481** static HTML IDs remain unique.
- App title, runtime version, manifest name, cache key, stylesheet reference, and equipment-script cache reference are aligned to 13.6.4.
- In-browser Training Setup validation completed with **31 of 31 checks passing**.
- Settings dropdowns use light text on a dark background and request the browser's dark native control scheme.
- Opened dropdown options use a readable dark palette, including the selected-option state.
- Training locations render as a compact table with environment, equipment summary, active status, Use, and Edit controls.
- Equipment checkboxes are hidden until Edit or Add Location opens the focused editor.
- The editor renders all **25** equipment choices and updates the selected-equipment count immediately.
- Add Location creates a clearly labeled unsaved draft; Cancel removes it and Save persists it.
- An unsaved location cannot become active before it is saved.
- Use maintains exactly one active training location.
- Saved locations can be edited and deleted without leaving stale rows or active-state badges.
- Desktop and 390-pixel mobile layouts have no horizontal overflow.
- The mobile equipment editor collapses to one column.
- No JavaScript runtime errors occurred during the interaction test.

## Browser test method
The managed Chromium environment blocks normal local-site navigation. The complete application HTML, CSS, and JavaScript were therefore assembled into an in-memory browser document and exercised with the actual application functions and event handlers. Test-only storage, alert, confirmation, service-worker, and onboarding-overlay stubs were used solely to make the isolated browser harness deterministic; they are not included in the release build.

## Packaging
- Service-worker cache entries include the new 13.6.4 stylesheet and equipment script.
- ZIP integrity and packaged-path checks are performed after the release archive is created.
