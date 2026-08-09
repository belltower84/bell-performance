# Bell Performance Product Blueprint

**Version:** 1.0  
**Applies to:** Bell Performance 13 and later  
**Status:** Product and engineering source of truth

---

## 1. Product Vision

Bell Performance is an AI Performance Coach that continuously plans, adapts, and explains training, nutrition, and recovery so each athlete always knows what to do next and why it matters.

Bell is not primarily a workout generator, a static program library, or a fitness tracker. Workouts, plans, analytics, and recommendations are outputs of the coaching system.

### Product promise

Bell should help an athlete answer five questions at any time:

1. Who am I training to become?
2. What is my current objective?
3. Where am I in my Journey?
4. What is today's Mission?
5. Why is Bell recommending it?

### North-star outcome

Bell becomes the most trusted coach the athlete has because it remains useful when goals change, life interrupts training, recovery declines, progress stalls, or a new event is added.

---

## 2. Core Product Principles

### Coach first

Every screen should help the athlete understand what to do next. Information without guidance is incomplete.

### Explain decisions

Any meaningful recommendation or adjustment must be explainable. Bell should provide a clear reason for workouts, scheduling changes, phase transitions, calorie changes, recovery recommendations, and milestone updates.

### Adapt intelligently

The plan should respond to the athlete rather than force the athlete to follow a rigid calendar. Adaptation should consider readiness, adherence, missed sessions, injuries, equipment, schedule, progress, and event timing.

### Learn over time

Bell should retain useful coaching observations and use them to improve future decisions. Memory must be evidence-based, reviewable, and reversible.

### Keep complexity behind the curtain

Bell may use sophisticated planning logic, but the athlete experience should remain simple, calm, and direct.

### Preserve priorities

When time, recovery, or schedule is constrained, Bell protects the work that matters most to the current objective.

### Progress must remain visible

The athlete should always be able to see the current Phase, Phase week, Journey progress, next milestone, and upcoming transition.

### Consistency over novelty

New features should reuse established terminology, interaction patterns, layout rules, and visual components unless a genuine product need requires a change.

---

## 3. Standard Product Language

Bell uses one consistent vocabulary across onboarding, Mission Control, Training, Journey, Progress, Settings, notifications, and coaching explanations.

| Bell term | Meaning |
|---|---|
| Athlete | The person being coached |
| Identity | The training identity or coaching model |
| Objective | The primary outcome being pursued |
| Journey | The long-term adaptive coaching plan |
| Planning Mode | Event Preparation or Continuous Development |
| Phase | The current block of focused development |
| Phase Week | The current week within a Phase |
| Journey Week | The current week across the full Journey |
| Mission | Today's prescribed training objective |
| Weekly Plan | The current seven-day training schedule |
| Milestone | A meaningful checkpoint or decision point |
| Bell Coach | The explanation and guidance layer |
| Mission Control | The primary dashboard and coaching overview |

### Terms to retire from primary athlete-facing use

- Program
- Routine
- Generic workout plan
- Dashboard
- Season
- Week 1–12 program

Legacy terms may remain internally during migration, but new UI and new data contracts should use the standardized vocabulary.

---

## 4. Athlete Model

Bell separates who the athlete is from what the athlete is trying to achieve.

### Identity

Identity determines the coaching model and training emphasis.

Supported identities should include:

- Performance & Health
- Powerlifter
- Bodybuilder
- Hybrid Athlete
- Tactical Athlete
- Functional Fitness Athlete
- Endurance Athlete

### Objective

Objective determines the current outcome Bell prioritizes.

Supported objectives should include:

- Lose Fat
- Build Muscle
- Body Recomposition
- Increase Strength
- Improve Conditioning
- Improve Performance
- Prepare for Competition
- Maintain Fitness

### Journey

Journey is the adaptive long-term route Bell creates from Identity, Objective, timeline, schedule, equipment, experience, limitations, and progress.

Examples:

- Fat-Loss Transformation
- Strength Development
- Tactical Readiness
- Powerlifting Meet Preparation
- Marathon Preparation
- Continuous Hybrid Development

### Planning Modes

#### Event Preparation

Used when the athlete has a dated competition or event. Bell plans backward from the event, assigns appropriate Phases, and adjusts the remaining timeline when circumstances change.

#### Continuous Development

Used when there is no dated event. Bell still periodizes training through purposeful Phases, assessments, recovery periods, and renewed development cycles. The experience must never present a dead end or an indefinite repeated week.

---

## 5. Coaching Priorities

Every active Journey must have ranked coaching priorities.

