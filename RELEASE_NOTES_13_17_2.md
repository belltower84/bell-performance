# Bell Performance 13.17.2

## Protective Status Semantics & Long-Horizon Baseline Lock

- Recognizes `safety_hold` as a valid active-injury protection outcome in the 52-week Chromium suite.
- Requires every simulated active-injury decision to use a protective status: `safety_hold`, `protect`, `hold`, `regress`, `deload`, or `rebuild`.
- Explicitly forbids `progress` and `accelerate` while the simulated injury is active.
- Retains conservative return-to-training checks after injury clearance.
- Preserves the durable IndexedDB archive and history-compaction architecture introduced in 13.17.1.
- Updates the dynamic journey configuration, report title, app metadata, and cache version to 13.17.2.
