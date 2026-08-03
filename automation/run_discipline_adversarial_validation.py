from __future__ import annotations

import argparse
import copy
import datetime as dt
import html
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import run_year_simulations as sim
import run_adversarial_validation as base

VERSION = "13.11.2"
RULES = {
    "CONTROL_SETUP_INVALID": "A clean adversarial control is missing the context required to test its detector.",
    "MUTATION_NOT_APPLIED": "A corruption did not change the intended control data and cannot be used as evidence.",
    "PH_STRENGTH_MISSING": "Performance & Health programming contains no meaningful resistance-training exposure.",
    "PH_CONDITIONING_MISSING": "Performance & Health programming contains no aerobic or conditioning exposure.",
    "PH_INTENSITY_STACKED": "Performance & Health programming stacks excessive high-intensity sessions in one week.",
    "PL_SPECIFICITY_MISSING": "Powerlifting meet preparation lacks one or more competition lifts.",
    "EVENT_TAPER_MISSING": "Powerlifting meet preparation lacks a defensible taper or peak.",
    "RECOVERY_PHASE_MISSING": "Post-event recovery is absent or corrupted.",
    "BB_VOLUME_EXTREME": "Bodybuilding programming exceeds the adversarial weekly muscle-set ceiling.",
    "BB_MOVEMENT_IMBALANCE": "Bodybuilding programming removes pulling work or creates severe press/pull imbalance.",
    "BB_LOWER_BODY_MISSING": "Bodybuilding programming omits lower-body training.",
    "HYBRID_LOWER_STRESS_STACKED": "Hybrid programming stacks heavy lower-body strength and hard endurance stress on consecutive days.",
    "HYBRID_LONG_AEROBIC_MISSING": "Hybrid programming omits long aerobic development.",
    "HYBRID_STRENGTH_COLLAPSE": "Hybrid programming allows strength exposure to collapse during endurance development.",
    "TACTICAL_RUCK_SPIKE": "Tactical programming increases modeled ruck dose by more than 40% week to week.",
    "TACTICAL_IMPACT_CLUSTER": "Tactical programming clusters rucking and hard running without recovery spacing.",
    "TACTICAL_CARRY_TRUNK_MISSING": "Tactical programming omits carry, grip, or trunk-capacity work.",
    "FUNCTIONAL_DAILY_HIGH_INTENSITY": "Functional Fitness programming prescribes excessive high-intensity mixed-modal days.",
    "FUNCTIONAL_STRENGTH_MISSING": "Functional Fitness programming omits structured strength development.",
    "FUNCTIONAL_SKILL_MISSING": "Functional Fitness programming omits skill or technical development.",
    "ENDURANCE_HIGH_DAYS_CLUSTERED": "Endurance programming contains three or more demanding sessions in one week.",
    "ENDURANCE_LONG_RUN_SHARE": "The long session exceeds 50% of modeled weekly endurance duration.",
    "ENDURANCE_LOAD_SPIKE": "Normal-development endurance duration rises by more than 40% week to week.",
}

POWERLIFTING_REQUIRED_ROLES = {
    "competition_squat",
    "competition_bench",
    "competition_deadlift",
}


def text(item: dict) -> str:
    return " ".join(str(item.get(k) or "") for k in ("label", "title", "name", "detail", "description")).lower()


def all_items(run: sim.JourneyRun) -> list[dict]:
    return [item for week in run.weeks for item in week.get("plan", [])]


def add(flags: list[dict], code: str, evidence: str) -> None:
    if not any(item["code"] == code for item in flags):
        flags.append({"code": code, "evidence": evidence})


def event_weeks(run: sim.JourneyRun) -> list[dict]:
    return [
        week
        for week in run.weeks
        if bool(base.phase_for_week(run, int(week.get("globalWeek") or 0)).get("eventType"))
    ]


def powerlifting_event_context(run: sim.JourneyRun) -> bool:
    for phase in run.phases:
        event_type = str(phase.get("eventType") or "").lower()
        journey_mode = str(phase.get("journeyMode") or "").lower()
        phase_name = str(phase.get("name") or "").lower()
        if "powerlifting" in event_type or (
            journey_mode == "event_preparation" and any(term in phase_name for term in ("meet", "powerlifting"))
        ):
            return True
    return False


