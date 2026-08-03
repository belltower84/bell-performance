# Bell Performance 13.16.6 — Positive Decision Promotion & Comparable Exposure Repair

## Purpose

13.16.5 proved that valid strength evidence was no longer mislabeled as low completion and that scheduled workout identity remained distinct across weeks. The remaining failure was narrower: the confidence gate under-counted structured completion evidence, so recognized `REPEATED_SUCCESS` and `RAPID_POSITIVE_RESPONSE` signals were downgraded to `observe`.

## Repairs

- Structured `exercise_results` now count as real strength evidence in the confidence gate.
- `readiness.score`, structured pain maps, actual duration, and structured performance ratio are normalized directly.
- Complete structured strength sessions can reach the upward-confidence threshold without fabricating extra fields.
- Positive decisions retain explicit comparable-exposure diagnostics: comparable key, current streak, required streak, eligibility, and promotion blocker.
- Duplicate identity remains tied to the scheduled occurrence and is separate from progression comparability.
- New direct validation proves first success observes, second comparable success progresses, third rapid success accelerates, later scheduled occurrences remain distinct, and true resubmissions remain duplicates.

## Full-stack acceptance

- 8/8 athlete journeys pass.
- Steady responder earns `progress`.
- Rapid responder earns `progress` or `accelerate`.
- First successful exposure remains `observe`.
- Pain, travel, taper, adherence, persistence, and duplicate protections remain intact.
