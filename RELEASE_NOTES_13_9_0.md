# Bell Performance 13.9.0 — Longitudinal Coaching Engine Repair

## Purpose

13.9.0 repairs the long-horizon programming issues exposed by the 12-month athlete simulations. It keeps the 13.8.5 athlete experience and replaces the competing week-generation paths with one formal week model.

## Formal week architecture

- Every active or scheduled block now contains one formal record for every week in the block.
- Each week stores its date range, phase, objective, status, prescription, and schema version.
- The current dashboard plan and the current formal week remain synchronized.
- Completed sessions are preserved when a future week is regenerated.
- Plan previews and calendar phases now use the same discipline-aware phase model.

## Event preparation

### Powerlifting

- Competition squat, bench press, and deadlift carry durable canonical roles.
- Athlete-facing labels change through volume, strength, specificity, singles, opener practice, and meet-week primer phases.
- The simulator no longer relies on exact display-title matching to identify competition lifts.

### Running events

- Four-day running athletes retain an easy run, quality session, long run or rehearsal, and strength support rather than losing key sessions during availability trimming.
- Quality prescriptions progress from running economy and hills to threshold, goal-pace work, race rehearsal, and sharpening.
- Long-run prescriptions progress by event type and phase while respecting the athlete's session-time ceiling.

### Female Physique

- Resistance sessions rotate through balanced symmetry, delts and arms, and back and glute emphases.
- Contest cardio progresses gradually and reduces during taper and event week.
- Posing practice remains excluded from prescribed workouts.

## Post-event recovery

- Powerlifting post-meet recovery removes competition-volume and heavy-exposure prescriptions.
- Physique post-show recovery uses low-fatigue full-body restore sessions and easy movement.
- Running post-race recovery removes threshold, interval, rehearsal, and long-run stress before gradual re-entry.
- The app records the recently completed event family when an event block is archived so a subsequent maintenance or recovery block can use the correct transition.

## Development progression

- Powerlifting development labels distinguish weak-point hypertrophy, base volume, strength build, intensification, and technique deloads.
- Beginner foundation blocks use three dedicated, lower-complexity full-body sessions.
- All formal sessions include longitudinal phase and objective metadata for future analytics and coaching explanations.

## Included testing

The `automation` folder contains the updated 12-month journey simulator and athlete configurations for:

- Powerlifting meet preparation
- Female physique competition preparation
- 10K to half-marathon development
- Beginner body recomposition

The updated assertions use canonical exercise and endurance roles, test discipline-specific recovery, and audit prescription variation.