Example: fat loss

1. Preserve lean mass
2. Reduce body fat
3. Improve work capacity

Example: powerlifting

1. Improve competition squat
2. Maintain bench progression
3. Preserve aerobic recovery capacity

Priorities guide decisions when Bell must shorten a week, remove a session, alter volume, insert recovery, or resolve conflicting goals.

A lower-ranked priority may never quietly override a higher-ranked priority without an explicit reason.

---

## 6. Bell Coaching Engine

The Bell Coaching Engine is the source of truth for athlete state and coaching decisions.

```text
Athlete Profile
      ↓
Identity + Objective
      ↓
Journey Builder
      ↓
Macrocycle Generator
      ↓
Phase Generator
      ↓
Weekly Scheduler
      ↓
Mission Generator
      ↓
Bell Coach Explanation
      ↓
Completion + Feedback
      ↓
Adaptation + Memory
```

### Engine responsibilities

- Resolve the athlete's current coaching state
- Build or revise a Journey
- Generate Phases and milestones
- Rank current priorities
- Build the Weekly Plan
- Prescribe today's Mission
- Adapt around readiness and schedule changes
- Explain recommendations
- Record outcomes and coaching observations

### Single source of truth

Mission Control, Training, Journey, Progress, Settings, Nutrition, and Recovery should all read from the same coaching state. Individual screens must not independently invent current Phase, week, objective, or planning mode.

### Required athlete state contract

The canonical state should support at least:

```yaml
athlete:
  id: string
  name: string
  identity: string
  experience_level: string
  limitations: []

objective:
  primary: string
  secondary: []
  target_value: optional
  target_date: optional

journey:
  id: string
  name: string
  planning_mode: event_preparation | continuous_development
  status: active | paused | completed
  start_date: date
  target_date: optional
  current_phase_id: string
  journey_week: integer
  total_weeks: optional
  progress_percent: number

phase:
  id: string
  name: string
  purpose: string
  week: integer
  duration_weeks: integer
  objectives: []
  exit_criteria: []
  next_phase_id: optional

priorities:
  - rank: integer
    name: string
    rationale: string

weekly_plan:
  week_start: date
  sessions: []

milestones: []

readiness:
  status: low | moderate | high
  contributing_factors: []

coach:
  summary: string
  next_action: string
  explanation_refs: []
```

The implementation may expand this contract, but it should not fragment these concepts into competing sources.

---

## 7. Journey and Phase Rules

### Journey generation

Bell builds a Journey from:

- Identity
- Objective
- Event and event date, when present
- Available weeks
- Training age and experience
- Available days and session duration
- Equipment and locations
- Limitations and injuries
- Recent training history
- Current readiness and adherence

### Event insertion

When an athlete adds an event during an active Journey, Bell should:

1. Preserve completed training history.
2. Evaluate the current Phase.
3. Finish, shorten, or replace the current Phase as appropriate.
4. Rebuild the remaining Journey backward from the event.
5. Explain what changed and why.

Adding an event must not reset the athlete unless the athlete explicitly chooses a reset.

### Phase requirements

Every Phase must define:

- Name
- Purpose
- Typical duration
- Training priorities
- Weekly exposure targets
- Progression rules
- Recovery rules
- Nutrition intent, when relevant
- Exit criteria
- Likely next Phase

### Phase transitions

Bell may:

- Advance as planned
- Extend the current Phase
- Shorten the current Phase
- Insert a recovery Phase
- Replace the next Phase
- Rebuild the remaining Journey

Every non-routine transition must produce an athlete-facing explanation.

---

## 8. Adaptive Weekly Scheduling

The Weekly Scheduler should consider:

- Current Phase and priorities
- Athlete availability
- Session duration
- Recovery and readiness
- Missed or incomplete Missions
- Event proximity
- Training interference
- Equipment and location
- Required exposure frequency

### Concurrent-training principles

Preferred:

- Upper strength plus engine

Allowed when appropriate:

- Lower strength plus easy engine

Avoid when possible:

- Lower strength plus hard engine
- Lower strength plus long endurance

The coaching library may add discipline-specific constraints.

### Missed Mission behavior

Bell should not blindly shift every missed workout forward. It should determine:

- Whether the session is essential to the current priority
- Whether it can be merged safely
- Whether it should be rescheduled
- Whether it should be dropped
- Whether the week should be rebalanced

The athlete should receive a concise explanation of the change.

---

## 9. Bell Coach and the “Why?” System

Bell Coach is the explanation and guidance layer, not merely a chatbot or motivational text generator.

