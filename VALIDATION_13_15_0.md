# Bell Performance 13.15.0 Validation

## Scope

The closed-loop suite verifies that stabilized longitudinal decisions change the correct future prescription in both the browser and Bell Core. It tests application routing, dose rewriting, movement-level protection, safety replacement, channel isolation, identity preservation, persistence metadata, and exact idempotency.

## Deterministic controls

Twenty browser/Python parity cases cover:

- strength progress, acceleration, hold, regression, rebuild, deload, and protected re-entry;
- engine progress, acceleration, hold, and rebuild;
- exercise-specific hold, regression, pain protection, and technique protection;
- safety-hold replacement with recovery;
- next-comparable-session routing;
- skipping already completed target sessions;
- strength/engine channel isolation;
- event-role preservation;
- duplicate-application prevention.

## Acceptance criteria

- 20/20 JavaScript closed-loop cases pass.
- 20/20 Python/Bell Core closed-loop cases pass.
- JavaScript and Python outcomes agree for every case.
- The same application ID cannot compound a prescription twice.
- An engine decision cannot modify a strength session, and a strength decision cannot modify an engine session.
- Exercise-specific protection cannot alter unrelated movements.
- A safety hold cannot leave the hard prescription active.
- Completed targets are skipped during retargeting.
- Canonical event and session identity remains present after rewriting.
- All backend regression tests pass.
- The locked 13.13.0 athlete-response, 13.14.0 longitudinal, and 13.12.3 event-adversarial suites remain green.

## Interpretation boundary

Passing this suite establishes deterministic prescription application and browser/Bell Core parity for the tested contracts. It does not establish clinical safety, injury diagnosis, guaranteed performance outcomes, or successful synchronization under every real-world network failure. Those require prospective user testing and deployment monitoring.
