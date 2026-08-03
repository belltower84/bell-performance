from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import run_event_validation as validation  # noqa: E402


def item(label: str, duration: float = 60, **roles: str) -> dict:
    return {"label": label, "duration": duration, **roles}


def main() -> int:
    powerlifting = [{
        "globalWeek": 45,
        "plan": [
            item("Competition Squat — Opener Practice", exerciseRole="competition_squat"),
            item("Competition Bench — Opener Practice", exerciseRole="competition_bench"),
            item("Competition Deadlift — Opener Practice", exerciseRole="competition_deadlift"),
        ],
    }]
    evidence = validation.rehearsal_evidence(powerlifting, {"rehearsalMode": "powerlifting_openers"})
    assert evidence, "Powerlifting opener practice should count as controlled meet rehearsal"

    crossfit_clean = [{
        "globalWeek": 37,
        "plan": [
            item("Primary Upper Strength", eventRole="strength_skill"),
            item("Olympic Lift + Gymnastics Skill", eventRole="strength_skill"),
            item("Aerobic Recovery + Skill", eventRole="aerobic_recovery"),
        ],
    }]
    assert not validation.rehearsal_evidence(crossfit_clean, {"rehearsalRoles": ["crossfit_simulation"]}), (
        "Ordinary strength and skill sessions must not satisfy the competition-simulation detector"
    )
    crossfit_clean[0]["plan"].append(item("Competition Simulation", 70, eventRole="crossfit_simulation"))
    assert validation.rehearsal_evidence(crossfit_clean, {"rehearsalRoles": ["crossfit_simulation"]})

    physique = [{"globalWeek": 45, "plan": [item("Legs — Peak Week Fatigue Reduction", 35, physiqueRole="resistance_lower")]}]
    found, detail = validation.concept_result(physique, ["resistance_lower", "legs"])
    assert found, detail

    dose, detail = validation.long_or_simulation_minutes(
        [{"globalWeek": 44, "plan": [item("Race-Specific Brick", 100, eventRole="brick_rehearsal")]}],
        {"doseRoles": ["long_brick", "brick_rehearsal"]},
    )
    assert dose == 100, detail

    print("PASS: context-aware rehearsal, physique, and canonical dose detectors calibrated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
