# Bell Performance 8.7.1 Validation

## Changes verified
- First Flight page 1 visibly requires first name, age, bodyweight, and height.
- Programming profile remains available on page 1.
- Secondary goals render as visible selectable cards based on the chosen primary training identity.
- Changing the primary identity immediately rebuilds the relevant secondary-goal choices.
- Date-driven secondary goals reveal the optional target-date field.
- First Flight readiness uses the same six sliders and labeling direction as the daily readiness check-in.
- The initial readiness values are committed during onboarding, preventing a redundant immediate check-in prompt after launch.
- Existing saved primary and secondary mission values are hydrated when editing First Flight.

## Static checks
- All JavaScript files pass `node --check`.
- No duplicate HTML IDs detected.
- Mobile CSS stacks profile fields, secondary-goal cards, and coach preferences into one column.
- Service-worker cache and asset query versions updated to 8.7.1 / 8710.
- ZIP integrity validated after packaging.

## Note
A complete automated Chromium interaction run was not available in the build container. The release was validated through static DOM inspection, JavaScript syntax checks, duplicate-ID checks, and package integrity testing.
