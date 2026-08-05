# Bell Performance 13.21.6 Validation

## Focused workout UX checks

- Guide and Replace controls render with inline SVG icons rather than unsupported text glyphs.
- Both action labels remain visible on desktop; compact icon-only controls remain accessible on mobile.
- Superset exercise cards render in a stacked, full-width layout.
- All set controls remain inside the visible exercise card at desktop and mobile widths.
- Workout-level equipment changes render as a compact expandable summary.
- Exercise-level equipment changes render once as a concise swap notice.
- Generated substitution prefixes are removed from coaching cues.
- Generic “Superset with…” cue text is suppressed when the explicit superset explanation is already displayed.

## Regression checks

- 9/9 explicit superset identity checks passed.
- 8/8 readiness transparency checks passed.
- 73 JavaScript files passed syntax validation.
- Service-worker syntax passed.
- 177 local HTML and service-worker references resolved.
- Manifest JSON passed validation.
- Desktop and mobile browser fixtures passed without visible set-control clipping.
