# Bell Performance 7.0.1 Validation

## First Flight sequence
- Athlete profile is the first required step.
- Profile captures name, age, programming profile, athlete type, bodyweight, height, and optional target bodyweight.
- Profile values are saved before the guided tour begins.
- Guided tour opens on the live main dashboard.
- Finishing or closing the initial guided tour resumes First Flight at the Workout Location Editor.
- First Flight remains incomplete until locations, coaching voice, and final review are completed.

## Guided tour coverage
- Main dashboard orientation.
- Daily Readiness and the exact Mission Status / Update Check-In area.
- Daily Mobility prescription, focus, duration, movement checklist, and completion action.
- Dual Mission Goal Builder.
- Training entry points and library.
- Workout Location behavior and substitutions.
- Exercise logging, progression feedback, and training debrief.

## Automated checks
- `node --check` passed for every JavaScript file, workout data file, and service worker.
- HTML parsed successfully.
- No duplicate HTML IDs were found.
- All local scripts, stylesheets, images, and manifest references exist.
- Required tour targets and new athlete-profile fields are present.
- Service-worker cache and asset query versions were advanced to 7.0.1 / 701.
