# Bell Performance 13.17.4

## Atomic Session Identity & Workout Title Integrity

The concurrent-session repair correctly separated weekly sessions, but exposed an athlete-facing title bug. A cleanup expression treated the first capital letter of `Press` as a one-letter strength-block marker, converting `Strength Press` to `ress`.

### Repair

- Restricts one-letter block-marker removal to cases where the marker is followed by a title delimiter or the end of the label.
- Preserves complete workout words including Press, Pull, Bench, Back, Squat, and Deadlift.
- Adds malformed-title detection and fallback to the canonical template label, mission label, or original identity.
- Keeps concurrent Engine counting and placement behavior from 13.17.3 unchanged.

### Athlete-facing result

Weekly plan cards no longer display fragments such as `ress`, `ngth`, or `ine`. Existing valid concise workout titles remain unchanged.
