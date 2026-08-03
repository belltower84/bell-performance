# Bell Performance 12.2.2 — Unified Mission Flow

## Mission behavior
- Removed the separate **Bell Core AI Mission** dashboard card.
- Bell Core now supplies the final prescription to the main **Today’s Mission** card.
- The dashboard presents one clear **Start Workout** action instead of competing local and AI workout buttons.
- Bell Core readiness explanations now remain in Today’s Briefing, the mission adjustment panel, and Coaching.

## Completion behavior
- Completing today’s Bell Core session no longer pulls the next unfinished plan session into today.
- The dashboard switches to **Today’s Mission Complete** with **View Results** and recovery actions.
- The next Bell Core session is available as a preview only. It cannot be started from the completed-day dashboard.
- Local future workouts are also preview-only from the dashboard.

## Backend behavior
- `GET /api/v1/athletes/{athlete_id}/today` now accepts `?date=YYYY-MM-DD`.
- Bell Core records a session against the requested local calendar date.
- Re-requesting that date after completion returns `status: today_complete`, not the next workout.
- The response includes `next_session_preview` separately for safe preview behavior.

## Verification
- Backend automated test suite: 6 tests passed.
- Changed frontend JavaScript passes Node syntax validation.
