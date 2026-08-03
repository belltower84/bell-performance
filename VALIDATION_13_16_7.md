# Validation 13.16.7

## Acceptance objective

- 8/8 full-stack athlete journeys.
- Protected taper sessions contain no `progress` or `accelerate` decisions.
- Pre-taper progression remains allowed.
- Stale upward applications cannot change protected taper prescriptions.
- Positive, pain, travel, regression, persistence, and duplicate behavior remain passing.

## Direct checks

```powershell
node .\automation\test-taper-application-revalidation-13167.js
```

Expected result:

```text
PASS: 8/8 taper application revalidation checks.
```

## Full browser replay

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\automation\run-full-stack-athlete-journeys.ps1
```

Report:

`automation\full_stack_journey_reports\latest\index.html`
