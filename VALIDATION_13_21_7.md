# Bell Performance 13.21.7 Validation

## Superset paired-round checks

- Two-exercise supersets render through a shared round table rather than two unrelated vertical logs.
- A1 and B1 share the same row and height.
- A2/B2 and A3/B3 remain aligned in their matching rounds.
- Weight, reps, RPE, status, and skip controls remain independent for both exercises.
- Guided order remains A1 → B1 → A2 → B2.
- Exercise summaries begin on the same level above the shared set table.
- Equipment-change notices and Guide/Replace actions remain available on both exercises.
- Unequal set counts preserve the round alignment with a no-programmed-set placeholder.
- Mobile layouts retain A/B grouping inside each numbered round without horizontal clipping.
- Rear-Delt Fly now reports rear delts and upper back rather than being misclassified as chest.

## Focused browser results

- Desktop paired-round alignment passed at 1280 × 900.
- All three A/B round pairs had 0 px top and height differences.
- Desktop modal and control overflow: 0 px.
- Mobile paired-round sequence remained A1/B1, A2/B2, A3/B3.
- Mobile modal and set-cell overflow: 0 px.

## Regression checks

- 9/9 explicit superset identity checks passed.
- 8/8 readiness transparency checks passed.
- 74 JavaScript files passed syntax validation.
- Service-worker syntax passed.
- 89 local HTML references resolved.
- 90 service-worker references resolved.
- Manifest JSON passed validation.
