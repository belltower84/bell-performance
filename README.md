# Bell Performance 12.1.0 — Full Intelligence Integration

Bell Performance remains a local-first static web application and now consumes the complete Bell Core 0.3.0 coaching workflow when connected.

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

See `RELEASE_NOTES_12_1_0.md` for release-specific changes. Older release notes remain in this directory for historical reference.
