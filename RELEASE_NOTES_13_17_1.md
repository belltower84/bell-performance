# Bell Performance 13.17.1

## Durable Athlete Data Storage & History Compaction

This release repairs the browser quota failure exposed by the 52-week dynamic athlete journeys.

### Changes

- Added an IndexedDB archive for older detailed history, response decisions, prescription applications, readiness, feedback, missed sessions, and review records.
- Retained a bounded recent window in the synchronous boot state so existing coaching logic remains available immediately.
- Added compact historical summaries and archive counters for long-term context.
- Added soft-limit and aggressive compaction passes before local-storage writes.
- Added a failed-write recovery record and retry path.
- Added storage diagnostics through `window.bellStorageDiagnostics()`.
- Reset now removes both local state and the durable IndexedDB archive.
- Added a 900-session storage stress test.

The full 52-week Chromium suite must still be run on Windows to confirm all six journeys complete without quota errors.
