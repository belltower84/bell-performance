# Bell Performance 13.16.7

## Taper Window Fidelity & Pending Application Revalidation

13.16.7 closes the final gap exposed by the 13.16.6 browser journeys.

### Production changes

- Protected taper windows are resolved from the target session's production phase metadata rather than an exposure-position approximation.
- `progress` and `accelerate` applications are revalidated immediately before they are returned or applied.
- Upward applications are blocked in taper, peak week, race week, event week, competition week, meet week, and late-specific protected phases.
- Blocked applications retain an audit state and `TAPER_PROTECTION` reason.
- Protective and neutral applications such as `hold`, `rebuild`, `regress`, `protect`, and `safety_hold` remain eligible during taper.
- The scheduler skips protected targets when an upward application is still awaiting a comparable exposure.
- Workout rendering now passes event and longitudinal phase metadata into the prescription-application layer.

### Journey validation changes

- Taper assertions inspect only sessions actually marked as protected by production phase metadata.
- Pre-taper progression remains valid and is no longer included in the taper-failure window.
- The suite verifies that a stale queued upward application does not modify a protected taper prescription.

### Direct validation

`automation/test-taper-application-revalidation-13167.js` verifies eight cases covering build-phase progression, taper blocking, race-week blocking, protective holds, queued application removal, pre-taper availability, protected-target scheduling, and phase aliases.
