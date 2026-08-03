# Bell Performance 13.12.1 — Event Routing & Clean-Control Calibration

## Purpose

13.12.1 repairs the clean event controls exposed by the first 13.12.0 browser run. The release focuses on routing and prescription fidelity rather than lowering scientific guardrails to make reports pass.

## Event-critical session preservation

Adaptive schedule fitting now classifies sessions from canonical roles before using text fallbacks. Event rehearsals, long sessions, quality work, event-specific strength, and recovery sessions are protected according to the selected event family when weekly availability requires trimming.

The scheduler now uses event-aware exposure targets for running, cycling, multisport, functional fitness, strongman, powerlifting, tactical, obstacle-course, and physique preparation.

## Routing repairs

- Strongman events no longer inherit the powerlifting meet template merely because the athlete has a strength or powerlifting identity.
- Strongman preparation preserves overhead event strength, carries and loading, grip and upper-back work, and event simulations.
- Triathlon preparation preserves swim, bike, run, brick, fueling, and long-rehearsal work.
- Cycling preparation preserves long rides and time-trial rehearsal.
- HYROX, CrossFit, and combat-sports simulations remain in the plan through schedule adaptation.
- Tactical, fitness-test, obstacle-course, physique, and custom-event routes retain their canonical event roles.

## Running specificity

Running event prescriptions now expose the selected event identity in athlete-facing labels and details. The 5K, 10K, half-marathon, and marathon controls retain different quality, goal-pace, long-session, and rehearsal prescriptions.

Static calibration verifies differentiated rehearsal doses of 63, 74, 105, and 120 minutes respectively.

## Context-aware validation

- Powerlifting opener and command practice count as controlled meet rehearsal when all three competition lifts are represented.
- Physique lower-body training is recognized through canonical resistance roles.
- Physique peak-week fatigue reduction is evaluated from event-week prescription and dose rather than generic rehearsal language.
- Physique is not required to prescribe posing as a workout.
- Rehearsal and long-dose checks use event-specific canonical roles instead of unrelated session descriptions.

## Custom-event boundary

An undefined custom event is now reported as `SCOPE_LIMITED`. Bell requires duration, scoring, movement demands, equipment, and work-to-rest structure before claiming event-specific programming. The user-defined event name still persists.

## Run

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-event-validation.ps1
```

Report:

```text
automation\event_validation_reports\latest\index.html
```
