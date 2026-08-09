# Bell Performance 13.3 — Athlete Experience Architecture

Bell 13.3 modernizes the athlete profile, First Flight onboarding, and Settings experience around the Journey-centered Bell Coaching Engine.

## Product hierarchy

Bell now separates the athlete's stable identity from the objective they are pursuing now:

```text
Athlete Profile
  → Training Identity
  → Current Objective
  → Journey Mode
  → Journey
  → Phase
  → Weekly Plan
  → Today's Mission
```

### Training Identity

The identity selects the coaching philosophy:

- Performance & Health
- Hybrid Athlete
- Powerlifting
- Bodybuilding
- Tactical Athlete
- Functional Fitness
- Endurance Athlete

### Objective

The objective tells Bell what matters now. Available objectives change by identity and include fat loss, muscle gain, body recomposition, strength, conditioning, performance, endurance, competition preparation, and maintenance.

### Journey mode

- **Continuous Development** creates renewable phases without requiring an event date.
- **Event Preparation** builds backward from a named event and date.

Changing an objective or adding an event updates the Journey without erasing completed training history.

## Athlete profile schema

The local profile is stored as `athleteProfile.schemaVersion = 1` and includes:

- demographics;
- identity and objective;
- Journey mode, event, and Journey name;
- experience and training age;
- normal training availability;
- strength baselines;
- recovery preferences;
- Bell Coach communication preferences;
- profile-completeness status.

Legacy Bell settings remain synchronized for backward compatibility with existing workout, nutrition, scheduling, and dashboard logic.

Bell Core normalizes the corresponding server profile into snake-case schema version 1. Existing legacy payload aliases remain accepted.

## First Flight

First Flight now uses seven coaching-focused steps:

1. Athlete Profile
2. Training Identity
3. Objective & Journey
4. Availability
5. Training Baseline
6. Recovery & Coaching
7. Launch Review

Powerlifting requires current squat, bench press, and deadlift maxes. Other identities may leave unfamiliar lift maxes blank rather than guessing.

Event Preparation requires both an event name and a future event date. Fat-loss and body-recomposition objectives may include an optional goal-weight milestone.

The existing guided tour still launches after a new athlete completes First Flight. Reopening First Flight from Settings edits the current profile or Journey without replaying the new-athlete tour.

## Athlete Control Center

Settings now opens as an Athlete Control Center with seven consistent panels:

- **Athlete** — demographics, experience, training age, max lifts, and profile completeness.
- **Journey** — identity, objective, planning mode, phase, phase week, next milestone, and advanced Journey controls.
- **Training** — normal training days, session length, preferred time, schedule reliability, equipment, and rotation settings.
- **Nutrition** — current nutrition setup and mission-linked nutrition controls.
- **Recovery** — movement limitations, return status, sleep target, and deload preference.
- **Bell Coach** — explanation detail, check-in frequency, message style, and optional Scripture frequency.
- **App** — help, exercise library, Bell Core connection, diagnostics, backup, restore, and reset.

Existing feature cards are reorganized rather than discarded, preserving their original controls and functions.

## Bell Core profile lifecycle

Bell Core now supports:

```text
POST  /api/v1/athletes
GET   /api/v1/athletes/{athlete_id}
PATCH /api/v1/athletes/{athlete_id}
```

Connected athletes can update profile sections without replacing unrelated maxes, availability, or coaching preferences. Local-first use remains fully supported when Bell Core is unavailable.

## Compatibility rules

- Existing profiles migrate automatically on load.
- Existing max lifts, training history, active blocks, equipment, readiness, nutrition, and Bell Core account data are preserved.
- Modern profile changes continue to populate legacy settings needed by earlier Bell modules.
- No database migration is required.
