from __future__ import annotations

import run_event_validation as validation


def item(label: str, duration: float = 60, **roles: str) -> dict:
    return {"label": label, "duration": duration, **roles}


def main() -> int:
    powerlifting = [{
        "globalWeek": 45,
        "plan": [
            item("Competition Squat — Opener Practice Commands", exerciseRole="competition_squat"),
            item("Competition Bench — Opener Practice Commands", exerciseRole="competition_bench"),
            item("Competition Deadlift — Opener Practice Commands", exerciseRole="competition_deadlift"),
        ],
    }]
    assert validation.rehearsal_evidence(powerlifting, {"rehearsalMode": "powerlifting_openers"})

    crossfit = [{"globalWeek": 37, "plan": [item("Olympic Lift + Gymnastics Skill", eventRole="strength_skill")]}]
    assert not validation.rehearsal_evidence(crossfit, {"rehearsalRoles": ["crossfit_simulation"]})
    crossfit[0]["plan"].append(item("CrossFit Competition Simulation", 70, eventRole="crossfit_simulation"))
    assert validation.rehearsal_evidence(crossfit, {"rehearsalRoles": ["crossfit_simulation"]})

    physique = [{
        "globalWeek": 27,
        "plan": [
            item("Chest & Back — Individual Profile", physiqueRole="resistance_upper"),
            item("Legs — Individual Profile", physiqueRole="resistance_lower"),
        ],
    }]
    upper, upper_detail = validation.concept_result(physique, ["resistance_upper", "physique upper", "hypertrophy"])
    lower, lower_detail = validation.concept_result(physique, ["resistance_lower", "physique lower", "legs"])
    assert upper, upper_detail
    assert lower, lower_detail

    dose, detail = validation.long_or_simulation_minutes(
        [{"globalWeek": 44, "plan": [item("Race-Specific Brick", 100, eventRole="brick_rehearsal")]}],
        {"doseRoles": ["long_brick", "brick_rehearsal"]},
    )
    assert dose == 100, detail

    print("PASS: 13.12.2 context-aware rehearsal, physique, and canonical-dose detectors calibrated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
