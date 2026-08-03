# Bell Performance 13.16.3

## Journey Channel Fidelity & Application Persistence Repair

This release repairs the two defects exposed by the first successful full-stack athlete journey replay.

### Production repairs

- Preserves longitudinal adaptive state across save and reload.
- Preserves closed-loop prescription applications, their IDs, targets, states, channels, and audit metadata.
- Preserves the most recent closed-loop application record.
- Calculates compliance with the just-completed real session included, preventing a valid first exposure from being misread as low compliance before the UI marks the plan item complete.
- Keeps the existing safety, pain, interruption, progression, deload, and cumulative-dose rules unchanged.

### Full-stack journey repairs

- Selects sessions according to each journey's required channel mix instead of taking the first two sessions in plan order.
- Requires strength journeys to process strength sessions.
- Requires endurance journeys to process engine sessions.
- Requires hybrid journeys to process both channels.
- Reports mission, label, resolved channel, exercise count, and engine-field presence for discovered sessions.
- Verifies application IDs and target metadata survive the mid-journey browser reload.
- Verifies final application IDs remain unique.
- Uses the correct taper invariant: protected late phases must prevent progress and accelerate, but do not require an artificial hold decision.

No database migration is required.
