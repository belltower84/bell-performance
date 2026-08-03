# Bell Performance 13.16.1 Validation

## Definitive Windows command

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\automation\run-full-stack-athlete-journeys.ps1
```

The script installs the Playwright Python dependency when needed, uses an installed Chrome or Edge browser when available, and falls back to Playwright Chromium.

## Report

`automation/full_stack_journey_reports/latest/index.html`

## Acceptance criteria

- 8/8 browser journeys pass.
- Actual generated plans contain the requested eight formal weeks.
- Every executed exposure comes from an actual generated plan session.
- Every non-missed exposure produces a decision from `bellRecordAthleteResponse`.
- Decisions remain inside cumulative safety bounds.
- Non-neutral pending applications change the next real prescription template.
- Mid-journey reload preserves completed history and scheduled applications.
- Duplicate completions are recognized without adding another application.
- Pain produces protected progression and protected re-entry.
- Travel interruption produces rebuilding rather than catch-up work.
- Late event phases do not allow upward progression.
- No browser page errors or console errors occur.

## Environment limitation

The packaged runner could not be executed inside the build container because Chromium navigation to localhost is blocked by administrator policy. The definitive run must therefore be completed on Windows.
