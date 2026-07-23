# Bell Performance 7.0.36 — Workout Learn & Replace Fix

Adds a searchable exercise education system and purpose-matched user-controlled substitutions. The library is generated from exercises currently prescribed by Bell Performance and includes movement pattern, muscles, equipment, setup, execution, coaching cues, common mistakes, and alternatives.


## 7.0.36 Reset and Daily Goals
- Full reset clears max lifts, derived training maxes, active mission, primary and secondary goals, event details, active block, plan, and personalized habit targets.
- Blank max-lift fields no longer silently restore demo values.
- The dashboard shows explicit daily protein, water, steps, sleep, and mobility targets.


## 7.0.36 First Flight Strength Baseline
- Added optional Bench Press, Back Squat, Deadlift, and Push Press 1RM fields to First Flight.
- Blank values remain unset and continue to use effort-based loading.
- Entered maxes populate the existing Training Maxes system and appear in the onboarding review.

## 7.0.36 Goal-Specific Nutrition
- Primary mission now selects the nutrition profile: recomposition, hypertrophy, strength, hybrid, endurance, or balanced performance.
- Secondary endurance goals add targeted carbohydrate and hydration without overriding the primary calorie direction.
- Today's actual Strength and Engine workload adjusts calories, carbohydrates, and hydration.
- Dashboard explains the current nutrition profile and fueling emphasis.


## 7.0.36 — Athlete Type Descriptions
Added plain-language descriptions for every athlete type in First Flight and Athlete Settings, including a clear explanation that Masters Athlete generally refers to age 40+ or a sport-specific masters division.


## 7.0.36 — Functional Fitness Athlete

Added a Functional Fitness Athlete profile for CrossFit-style training, HYROX, and similar mixed-modality competition. The description explains the combination of strength, Olympic lifting, gymnastics, carries, and high-intensity Engine work.

## 7.0.36 — Unified Protein Target
- Daily Goals protein and hydration recommendations now use the same goal-specific nutrition calculation as the dashboard Nutrition panel.
- Non-custom daily targets automatically refresh when bodyweight, mission, secondary goal, or daily training load changes.
- Custom habit targets remain user-controlled and intentionally override the calculated nutrition recommendation.

## 7.0.36 — Today Mission Session Sync
- Dashboard and weekly schedule now use the same session classifier.
- Strength and Engine cards remain visible together on blended days, including after a workout is started.
- Start buttons refresh on every render and display Resume for the active session.

## 7.0.36 — Workout Learn & Replace Fix
- Exercise detail and replacement dialogs now stack above the active workout log.
- Learn opens movement instructions without ending or pausing the session timer.
- Replace opens purpose-matched alternatives and returns to the same active workout.
