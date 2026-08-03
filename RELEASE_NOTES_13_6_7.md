# Bell Performance 13.6.7 — Training Library Visual Match

## Why this release was needed
The first 13.6.6 implementation used the new content structure but rendered the exercise guide inside a constrained modal. That made the hero artwork, instructional copy, and lower guide cards feel cramped and did not match the approved Training Library mockup.

## Changes
- Rebuilt exercise guides as a dedicated full-width app screen instead of a narrow modal.
- Added a clear **Back to Library** action rather than a floating close control.
- Matched the approved desktop composition:
  - large exercise title and tags
  - central search and category controls
  - favorite and similar-lift actions
  - wide instructional hero panel
  - right-side information column
  - three full-width coaching cards below the artwork
- Added the approved Back Squat instructional artwork plate with Bell coaching callouts.
- Increased the Training Library and exercise guide maximum width to better use desktop space.
- Added responsive tablet and mobile layouts that stack content instead of squeezing text into narrow columns.
- Preserved favorites, similar lifts, substitutions, and exercise-swap guide access.
- Updated service-worker cache and app version strings.

## Result
The Back Squat guide now follows the actual approved mockup direction instead of merely using the same content categories.
