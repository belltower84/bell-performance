# Bell Performance 13.8.4 — Commercial Home Session Rebuild

## Purpose

13.8.2 and 13.8.3 added an independent-session renderer, but the live Home dashboard continued to use the older `bell13-commercial-home.js` mission card. This release changes the renderer that actually owns the visible Home screen.

## Changes

- Rebuilt the visible Today’s Training card as vertically stacked session cards.
- Added independent Primary, Engine, Core, and Mobility controls.
- Added a dedicated Preview and Start button to every applicable session.
- Removed the shared session selector and shared Start / Preview / Modify action row.
- Completed sessions become shaded and their action changes to a disabled Completed button.
- Required Primary, Engine, and Core work remains inside the selected 30–120 minute training budget.
- Daily Mobility remains visible and is labeled outside the required training budget.
- Engine launches with the exact allocated duration shown on the dashboard.
- Completion is stored by date and broad session type, so Engine does not depend on workout aliases or display titles.
- Added Mission Complete and Preview Tomorrow behavior once all required sessions are complete.
- Updated onboarding, settings, and Daily Check-In time handling to 30, 45, 60, 75, 90, 105, and 120 minutes.
- Updated the app title and service-worker cache to 13.8.4.

## Important

This build changes the actual commercial Home renderer instead of layering another renderer behind it. Existing athlete plans are not migrated or rewritten.
