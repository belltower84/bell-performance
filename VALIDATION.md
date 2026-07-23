# Validation

- Exercise catalog built from live workout templates plus curated movement metadata.
- Search and filters for pattern, equipment, and training role.
- Exercise detail modal with setup, execution, coaching cues, errors, and simple start/finish diagram.
- Workout Learn and Replace controls integrated.
- Replacement reason and scope persisted for today, current block, or future workouts.
- Backward-compatible exerciseIntelligence data normalization.
- JavaScript syntax and ZIP integrity checked.


## 7.0.29 checks
- Confirmed reset source contains null max lifts and null mission-goal values.
- Confirmed no 315/455/185 fallback max values remain in workout recommendations.
- Confirmed dashboardDailyTargets is present and populated from personalized habit targets.


## 7.0.29 checks
- First Flight max-lift inputs load from and save to `data.settings.maxes`.
- Blank max fields persist as null rather than demo values.
- Invalid non-positive values are rejected.
- Onboarding review summarizes entered max lifts.
