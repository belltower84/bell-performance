# Bell Performance 12.2.7 — Integrated Mobility and Core

## Weekly schedule
- Removed normal `M-1 Daily Reset` entries from the formal weekly schedule.
- Mobility no longer consumes a selected training day or creates duplicate weekday components.
- Weekly cards now show mobility and core as included sections of the primary workout.

## Workout structure
- Added training-specific cooldown mobility to strength, engine, and blended sessions.
- Lower-body and running sessions receive hips, ankles, and posterior-chain mobility.
- Upper-body sessions receive shoulder and thoracic mobility.
- Core is prescribed as required or optional based on session fatigue and purpose.
- Long-endurance sessions avoid required core by default.
- Estimated session duration includes integrated core and mobility time.

## Dashboard
- Removed separate mobility and optional-core rows from Today’s Mission.
- Today’s Mission now represents one guided workout flow with warm-up, main work, core where appropriate, and cooldown mobility.

## Architecture
- Bell Core backend supplies authoritative integrated-support metadata.
- Frontend local/offline scheduling applies matching support rules.
