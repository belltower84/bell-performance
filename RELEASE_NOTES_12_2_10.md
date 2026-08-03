# Bell Performance 12.2.10 — Three-Day Weekly Plan Carousel

## What changed
- Reworked the compact Weekly Plan dashboard tile to show **three days at a time** instead of all seven.
- Added a **horizontal scroll / swipe carousel** so the user can move through the full week cleanly.
- Increased spacing, card height, and chip sizing for better readability.
- Kept the same day selection behavior and Weekly Plan tile click-through behavior.

## Why
The seven-day mini-grid still felt crowded inside the dashboard tile. This patch cleans it up by showing a smaller visual window while preserving the full week.

## Scope
Frontend-only UI patch. No scheduling logic changed.
