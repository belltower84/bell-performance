# Bell Performance 13.4.0 Validation

## Automated

- JavaScript syntax validation for every frontend module.
- Python compilation for Bell Core.
- Backend test suite, including:
  - repeated-evidence memory threshold
  - explicit memory creation and removal
  - removed inferred memory remaining inactive after refresh
  - structured explanation contract
- HTML and manifest parsing.
- Service-worker asset existence validation.
- ZIP integrity testing.

## Manual checks before main

- Complete First Flight on a clean browser profile.
- Confirm Mission Control shows the Bell Coach Brief.
- Open every Why topic and verify Context, Decision, Reason, and Next focus.
- Add an explicit memory; reload; confirm it remains visible.
- Remove a memory; reload and sync; confirm Bell does not use it.
- Disable coaching memory in Settings and confirm inferred memory is not used.
- Trigger Yellow and Red readiness states and inspect the decision history.
- Verify the Plan page Why buttons open Bell Coach instead of browser alerts.
- Verify Bell Coach functions offline.
- Verify `/coach` and memory endpoints against deployed Render Bell Core after migration.
- Test Chrome mobile viewport and installed PWA viewport.