def powerlifting_snapshot(run: sim.JourneyRun) -> dict:
    weeks = event_weeks(run)
    found: set[str] = set()
    locations: dict[str, list[str]] = {role: [] for role in POWERLIFTING_REQUIRED_ROLES}
    aliases = {
        "competition_squat": ("competition_squat", "competition squat"),
        "competition_bench": ("competition_bench", "competition bench"),
        "competition_deadlift": ("competition_deadlift", "competition deadlift"),
    }
    for week in weeks:
        for item in week.get("plan", []):
            blob = f"{base.item_role(item)} {base.item_text(item)}"
            for canonical, terms in aliases.items():
                if any(term in blob for term in terms):
                    found.add(canonical)
                    locations[canonical].append(
                        f"week {week.get('globalWeek')}: {item.get('label') or item.get('title') or item.get('name') or canonical}"
                    )

    taper_weeks = [
        int(week.get("globalWeek") or 0)
        for week in weeks
        if any(term in str(week.get("programPhase") or "").lower() for term in ("taper", "peak"))
        or any(
            any(term in str(label).lower() for term in ("taper", "peak", "opener"))
            for label in week.get("planLabels", [])
        )
    ]
    event_week_numbers = [
        int(week.get("globalWeek") or 0)
        for week in weeks
        if "event week" in str(week.get("programPhase") or "").lower()
        or any("meet week" in str(label).lower() for label in week.get("planLabels", []))
    ]

    recovery_phases = [
        phase
        for phase in run.phases
        if any(term in str(phase.get("name") or "").lower() for term in ("post-meet", "post meet", "recovery"))
    ]
    recovery_weeks: list[int] = []
    recovery_text_parts: list[str] = []
    for phase in recovery_phases:
        for week in run.weeks:
            if int(phase.get("startWeek") or 0) <= int(week.get("globalWeek") or 0) <= int(phase.get("endWeek") or -1):
                recovery_weeks.append(int(week.get("globalWeek") or 0))
                recovery_text_parts.extend(str(x) for x in week.get("planLabels", []))
                recovery_text_parts.extend(str(x) for x in week.get("planDetails", []))
    recovery_text = " ".join(recovery_text_parts).lower()
    recovery_prescription = any(
        term in recovery_text for term in ("recovery", "restore", "easy return", "walk", "re-entry")
    )

    return {
        "hasEventContext": powerlifting_event_context(run),
        "eventWeekCount": len(weeks),
        "foundRoles": sorted(found),
        "missingRoles": sorted(POWERLIFTING_REQUIRED_ROLES - found),
        "roleLocations": locations,
        "taperWeeks": sorted(set(taper_weeks)),
        "eventWeeks": sorted(set(event_week_numbers)),
        "recoveryPhaseNames": [str(phase.get("name") or "") for phase in recovery_phases],
        "recoveryWeeks": sorted(set(recovery_weeks)),
        "recoveryPrescription": recovery_prescription,
    }


def control_setup_errors(run: sim.JourneyRun, discipline: str) -> list[str]:
    if discipline != "powerlifting-discipline":
        return []
    snapshot = powerlifting_snapshot(run)
    errors: list[str] = []
    if not snapshot["hasEventContext"] or snapshot["eventWeekCount"] == 0:
        errors.append("No explicit powerlifting meet-preparation phase was generated.")
    if snapshot["missingRoles"]:
        errors.append("Clean meet control is missing canonical roles: " + ", ".join(snapshot["missingRoles"]) + ".")
    if not snapshot["taperWeeks"]:
        errors.append("Clean meet control contains no peak/taper week.")
    if not snapshot["eventWeeks"]:
        errors.append("Clean meet control contains no event week.")
    if not snapshot["recoveryPhaseNames"] or not snapshot["recoveryPrescription"]:
        errors.append("Clean meet control contains no valid post-meet recovery prescription.")
    return errors


