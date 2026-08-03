# Bell Performance 13.12.2 — Event-Type Adversarial Validation

## Purpose

13.12.2 locks the 13.12.1 event-routing clean controls and adds event-specific negative controls. The suite generates each clean 52-week event journey once, applies five deliberate corruptions in memory, and scores every mutation only on warnings newly introduced beyond its clean baseline.

## Coverage

The suite covers all 16 selectable event types:

- 5K, 10K, half marathon, and marathon
- Cycling time trial and triathlon
- HYROX, CrossFit competition, and combat-sports tournament
- Powerlifting meet and strongman competition
- Tactical Games and military/law-enforcement fitness test
- Custom sport event
- Obstacle-course race
- Bodybuilding/physique competition

There are 16 clean controls and 80 deliberate mutations, for 96 total cases.

## Negative controls

Most event types receive five corruptions:

1. remove a required event-specific concept;
2. remove canonical rehearsal evidence;
3. reduce the longest canonical event dose below its minimum;
4. corrupt taper-volume reduction;
5. replace post-event recovery with high-stress competition work.

Context-specific exceptions are used where generic rehearsal or dose checks would be inappropriate:

- Powerlifting tests competition-lift specificity, opener/command rehearsal, taper, recovery, and family routing.
- Undefined custom events test strength, conditioning, skill practice, scope overclaim, and recovery.
- Physique preparation tests upper body, lower body, contest cardio, peak-week fatigue reduction, and post-show recovery without prescribing posing as a workout.

## Differential scoring

A mutation cannot pass using a warning already present in its clean control.

```text
new warnings = mutated warnings − clean baseline warnings
```

Every case also verifies that the intended mutation actually changed the targeted concept, dose, phase, scope status, or recovery prescription.

## Detector isolation

The suite suppresses duplicate downstream warnings when one proximal fault necessarily causes another observation. Examples:

- Removing a powerlifting competition lift may also make opener rehearsal impossible; the specificity warning takes priority.
- Removing the only event rehearsal may also eliminate the longest event dose; the rehearsal warning takes priority.

Dose mutations retain the canonical rehearsal role and only reduce duration, so they remain independently testable.

## Clean-control hotfix

The physique upper-body detector now recognizes the canonical `resistance_upper` role. This resolves the final 13.12.1 clean-control contradiction where Chest & Back and Shoulders & Arms were cited elsewhere but not accepted by the isolated upper-body check.

## Run

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-event-adversarial-validation.ps1
```

Report:

```text
automation\event_adversarial_reports\latest\index.html
```

Acceptance target: **96/96 cases passed**.
