# Real-World Testing — Bell Performance 13.7.2

## Before each test

Use a clean Chrome profile or clear Bell Performance site data and unregister the service worker. Each tester should create a brand-new athlete rather than importing an existing profile.

## Owner acceptance test

Run this first:

- Complete First Flight with your real information.
- Confirm every Continue action starts the next page at the top.
- Confirm the Journey choices match your intended training path.
- Save the first readiness check-in.
- Complete the guided tour.
- Confirm the tour ends on Home and First Flight does not return.
- Confirm the dashboard greeting uses your name.
- Confirm Today’s Training, Bell Coach direction, phase, and event all describe the same mission.
- Start, exit, resume, and complete the first workout.
- Refresh the app and confirm completion remains saved.

## Initial tester profiles

Use 3–5 testers with different pathways:

1. Continuous Development — Body Recomposition
2. Bodybuilding — Physique Competition
3. Powerlifting — Powerlifting Meet
4. Endurance Athlete — 5K or 10K Race
5. General athlete — limited equipment

## What to record

For every issue, record:

```text
Build: 13.7.2
Athlete pathway:
Device and browser:
Screen:
Action taken:
Expected result:
Actual result:
Severity: Critical / Major / Minor / Enhancement
Screenshot or screen recording:
```

## Stop-testing conditions

Pause that pathway and report immediately when:

- onboarding cannot continue;
- First Flight unexpectedly reopens;
- the workout and Bell Coach describe different disciplines;
- a completed or skipped session changes incorrectly after refresh;
- a prescribed day exceeds the athlete’s stated time without explaining a split session;
- the app generates an inappropriate event family or workout type;
- a button traps the tester or prevents returning to Home.

## Next simulated-cycle scenarios

After the opening flow is stable, test:

- complete all work normally;
- complete strength but skip engine;
- leave a workout unfinished and resume it;
- miss one day and two consecutive days;
- submit Green, Yellow, and Red readiness;
- change equipment and availability;
- change the mission mid-block;
- reset the current block;
- complete a week, progression week, deload, and final block review.
