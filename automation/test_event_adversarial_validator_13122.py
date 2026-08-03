from __future__ import annotations

import copy
import json
from pathlib import Path

import run_year_simulations as sim
import run_event_adversarial_validation as adv

HERE = Path(__file__).resolve().parent


def item_for_target(concept: str, target: dict, duration: float = 45) -> dict:
    roles = list(target.get("roles", []))
    terms = list(target.get("terms", []))
    item = {
        "label": terms[0].title() if terms else concept,
        "detail": terms[0] if terms else concept,
        "duration": duration,
    }
    if roles:
        item["eventRole"] = roles[0]
    return item


def synthetic_control(spec: dict, adv_spec: dict) -> sim.JourneyRun:
    event_type = spec["eventType"]
    family = spec["family"]
    weeks = []
    start = 35
    count = max(8, int(spec.get("prepWeeks") or 10))
    for offset in range(count):
        number = start + offset
        phase = "Specific Development"
        if offset >= count - 4:
            phase = "Competition Preparation"
        if offset == count - 2:
            phase = "Peak & Taper"
        if offset == count - 1:
            phase = "Event Week"
        weeks.append({
            "globalWeek": number,
            "eventType": event_type,
            "programPhase": phase,
            "phaseName": f"{event_type} Preparation",
            "eventSummary": {"family": family, "scopeStatus": "SCOPE_LIMITED" if spec.get("scopeLimitedWhenUndefined") else "EVENT_SPECIFIC"},
            "plan": [{"label": "General Event Preparation", "duration": 300 if offset < count - 2 else 120, "eventRole": "general_event_preparation"}],
        })

    # Required concepts are represented independently so each mutation is isolated.
    for idx, concept in enumerate(adv_spec.get("requiredConcepts", [])):
        target = dict((adv_spec.get("conceptTargets") or {}).get(concept) or {})
        weeks[min(idx, count - 5)]["plan"].append(item_for_target(concept, target, 45))

    if spec.get("rehearsalMode") == "powerlifting_openers":
        opener_week = weeks[-2]
        opener_week["plan"] = [
            {"label": "Competition Squat — Opener Practice Commands", "eventRole": "competition_squat", "duration": 35},
            {"label": "Competition Bench — Opener Practice Commands", "eventRole": "competition_bench", "duration": 35},
            {"label": "Competition Deadlift — Opener Practice Commands", "eventRole": "competition_deadlift", "duration": 35},
        ]
    elif spec.get("rehearsalRequired", True):
        role = (spec.get("rehearsalRoles") or ["event_rehearsal"])[0]
        duration = max(float(spec.get("minLongMinutes") or 0) + 10, 60)
        weeks[-4]["plan"].append({"label": f"{event_type} Controlled Rehearsal", "eventRole": role, "duration": duration})

    # Ensure taper remains a reduction even after adding concept items to earlier weeks.
    weeks[-2]["plan"] = weeks[-2]["plan"] if spec.get("rehearsalMode") == "powerlifting_openers" else [
        {"label": "Peak & Taper Practice", "eventRole": "taper_practice", "duration": 160}
    ]
    weeks[-1]["plan"] = [{"label": "Event Week Practice", "eventRole": "event_week_practice", "duration": 110}]

    recovery = []
    for number in (start + count, start + count + 1):
        recovery.append({
            "globalWeek": number,
            "eventType": "",
            "programPhase": "Recovery & Absorption",
            "phaseName": "Post-Event Recovery",
            "plan": [{"label": "Easy Recovery Walk + Mobility", "detail": "Restore and easy re-entry", "duration": 30, "eventRole": "recovery"}],
        })
    weeks.extend(recovery)
    phases = [
        {"name": f"{event_type} Preparation", "journeyMode": "event_preparation", "startWeek": start, "endWeek": start + count - 1, "eventType": event_type},
        {"name": "Post-Event Recovery", "journeyMode": "continuous_development", "startWeek": start + count, "endWeek": start + count + 1},
    ]
    return sim.JourneyRun(
        config={"eventValidationId": spec["id"], "id": spec["id"] + "-synthetic"},
        weeks=weeks,
        days=[],
        phases=phases,
        screenshots=[],
        warnings=[],
        checks=[],
        final_state={},
        errors=[],
    )


def main() -> int:
    matrix = json.loads((HERE / "event_validation_matrix.json").read_text(encoding="utf-8"))
    adversarial = json.loads((HERE / "event_adversarial_matrix.json").read_text(encoding="utf-8"))
    specs = {x["id"]: x for x in matrix["eventTypes"]}
    adv_specs = {x["id"]: x for x in adversarial["events"]}
    passed = 0
    total = 0
    failures = []
    for event_id in sorted(specs):
        spec = specs[event_id]
        adv_spec = adv_specs[event_id]
        control = synthetic_control(spec, adv_spec)
        baseline = adv.validate(control, spec, adv_spec)
        total += 1
        if not baseline:
            passed += 1
        else:
            failures.append(f"{event_id} clean: {[x['code'] for x in baseline]}")
        for mutation in adv_spec["mutations"]:
            total += 1
            candidate = adv.mutate(control, spec, adv_spec, mutation)
            details = adv.validate(candidate, spec, adv_spec)
            codes = [x["code"] for x in details]
            expected = [adv.expected_code(event_id, mutation)]
            verification = adv.verify_mutation(control, candidate, spec, adv_spec, mutation)
            if codes == expected and verification["passed"]:
                passed += 1
            else:
                failures.append(
                    f"{event_id}/{mutation['id']}: expected={expected} detected={codes} verification={verification}"
                )
    print(f"Synthetic event adversarial calibration: {passed}/{total} cases passed")
    for failure in failures:
        print("FAIL:", failure)
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
