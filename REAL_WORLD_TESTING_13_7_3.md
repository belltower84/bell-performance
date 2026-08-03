# Real-World Testing — Bell Performance 13.7.3

## Guided-tour test

Use a fresh browser profile or clear Bell Performance site data before testing the first-run sequence.

Confirm this order:

1. Complete First Flight.
2. Complete the normal 10-second Daily Check-In.
3. The guided tour opens on the Dashboard.
4. Advance through all eight steps.
5. Confirm each spotlight surrounds the interface being described.
6. Confirm the Workouts step changes screens correctly.
7. Confirm the navigation step shows the full navigation control without covering it.
8. Select **Go to Dashboard**.
9. Refresh the app and confirm First Flight and the tour do not restart.

## Replay test

From **Settings → Help**, replay the tour from Home and from another screen. Confirm the tour finishes on the screen where the replay started.

## Report format

```text
Build: 13.7.3
Device and browser:
Tour step:
Action:
Expected:
Actual:
Severity: Critical / Major / Minor / Enhancement
Screenshot:
```

Report any clipped panel, hidden target, wrong spotlight, unreadable copy, blocked button, incorrect screen change, or return to First Flight.
