# Bell Performance 12.2.4 — Concurrent Scheduling Intelligence

## Scheduling corrections
- Primary strength and engine sessions are assigned before mobility.
- Mobility no longer consumes an available training-day slot.
- Friday is treated as a meaningful strength opportunity whenever Friday is selected and strength work remains.
- Long runs prefer Saturday when Saturday is available.
- Multiple components scheduled on the same day are displayed under one weekday card.

## Strength and engine compatibility
- Upper-body strength is the preferred same-day partner for engine work.
- Easy engine work may be paired with lower-body strength when needed.
- Hard intervals, tempo work, hills, and sprints are strongly discouraged on heavy lower-body days.
- Long endurance sessions are kept separate from lower-body strength by default.
- Hard engine sessions are spaced away from lower-body strength when the athlete's selected days allow it.

## Architecture
- Bell Core applies the authoritative compatibility and scheduling rules for connected athletes.
- The frontend uses matching logic as the local/offline fallback.
- Selected weekdays remain hard constraints in both modes.

## Validation
- Backend Python compiles successfully.
- Updated frontend JavaScript passes Node syntax validation.
- Added scheduler tests for Friday strength use, mobility layering, Saturday long runs, and unavailable-day protection.