### Required explanation categories

- Why this Mission?
- Why this exercise or training emphasis?
- Why did my Weekly Plan change?
- Why did Bell change volume or intensity?
- Why did Bell change calories or activity?
- Why am I entering recovery?
- Why did this Phase extend or end?
- Why is this milestone important?

### Explanation standard

A useful explanation should state:

1. The relevant context
2. The decision Bell made
3. The reason for the decision
4. What the athlete should focus on next

Example:

> You are in Week 4 of Strength Development, and squat progression is the highest current priority. Bell preserved today's lower-body session after Tuesday was missed and moved accessory work to Friday so the key exposure remains intact without stacking two hard lower-body days.

### Trust rules

Bell must not fabricate certainty. When data is incomplete, Bell should say what it knows, what it inferred, and what additional information would improve the recommendation.

---

## 10. Athlete Memory

Bell Memory stores durable coaching observations derived from repeated evidence.

Examples:

- Bench responds well to twice-weekly exposure
- Squat fatigue rises after five consecutive high-load weeks
- Athlete consistently has less time on Wednesdays
- Sled work produces high adherence
- Repeating the same accessory selection beyond four weeks reduces adherence

### Memory requirements

Each memory should include:

- Observation
- Evidence source
- Confidence
- Date first observed
- Date last confirmed
- Whether the athlete can review or remove it

Bell should not convert a single occurrence into a permanent coaching rule unless the athlete explicitly states a preference or limitation.

---

## 11. Product Information Architecture

Primary navigation:

1. Mission
2. Training
3. Journey
4. Progress
5. More

### Mission Control

Purpose: Tell the athlete where they are, what matters now, and what to do next.

Required content:

- Bell Coach header
- Current Journey
- Identity and Objective
- Planning Mode
- Current Phase
- Phase Week
- Journey progress
- Today's Mission
- Weekly Plan preview
- Next milestone
- Current coaching explanation

### Training

Purpose: Execute and review prescribed work.

Priority order:

1. Today's Mission
2. Current Weekly Plan
3. Phase objective
4. Completed and upcoming Missions
5. Substitutions and adjustments
6. Workout library as a secondary tool

### Journey

Purpose: Show the long-term coaching route.

Required content:

- Current and upcoming Phases
- Completed Phases
- Phase objectives
- Phase duration
- Milestones
- Event date, when applicable
- Reason for current Phase
- Expected next transition

### Progress

Purpose: Show whether the Journey is working.

Metrics should adapt to Identity and Objective rather than forcing every athlete into the same dashboard.

### More

Contains:

- Settings
- Athlete profile
- Bell Coach
- Help and guided tour
- Account and sync
- Data controls
- Diagnostics and app version

---

## 12. Settings and Onboarding Standards

### Onboarding intent

Bell should ask for the information needed to coach, not ask the athlete to design their own program.

Core questions:

- Who do you want to become?
- What is your primary objective?
- Do you have an event or deadline?
- What is your training experience?
- Which days and how long can you train?
- What equipment and locations are available?
- What injuries or limitations matter?
- What secondary goals should Bell preserve?

### Settings structure

#### Athlete

- Personal details
- Experience
- Training history
- Injuries and limitations

#### Journey

- Identity
- Primary and secondary objectives
- Planning Mode
- Event calendar
- Edit current Journey

#### Training

- Available days
- Session duration
- Equipment
- Locations
- Exercise preferences

#### Nutrition

- Nutrition objective
- Targets
- Dietary preferences
- Check-in settings

#### Recovery

- Sleep target
- Mobility needs
- Readiness prompts
- Recovery preferences

#### Bell Coach

- Coaching detail level
- Cue density
- Notification preferences
- Explanation preferences

#### App and Data

- Connection status
- Sync
- Export
- Diagnostics
- Version
- Reset onboarding
- Reset Journey
- Clear local data

Destructive actions must be visually separated and require clear confirmation.

---

## 13. Design System Standards

### Visual character

- Premium
- Minimal
- Professional
- Calm
- Confident

### Core palette

- Black and charcoal foundations
- Warm gold accents
- White primary text
- Muted gray secondary text

### Layout rules

- Use an 8-point spacing system
- Maintain one dominant action per screen
- Use consistent card hierarchy
- Keep touch targets mobile-friendly
- Preserve safe-area spacing
- Avoid dense walls of controls
- Use progressive disclosure for secondary details

### Page hierarchy

Every page should follow this order:

1. Page identity
2. Current coaching context
3. Primary action
4. Most important information
5. Secondary detail

### Interaction rules