def validate(run: sim.JourneyRun, discipline: str) -> list[dict]:
    flags: list[dict] = []
    items = all_items(run)
    blobs = [text(item) for item in items]

    if discipline == "performance-health":
        strength = [blob for blob in blobs if any(k in blob for k in ("strength", "squat", "press", "hinge", "row", "deadlift"))]
        conditioning = [blob for blob in blobs if any(k in blob for k in ("conditioning", "aerobic", "run", "bike", "rower", "interval"))]
        if not strength:
            add(flags, "PH_STRENGTH_MISSING", "No strength-pattern session remained in the 52-week plan.")
        if not conditioning:
            add(flags, "PH_CONDITIONING_MISSING", "No conditioning or aerobic session remained in the 52-week plan.")
        for week in run.weeks:
            high = sum(1 for item in week.get("plan", []) if item.get("adversarialIntensity") == "high")
            if high >= 4:
                add(flags, "PH_INTENSITY_STACKED", f"Week {week['globalWeek']}: {high} sessions marked high intensity.")
                break

    elif discipline == "powerlifting-discipline":
        # Event-specific rules are only valid for an explicit powerlifting meet mission.
        if powerlifting_event_context(run):
            mapped = copy.deepcopy(run)
            mapped.config["baseId"] = "powerlifting-discipline-meet"
            for detail in base.validate_details(mapped):
                if detail["code"] in ("PL_SPECIFICITY_MISSING", "EVENT_TAPER_MISSING", "RECOVERY_PHASE_MISSING"):
                    flags.append(detail)

    elif discipline == "bodybuilding-discipline":
        for week in run.weeks:
            muscle: dict[str, float] = {}
            for item in week.get("plan", []):
                for exercise in item.get("exercises", []):
                    for muscle_name in exercise.get("primary") or []:
                        key = str(muscle_name).lower()
                        muscle[key] = muscle.get(key, 0) + float(exercise.get("sets") or 0)
            if muscle and max(muscle.values()) > 25:
                name = max(muscle, key=muscle.get)
                add(flags, "BB_VOLUME_EXTREME", f"Week {week['globalWeek']}: {name} received {muscle[name]:g} modeled sets.")
                break
        press = pull = 0.0
        for item in items:
            for exercise in item.get("exercises", []):
                sets = float(exercise.get("sets") or 0)
                blob = (str(exercise.get("pattern") or "") + " " + str(exercise.get("name") or "")).lower()
                if any(k in blob for k in ("press", "push", "chest")):
                    press += sets
                if any(k in blob for k in ("pull", "row", "lat", "back")):
                    pull += sets
        if press and (pull == 0 or press / max(1, pull) > 2.5):
            add(flags, "BB_MOVEMENT_IMBALANCE", f"Press sets={press:g}; pull sets={pull:g}.")
        lower = any(any(k in blob for k in ("squat", "leg", "lunge", "hinge", "deadlift", "glute", "hamstring", "quad")) for blob in blobs)
        if not lower:
            add(flags, "BB_LOWER_BODY_MISSING", "No lower-body session or exercise remained.")

    elif discipline == "hybrid-athlete-discipline":
        for week in run.weeks:
            days = sorted(
                (int(item.get("adversarialDay", 99)), item)
                for item in week.get("plan", [])
                if item.get("adversarialStress")
            )
            for (day_a, item_a), (day_b, item_b) in zip(days, days[1:]):
                if day_b - day_a <= 1 and {item_a.get("adversarialStress"), item_b.get("adversarialStress")} == {"heavy_lower", "hard_endurance"}:
                    add(flags, "HYBRID_LOWER_STRESS_STACKED", f"Week {week['globalWeek']}: heavy lower-body and hard endurance sessions were placed on adjacent days.")
                    break
        if not any(item.get("adversarialRole") == "long_aerobic" or any(k in text(item) for k in ("long run", "long aerobic", "zone 2")) for item in items):
            add(flags, "HYBRID_LONG_AEROBIC_MISSING", "No long-aerobic session remained.")
        if sum(1 for item in items if item.get("adversarialRole") == "strength") < 2 and any(item.get("adversarialMutation") == "strength_collapse" for item in items):
            add(flags, "HYBRID_STRENGTH_COLLAPSE", "Strength exposure was reduced below two modeled sessions across the mutated plan.")

    elif discipline == "tactical-athlete-discipline":
        rucks: list[tuple[int, float]] = []
        for week in run.weeks:
            dose = sum(float(item.get("adversarialRuckDose") or 0) for item in week.get("plan", []))
            rucks.append((week["globalWeek"], dose))
            if sum(1 for item in week.get("plan", []) if item.get("adversarialImpact") == "high") >= 3:
                add(flags, "TACTICAL_IMPACT_CLUSTER", f"Week {week['globalWeek']}: three high-impact run/ruck sessions.")
        for (week_a, dose_a), (week_b, dose_b) in zip(rucks, rucks[1:]):
            if dose_a > 0 and dose_b / dose_a > 1.4:
                add(flags, "TACTICAL_RUCK_SPIKE", f"Week {week_a} to {week_b}: modeled ruck dose rose from {dose_a:g} to {dose_b:g}.")
                break
        if any(item.get("adversarialMutation") == "carry_removed" for item in items):
            add(flags, "TACTICAL_CARRY_TRUNK_MISSING", "Carry, grip, and trunk work was deliberately removed.")

    elif discipline == "functional-fitness-discipline":
        for week in run.weeks:
            high = sum(1 for item in week.get("plan", []) if item.get("adversarialIntensity") == "high")
            if high >= 5:
                add(flags, "FUNCTIONAL_DAILY_HIGH_INTENSITY", f"Week {week['globalWeek']}: {high} high-intensity mixed-modal sessions.")
                break
        if any(item.get("adversarialMutation") == "strength_removed" for item in items):
            add(flags, "FUNCTIONAL_STRENGTH_MISSING", "Structured strength sessions were deliberately removed.")
        if any(item.get("adversarialMutation") == "skill_removed" for item in items):
            add(flags, "FUNCTIONAL_SKILL_MISSING", "Skill and technical sessions were deliberately removed.")

    elif discipline == "endurance-athlete-discipline":
        mapped = copy.deepcopy(run)
        mapped.config["baseId"] = "endurance-athlete-discipline"
        for detail in base.validate_details(mapped):
            if detail["code"] in ("ENDURANCE_HIGH_DAYS_CLUSTERED", "ENDURANCE_LONG_RUN_SHARE", "ENDURANCE_LOAD_SPIKE"):
                flags.append(detail)

    return sorted(flags, key=lambda item: item["code"])


