# Bell Performance 13.8.3 — Independent Session Renderer Repair

- Fixes the 13.8.2 independent-session UI not replacing the legacy selector.
- Forces the stacked Strength, Engine, Core, and Mobility renderer after every dashboard render.
- Uses direct global function replacement so the dashboard calls the new renderer.
- Ensures completion wrappers replace the actual global completion functions.
- Bumps cache and asset versions to prevent stale 13.8.2 UI files.
