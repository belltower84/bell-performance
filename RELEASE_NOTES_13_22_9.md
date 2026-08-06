# Bell Performance 13.22.9

## Runtime Stability & GitHub Pages Repair

- Removed competing MutationObservers that repeatedly rewrote the build label and prevented DOMContentLoaded from completing.
- Centralized build identity in one final release module.
- Removed page-side cache deletion that could erase the active service-worker cache.
- Added resilient GitHub Pages service-worker installation and network-first code delivery.
- Added refresh.html to remove stale app caches without clearing athlete localStorage.