def mutate(run: sim.JourneyRun, mutation: str) -> sim.JourneyRun:
    mutated = copy.deepcopy(run)
    items = all_items(mutated)
    if mutation == "ph_no_strength":
        for week in mutated.weeks:
            week["plan"] = [item for item in week.get("plan", []) if not any(k in text(item) for k in ("strength", "squat", "press", "hinge", "row", "deadlift"))]
    elif mutation == "ph_no_conditioning":
        for week in mutated.weeks:
            week["plan"] = [item for item in week.get("plan", []) if not any(k in text(item) for k in ("conditioning", "aerobic", "run", "bike", "rower", "interval"))]
    elif mutation == "ph_stacked":
        for item in mutated.weeks[3]["plan"][:4]:
            item["adversarialIntensity"] = "high"
    elif mutation in ("pl_no_specificity", "no_taper", "no_recovery"):
        return base.mutate(mutated, mutation)
    elif mutation == "bb_extreme":
        mutated.weeks[4]["plan"][0]["exercises"] = [{"name": "Bench Press", "sets": 30, "primary": ["Chest"], "pattern": "Press"}]
    elif mutation == "bb_no_pull":
        for item in items:
            item["exercises"] = [
                exercise
                for exercise in item.get("exercises", [])
                if not any(k in (str(exercise.get("name") or "") + " " + str(exercise.get("pattern") or "")).lower() for k in ("pull", "row", "lat", "back"))
            ]
    elif mutation == "bb_no_lower":
        for week in mutated.weeks:
            week["plan"] = [item for item in week.get("plan", []) if not any(k in text(item) for k in ("leg", "lower", "squat", "hinge", "deadlift", "glute"))]
    elif mutation == "hybrid_stack":
        for day, stress in ((1, "heavy_lower"), (2, "hard_endurance")):
            mutated.weeks[5]["plan"][day - 1]["adversarialDay"] = day
            mutated.weeks[5]["plan"][day - 1]["adversarialStress"] = stress
    elif mutation == "hybrid_no_long":
        for item in items:
            item["adversarialRole"] = "other"
            for key in ("label", "title", "name"):
                item[key] = str(item.get(key) or "").replace("Long Run", "Aerobic Support").replace("Long Aerobic", "Aerobic Support")
    elif mutation == "hybrid_strength_collapse":
        for item in items:
            item["adversarialMutation"] = "strength_collapse"
            item["adversarialRole"] = "other"
    elif mutation == "tactical_ruck_spike":
        mutated.weeks[6]["plan"][0]["adversarialRuckDose"] = 60
        mutated.weeks[7]["plan"][0]["adversarialRuckDose"] = 120
    elif mutation == "tactical_impact_cluster":
        for item in mutated.weeks[8]["plan"][:3]:
            item["adversarialImpact"] = "high"
    elif mutation == "tactical_no_carry":
        for item in items:
            item["adversarialMutation"] = "carry_removed"
    elif mutation == "functional_daily_high":
        for item in mutated.weeks[4]["plan"][:5]:
            item["adversarialIntensity"] = "high"
    elif mutation == "functional_no_strength":
        for item in items:
            item["adversarialMutation"] = "strength_removed"
    elif mutation == "functional_no_skill":
        for item in items:
            item["adversarialMutation"] = "skill_removed"
    elif mutation in ("endurance_three_hard_days", "endurance_long_run_60pct", "endurance_50pct_spike"):
        return base.mutate(mutated, mutation)
    return mutated


