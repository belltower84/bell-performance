# Bell Coaching Engine 13.2

## Purpose

Bell 13.2 adds the discipline layer that sits between the athlete's Journey and the weekly planner.

```text
Athlete Identity + Objective
          ↓
Discipline Coaching Library
          ↓
Journey Phase
          ↓
Weekly Architecture
          ↓
Session Selection and Progression
```

The Journey engine still decides **where the athlete is going**. The discipline library now decides **how that kind of athlete should train while getting there**.

## Supported coaching libraries

Bell includes distinct libraries for:

- Performance & Health
- Powerlifting
- Bodybuilding
- Hybrid Athlete
- Tactical Athlete
- Functional Fitness
- Endurance Athlete

Each library defines:

- coaching promise and priorities;
- typical strength, Engine, and recovery architecture;
- protected sessions;
- progression rules;
- readiness adjustments;
- missed-session rules;
- assessment metrics;
- Continuous Development bias rotation;
- phase-specific session ordering.

## Continuous Development

Continuous Development no longer ends when the first generated cycle is complete.

Bell tracks:

- absolute Journey week;
- current cycle number;
- current week inside the cycle;
- current cycle emphasis;
- next cycle emphasis;
- renewable-cycle policy.

When a cycle ends, Bell moves into the next development cycle without deleting completed history. The next bias is selected from objective priority, assessment results, adherence, and recovery response.

## Transition policy

The discipline library exposes a transition decision model:

- **Continue** when the phase remains productive.
- **Advance** when the objective is achieved with acceptable recovery.
- **Extend** when more exposure is needed and the timeline permits it.
- **Hold** when adherence is too low to justify more demand.
- **Recover** when readiness, pain, illness, or fatigue risk is too high.

Event Preparation still respects the event deadline. Continuous Development can extend productive phases or insert recovery without a competition countdown forcing the decision.

## Weekly planning

The weekly planner now receives:

- athlete identity;
- objective;
- current Journey phase;
- discipline ID;
- requested training days;
- requested strength and Engine exposures.

It returns discipline-specific metadata alongside the schedule:

- protected sessions;
- progression rule;
- missed-session rule;
- yellow- and red-readiness actions;
- assessment metrics;
- weekly architecture;
- discipline-library version.

## Frontend behavior

The Plan page now shows a Coaching Library card with:

- discipline philosophy;
- typical weekly architecture;
- current progression rule;
- protected sessions;
- next Continuous Development bias or event assessment focus.

Mission Control shows the current cycle for Continuous Development athletes instead of implying that the Journey ends after the first block.

## Bell Core contract

Plan snapshots now include:

- `discipline`;
- `discipline_library_version`;
- `continuous_policy`;
- cycle state;
- phase progression rules;
- weekly coaching rules.

`GET /api/v1/athletes/{athlete_id}/coaching-state` can resolve later Continuous Development cycles while preserving the original cycle's generated weekly structure as the renewable template.
