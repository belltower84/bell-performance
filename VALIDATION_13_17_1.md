# Validation — Bell Performance 13.17.1

## Completed locally

- Durable storage stress test: 8/8 checks passed across 900 synthetic detailed sessions.
- Persisted local state remained below quota while older records were compacted and queued for IndexedDB.
- JavaScript syntax validation passed.
- Python compilation passed.
- JSON parsing passed.
- Backend and existing coaching regression suites were run where available.

## Windows acceptance

Run both browser suites:

```powershell
.\automation\run-full-stack-athlete-journeys.ps1
.\automation\run-dynamic-52-week-athlete-journeys.ps1
```

Target: 8/8 short journeys and 6/6 52-week dynamic journeys, with no `QuotaExceededError`.
