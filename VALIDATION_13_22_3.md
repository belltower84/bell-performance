# Bell Performance 13.22.3 Validation

## Static validation
- 79 JavaScript source files passed `node --check`.
- Service worker passed `node --check`.
- Manifest JSON parsed successfully.
- 97 HTML asset references checked; 0 missing.
- 98 service-worker asset references checked; 0 missing.

## Warm-up algorithm fixtures
- Bench press, 225 lb max, 180 lb working load: `45 × 10 → 135 × 3 → 160 × 1`.
- Bench press, 225 lb max, 205 lb working load: `45 × 10 → 135 × 3 → 180 × 1`.
- Back squat, 315 lb max, 315 lb working load: `45 × 8 → 135 × 5 → 225 × 3 → 275 × 1`.
- Deadlift, 405 lb max, 315 lb working load: `45 × 8 hinge rehearsal → 135 × 5 → 225 × 3 → 275 × 1`.
- Lighter back squat, 185 lb working load: `45 × 8 → 95 × 5 → 135 × 3 → 165 × 1`.

## Plate-math fixtures
Exact per-side loading was verified for 45, 95, 135, 160, 185, 225, 275, and 315 lb using a 45 lb bar and standard plates.

## Movement-guide coverage
All 162 unique movement IDs currently present in the adaptive mobility and rehab library resolve to a specialized guide category with setup, execution, breathing, intended sensation, common mistakes, regression, and progression.

## Limitation
This environment completed source-level, algorithm, asset, and package validation. Interactive behavior should still be confirmed in the user's real browser because local profile state, service-worker state, viewport, and exercise data can alter the rendered experience.
