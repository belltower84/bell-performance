# Validation

- Exercise catalog built from live workout templates plus curated movement metadata.
- Search and filters for pattern, equipment, and training role.
- Exercise detail modal with setup, execution, coaching cues, errors, and simple start/finish diagram.
- Workout Learn and Replace controls integrated.
- Replacement reason and scope persisted for today, current block, or future workouts.
- Backward-compatible exerciseIntelligence data normalization.
- JavaScript syntax and ZIP integrity checked.


## 7.0.35 checks
- Confirmed reset source contains null max lifts and null mission-goal values.
- Confirmed no 315/455/185 fallback max values remain in workout recommendations.
- Confirmed dashboardDailyTargets is present and populated from personalized habit targets.


## 7.0.35 checks
- First Flight max-lift inputs load from and save to `data.settings.maxes`.
- Blank max fields persist as null rather than demo values.
- Invalid non-positive values are rejected.
- Onboarding review summarizes entered max lifts.

## 7.0.35 checks
- Verified nutrition profile classification across body recomposition, hypertrophy, strength, hybrid, and endurance missions.
- Verified secondary 5K/10K/half-marathon/marathon goals modify fueling without replacing the primary goal.
- Verified current-day Strength, Engine duration, blended sessions, and recovery days produce different targets.


## Athlete Type Description Validation
- Verified all six athlete types have plain-language descriptions.
- Verified descriptions update on selection changes in First Flight and Athlete Settings.
- Verified saved athlete types populate the matching description when screens load.


## 7.0.35 checks

- Verified Functional Fitness Athlete appears in First Flight and Athlete Settings.
- Verified the description explicitly includes CrossFit-style training and HYROX.
- Verified saved selections persist and reload through the existing athlete-mode setting.

## 7.0.35 validation
- Confirmed Daily Goals and Nutrition use the shared `macroTargets()` protein and hydration outputs.
- Confirmed non-custom habit targets recalculate instead of retaining stale recommendations.
- Confirmed custom targets continue to override automatic targets.

## 7.0.35 validation
- Confirmed Today's Mission uses scheduleTypeForMission, matching the weekly schedule classifier.
- Confirmed both Strength and Engine cards can render for the same day.
- Confirmed dashboard start buttons are rebound on every render.
