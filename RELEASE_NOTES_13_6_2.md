# Bell Performance 13.6.2 — Refined Bell Coach Workspace

## Coach screen
- Replaced the full-width blue exit control with the same compact circular close button used by other Bell Performance dialogs.
- Removed the stale `Bell Performance 13.4` label from the Coach header.
- Rebuilt the Coach header as a stable, dedicated workspace header with clearer title hierarchy.

## Coach navigation
- Changed the Coach section selector from a generic page navigation element to an accessible tab list.
- The **Today**, **Why**, **Memory**, and **Decisions** tabs now remain at the top of the Coach workspace instead of floating over the bottom of the content.
- Added active-tab accessibility state and keyboard focus behavior.

## Scrolling and layout
- Coach content now scrolls inside its own body region, with protected bottom padding so the final content is always reachable.
- Mobile keeps the Coach as a full-screen workspace.
- Larger screens use a centered, bordered Coach panel over a darkened backdrop.
- Tapping the desktop backdrop or pressing Escape closes the Coach.

## Compatibility
- No backend or database migration is required.
- Coaching memory, decision history, readiness data, Journey data, and athlete settings are preserved.
