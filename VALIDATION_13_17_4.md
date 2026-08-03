# Validation 13.17.4

## Focused regression

Run:

```powershell
node .\automation\test-workout-title-integrity-13174.js
```

Expected:

```text
PASS: 7/7 workout title integrity checks.
```

The checks cover Strength Press, Strength Pull, one-letter block markers before delimiters, structured strength prefixes, concise titles, Engine normalization, and malformed-fragment rejection.

## Full validation still required on Windows

```powershell
.\automation\run-dynamic-52-week-athlete-journeys.ps1
```

Also rebuild the Hybrid + Body Recomposition block and verify every weekly card has a complete title and no day contains two required Engine sessions.
