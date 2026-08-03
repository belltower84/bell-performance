## Current build

Bell Performance 13.16.2 — Full-Stack Journey Session Discovery Repair

See `RELEASE_NOTES_13_15_0.md` and `VALIDATION_13_15_0.md`. Bell now converts the stabilized longitudinal coaching decision into the next comparable future prescription, applies the change exactly once, preserves event identity and channel separation, and persists the application through local and Bell Core state.

# Bell Performance 13.7.5 — Settings Flow Rebuild

Bell Performance is a local-first training application with Bell Coach and Workout Planner control modes. Version 13.7.5 rebuilds the Settings follow-on screens into a cleaner expandable flow that matches the Control Center home page.

## Product blueprint

Bell 13 and later are governed by [`BELL_PRODUCT_BLUEPRINT.md`](BELL_PRODUCT_BLUEPRINT.md). It defines the product language, coaching architecture, design standards, adaptive-planning rules, and release roadmap.

## Bell 13 athlete profile

```text
Athlete Profile
  → Training Identity
  → Current Objective
  → Journey Mode
  → Journey
  → Current Phase
  → Weekly Plan
  → Today's Mission
```

Bell separates who the athlete is becoming from the objective being pursued now. A Powerlifter can pursue Body Recomposition, a Performance & Health athlete can prepare for a race, and any identity can continue purposeful development without a dated event.

## First Flight

The seven-step onboarding flow captures:

- athlete profile, Sex, current and desired weight;
- optional strength, Olympic-lifting, and endurance baselines;
- application control mode and training identity;
- Continuous Development or Event Preparation, followed by the specific objective or event;
- normal training availability and session length;
- experience and current limitations;
- recovery and communication preferences with live message previews;
- final Journey review.

Readiness is collected after First Flight with the same 10-second check-in used every day. The guided tour begins after that first check-in and finishes on the dashboard without reopening onboarding.

## Settings Control Center

Settings opens on six focused destinations:

- Athlete Profile
- Mission & Program
- Training Setup
- Recovery & Nutrition
- Bell Behavior
- Help & Data

Existing equipment, limitation, nutrition, Bell Core, advanced Journey, backup, and help controls remain available inside the new structure. Manual program overrides stay collapsed until the athlete deliberately opens advanced controls.

## Connected experience

- Register or sign in to Bell Core from Settings.
- Create, retrieve, and partially update the normalized athlete profile.
- Sync the current mission, discipline, Journey, and multiweek plan.
- Submit readiness and receive discipline-aware adaptation in Bell Coach mode. Workout Planner keeps readiness local and informational.
- Start and complete Bell Core sessions in the guided workout player.
- Continue using Bell locally when Bell Core is unavailable.

## Documentation

- [`BELL_PRODUCT_BLUEPRINT.md`](BELL_PRODUCT_BLUEPRINT.md)
- [`BELL_ATHLETE_EXPERIENCE_13_3.md`](BELL_ATHLETE_EXPERIENCE_13_3.md)
- [`BELL_COACHING_ENGINE_13_2.md`](BELL_COACHING_ENGINE_13_2.md)
- [`RELEASE_NOTES_13_7_3.md`](RELEASE_NOTES_13_7_3.md)
- [`VALIDATION_13_7_3.md`](VALIDATION_13_7_3.md)
- [`REAL_WORLD_TESTING_13_7_3.md`](REAL_WORLD_TESTING_13_7_3.md)

## Local use

Serve the frontend over HTTP:

```bash
python -m http.server 5173
```

Run Bell Core from `backend/`:

```bash
uvicorn app.main:app --reload
```

## Validation

Run backend tests from `backend/`:

```bash
pytest -q
```

Version 13.4.0 ships with **28 passing backend tests**, JavaScript and Python compilation checks, CSS/HTML/manifest validation, profile migration smoke tests, and archive-integrity checks.


## Bell Coach Intelligence (13.4)

Bell Coach now produces structured explanations, separates known facts from inference and missing data, maintains athlete-reviewable coaching memory, and exposes an auditable decision history. See `BELL_COACH_INTELLIGENCE_13_4.md`.

## Bell Performance 13.5.0
13.5.0 introduces the Commercial Athlete Experience foundation: a simplified Home dashboard, familiar Home/Train/Plan/Progress/More navigation, Guided and Advanced display modes, and a clearer path from daily readiness to starting training. Bell 13.4 coaching intelligence and data contracts remain intact.