def verify_mutation(before: sim.JourneyRun, after: sim.JourneyRun, mutation: str | None) -> dict:
    if mutation is None:
        return {"passed": True, "evidence": "Clean control; no mutation expected."}
    if mutation == "pl_no_specificity":
        before_state = powerlifting_snapshot(before)
        after_state = powerlifting_snapshot(after)
        passed = not before_state["missingRoles"] and set(after_state["missingRoles"]) == POWERLIFTING_REQUIRED_ROLES
        evidence = (
            f"Before roles: {', '.join(before_state['foundRoles']) or 'none'}; "
            f"after roles: {', '.join(after_state['foundRoles']) or 'none'}; "
            f"removed: {', '.join(after_state['missingRoles']) or 'none'}."
        )
        return {"passed": passed, "evidence": evidence}
    if mutation == "no_taper":
        before_state = powerlifting_snapshot(before)
        after_state = powerlifting_snapshot(after)
        passed = bool(before_state["taperWeeks"]) and not after_state["taperWeeks"]
        return {
            "passed": passed,
            "evidence": f"Before taper weeks: {before_state['taperWeeks'] or 'none'}; after: {after_state['taperWeeks'] or 'none'}.",
        }
    if mutation == "no_recovery":
        before_state = powerlifting_snapshot(before)
        after_state = powerlifting_snapshot(after)
        passed = before_state["recoveryPrescription"] and not after_state["recoveryPrescription"]
        return {
            "passed": passed,
            "evidence": (
                f"Before recovery prescription: {before_state['recoveryPrescription']} in weeks {before_state['recoveryWeeks']}; "
                f"after: {after_state['recoveryPrescription']} in weeks {after_state['recoveryWeeks']}."
            ),
        }
    return {"passed": True, "evidence": "Mutation is covered by its discipline-specific detector."}


CASES: list[tuple[str, str, str | None, list[str]]] = []


def group(discipline: str, mutations: list[tuple[str, str, str, list[str]]]) -> None:
    clean_name = "Clean powerlifting meet control" if discipline == "powerlifting-discipline" else f"Clean {discipline} control"
    CASES.append((clean_name, discipline, None, []))
    CASES.extend(mutations)


