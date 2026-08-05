# Bell Performance 13.21.1

## Workout Scroll Container & Dock Reservation Repair

- Makes the workout modal the single scrolling surface during working sets.
- Removes the nested full-height workout scroller that allowed the fixed action dock to cover set rows.
- Measures the real bottom-dock height and applies it to the modal and explicit dock spacer.
- Recalculates reservation after resize, browser zoom/layout changes, timer changes, orientation changes, and dock mutations.
- Preserves the 13.21.0 preview and warm-up source consolidation.
