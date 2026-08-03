# Bell Performance 13.12.3 — Adversarial Mutation Isolation Repair

## Purpose

13.12.3 repairs the event-type adversarial harness after the first real browser run passed 85 of 96 cases. All 16 clean controls and all 80 expected detectors worked, but 11 mutations also changed unrelated taper, rehearsal, or dose conditions. This release makes each negative control orthogonal so a case can pass only when the intended fault is introduced by itself.

## Changes

- Added precise `conceptTargets` for all event concept mutations.
- Separated concept, rehearsal, dose, taper, recovery, family, and scope mutation behavior.
- Concept mutations neutralize canonical evidence while preserving session duration.
- Rehearsal mutations preserve weekly minutes and retain non-rehearsal event-dose roles where applicable.
- Dose mutations reduce canonical event dose and redistribute removed minutes to noncanonical low-stress support work in the same week.
- Recovery mutations preserve recovery-week minutes while replacing low-stress restoration with high-stress event work.
- Powerlifting specificity remains context-aware and suppresses the dependent opener-rehearsal warning.
- Added invariant auditing for weekly minutes, taper ratio, rehearsal count, dose validity, recovery state, event family, scope status, and non-target concepts.
- Compound or contaminated corruptions now return `CONTROL_MUTATION_INVALID`.
- Updated report diagnostics to show mutation-isolation failures explicitly.

## Frozen coaching behavior

No event-programming route, session library, phase architecture, or athlete-facing prescription was changed. This release only calibrates the scientific-validation harness.

## Acceptance

```text
16/16 clean controls pass
80/80 mutations applied
80/80 expected warnings detected
0 missed warnings
0 unexpected warnings
96/96 total cases pass
```

## Run

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-event-adversarial-validation.ps1
```

Report:

```text
automation\event_adversarial_reports\latest\index.html
```
