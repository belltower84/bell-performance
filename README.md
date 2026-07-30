# Bell Performance 13.7.4 — Guided Tour Visibility

Bell Performance is a local-first training application with Bell Coach and Workout Planner control modes. Version 13.7.4 strengthens the contextual guided tour with a larger coaching panel, a reliable spotlight cutout, and brighter focus treatment across mobile and desktop.

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