## Bell Performance 13.5.1
13.5.1 refines the commercial Home dashboard with balanced card geometry, consistent spacing, a selectable weekly calendar with an in-card day summary, and a workflow-based desktop sidebar: Home, Train, Plan, Progress, Coach, Recovery, Nutrition, Library, and More.




## Bell Performance 13.7.3
13.7.3 replaces the legacy slide walkthrough with an eight-step contextual tour that spotlights the current Dashboard, Workouts screen, and primary navigation. It also repairs replay return behavior and first-flight completion state.

## Bell Performance 13.7.2
13.7.2 rebuilds First Flight, separates Continuous Development from Event Preparation, expands optional athlete baselines, moves readiness to the standard daily check-in, repairs the guided-tour completion route, and aligns physique, powerlifting, endurance, tactical, cycling, and functional events with their correct coaching families.

## Bell Performance 13.6.5
13.6.5 streamlines recovery-only days. **Start Recovery** now opens the prescribed recovery session immediately, **View Recovery** is functional, and **Recovery Options** retains access to readiness and recovery controls without forcing an extra drawer step before training.

## Bell Performance 13.6.4
13.6.4 fixes Settings dropdown contrast and replaces the always-open equipment checkbox wall with a responsive training-location table. Each location shows its environment, active status, and equipment summary; **Edit** opens the full equipment selector only when needed.

## Bell Performance 13.6.3
13.6.3 replaces the long Settings page with a compact control-center home and focused pages for Athlete Profile, Mission & Program, Training Setup, Recovery & Nutrition, Bell Behavior, and Help & Data.


## Bell Performance 13.7.4
13.7.4 improves guided-tour visibility and focus. The guide panel is larger and brighter, the active interface element is isolated with a dedicated spotlight frame, and geometry now stays synchronized during scrolling and resizing.


## 13.11.0 Discipline-Wide Validation
Run `.\automation\run-discipline-validation.ps1` to simulate all seven canonical coaching disciplines for 52 weeks at the real-world 90% target-compliance condition.




## 13.12.2 Event-Type Adversarial Validation
Run `./automation/run-event-adversarial-validation.ps1` in PowerShell to generate all 16 clean event controls and apply five deliberate corruptions to each one. The 96-case suite uses differential scoring, mutation verification, canonical event roles, context-aware duplicate suppression, and explicit `SCOPE_LIMITED` handling for undefined custom events.

## 13.12.3 Adversarial Mutation Isolation Repair
The event adversarial harness now uses precise concept targets and duration-preserving mutations. Concept and rehearsal corruptions neutralize only their intended canonical evidence, dose corruptions redistribute removed minutes to noncanonical support work, and every case audits taper, rehearsal, dose, recovery, routing, scope, weekly minutes, and non-target concepts. A compound mutation is rejected as `CONTROL_MUTATION_INVALID` instead of being scored as a valid negative control.

## 13.12.1 Event Routing & Clean-Control Calibration
Run `./automation/run-event-validation.ps1` in PowerShell to simulate all 16 selectable event types through clean 52-week controls at the 90% target-compliance condition. Event-critical sessions are protected by canonical roles during schedule adaptation, rehearsal checks are context-aware, running events expose their target identity and differentiated dose, and undefined custom events are reported as `SCOPE_LIMITED` rather than presented as sport-specific.



## 13.14.0 Longitudinal Adaptive Coaching

Bell now evaluates athlete response across complete multi-week trajectories rather than treating each correct session decision as an isolated event.

- progression cooldowns prevent repeated increases before the previous change is absorbed;
- protective and safety decisions require measured pain-free re-entry;
- repeated regressions are consolidated instead of compounded;
- accumulated fatigue can trigger a spaced two-exposure deload;
- taper, event week, and post-event recovery block upward progression;
- strength and engine targets maintain independent longitudinal histories;
- cumulative load, volume, and endurance-duration targets have hard ceilings;
- event-specific roles remain intact while only dose is adjusted.