- Active navigation must be obvious
- Buttons must describe the action, not merely say “Continue” when context is unclear
- Empty states must coach the athlete toward the next step
- Errors must explain what happened and how to recover
- Loading states should preserve layout and avoid disruptive jumps
- Modals should be reserved for focused decisions, not routine navigation

### Motion

Animation should clarify hierarchy or state changes. It should be subtle, fast, and never delay the athlete's task.

---

## 14. Bell Voice and Writing Standards

Bell sounds like an experienced coach.

### Voice qualities

- Knowledgeable
- Calm
- Direct
- Supportive
- Honest
- Concise

### Avoid

- Empty hype
- Excessive exclamation points
- Shame or guilt
- Artificial certainty
- Generic motivational filler
- Unexplained technical jargon

### Preferred style

Instead of:

> Let's crush this workout!

Use:

> Today's session builds the lower-body strength needed for the next Phase. Keep the working sets controlled and leave one clean rep in reserve.

---

## 15. Engineering Principles

### Stable contracts before screen-specific logic

New features should extend the coaching-state contract rather than create isolated state stores.

### Backward-compatible migration

Bell should preserve existing athlete history and settings whenever possible. Migration code should translate legacy `program`, `goal`, and `block` values into Journey terminology without data loss.

### Local-first resilience

The app should remain usable when Bell Core is unavailable. Local fallback must not silently produce a contradictory Journey or overwrite newer cloud state.

### Explainable rules

Important coaching decisions should produce a machine-readable reason code and an athlete-facing explanation.

### Deterministic safety layer

High-impact decisions—such as large training-load changes, aggressive calorie changes, or exercise selection around injury limitations—must pass deterministic rules even when AI-generated guidance is used.

### Testing priorities

Every release should test:

- First-time onboarding
- Returning athlete state restoration
- Reset behavior
- Midweek start
- Missed Mission rescheduling
- Continuous Development
- Event insertion
- Phase transitions
- Offline fallback
- Cloud synchronization
- Mobile viewport and safe-area behavior
- Navigation and browser back behavior

---

## 16. Release Roadmap

### 13.0.0 — Unified Experience

- Shared design system
- Primary navigation
- Mission Control dashboard

### 13.1 — Adaptive Planning Engine

- Canonical athlete state
- Journey Builder
- Macrocycle generation
- Phase generation
- Milestones
- Event Preparation
- Continuous Development
- Adaptive Weekly Scheduler

### 13.2 — Coaching Libraries

- Performance & Health
- Powerlifting
- Bodybuilding
- Hybrid
- Tactical
- Functional Fitness
- Endurance

### 13.3 — Athlete Experience

- Settings redesign
- New onboarding
- Athlete profile modernization
- Journey editing
- Event calendar

### 13.4 — Bell Intelligence

- Contextual explanations
- “Why?” system
- Coaching summaries
- Evidence-based athlete memory
- Transparent adaptation history

### Future

- Nutrition coaching
- Recovery and wearables
- Conversational and voice coaching
- Coach, family, team, and organization tools

---

## 17. Feature Review Checklist

Before approving a feature, answer:

- Does it improve Bell's ability to coach?
- Does it simplify the athlete's next decision?
- Does it use standardized product language?
- Does it read from the canonical coaching state?
- Can Bell explain the recommendation?
- Does it preserve the current Journey and history?
- Does it work in both Event Preparation and Continuous Development where relevant?
- Is the primary action clear?
- Does it follow the shared design system?
- Has mobile behavior been tested?

A feature that fails these checks should be revised before implementation.

---

## 18. Non-Negotiables

1. Bell never treats “no event” as “no plan.”
2. Bell never resets completed history merely because an objective or event changes.
3. Bell never presents a major adjustment without a reason.
4. Bell never lets secondary goals silently override the primary coaching priority.
5. Bell never requires the athlete to understand periodization in order to receive good coaching.
6. Bell never allows separate screens to disagree about the current Journey, Phase, or week.
7. Bell never uses athlete memory without evidence or athlete control.
8. Bell never sacrifices clarity for visual novelty.
9. Bell never hides destructive data actions among routine settings.
10. Bell always tells the athlete what to do next.

---

## 19. Definition of Success

Bell succeeds when an athlete can miss training, change goals, add an event, encounter a plateau, or experience poor recovery—and Bell responds with a thoughtful revised plan, a clear explanation, and an obvious next step without losing the athlete's history.

The ultimate standard is not whether Bell can generate a good workout. It is whether the athlete trusts Bell to guide the entire Journey.
