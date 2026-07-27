# Bell Performance 10.0.1 — Active Timer Hotfix

## Fixed

- Corrected the active training timer running several times faster than real time.
- The timer now treats `timerAccumulatedSeconds: 0` as a valid value instead of falling back to the continuously updated elapsed time.
- Added protection against invalid stored timer timestamps.
- Updated the service-worker cache key so browsers receive the corrected JavaScript.

## Root cause

The previous elapsed-time calculation used a truthy fallback. Because zero is falsey in JavaScript, the function reused the growing `elapsed` value and then added the full timestamp difference again each second. That compounded the displayed time.