Run the longitudinal suite:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-longitudinal-adaptation-validation.ps1
```

## 13.13.0 Athlete Response & Adaptive Progression

Strength sessions now retain planned and completed load, repetitions, sets, per-set RPE, and reps in reserve. Engine sessions retain time, distance, pace, heart rate, and elevation. Bell combines these completed-performance inputs with session difficulty, pain, technique, readiness, and recent consistency before changing the next prescription.

Run the deterministic validation suite:

```powershell
.\automation\run-athlete-response-validation.ps1
```

Acceptance: **30/30 response cases**, JavaScript/Python parity, and all backend regression tests pass.
## 13.15.0 Closed-Loop Prescription Application

Bell now closes the loop between athlete-response analysis and the actual future workout. A stabilized longitudinal decision is converted into a deterministic prescription application, routed to the next comparable strength or engine exposure, and applied exactly once.

- strength progression changes the intended load, set count, or effort target;
- engine progression changes only the intended duration;
- movement-specific holds, regressions, and protections affect only the matching exercise;
- safety holds replace the next hard exposure with recovery;
- completed or consumed targets are skipped during retargeting;
- canonical event and session roles remain intact;
- local and Bell Core application identifiers prevent duplicate scaling.

Run the closed-loop suite:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\automation\run-closed-loop-prescription-validation.ps1
```

Acceptance: **20/20 browser/Bell Core parity cases**, all backend regressions, and the locked athlete-response, longitudinal, and event-adversarial suites pass.



## 13.16.0 Real-World Athlete Simulation & Chaos Testing

Bell now normalizes malformed completion telemetry, fingerprints and rejects duplicate completions, scores evidence quality, and withholds upward adaptation when input is sparse or contradictory. The deterministic chaos suite covers 120 multi-week journeys and more than 2,000 completed, missed, duplicated, painful, interrupted, or malformed exposures.

## 13.16.1 Full-Stack Athlete Journey Replay

Bell now includes a deep browser-driven replay suite that generates and advances real eight-week athlete plans. Unlike the fast chaos suite, the replay does not assign coaching statuses directly. Completion data is derived from actual Bell prescriptions and passed through the real athlete-response, longitudinal, and closed-loop application engines.

Run `automation/run-full-stack-athlete-journeys.ps1` on Windows and open `automation/full_stack_journey_reports/latest/index.html`.


## 13.16.2 Full-Stack Journey Session Discovery Repair

Repairs the browser replay harness so sessions returned by `sessionsFromPlanItem()` are classified through Bell's canonical mission classifier rather than requiring a nonexistent `sessionType` field. Every generated week now performs an executable-session preflight, and a zero-session week fails immediately with `JOURNEY_SESSION_DISCOVERY_FAILED`.

## 13.16.7 — Taper Window Fidelity & Pending Application Revalidation

This release evaluates taper protection from the actual target session phase and revalidates queued closed-loop applications before they can alter a protected prescription. Run `node automation/test-taper-application-revalidation-13167.js` for the direct guard suite and `automation/run-full-stack-athlete-journeys.ps1` for the browser replay.

## 13.17.1: durable athlete data storage and history compaction

Run six one-year full-stack journeys that include goal changes, track changes, injuries, recovery, and multiple reloads:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\automation\run-dynamic-52-week-athlete-journeys.ps1
```

Open `automation\dynamic_52_week_reports\latest\index.html` after completion.


### Durable storage architecture

13.17.1 keeps the active coaching state and recent training window in the boot-critical `bellPerformanceV2` local-storage document while moving older detailed records into the `bellPerformanceDurable` IndexedDB archive. Compact summaries remain locally available for longitudinal context. Storage diagnostics are exposed through `window.bellStorageDiagnostics()`.

Run the storage stress test with:

```powershell
node .\automation\test-durable-storage-13171.js
```


## 13.17.3: protective status semantics and long-horizon baseline lock

The 52-week validation runner now treats `safety_hold` as a first-class active-injury protection status alongside `protect`, `hold`, `regress`, `deload`, and `rebuild`. Active-injury weeks must contain only protective statuses and must contain no `progress` or `accelerate` decisions. Return weeks continue to require conservative re-entry behavior.


## 13.17.3: concurrent session counting and Engine placement repair
Nested Engine support now counts toward weekly exposure targets, repaired sessions have valid durations, and ordinary plans are limited to one required Engine session per day.


## 13.17.3: concurrent session counting and Engine placement repair
Nested Engine support now counts toward weekly exposure targets, repaired sessions have valid durations, and ordinary plans are limited to one required Engine session per day.


## 13.17.4: atomic session identity and workout title integrity

- Preserves complete strength-workout titles when concurrent sessions are split into atomic records.
- Prevents the title cleaner from consuming the first letter of words such as Press.
- Rejects malformed fragments such as `ress`, `ngth`, and `ine`, with a safe template or mission fallback.
- Adds a focused seven-check title-integrity regression suite.
