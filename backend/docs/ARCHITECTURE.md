# Bell Core 0.3.0 architecture

Bell Core owns authentication, persistence, orchestration, and decision auditability. Intelligence modules are deterministic and side-effect free where practical. Database writes are concentrated in the application service layer.

## Planning path

```text
Mission API request
  → Bell Coaching Language parse
  → Mission Compiler
  → Journey Planning Engine
  → Periodization Engine
  → Block Programming Engine
  → Performance Forecast
  → Goal Probability
  → Competition Intelligence
  → Nutrition Periodization
  → Pattern Recognition
  → Digital Twin Simulation
  → Weekly Planning Engine
  → Session Builder
  → Exercise Selection Engine
  → immutable Plan snapshot
  → plan-generation Decision trace
```

The Journey Planning Engine converts identity, objective, timeline, and program metadata into the canonical macrocycle state consumed by Mission Control. The long-horizon Intelligence Orchestrator coordinates the remaining engines through Digital Twin selection. Bell Core then invokes Weekly Planning, Session Builder, and Exercise Selection separately so session-level decisions remain inspectable.

## Daily path

```text
Daily check-in
  → Adaptive Coaching readiness score and first-pass adaptation
  → Athlete State projection from immutable events
  → Coaching Reasoning competing-action evaluation
  → Bell Coaching Language daily rule evaluation
  → Pattern Recognition
  → revised current session
  → immutable daily-adaptation Decision trace
```

The final session may proceed, be modified, swapped, moved, converted to recovery, deloaded, or escalated according to safety and mission constraints.

## Completion path

```text
Idempotent session completion
  → workout_completed event
  → Athlete State projection
  → Learning Engine bounded parameter update
  → learning_updated event
  → refreshed state and intelligence summary
```

## Data responsibilities

### Application database

Stores:

- users and credentials;
- athletes and ownership;
- missions;
- immutable plan snapshots;
- daily check-ins;
- session completions;
- athlete events;
- coaching decisions;
- idempotency records.

### Exercise knowledge base

`database/bckb_v1.3.0.sqlite` is the controlled exercise catalog and relationship graph used by Session Builder and Exercise Selection. It is not the source of athlete history.

## Auditability

- Athlete state is reproducible from ordered events.
- Plans preserve the exact engine outputs and engine manifest used at generation time.
- Daily adaptation records preserve the original session, revised session, adaptive result, reasoning candidates, explanation, evidence references, Bell Coaching Language rules, and recognized patterns.
- Completion retries are protected by idempotency records.

## Deployment boundary

Bell Performance is a static frontend. Bell Core is a separate Python API backed by PostgreSQL in production. The frontend never owns authoritative coaching state when cloud coaching is connected, but it retains local-first functionality for offline use.

## Not included in v0.3.0

- Bell Validation Framework benchmark and certification system
- Coach Debate Engine
- clinical decision support
- external identity provider integration
- refresh-token rotation
- job queues and distributed workers
- production observability and rate limiting
