# Bell Performance 13.14.0 Validation

## Scope

The longitudinal suite tests whether Bell's session-level decisions remain stable and coherent across repeated exposure sequences. It focuses on hysteresis, cooldowns, re-entry, deload spacing, channel independence, phase integrity, and cumulative caps.

## Deterministic trajectories

Eighteen trajectories cover 192 completed exposures:

- steady and rapid responders;
- noisy alternating response;
- persistent underperformance;
- interruption and missed-training re-entry;
- moderate and severe pain recovery;
- accumulated-fatigue deloads;
- taper and post-event recovery protection;
- mixed strength and engine response;
- temporary holds after earned progression;
- 30-exposure cumulative-cap testing;
- event-specificity preservation;
- deload cooldowns;
- pain overriding rapid improvement;
- regression followed by measured recovery.

## Acceptance criteria

- 18/18 Python trajectories pass.
- 18/18 JavaScript trajectories match the locked Python fixture.
- 192/192 exposure decisions maintain JavaScript/Python parity.
- No upward decision occurs during taper, event week, or recovery.
- No immediate upward decision occurs during protective re-entry.
- Repeated regressions do not compound on consecutive exposures.
- Deload episodes respect the six-exposure cooldown.
- Strength and engine histories remain independent.
- Cumulative targets remain inside their hard ceilings.
- Event-specificity preservation is present on every decision.
- Existing athlete-response and event-adversarial suites remain green.

## Interpretation boundary

Passing this suite establishes deterministic stability for Bell's longitudinal progression policy. It does not establish injury diagnosis, clinical safety, or guaranteed outcomes. Prospective real-world calibration and coach review remain necessary.
