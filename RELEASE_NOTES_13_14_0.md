# Bell Performance 13.14.0 — Longitudinal Adaptive Coaching

## Purpose

13.13.0 proved that Bell could make correct individual athlete-response decisions. 13.14.0 adds a longitudinal stability layer so a sequence of individually reasonable decisions remains coherent across an 8–16 week training block and beyond.

## New coaching behavior

- Progression cooldowns prevent consecutive load increases before adaptation can be observed.
- Accelerated progression requires sufficient evidence and more spacing than normal progression.
- Pain and safety holds create two- or three-exposure re-entry locks.
- Repeated regressions are consolidated rather than compounded into a downward spiral.
- Repeated low-readiness or difficult exposures can trigger one two-exposure deload.
- Deloads cannot repeat until the required exposure cooldown has passed.
- Taper, event week, competition, and post-event recovery phases block upward progression.
- Strength-load, strength-volume, and engine-duration targets retain independent histories.
- Temporary holds reduce the current prescription without erasing previously earned targets.
- Cumulative targets are capped at 110% strength intensity, 115% strength volume, and 120% engine duration.
- Dose adaptation never removes canonical event-specific training roles.

## Athlete-facing changes

The Athlete Response card now reports:

- the longitudinal decision;
- current phase;
- comparable exposure count;
- accumulated fatigue score;
- current strength, volume, and engine factors.

## Bell Core

Structured completions now store both:

- the raw single-session response; and
- the stabilized longitudinal decision and state.

The adaptive-progression profile schema is now version 2. No database migration is required because the state remains inside the athlete profile JSON.
