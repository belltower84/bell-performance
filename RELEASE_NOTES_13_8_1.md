# Bell Performance 13.8.1 — Emergency Rollback

This release restores the stable 13.7.18 application flow after the 13.8.0 unified-session migration reset or disconnected active plan data for existing profiles.

## Restored
- Existing athlete profile and active plan rendering
- Today’s Mission selector and readiness time allocation
- Weekly plan and Bell Coach data
- Settings and navigation state

## Important
The unresolved Engine completion-display defect remains under investigation. This rollback intentionally does not introduce another completion-state patch. The next repair should be based on captured runtime state from an affected profile rather than additional alias matching.
