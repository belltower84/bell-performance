# Bell Performance 13.8.0 — Unified Session State

## Purpose
Replace inferred Strength and Engine completion matching with one authoritative daily session ledger.

## Changes
- Creates a durable session ID for every planned Strength and Engine session.
- Launches workouts with the exact session-ledger identity.
- Marks completion directly against that identity before dashboard refresh.
- Drives Today’s Mission and weekly completion from ledger status.
- Keeps required and optional sessions independent.
- Persists readiness-based time allocations for the exact daily session records.
- Migrates existing 13.7.x plan completions and workout-history records into the ledger.
- Keeps legacy `sessionCompletions` fields synchronized for compatibility.

## Completion rule
A training day is complete when every required ledger session is complete. Optional sessions do not block day completion.
