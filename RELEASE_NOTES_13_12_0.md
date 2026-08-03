# Bell Performance 13.12.0 — Event-Type Scientific Validation

## Purpose

13.12.0 expands Bell's locked 13.11.2 discipline baseline into clean-control validation for every event type currently selectable during First Flight.

## Coverage

The suite contains 16 deterministic 52-week athlete journeys:

- 5K Race
- 10K Race
- Half Marathon
- Marathon
- Cycling Time Trial
- Triathlon
- HYROX
- CrossFit Competition
- Combat Sports Tournament
- Powerlifting Meet
- Strongman Competition
- Tactical Games
- Military / Law-Enforcement Fitness Test
- Custom Sport Event
- Obstacle Course Race
- Bodybuilding / Physique Competition

## Validation dimensions

Each journey audits:

- correct event-family routing;
- persistence of the selected event type and preparation length;
- general, build, specific, competition, taper, and event-week architecture;
- event-specific training concepts and controlled rehearsal;
- event-distance or event-demand dose differentiation;
- pre-event volume reduction without deleting specific practice;
- post-event recovery;
- formal-week completeness, runtime stability, and time feasibility;
- execution under the 90% target-compliance condition.

## Scientific scope

`automation/event_evidence_sources.json` records the primary research, systematic reviews, and position stands used to define conservative guardrails. A passing result supports prescription structure and internal validity only. It does not prove that projected performance outcomes will occur.

`Custom Sport Event` is explicitly treated as a scope-limited fallback. It cannot be considered sport-specific until the event's movement, duration, intensity, equipment, and scoring demands are defined.

## Run

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\automation\run-event-validation.ps1
```

The report is written to:

```text
automation\event_validation_reports\latest\index.html
```
