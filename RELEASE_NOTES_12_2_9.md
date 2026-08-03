# Bell Performance 12.2.9 — Weekly Plan UI Cleanup

## Dashboard Weekly Plan tile
- Replaced the crowded miniature icon strip with seven clean day cells.
- Each day now shows only its primary training classification: **STR**, **ENG**, **STR + ENG**, or **REST**.
- Mobility and core are intentionally omitted from the compact strip because they are integrated inside the daily workout.
- Added a clearer Week/Phase heading and a compact weekly strength/engine count.
- Increased spacing, typography size, contrast, and selected/today highlighting.
- Preserved the existing click behavior for selecting a day and opening the full plan.

## Scope
This is a frontend presentation patch. It does not change Bell Core scheduling or workout generation.
