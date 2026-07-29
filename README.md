# Bell Performance 13.2.0 — Discipline Coaching Libraries

Bell Performance is a local-first adaptive coaching application. Version 13.2 adds discipline-specific coaching libraries and renewable Continuous Development cycles to the Journey-centered Bell Coaching Engine.

## Product blueprint

Bell 13 and later are governed by [`BELL_PRODUCT_BLUEPRINT.md`](BELL_PRODUCT_BLUEPRINT.md). It defines the product language, coaching architecture, design standards, adaptive-planning rules, and release roadmap.

## Bell 13.2 coaching model

```text
Athlete Identity
  → Objective
  → Journey
  → Discipline Coaching Library
  → Current Phase
  → Weekly Plan
  → Today's Mission
```

Supported libraries:

- Performance & Health
- Powerlifting
- Bodybuilding
- Hybrid Athlete
- Tactical Athlete
- Functional Fitness
- Endurance Athlete

Each library defines weekly architecture, protected sessions, progression, readiness adjustments, missed-session behavior, assessments, and Continuous Development bias rotation.

## Continuous Development

Athletes without a dated event move through renewable development cycles. Bell tracks the current cycle, cycle week, current bias, and next bias without resetting completed training history.

## Event Preparation

Dated events still build backward from competition day. Discipline-specific peaking, specificity, and taper rules control the final phases.

## Mission Control and Plan

Mission Control displays Journey, Phase, Phase Week, cycle status, progress, and the next milestone. The Plan page displays the full phase timeline and a Coaching Library card explaining how Bell is coaching the athlete.

See [`BELL_COACHING_ENGINE_13_2.md`](BELL_COACHING_ENGINE_13_2.md) and [`RELEASE_NOTES_13_2_0.md`](RELEASE_NOTES_13_2_0.md).

## Connected experience

- Register or sign in to Bell Core from Settings.
- Sync the athlete profile, mission, discipline, Journey, and multiweek plan.
- Submit readiness and receive discipline-aware adaptation.
- Start and complete Bell Core sessions in the existing guided workout player.
- Preserve offline operation when Bell Core is unavailable.

## Local use

Serve the files over HTTP:

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

Version 13.2.0 ships with 21 passing backend tests plus JavaScript, HTML, manifest, and archive validation.