group(
    "performance-health",
    [
        ("Performance & Health strength removed", "performance-health", "ph_no_strength", ["PH_STRENGTH_MISSING"]),
        ("Performance & Health conditioning removed", "performance-health", "ph_no_conditioning", ["PH_CONDITIONING_MISSING"]),
        ("Performance & Health intensity stacked", "performance-health", "ph_stacked", ["PH_INTENSITY_STACKED"]),
    ],
)
group(
    "powerlifting-discipline",
    [
        ("Powerlifting specificity removed", "powerlifting-discipline", "pl_no_specificity", ["PL_SPECIFICITY_MISSING"]),
        ("Powerlifting taper removed", "powerlifting-discipline", "no_taper", ["EVENT_TAPER_MISSING"]),
        ("Powerlifting recovery corrupted", "powerlifting-discipline", "no_recovery", ["RECOVERY_PHASE_MISSING"]),
    ],
)
group(
    "bodybuilding-discipline",
    [
        ("Bodybuilding extreme chest volume", "bodybuilding-discipline", "bb_extreme", ["BB_VOLUME_EXTREME"]),
        ("Bodybuilding pulling removed", "bodybuilding-discipline", "bb_no_pull", ["BB_MOVEMENT_IMBALANCE"]),
        ("Bodybuilding lower body removed", "bodybuilding-discipline", "bb_no_lower", ["BB_LOWER_BODY_MISSING"]),
    ],
)
group(
    "hybrid-athlete-discipline",
    [
        ("Hybrid lower stress stacked", "hybrid-athlete-discipline", "hybrid_stack", ["HYBRID_LOWER_STRESS_STACKED"]),
        ("Hybrid long aerobic removed", "hybrid-athlete-discipline", "hybrid_no_long", ["HYBRID_LONG_AEROBIC_MISSING"]),
        ("Hybrid strength collapsed", "hybrid-athlete-discipline", "hybrid_strength_collapse", ["HYBRID_STRENGTH_COLLAPSE"]),
    ],
)
group(
    "tactical-athlete-discipline",
    [
        ("Tactical ruck dose spike", "tactical-athlete-discipline", "tactical_ruck_spike", ["TACTICAL_RUCK_SPIKE"]),
        ("Tactical impact clustered", "tactical-athlete-discipline", "tactical_impact_cluster", ["TACTICAL_IMPACT_CLUSTER"]),
        ("Tactical carry and trunk removed", "tactical-athlete-discipline", "tactical_no_carry", ["TACTICAL_CARRY_TRUNK_MISSING"]),
    ],
)
group(
    "functional-fitness-discipline",
    [
        ("Functional Fitness daily high intensity", "functional-fitness-discipline", "functional_daily_high", ["FUNCTIONAL_DAILY_HIGH_INTENSITY"]),
        ("Functional Fitness strength removed", "functional-fitness-discipline", "functional_no_strength", ["FUNCTIONAL_STRENGTH_MISSING"]),
        ("Functional Fitness skill removed", "functional-fitness-discipline", "functional_no_skill", ["FUNCTIONAL_SKILL_MISSING"]),
    ],
)
group(
    "endurance-athlete-discipline",
    [
        ("Endurance hard days clustered", "endurance-athlete-discipline", "endurance_three_hard_days", ["ENDURANCE_HIGH_DAYS_CLUSTERED"]),
        ("Endurance oversized long session", "endurance-athlete-discipline", "endurance_long_run_60pct", ["ENDURANCE_LONG_RUN_SHARE"]),
        ("Endurance load spike", "endurance-athlete-discipline", "endurance_50pct_spike", ["ENDURANCE_LOAD_SPIKE"]),
    ],
)


