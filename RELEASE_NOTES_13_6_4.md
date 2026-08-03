# Bell Performance 13.6.4 — Training Setup Refinement

## Dropdown visibility
- Applied a dark color scheme to Settings dropdowns and their option lists.
- Added explicit foreground and background colors so session length, preferred time, schedule consistency, environment, and other Settings selections remain readable when opened.

## Training locations
- Replaced the permanently expanded equipment checkbox wall with a compact table of saved training locations.
- Each row now shows the location name, active status, environment, equipment count, and a short equipment summary.
- Added a **Use** action for changing the active training location without entering the editor.
- Added a focused **Edit** action for each saved location.

## Equipment editor
- Equipment checkboxes remain hidden until the athlete selects **Edit** or **Add Location**.
- The editor includes location name, environment presets, live selected-equipment count, Select All, Clear, Save, Cancel, and Delete controls.
- Adding a location now opens a clean editor with the minimal-equipment preset instead of requiring a separate prompt.

## Responsive behavior
- The location table converts to stacked rows on smaller screens.
- The equipment selector changes from three columns on desktop to two columns on tablets and one column on phones.
- Corrected hidden weekday checkbox positioning so the Training Setup page no longer creates horizontal overflow on narrow screens.

## Compatibility
- Existing locations, active-location selection, environment values, equipment selections, exercise substitutions, onboarding equipment, and workout history remain compatible.
- No backend or database migration is required.
