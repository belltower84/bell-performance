# Bell Performance 12.0.0 — Bell Core Integration

## What changed

- Added optional Bell Core API account creation and sign-in in Settings.
- Added configurable API base URL for local, staging, or production deployments.
- Onboarding now mirrors the athlete profile, mission, and generated plan to Bell Core.
- Daily readiness check-ins now submit to the Adaptive Coaching Engine.
- Completed workouts now post to the current Bell Core session with idempotency protection.
- Server athlete state, readiness, compliance, current session, and latest decision are cached on the device.
- Added manual sync, connection status, error reporting, and device disconnect controls.
- Preserved local/offline operation when no backend is configured or the API is unavailable.

## Deployment note

GitHub Pages hosts only the frontend. Bell Core must be deployed separately over HTTPS. Set Bell Core's `BELL_CORS_ORIGINS` to the exact GitHub Pages origin and enter the deployed `/api/v1` URL in Settings.
