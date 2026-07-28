# Bell Performance 12.2.5 — Discipline Exposure Intelligence

## Programming dose
- Weekly strength and engine exposure targets now come from the athlete pathway, not only the number of selected weekdays.
- Six-day Hybrid, body-recomposition, general-fitness, tactical, and athlete pathways target **4 strength + 3 engine exposures**.
- Running-focused pathways prioritize more engine work; physique pathways prioritize more lifting.
- Exposure counts may exceed available weekdays, creating intentional blended days.

## Backend
- Bell Core sends explicit strength and engine targets to the weekly planning engine.
- The weekly planner can now place multiple compatible sessions on the same day instead of truncating the plan to one session per available weekday.
- Concurrent scheduling still prefers upper strength with engine, protects lower strength from hard engine, reserves Saturday for long endurance, and treats Friday as a meaningful strength opportunity.

## Frontend/local mode
- Local plan generation fills missing discipline exposures before weekday optimization.
- The same pathway rules are sent to Bell Core during mission synchronization.
- Mobility remains a support component and does not consume a primary training opportunity.
