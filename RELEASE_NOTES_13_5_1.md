# Bell Performance 13.5.1 — Dashboard Refinement

## Purpose
13.5.1 refines the Commercial Athlete Experience introduced in 13.5.0. The release focuses on alignment, spacing, weekly-plan usefulness, and a clearer desktop navigation flow without changing Bell's coaching engine or athlete data.

## Dashboard layout
- Rebalanced the two-card dashboard rows into equal columns.
- Standardized card padding, header spacing, minimum heights, and internal alignment.
- Centered plan and progress content within their cards.
- Kept Bell Coach actions anchored consistently at the bottom of the coaching card.
- Corrected the Today card action layout so the primary action remains dominant and secondary actions no longer stretch unpredictably.
- Improved responsive behavior for desktop, tablet, narrow mobile, and very small screens.

## Interactive weekly calendar
- Every day in the weekly strip is now selectable.
- Today remains visually identified while the selected day receives a clear active state.
- Selecting a day updates an in-card summary showing:
  - Full date
  - Scheduled session or recovery day
  - Planned duration
  - Training type
  - Completion status
  - Brief session purpose
- The selected day is keyboard accessible with arrow, Home, and End navigation.
- The selected summary remains on the Home screen and does not unexpectedly change today's main training card.

## Navigation hierarchy
The desktop sidebar now follows the athlete's normal workflow:

1. Home
2. Train
3. Plan
4. Progress
5. Coach
6. Recovery
7. Nutrition
8. Library
9. More

Recovery, Nutrition, and Library are visually separated as support tools. More remains at the bottom as the utility destination. The five-item mobile navigation remains Home, Train, Plan, Progress, and More.

## Compatibility
- No athlete data is reset.
- Bell Coach intelligence and memory remain intact.
- Journey planning and discipline libraries remain intact.
- Powerlifting top-set and automatic back-off loading remain intact.
- Existing Bell Core APIs and backend migrations are unchanged.
