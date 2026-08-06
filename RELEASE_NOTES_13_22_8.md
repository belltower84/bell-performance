# Bell Performance 13.22.8 — GitHub Pages Deployment Repair

## Repairs
- Uses a stable `sw.js` registration URL with `updateViaCache: none`.
- Fixes the cache-name mismatch that caused the active Bell cache to be deleted on every load.
- Replaces all-or-nothing pre-caching with resilient per-file caching.
- Keeps HTML, JavaScript, CSS, and JSON network-first so GitHub deployments surface immediately.
- Adds `refresh.html`, which unregisters stale workers and clears Bell CacheStorage without deleting local athlete data.
- Includes a flat GitHub-upload archive so `index.html` can be placed directly at the Pages publishing root.
- Preserves the Coach’s Dashboard and all 13.22.7 functionality.
