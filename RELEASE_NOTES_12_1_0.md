# Bell Performance 12.1.0 — Full Intelligence Integration

## Main change

The frontend no longer only mirrors lifecycle events to Bell Core. It can now execute the actual server-generated workout produced by the complete coaching-intelligence stack.

## Added

- **Bell Core AI Mission** card on the Home dashboard
- Strength-session conversion from Bell Core exercise blocks into the guided workout player
- Engine-session conversion into an executable timed prescription
- Server adaptation explanation in the pre-workout briefing
- Bell Core session ID preservation through completion
- Unified intelligence fetch from `/athletes/{id}/intelligence`
- Settings summary for:
  - Digital Twin strategy
  - periodization model
  - heuristic goal probability
  - nutrition target
  - competition taper
  - learned athlete patterns
  - active-engine count
- Support for full Athlete State and Coaching Reasoning outputs

## Backend integration

Bell Performance 12.1.0 targets Bell Core 0.3.0 and uses:

- `/athletes/{id}/state`
- `/athletes/{id}/today`
- `/athletes/{id}/intelligence`
- `/athletes/{id}/check-ins`
- `/athletes/{id}/sessions/{session_id}/complete`

## Compatibility

- Existing local profile, plan, history, and guided workout data remain intact.
- Cloud coaching remains opt-in.
- Offline/local behavior is preserved when the API is disconnected or unavailable.
- The service-worker cache was advanced to `bell-performance-12.1.0-full-intelligence`.

## Validation

- All frontend JavaScript files passed `node --check`.
- Backend full-intelligence lifecycle tests passed.