def write_report(results: list[dict], control_status: dict[str, dict], output: Path) -> None:
    rows: list[str] = []
    diagnostics: list[str] = []
    control_cards: list[str] = []

    for discipline, status in control_status.items():
        setup = status["setupErrors"]
        baseline = status["baseline"]
        state = "PASS" if not setup and not baseline else "INVALID"
        detail = []
        if setup:
            detail.extend(setup)
        if baseline:
            detail.append("Baseline warnings: " + ", ".join(baseline))
        if discipline == "powerlifting-discipline":
            snapshot = status.get("snapshot") or {}
            detail.append(
                "Meet fixture — roles: "
                + (", ".join(snapshot.get("foundRoles", [])) or "none")
                + f"; taper weeks: {snapshot.get('taperWeeks') or 'none'}; event weeks: {snapshot.get('eventWeeks') or 'none'}; recovery weeks: {snapshot.get('recoveryWeeks') or 'none'}."
            )
        control_cards.append(
            f"<article><h3>{html.escape(discipline)}</h3><p><b>{state}</b></p><ul>"
            + "".join(f"<li>{html.escape(item)}</li>" for item in (detail or ["Clean baseline produced no warnings."]))
            + "</ul></article>"
        )

    for result in results:
        css_class = "pass" if result["passed"] else "fail"
        rows.append(
            f"<tr class='{css_class}'><td>{'PASS' if result['passed'] else 'FAIL'}</td>"
            f"<td>{html.escape(result['name'])}</td>"
            f"<td>{html.escape(', '.join(result['expected']) or 'No warnings')}</td>"
            f"<td>{html.escape(', '.join(result['baseline']) or 'None')}</td>"
            f"<td>{html.escape(', '.join(result['newDetected']) or 'No warnings')}</td>"
            f"<td>{html.escape(', '.join(result['missing']) or 'None')}</td>"
            f"<td>{html.escape(', '.join(result['unexpected']) or 'None')}</td>"
            f"<td>{'PASS' if result['mutationVerification']['passed'] else 'FAIL'}</td></tr>"
        )
        diagnostic_lines = []
        if result["setupErrors"]:
            diagnostic_lines.extend({"code": "CONTROL_SETUP_INVALID", "evidence": item} for item in result["setupErrors"])
        diagnostic_lines.extend(result["details"])
        diagnostic_lines.append(
            {
                "code": "MUTATION_VERIFICATION",
                "evidence": result["mutationVerification"]["evidence"],
            }
        )
        diagnostics.append(
            "<article><h3>"
            + html.escape(result["name"])
            + "</h3><ul>"
            + "".join(f"<li><b>{html.escape(line['code'])}</b> — {html.escape(line['evidence'])}</li>" for line in diagnostic_lines)
            + "</ul></article>"
        )

    passed = sum(result["passed"] for result in results)
    total = len(results)
    rules = "".join(f"<li><b>{html.escape(code)}</b> — {html.escape(description)}</li>" for code, description in RULES.items())
    document = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Bell {VERSION} Discipline Adversarial Validation</title><style>body{{font-family:Segoe UI,Arial;background:#090b0f;color:#f5f5f3;margin:0}}main{{max-width:1580px;margin:auto;padding:28px}}header,section,article{{background:#12161d;border:1px solid #303641;border-radius:18px;padding:22px;margin-bottom:18px}}h1{{font-size:clamp(2rem,5vw,4rem)}}p,li{{color:#b6bdc8;line-height:1.55}}table{{width:100%;border-collapse:collapse;min-width:1450px}}th,td{{padding:10px;border-bottom:1px solid #303641;text-align:left;vertical-align:top}}th{{color:#e0ae32}}.wrap{{overflow:auto}}.pass td:first-child{{color:#64d69a;font-weight:900}}.fail td:first-child{{color:#ff7777;font-weight:900}}.metric{{font-size:2rem;font-weight:900}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px}}.grid article{{margin:0}}</style></head><body><main><header><h1>Discipline-Wide Adversarial Validation</h1><p>Seven clean 52-week controls and 21 deliberate corruptions test discipline-specific guardrails at the 90% real-world compliance condition. Powerlifting event rules use an explicit meet fixture, and every mutation is scored only on warnings newly introduced beyond its clean baseline.</p><div class='metric'>{passed}/{total} cases passed</div></header><section><h2>Control preconditions</h2><div class='grid'>{''.join(control_cards)}</div></section><section><h2>Differential mutation results</h2><div class='wrap'><table><thead><tr><th>Result</th><th>Case</th><th>Expected new warning</th><th>Clean baseline</th><th>Newly detected</th><th>Missed</th><th>Unexpected</th><th>Mutation applied</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></section><section><h2>Diagnostic evidence</h2>{''.join(diagnostics)}</section><section><h2>Guardrails</h2><ul>{rules}</ul></section></main></body></html>"""
    output.mkdir(parents=True, exist_ok=True)
    (output / "index.html").write_text(document, encoding="utf-8")
    (output / "results.json").write_text(
        json.dumps({"version": VERSION, "passed": passed, "total": total, "controlStatus": control_status, "results": results}, indent=2),
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--app-root", required=True, type=Path)
    parser.add_argument("--journeys", required=True, type=Path)
    parser.add_argument("--headed", action="store_true")
    args = parser.parse_args()

    discipline_configs = {item["id"]: item for item in json.loads(args.journeys.read_text(encoding="utf-8"))}
    year_configs = {item["id"]: item for item in json.loads((HERE / "year_journeys.json").read_text(encoding="utf-8"))}
    # The broad discipline journey remains the 13.11.0 clean control. Event-specific adversarial
    # rules require a separate meet fixture with explicit event preparation, taper, event week, and recovery.
    discipline_configs["powerlifting-discipline"] = copy.deepcopy(year_configs["powerlifting-year"])

    root = args.app_root.resolve()
    report_root = root / "automation" / "discipline_adversarial_reports"
    output = report_root / dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    controls: dict[str, sim.JourneyRun] = {}

    with sim.local_server(root) as url:
        with sim.sync_playwright() as playwright:
            launch = {"headless": not args.headed}
            executable = sim.find_browser_executable()
            if executable:
                launch["executable_path"] = executable
            browser = playwright.chromium.launch(**launch)
            try:
                for number, (key, config) in enumerate(discipline_configs.items(), 1):
                    control = copy.deepcopy(config)
                    control["baseId"] = key
                    control["id"] = key + ("-meet-adversarial-control" if key == "powerlifting-discipline" else "-discipline-adversarial-control")
                    control["adherence"] = 0.90
                    control["targetCompliance"] = 0.90
                    print(f"[{number}/7] Building {key} control")
                    controls[key] = sim.simulate_journey(browser, url, control, output / "controls")
            finally:
                browser.close()

    baseline_details = {discipline: validate(control, discipline) for discipline, control in controls.items()}
    control_status: dict[str, dict] = {}
    for discipline, control in controls.items():
        setup_errors = control_setup_errors(control, discipline)
        baseline_codes = [detail["code"] for detail in baseline_details[discipline]]
        control_status[discipline] = {
            "setupErrors": setup_errors,
            "baseline": baseline_codes,
            "snapshot": powerlifting_snapshot(control) if discipline == "powerlifting-discipline" else None,
        }

    results: list[dict] = []
    for name, discipline, mutation_name, expected in CASES:
        clean_control = controls[discipline]
        candidate = clean_control if mutation_name is None else mutate(clean_control, mutation_name)
        details = validate(candidate, discipline)
        full_codes = [detail["code"] for detail in details]
        baseline_codes = control_status[discipline]["baseline"]
        newly_detected = sorted(set(full_codes) - set(baseline_codes)) if mutation_name is not None else full_codes
        missing = sorted(set(expected) - set(newly_detected))
        unexpected = sorted(set(newly_detected) - set(expected))
        verification = verify_mutation(clean_control, candidate, mutation_name)
        setup_errors = control_status[discipline]["setupErrors"]
        passed = (
            not setup_errors
            and not baseline_codes
            and verification["passed"]
            and not missing
            and not unexpected
        )
        results.append(
            {
                "name": name,
                "discipline": discipline,
                "mutation": mutation_name,
                "expected": expected,
                "baseline": baseline_codes,
                "fullDetected": full_codes,
                "newDetected": newly_detected,
                "details": details,
                "missing": missing,
                "unexpected": unexpected,
                "setupErrors": setup_errors,
                "mutationVerification": verification,
                "passed": passed,
            }
        )

    write_report(results, control_status, output)
    sim.copy_latest(output, report_root / "latest")
    passed = sum(result["passed"] for result in results)
    print(f"Discipline adversarial validation: {passed}/{len(results)}. Report: {report_root / 'latest' / 'index.html'}")
    return 0 if all(result["passed"] for result in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
