# Bell Performance 13.21.3

## Readiness Transparency & Fatigue-Cap Repair

- Removes the silent `50` readiness hard cap caused by three low feedback records.
- Uses today’s check-in as the primary readiness score.
- Limits the rolling seven-day recovery modifier to `-15` through `+5`.
- Deduplicates post-session feedback by completed session ID.
- Ignores incomplete, malformed, unmatched, and session-less feedback records.
- Keeps a protective cap for pain reported today and explains it explicitly.
- Shows daily score, seven-day modifier, and protective modifier on the dashboard.
- Adds readiness calculation diagnostics under Help & Data.

Focused validation:

```text
PASS: 8/8 readiness transparency checks.
```
