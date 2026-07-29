# Bell Performance 13.1.0 — Adaptive Journey Planning

Bell Performance is a local-first adaptive coaching application. Version 13.1 adds a Journey-centered planning layer shared by the offline frontend and Bell Core.

## Product blueprint

Bell 13 and later are governed by [`BELL_PRODUCT_BLUEPRINT.md`](BELL_PRODUCT_BLUEPRINT.md). It defines the product language, coaching architecture, design standards, adaptive-planning rules, and release roadmap. New features should be reviewed against its feature checklist before implementation.

## Bell 13.1 Journey model

- Event Preparation calculates the active horizon from the competition date.
- Continuous Development creates purposeful phases without requiring an event.
- Mission Control displays Journey, Phase, Phase Week, progress, and the next milestone.
- The Plan page displays the full Journey timeline.
- Bell Core exposes the authoritative state through `GET /athletes/{athlete_id}/coaching-state`.

See [`BELL_COACHING_ENGINE_13_1.md`](BELL_COACHING_ENGINE_13_1.md) and [`RELEASE_NOTES_13_1_0.md`](RELEASE_NOTES_13_1_0.md).

## Connected experience

- Register or sign in to Bell Core from Settings.
- Sync the athlete profile, mission, and multiweek plan.
- Display the current Bell Core workout on the Home dashboard.
- Show the selected Digital Twin strategy and coaching-intelligence summary.
- Submit readiness to Adaptive Coaching and Coaching Reasoning.
- Show the athlete-facing explanation before training.
- Convert the server-generated strength or engine session into Bell's existing guided workout player.
- Preserve the Bell Core session ID through completion.
- Send an idempotent completion to the API.
- Refresh Athlete State, compliance, patterns, and learned parameters.
- Fall back to the existing local application when disconnected.

## Local use

Serve the files over HTTP rather than opening `index.html` directly:

```bash
python -m http.server 5173
```

Open `http://localhost:5173` and go to **Settings → Cloud Coaching Connection**. The local default is:

```text
http://localhost:8000/api/v1
```

## GitHub Pages

Upload the contents of this directory to the `bell-performance` repository. The Python backend must be deployed separately. In production, use an HTTPS Bell Core URL ending in `/api/v1`.

Bell Core must allow the exact frontend origin through `BELL_CORS_ORIGINS`.

## Test focus

1. Connect a Bell Core account and run a manual sync.
2. Complete First Flight and generate a mission.
3. Confirm the Home dashboard shows **Bell Core AI Mission**.
4. Submit a low-readiness check-in and verify the explanation and prescription change.
5. Start the AI workout and confirm the existing guided workout player opens.
6. Complete the workout and confirm the server session advances.
7. Confirm Settings displays strategy, periodization, probability, nutrition, competition, patterns, and active engines.
8. Disconnect Bell Core and verify the local workflow still operates.

See `RELEASE_NOTES_13_1_0.md` for this release. Older release notes remain for historical reference.
