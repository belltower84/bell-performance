# Bell Performance 13.16.5 — Completion Identity & Evidence Precedence Repair

## Purpose
Repairs two defects exposed by the 13.16.4 full-stack replay: complete strength sessions being labeled `LOW_COMPLETION`, and recurring weekly sessions being mistaken for duplicate submissions.

## Changes
- Separates current-session completion from weekly and block adherence.
- Valid current-session evidence takes precedence over unfinished future sessions.
- Adds explicit `LOW_SESSION_COMPLETION` and `LOW_WEEKLY_ADHERENCE` reason paths.
- Completion fingerprints now use athlete, plan, week, scheduled date, canonical session key, and attempt.
- The same scheduled occurrence remains idempotent across reload.
- Identical workout templates in later weeks are accepted as new evidence.
- Adds Python and JavaScript identity regression tests.
