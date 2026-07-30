# Bell Performance 13.8.4 Validation

## Static validation

- All JavaScript files passed `node --check`.
- All local `src` and `href` references in `index.html` resolved.
- All service-worker core-cache references resolved.
- ZIP integrity passed.

## Browser validation

A Chromium render test exercised the actual `bell13-commercial-home.js` Home dashboard.

Confirmed:

- The old selectable side-by-side mission tiles were absent.
- Primary, Engine, Core, and Mobility rendered as separate vertical cards.
- The shared Start / Preview / Modify action row was hidden.
- A 60-minute combined day allocated 37 minutes to Strength, 15 minutes to Engine, and 8 minutes to Core.
- Mobility displayed separately outside the 60-minute required budget.
- Start Engine opened the Engine workout with the 15-minute allocation.
- Completing Engine changed only the Engine card to Complete and preserved the other session states.

## Remaining real-world check

Install over the local test copy, clear the old service worker once, and repeat the Jamie combined-day flow using the existing saved athlete data.
