# Validation — Bell Performance 13.12.2

## Local validation completed

- Event adversarial configuration contains all 16 clean event IDs.
- Every event defines exactly five deliberate mutations.
- Total expected case count is 96: 16 clean controls plus 80 mutations.
- Python compilation passes for the clean and adversarial event runners.
- Configuration-only validation passes.
- Synthetic differential calibration passes 96/96 cases.
- HTML/JSON report-writer smoke test passes 96/96 synthetic cases.
- The physique clean-control matrix recognizes `resistance_upper`.
- Existing event-routing, running-specificity, and context-aware validator tests pass.
- Backend regression tests pass.
- JavaScript syntax validation passes.
- Archive integrity is verified after packaging.

## Browser-driven validation

The full suite requires Chrome or Chromium because it builds the real 52-week plan for each event before applying negative controls. A browser launch was attempted in the build environment, but localhost navigation was blocked with `ERR_BLOCKED_BY_ADMINISTRATOR`.

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-event-adversarial-validation.ps1
```

The report is written to:

```text
automation\event_adversarial_reports\latest\index.html
```

## Acceptance rule

The suite is accepted only when:

1. every clean event control passes its clean rubric;
2. every clean adversarial baseline contains no warnings;
3. every mutation is verified as actually applied;
4. every mutation introduces its expected warning;
5. no mutation introduces an unrelated warning;
6. no mutation passes by inheriting a clean-control warning;
7. undefined custom events remain `SCOPE_LIMITED` unless a complete demand profile exists.

Target: **96/96 cases passed**.

Passing proves sensitivity and specificity for these declared event fault classes. It does not prove every possible coaching error will be detected or that projected athletic outcomes will occur.
