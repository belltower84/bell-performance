# Bell Performance 13.9.0 Validation

## Static validation

- All JavaScript files pass `node --check`.
- The 12-month Python simulator passes Python compilation.
- `index.html` loads the longitudinal engine after the prior mission, scheduling, and dashboard layers.
- The service worker includes the new engine file and uses a new cache name.
- All local `src` and `href` references resolve inside the package, excluding intentional external or fragment links.

## Behavioral targets

1. A 12-week block contains 12 formal week records.
2. A powerlifting meet phase exposes canonical squat, bench, and deadlift roles.
3. A four-day running event plan retains quality work and a long run or rehearsal.
4. Post-meet recovery contains no competition-volume or heavy meet-prep sessions.
5. Post-race recovery contains no threshold, quality, race-rehearsal, or long-run prescriptions.
6. Post-show recovery uses low-fatigue restore sessions.
7. Beginner foundation training uses dedicated beginner sessions.
8. Existing dashboard time budgeting, optional Core, optional Mobility, and independent daily-session completion remain intact.

## Environment limitation

The complete Playwright journey simulation cannot run in the build container because local HTTP navigation is blocked by administrator policy. The updated simulator is packaged for execution on the user's Windows computer.
