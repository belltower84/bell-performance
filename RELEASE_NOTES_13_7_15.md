# Bell Performance 13.7.15 — Session Completion State Repair

- Repairs plan-item lookup when plan IDs change type during save/import serialization.
- Resolves completion by the exact planned session key before falling back to date and canonical mission matching.
- Supports abbreviated Engine mission aliases when recording completion.
- Records Strength and Engine completion independently on combined training days.
- Marks completed history entries explicitly as completed.
- Refreshes Today’s Mission and the weekly plan from the saved completion state.
