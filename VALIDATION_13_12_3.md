# Validation — Bell Performance 13.12.3

## Validation objective

Prove that every event-type adversarial mutation changes only its intended property. A mutation is invalid when it causes an unrelated warning through deleted volume, shared role matching, altered taper math, lost rehearsal evidence, changed routing, changed scope, or collateral removal of another required concept.

## Isolation invariants

For every non-taper mutation:

- Event-week minutes must remain unchanged.
- The taper ratio must remain unchanged.
- Rehearsal evidence must remain unchanged unless rehearsal is the target.
- Dose validity must remain unchanged unless dose is the target.
- Recovery state and recovery-week minutes must remain unchanged unless recovery is the target.
- Event family must remain unchanged unless routing is the target.
- Scope status must remain unchanged unless scope is the target.
- Non-target required concepts must remain unchanged.

Powerlifting competition-lift specificity is the documented exception to rehearsal-count invariance because opener evidence depends on the three competition-lift roles. The detector continues to prioritize the proximal specificity fault and suppress the dependent rehearsal warning.

## Local checks

```text
Configuration: 16 clean controls, 80 mutations
Synthetic event adversarial calibration: 96/96
```

Additional release checks include Python compilation, JavaScript syntax validation, automation JSON parsing, backend regression tests, local HTML reference validation, and ZIP integrity.

## Browser validation

The definitive acceptance run remains the Windows browser-driven suite:

```powershell
.\automation\run-event-adversarial-validation.ps1
```

The release is accepted when the generated report shows:

```text
96/96 cases passed
```

## Interpretation boundary

This suite validates sensitivity, specificity, context, mutation isolation, and diagnostic traceability for the declared event guardrails. It does not prove individual physiological outcomes or equivalence to all decisions made by a qualified one-on-one coach.
