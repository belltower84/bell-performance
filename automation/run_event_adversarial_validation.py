from __future__ import annotations

import argparse
import copy
import datetime as dt
import html
import json
from pathlib import Path
from typing import Any

import run_year_simulations as sim
import run_event_validation as clean

VERSION = "13.12.3"
ROLE_FIELDS = clean.ROLE_FIELDS
TEXT_FIELDS = ("label", "title", "name", "customLabel", "mission", "detail", "description")
NEUTRAL_ROLE = "neutral_event_support"
MINUTE_TOLERANCE = 0.01
RATIO_TOLERANCE = 0.0001


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def code_prefix(event_id: str) -> str:
    return "EVT_" + "".join(ch if ch.isalnum() else "_" for ch in event_id.upper()).strip("_")


def event_codes(event_id: str) -> dict[str, str]:
    prefix = code_prefix(event_id)
    return {
        "concept": f"{prefix}_CONCEPT_MISSING",
        "rehearsal": f"{prefix}_REHEARSAL_MISSING",
        "dose": f"{prefix}_DOSE_INSUFFICIENT",
        "taper": f"{prefix}_TAPER_INADEQUATE",
        "recovery": f"{prefix}_RECOVERY_INVALID",
        "scope": f"{prefix}_SCOPE_OVERCLAIM",
        "family": f"{prefix}_FAMILY_MISMATCH",
    }


def add(flags: list[dict[str, str]], code: str, evidence: str) -> None:
    if not any(flag["code"] == code for flag in flags):
        flags.append({"code": code, "evidence": evidence})


def event_weeks(run: sim.JourneyRun, spec: dict[str, Any]) -> list[dict[str, Any]]:
    return clean.event_weeks(run, str(spec["eventType"]))


def recovery_weeks(run: sim.JourneyRun) -> list[dict[str, Any]]:
    return clean.phase_weeks(run, "post-")


def taper_metrics(weeks: list[dict[str, Any]]) -> dict[str, Any]:
    taper = [week for week in weeks if "taper" in str(week.get("programPhase") or "").lower()]
    event_week = [week for week in weeks if "event week" in str(week.get("programPhase") or "").lower()]
    targets = taper or event_week
    if not targets:
        return {"passed": False, "reduction": None, "baselineAverage": 0.0, "targetAverage": 0.0, "targetWeeks": []}
    first_target = min(int(week.get("globalWeek") or 0) for week in targets)
    prior = [
        week for week in weeks
        if int(week.get("globalWeek") or 0) < first_target
        and "recovery" not in str(week.get("programPhase") or "").lower()
    ]
    baseline = prior[-2:]
    baseline_avg = sum(clean.planned_minutes(week) for week in baseline) / len(baseline) if baseline else 0.0
    target_avg = sum(clean.planned_minutes(week) for week in targets) / len(targets) if targets else 0.0
    reduction = (1 - target_avg / baseline_avg) if baseline_avg else None
    passed = baseline_avg > 0 and reduction is not None and 0.10 <= reduction <= 0.70
    return {
        "passed": passed,
        "reduction": reduction,
        "baselineAverage": baseline_avg,
        "targetAverage": target_avg,
        "targetWeeks": [int(week.get("globalWeek") or 0) for week in targets],
    }


def recovery_metrics(run: sim.JourneyRun) -> dict[str, Any]:
    weeks = recovery_weeks(run)
    blob = " ".join(clean.week_blob(week) for week in weeks)
    positive = any(term in blob for term in ("recovery", "restore", "easy", "walk", "mobility", "re-entry"))
    high_stress = any(term in blob for term in (
        "simulation", "race rehearsal", "mock meet", "competition squat", "competition deadlift",
        "full test / tactical simulation", "ocr course simulation", "tournament round simulation",
        "hyrox simulation", "competition simulation", "max effort test",
    ))
    return {
        "passed": bool(weeks) and positive and not high_stress,
        "weeks": [int(week.get("globalWeek") or 0) for week in weeks],
        "positive": positive,
        "highStress": high_stress,
    }


def scope_statuses(weeks: list[dict[str, Any]]) -> list[str]:
    return sorted({
        str((week.get("eventSummary") or {}).get("scopeStatus") or "")
        for week in weeks if week.get("eventSummary")
    })


def concept_target(adversarial_spec: dict[str, Any], concept: str) -> dict[str, list[str]]:
    raw = dict((adversarial_spec.get("conceptTargets") or {}).get(concept) or {})
    return {
        "roles": [str(role).strip().lower() for role in raw.get("roles", []) if str(role).strip()],
        "terms": [str(term).strip().lower() for term in raw.get("terms", []) if str(term).strip()],
    }


def target_matches_item(item: dict[str, Any], target: dict[str, list[str]]) -> bool:
    roles = clean.item_roles(item)
    accepted_roles = set(target.get("roles", []))
    accepted_terms = target.get("terms", [])
    blob = clean.item_blob(item)
    return bool(roles.intersection(accepted_roles) or any(term in blob for term in accepted_terms))


def target_result(weeks: list[dict[str, Any]], target: dict[str, list[str]]) -> tuple[bool, str]:
    matches: list[str] = []
    for week in weeks:
        for item in week.get("plan", []):
            if target_matches_item(item, target):
                roles = ", ".join(sorted(clean.item_roles(item))) or "untyped"
                matches.append(f"week {week.get('globalWeek')}: {clean.item_label(item)} ({roles})")
                if len(matches) >= 4:
                    return True, "; ".join(matches)
    return bool(matches), "; ".join(matches) if matches else "No matching canonical target found."


def concept_states(run: sim.JourneyRun, spec: dict[str, Any], adversarial_spec: dict[str, Any]) -> dict[str, bool]:
    weeks = event_weeks(run, spec)
    return {
        str(concept): target_result(weeks, concept_target(adversarial_spec, str(concept)))[0]
        for concept in adversarial_spec.get("requiredConcepts", [])
    }


def week_minutes(weeks: list[dict[str, Any]]) -> dict[int, float]:
    return {
        int(week.get("globalWeek") or 0): clean.planned_minutes(week)
        for week in weeks
    }


def families(weeks: list[dict[str, Any]]) -> list[str]:
    return sorted({
        str((week.get("eventSummary") or {}).get("family") or "")
        for week in weeks if week.get("eventSummary")
    })


def rehearsal_count(weeks: list[dict[str, Any]], spec: dict[str, Any]) -> int:
    return len(clean.rehearsal_evidence(weeks, spec))


def dose_value(weeks: list[dict[str, Any]], spec: dict[str, Any]) -> float:
    return float(clean.long_or_simulation_minutes(weeks, spec)[0])


def close_number(before: float | None, after: float | None, tolerance: float = RATIO_TOLERANCE) -> bool:
    if before is None or after is None:
        return before is after
    return abs(float(before) - float(after)) <= tolerance


def minutes_unchanged(before: dict[int, float], after: dict[int, float]) -> bool:
    return before.keys() == after.keys() and all(
        abs(before[week] - after[week]) <= MINUTE_TOLERANCE for week in before
    )


def mutation_snapshot(run: sim.JourneyRun, spec: dict[str, Any], adversarial_spec: dict[str, Any]) -> dict[str, Any]:
    weeks = event_weeks(run, spec)
    taper = taper_metrics(weeks)
    recovery = recovery_metrics(run)
    dose = dose_value(weeks, spec)
    minimum = float(spec.get("minLongMinutes") or 0)
    return {
        "eventMinutes": week_minutes(weeks),
        "recoveryMinutes": week_minutes(recovery_weeks(run)),
        "taperReduction": taper["reduction"],
        "taperPassed": taper["passed"],
        "rehearsalCount": rehearsal_count(weeks, spec),
        "dose": dose,
        "dosePassed": minimum <= 0 or dose >= minimum,
        "recoveryPassed": recovery["passed"],
        "family": families(weeks),
        "scope": scope_statuses(weeks),
        "concepts": concept_states(run, spec, adversarial_spec),
    }


def validate(run: sim.JourneyRun, spec: dict[str, Any], adversarial_spec: dict[str, Any]) -> list[dict[str, str]]:
    flags: list[dict[str, str]] = []
    weeks = event_weeks(run, spec)
    codes = event_codes(str(spec["id"]))
    if not weeks:
        add(flags, codes["family"], "No event-preparation weeks remained for the expected event type.")
        return flags

    observed_families = sorted({
        str((week.get("eventSummary") or {}).get("family") or "")
        for week in weeks if week.get("eventSummary")
    })
    if observed_families != [str(spec["family"])]:
        add(
            flags,
            codes["family"],
            f"Expected family {spec['family']}; observed {', '.join(observed_families) or 'none'}.",
        )

    missing_concepts: list[str] = []
    for concept in adversarial_spec.get("requiredConcepts", []):
        found, _ = target_result(weeks, concept_target(adversarial_spec, str(concept)))
        if not found:
            missing_concepts.append(str(concept))
    if missing_concepts:
        add(flags, codes["concept"], "Missing required event concept(s): " + ", ".join(missing_concepts) + ".")

    if bool(spec.get("rehearsalRequired", True)):
        rehearsal = clean.rehearsal_evidence(weeks, spec)
        # Competition-lift removal makes opener rehearsal impossible. Specificity is the more proximal fault.
        suppress_for_powerlifting_specificity = (
            str(spec["id"]) == "powerlifting-meet-event"
            and any(name in missing_concepts for name in ("Competition squat", "Competition bench", "Competition deadlift"))
        )
        if not rehearsal and not suppress_for_powerlifting_specificity:
            add(flags, codes["rehearsal"], "No canonical event-specific rehearsal remained.")

    minimum = float(spec.get("minLongMinutes") or 0)
    if minimum > 0 and not bool(spec.get("scopeLimitedWhenUndefined")):
        max_long, detail = clean.long_or_simulation_minutes(weeks, spec)
        rehearsal_missing = any(flag["code"] == codes["rehearsal"] for flag in flags)
        # Removing the only rehearsal may also erase the longest dose. Do not double-count the same proximal fault.
        if max_long < minimum and not rehearsal_missing:
            add(flags, codes["dose"], f"Minimum {minimum:g} minutes; {detail}")

    taper = taper_metrics(weeks)
    if not taper["passed"]:
        reduction = taper["reduction"]
        reduction_text = "unknown" if reduction is None else f"{reduction:.0%}"
        add(
            flags,
            codes["taper"],
            f"Pre-taper average {taper['baselineAverage']:.1f} min; taper/event average {taper['targetAverage']:.1f} min; reduction {reduction_text}.",
        )

    recovery = recovery_metrics(run)
    if not recovery["passed"]:
        add(
            flags,
            codes["recovery"],
            f"Recovery weeks {recovery['weeks'] or 'none'}; restore language={recovery['positive']}; high-stress work={recovery['highStress']}.",
        )

    if bool(spec.get("scopeLimitedWhenUndefined")):
        statuses = scope_statuses(weeks)
        if statuses != ["SCOPE_LIMITED"]:
            add(flags, codes["scope"], f"Undefined custom event reported scope status {', '.join(statuses) or 'none'} instead of SCOPE_LIMITED.")

    return sorted(flags, key=lambda item: item["code"])


def neutralize_text(item: dict[str, Any], label: str, detail: str) -> None:
    for field in TEXT_FIELDS:
        if field in item:
            item[field] = detail if field in {"detail", "description"} else label


def replace_target_roles(item: dict[str, Any], target_roles: set[str], replacement_role: str = NEUTRAL_ROLE) -> None:
    for field in ROLE_FIELDS:
        value = str(item.get(field) or "").strip().lower()
        if value in target_roles:
            item[field] = replacement_role


def neutralize_target_item(
    item: dict[str, Any],
    target: dict[str, list[str]],
    *,
    replacement_role: str = NEUTRAL_ROLE,
    label: str = "Neutral Event Support",
    detail: str = "Duration-preserving adversarial neutral support.",
) -> None:
    replace_target_roles(item, set(target.get("roles", [])), replacement_role)
    # Exact target terms can live in labels or details while the canonical role is shared
    # with unrelated sessions. Clear the athlete-facing text without changing duration.
    if target.get("terms"):
        neutralize_text(item, label, detail)
    item["adversarialNeutralized"] = True


def remove_concept(
    mutated: sim.JourneyRun,
    spec: dict[str, Any],
    adversarial_spec: dict[str, Any],
    concept: str,
) -> None:
    target = concept_target(adversarial_spec, concept)
    for week in event_weeks(mutated, spec):
        for item in week.get("plan", []):
            if target_matches_item(item, target):
                neutralize_target_item(item, target)


def remove_rehearsal(mutated: sim.JourneyRun, spec: dict[str, Any]) -> None:
    weeks = event_weeks(mutated, spec)
    if spec.get("rehearsalMode") == "powerlifting_openers":
        for week in weeks:
            for item in week.get("plan", []):
                for key in ("label", "title", "name", "mission", "detail", "description"):
                    value = str(item.get(key) or "")
                    for term in ("opener", "attempt", "command"):
                        value = value.replace(term, "technique").replace(term.title(), "Technique")
                    item[key] = value
        return
    roles = {str(role).lower() for role in spec.get("rehearsalRoles", [])}
    terms = [str(term).lower() for term in spec.get("rehearsalTerms", [])]
    replacement_roles = [
        str(role).lower() for role in spec.get("doseRoles", [])
        if str(role).lower() not in roles
    ]
    replacement_role = replacement_roles[0] if replacement_roles else NEUTRAL_ROLE
    for week in weeks:
        for item in week.get("plan", []):
            item_role_set = clean.item_roles(item)
            blob = clean.item_blob(item)
            if item_role_set.intersection(roles) or any(term in blob for term in terms):
                target = {"roles": sorted(roles), "terms": terms}
                neutralize_target_item(
                    item,
                    target,
                    replacement_role=replacement_role,
                    label="Event-Specific Capacity Session",
                    detail="Duration-preserving capacity work without controlled rehearsal status.",
                )


def reduce_dose(mutated: sim.JourneyRun, spec: dict[str, Any]) -> None:
    minimum = float(spec.get("minLongMinutes") or 0)
    target = max(5.0, minimum * 0.50)
    accepted_roles = {str(role).lower() for role in spec.get("doseRoles", [])}
    accepted_terms = [str(term).lower() for term in spec.get("doseTerms", [])]
    for week in event_weeks(mutated, spec):
        removed_minutes = 0.0
        for item in week.get("plan", []):
            roles = clean.item_roles(item)
            blob = clean.item_blob(item)
            if roles.intersection(accepted_roles) or any(term in blob for term in accepted_terms):
                before = float(item.get("duration") or target)
                after = min(before, target)
                item["duration"] = after
                removed_minutes += max(0.0, before - after)
        if removed_minutes > MINUTE_TOLERANCE:
            week.setdefault("plan", []).append({
                "label": "Low-Stress Volume Replacement",
                "detail": "Noncanonical easy support preserves weekly minutes while event-specific dose is reduced.",
                "duration": removed_minutes,
                "eventRole": NEUTRAL_ROLE,
                "adversarialVolumeReplacement": True,
            })


def corrupt_taper(mutated: sim.JourneyRun, spec: dict[str, Any]) -> None:
    weeks = event_weeks(mutated, spec)
    taper = [week for week in weeks if "taper" in str(week.get("programPhase") or "").lower()]
    event_week = [week for week in weeks if "event week" in str(week.get("programPhase") or "").lower()]
    targets = taper or event_week
    if not targets:
        return
    first_target = min(int(week.get("globalWeek") or 0) for week in targets)
    prior = [week for week in weeks if int(week.get("globalWeek") or 0) < first_target]
    baseline = prior[-2:]
    baseline_avg = sum(clean.planned_minutes(week) for week in baseline) / len(baseline) if baseline else 0.0
    for week in targets:
        plan = week.get("plan", [])
        if not plan:
            week["plan"] = [{"label": "Event Preparation", "duration": baseline_avg or 60, "eventRole": "event_preparation"}]
            continue
        current = clean.planned_minutes(week)
        desired = max(baseline_avg, current)
        scale = desired / current if current else 1.0
        for item in plan:
            item["duration"] = max(1.0, float(item.get("duration") or 0) * scale)


def corrupt_recovery(mutated: sim.JourneyRun) -> None:
    for week in recovery_weeks(mutated):
        total = clean.planned_minutes(week)
        week["plan"] = [
            {
                "label": "Competition Simulation — Max Effort Test",
                "detail": "High-stress competition simulation replaces the low-stress restoration prescription.",
                "duration": total or 30,
                "eventRole": "competition_simulation",
            }
        ]
        week["planLabels"] = ["Competition Simulation — Max Effort Test"]
        week["planDetails"] = ["High-stress competition simulation replaces recovery."]


def corrupt_scope(mutated: sim.JourneyRun, spec: dict[str, Any]) -> None:
    for week in event_weeks(mutated, spec):
        summary = week.setdefault("eventSummary", {})
        summary["scopeStatus"] = "EVENT_SPECIFIC"
        summary["scopeReason"] = "Adversarial overclaim"


def corrupt_family(mutated: sim.JourneyRun, spec: dict[str, Any]) -> None:
    wrong = "running" if str(spec.get("family")) != "running" else "functional"
    for week in event_weeks(mutated, spec):
        summary = week.setdefault("eventSummary", {})
        summary["family"] = wrong


def mutate(
    run: sim.JourneyRun,
    spec: dict[str, Any],
    adversarial_spec: dict[str, Any],
    mutation: dict[str, Any],
) -> sim.JourneyRun:
    mutated = copy.deepcopy(run)
    kind = str(mutation["kind"])
    if kind == "remove_concept":
        remove_concept(mutated, spec, adversarial_spec, str(mutation["concept"]))
    elif kind == "remove_powerlifting_specificity":
        for concept in ("Competition squat", "Competition bench", "Competition deadlift"):
            remove_concept(mutated, spec, adversarial_spec, concept)
    elif kind == "remove_rehearsal":
        remove_rehearsal(mutated, spec)
    elif kind == "reduce_dose":
        reduce_dose(mutated, spec)
    elif kind == "corrupt_taper":
        corrupt_taper(mutated, spec)
    elif kind == "corrupt_recovery":
        corrupt_recovery(mutated)
    elif kind == "scope_overclaim":
        corrupt_scope(mutated, spec)
    elif kind == "family_mismatch":
        corrupt_family(mutated, spec)
    else:
        raise ValueError(f"Unknown mutation kind: {kind}")
    return mutated


def invariant_issues(
    before: dict[str, Any],
    after: dict[str, Any],
    spec: dict[str, Any],
    mutation: dict[str, Any],
) -> list[str]:
    kind = str(mutation["kind"])
    issues: list[str] = []

    if kind != "corrupt_taper" and not close_number(before["taperReduction"], after["taperReduction"]):
        issues.append(f"Taper ratio changed {before['taperReduction']}->{after['taperReduction']} outside a taper mutation.")

    powerlifting_specificity = kind == "remove_powerlifting_specificity" and str(spec.get("id")) == "powerlifting-meet-event"
    if kind != "remove_rehearsal" and not powerlifting_specificity and before["rehearsalCount"] != after["rehearsalCount"]:
        issues.append(f"Rehearsal evidence count changed {before['rehearsalCount']}->{after['rehearsalCount']} outside a rehearsal mutation.")

    if kind != "reduce_dose" and before["dosePassed"] != after["dosePassed"]:
        issues.append(f"Dose validity changed {before['dosePassed']}->{after['dosePassed']} outside a dose mutation.")

    if kind != "corrupt_recovery":
        if before["recoveryPassed"] != after["recoveryPassed"]:
            issues.append(f"Recovery state changed {before['recoveryPassed']}->{after['recoveryPassed']} outside a recovery mutation.")
        if not minutes_unchanged(before["recoveryMinutes"], after["recoveryMinutes"]):
            issues.append("Recovery-week minutes changed outside a recovery mutation.")

    if kind != "family_mismatch" and before["family"] != after["family"]:
        issues.append(f"Event family changed {before['family']}->{after['family']} outside a routing mutation.")

    if kind != "scope_overclaim" and before["scope"] != after["scope"]:
        issues.append(f"Scope status changed {before['scope']}->{after['scope']} outside a scope mutation.")

    if kind not in {"corrupt_taper"} and not minutes_unchanged(before["eventMinutes"], after["eventMinutes"]):
        issues.append("Event-week minutes changed outside the taper mutation. Dose mutations must redistribute removed minutes.")

    if kind not in {"remove_concept", "remove_powerlifting_specificity"} and before["concepts"] != after["concepts"]:
        changed = [
            name for name in before["concepts"]
            if before["concepts"].get(name) != after["concepts"].get(name)
        ]
        issues.append("Required concept state changed outside a concept mutation: " + ", ".join(changed) + ".")

    if kind == "remove_concept":
        target = str(mutation["concept"])
        changed = {
            name for name in before["concepts"]
            if before["concepts"].get(name) != after["concepts"].get(name)
        }
        if changed != {target}:
            issues.append(f"Concept mutation changed {sorted(changed)}; expected only {target}.")

    if kind == "remove_powerlifting_specificity":
        expected = {"Competition squat", "Competition bench", "Competition deadlift"}
        changed = {
            name for name in before["concepts"]
            if before["concepts"].get(name) != after["concepts"].get(name)
        }
        if changed != expected:
            issues.append(f"Powerlifting specificity mutation changed {sorted(changed)}; expected {sorted(expected)}.")

    return issues


def verify_mutation(
    before_run: sim.JourneyRun,
    after_run: sim.JourneyRun,
    spec: dict[str, Any],
    adversarial_spec: dict[str, Any],
    mutation: dict[str, Any],
) -> dict[str, Any]:
    kind = str(mutation["kind"])
    before_weeks = event_weeks(before_run, spec)
    after_weeks = event_weeks(after_run, spec)
    before = mutation_snapshot(before_run, spec, adversarial_spec)
    after = mutation_snapshot(after_run, spec, adversarial_spec)
    mutation_passed = False
    evidence = ""

    if kind == "remove_concept":
        concept = str(mutation["concept"])
        before_found = before["concepts"].get(concept, False)
        after_found = after["concepts"].get(concept, False)
        _, before_detail = target_result(before_weeks, concept_target(adversarial_spec, concept))
        _, after_detail = target_result(after_weeks, concept_target(adversarial_spec, concept))
        mutation_passed = before_found and not after_found
        evidence = f"{concept}: before={before_found} ({before_detail}); after={after_found} ({after_detail})."
    elif kind == "remove_powerlifting_specificity":
        states = []
        mutation_passed = True
        for concept in ("Competition squat", "Competition bench", "Competition deadlift"):
            before_found = before["concepts"].get(concept, False)
            after_found = after["concepts"].get(concept, False)
            states.append(f"{concept}: {before_found}->{after_found}")
            mutation_passed = mutation_passed and before_found and not after_found
        evidence = "; ".join(states)
    elif kind == "remove_rehearsal":
        mutation_passed = before["rehearsalCount"] > 0 and after["rehearsalCount"] == 0
        evidence = f"Rehearsal evidence count {before['rehearsalCount']}->{after['rehearsalCount']}."
    elif kind == "reduce_dose":
        minimum = float(spec.get("minLongMinutes") or 0)
        mutation_passed = before["dose"] >= minimum and after["dose"] < minimum
        evidence = f"Maximum canonical dose {before['dose']:g}->{after['dose']:g} minutes; minimum {minimum:g}."
    elif kind == "corrupt_taper":
        mutation_passed = before["taperPassed"] and not after["taperPassed"]
        evidence = f"Taper reduction {before['taperReduction']}->{after['taperReduction']}."
    elif kind == "corrupt_recovery":
        mutation_passed = before["recoveryPassed"] and not after["recoveryPassed"]
        evidence = f"Recovery valid {before['recoveryPassed']}->{after['recoveryPassed']}."
    elif kind == "scope_overclaim":
        mutation_passed = before["scope"] == ["SCOPE_LIMITED"] and after["scope"] != ["SCOPE_LIMITED"]
        evidence = f"Scope status {before['scope']}->{after['scope']}."
    elif kind == "family_mismatch":
        mutation_passed = before["family"] == [str(spec["family"])] and after["family"] != [str(spec["family"])]
        evidence = f"Family {before['family']}->{after['family']}."
    else:
        evidence = f"No verifier for {kind}."

    issues = invariant_issues(before, after, spec, mutation)
    passed = mutation_passed and not issues
    if issues:
        evidence += " CONTROL_MUTATION_INVALID: " + " ".join(issues)
    return {
        "passed": passed,
        "mutationApplied": mutation_passed,
        "issues": issues,
        "code": None if passed else "CONTROL_MUTATION_INVALID",
        "evidence": evidence,
        "before": before,
        "after": after,
    }

def expected_code(event_id: str, mutation: dict[str, Any]) -> str:
    kind = str(mutation["kind"])
    codes = event_codes(event_id)
    if kind in {"remove_concept", "remove_powerlifting_specificity"}:
        return codes["concept"]
    if kind == "remove_rehearsal":
        return codes["rehearsal"]
    if kind == "reduce_dose":
        return codes["dose"]
    if kind == "corrupt_taper":
        return codes["taper"]
    if kind == "corrupt_recovery":
        return codes["recovery"]
    if kind == "scope_overclaim":
        return codes["scope"]
    if kind == "family_mismatch":
        return codes["family"]
    raise ValueError(kind)


def clean_check_failures(run: sim.JourneyRun, spec: dict[str, Any]) -> list[str]:
    candidate = copy.deepcopy(run)
    clean.validate_event_run(candidate, spec)
    return [str(check.get("name")) for check in candidate.checks if not check.get("passed")]


def write_report(results: list[dict[str, Any]], controls: dict[str, dict[str, Any]], output: Path) -> None:
    rows: list[str] = []
    diagnostics: list[str] = []
    control_cards: list[str] = []
    rules: dict[str, str] = {
        "CONTROL_SETUP_INVALID": "A clean event control failed its own rubric or lacked the target required for mutation.",
        "MUTATION_NOT_APPLIED": "A deliberate corruption did not change the intended clean-control data.",
        "CONTROL_MUTATION_INVALID": "A corruption changed an unrelated invariant such as weekly minutes, taper ratio, rehearsal evidence, recovery state, routing, scope, or a non-target concept.",
    }
    for event_id, status in controls.items():
        invalid = bool(status["cleanFailures"] or status["baseline"])
        details = []
        if status["cleanFailures"]:
            details.append("Clean-control failures: " + ", ".join(status["cleanFailures"]))
        if status["baseline"]:
            details.append("Adversarial baseline warnings: " + ", ".join(status["baseline"]))
        control_cards.append(
            f"<article><h3>{html.escape(status['eventType'])}</h3><p><b>{'INVALID' if invalid else 'PASS'}</b></p><ul>"
            + "".join(f"<li>{html.escape(detail)}</li>" for detail in (details or ["Clean control passed and produced no adversarial warnings."]))
            + "</ul></article>"
        )

    for result in results:
        css = "pass" if result["passed"] else "fail"
        rows.append(
            f"<tr class='{css}'><td>{'PASS' if result['passed'] else 'FAIL'}</td>"
            f"<td>{html.escape(result['eventType'])}</td><td>{html.escape(result['name'])}</td>"
            f"<td>{html.escape(', '.join(result['expected']) or 'No warnings')}</td>"
            f"<td>{html.escape(', '.join(result['baseline']) or 'None')}</td>"
            f"<td>{html.escape(', '.join(result['newDetected']) or 'No warnings')}</td>"
            f"<td>{html.escape(', '.join(result['missing']) or 'None')}</td>"
            f"<td>{html.escape(', '.join(result['unexpected']) or 'None')}</td>"
            f"<td>{'PASS' if result['verification']['passed'] else 'FAIL'}</td></tr>"
        )
        lines = list(result["details"])
        if result["verification"].get("issues"):
            lines.append({
                "code": "CONTROL_MUTATION_INVALID",
                "evidence": " ".join(result["verification"]["issues"]),
            })
        lines.append({"code": "MUTATION_VERIFICATION", "evidence": result["verification"]["evidence"]})
        diagnostics.append(
            "<article><h3>" + html.escape(result["eventType"] + " — " + result["name"]) + "</h3><ul>"
            + "".join(f"<li><b>{html.escape(line['code'])}</b> — {html.escape(line['evidence'])}</li>" for line in lines)
            + "</ul></article>"
        )
        for line in result["details"]:
            rules.setdefault(line["code"], "Event-specific adversarial guardrail; see diagnostic evidence for the affected concept, dose, phase, or recovery window.")

    passed = sum(1 for result in results if result["passed"])
    total = len(results)
    rule_html = "".join(f"<li><b>{html.escape(code)}</b> — {html.escape(desc)}</li>" for code, desc in sorted(rules.items()))
    document = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Bell {VERSION} Event-Type Adversarial Validation</title><style>
body{{font-family:Segoe UI,Arial;background:#090b0f;color:#f5f5f3;margin:0}}main{{max-width:1760px;margin:auto;padding:28px}}header,section,article{{background:#12161d;border:1px solid #303641;border-radius:18px;padding:22px;margin-bottom:18px}}h1{{font-size:clamp(2rem,5vw,4rem)}}p,li{{color:#b6bdc8;line-height:1.55}}table{{width:100%;border-collapse:collapse;min-width:1650px}}th,td{{padding:10px;border-bottom:1px solid #303641;text-align:left;vertical-align:top}}th{{color:#e0ae32}}.wrap{{overflow:auto}}.pass td:first-child{{color:#64d69a;font-weight:900}}.fail td:first-child{{color:#ff7777;font-weight:900}}.metric{{font-size:2rem;font-weight:900}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px}}.grid article{{margin:0}}</style></head><body><main>
<header><h1>Event-Type Adversarial Validation</h1><p>Sixteen clean 52-week event controls and eighty isolated corruptions test event-specific concepts, rehearsals, dose, taper, recovery, routing, and scope boundaries. Every mutation is scored only on warnings newly introduced beyond its clean baseline and must preserve every non-target invariant.</p><div class='metric'>{passed}/{total} cases passed</div></header>
<section><h2>Control preconditions</h2><div class='grid'>{''.join(control_cards)}</div></section>
<section><h2>Differential mutation results</h2><div class='wrap'><table><thead><tr><th>Result</th><th>Event</th><th>Case</th><th>Expected new warning</th><th>Clean baseline</th><th>Newly detected</th><th>Missed</th><th>Unexpected</th><th>Mutation isolation</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></section>
<section><h2>Diagnostic evidence</h2>{''.join(diagnostics)}</section>
<section><h2>Guardrails</h2><ul>{rule_html}</ul></section>
</main></body></html>"""
    output.mkdir(parents=True, exist_ok=True)
    (output / "index.html").write_text(document, encoding="utf-8")
    (output / "results.json").write_text(json.dumps({"version": VERSION, "passed": passed, "total": total, "controls": controls, "results": results}, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Bell Performance event-type adversarial validation.")
    parser.add_argument("--app-root", required=True, type=Path)
    parser.add_argument("--journeys", type=Path)
    parser.add_argument("--matrix", type=Path)
    parser.add_argument("--adversarial-matrix", type=Path)
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--config-only", action="store_true")
    args = parser.parse_args()

    root = args.app_root.resolve()
    journeys_path = args.journeys or root / "automation" / "event_validation_journeys.json"
    matrix_path = args.matrix or root / "automation" / "event_validation_matrix.json"
    adversarial_path = args.adversarial_matrix or root / "automation" / "event_adversarial_matrix.json"
    journeys = load_json(journeys_path)
    matrix = load_json(matrix_path)
    adversarial = load_json(adversarial_path)
    config_errors = clean.validate_configuration(journeys, matrix)
    event_ids = {str(spec["id"]) for spec in matrix.get("eventTypes", [])}
    adversarial_ids = {str(spec["id"]) for spec in adversarial.get("events", [])}
    if event_ids != adversarial_ids:
        config_errors.append(f"Clean/adversarial event IDs differ. Clean-only={sorted(event_ids-adversarial_ids)} Adversarial-only={sorted(adversarial_ids-event_ids)}")
    for entry in adversarial.get("events", []):
        if len(entry.get("mutations", [])) != 5:
            config_errors.append(f"{entry.get('id')}: expected exactly five mutations, observed {len(entry.get('mutations', []))}")
        targets = entry.get("conceptTargets") or {}
        for concept in entry.get("requiredConcepts", []):
            target = targets.get(concept) or {}
            if not target.get("roles") and not target.get("terms"):
                config_errors.append(f"{entry.get('id')}: missing precise concept target for {concept}")
        for mutation in entry.get("mutations", []):
            if mutation.get("kind") == "remove_concept" and mutation.get("concept") not in targets:
                config_errors.append(f"{entry.get('id')}: mutation {mutation.get('id')} references undefined concept target {mutation.get('concept')}")
    if config_errors:
        for error in config_errors:
            print("CONFIG ERROR:", error)
        return 2
    print(f"Configuration valid: {len(journeys)} clean controls and {sum(len(x['mutations']) for x in adversarial['events'])} mutations.")
    if args.config_only:
        return 0

    specs = {str(spec["id"]): spec for spec in matrix["eventTypes"]}
    adv_specs = {str(spec["id"]): spec for spec in adversarial["events"]}
    journey_configs = {str(item["eventValidationId"]): item for item in journeys}
    report_root = root / "automation" / "event_adversarial_reports"
    output = report_root / dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    controls: dict[str, sim.JourneyRun] = {}

    with sim.local_server(root) as url:
        with sim.sync_playwright() as playwright:
            launch: dict[str, Any] = {"headless": not args.headed}
            executable = sim.find_browser_executable()
            if executable:
                launch["executable_path"] = executable
            browser = playwright.chromium.launch(**launch)
            try:
                for index, event_id in enumerate(sorted(journey_configs), start=1):
                    config = copy.deepcopy(journey_configs[event_id])
                    config["id"] = str(config["id"]) + "-event-adversarial-control"
                    config["adherence"] = 0.90
                    config["targetCompliance"] = 0.90
                    print(f"[{index}/16] Building {specs[event_id]['eventType']} control")
                    controls[event_id] = sim.simulate_journey(browser, url, config, output / "controls")
            finally:
                browser.close()

    control_status: dict[str, dict[str, Any]] = {}
    for event_id, control in controls.items():
        baseline_details = validate(control, specs[event_id], adv_specs[event_id])
        control_status[event_id] = {
            "eventType": specs[event_id]["eventType"],
            "cleanFailures": clean_check_failures(control, specs[event_id]),
            "baseline": [detail["code"] for detail in baseline_details],
        }

    results: list[dict[str, Any]] = []
    for event_id in sorted(controls):
        control = controls[event_id]
        spec = specs[event_id]
        adv_spec = adv_specs[event_id]
        baseline_codes = control_status[event_id]["baseline"]
        setup_invalid = bool(control_status[event_id]["cleanFailures"] or baseline_codes)

        clean_details = validate(control, spec, adv_spec)
        results.append({
            "eventId": event_id,
            "eventType": spec["eventType"],
            "name": "Clean control",
            "mutation": None,
            "expected": [],
            "baseline": baseline_codes,
            "fullDetected": [d["code"] for d in clean_details],
            "newDetected": [d["code"] for d in clean_details],
            "missing": [],
            "unexpected": [d["code"] for d in clean_details],
            "details": clean_details,
            "verification": {"passed": True, "evidence": "Clean control; no mutation expected."},
            "passed": not setup_invalid and not clean_details,
        })

        for mutation in adv_spec["mutations"]:
            candidate = mutate(control, spec, adv_spec, mutation)
            details = validate(candidate, spec, adv_spec)
            full_codes = [detail["code"] for detail in details]
            new_codes = sorted(set(full_codes) - set(baseline_codes))
            expected = [expected_code(event_id, mutation)]
            missing = sorted(set(expected) - set(new_codes))
            unexpected = sorted(set(new_codes) - set(expected))
            verification = verify_mutation(control, candidate, spec, adv_spec, mutation)
            passed = not setup_invalid and verification["passed"] and not missing and not unexpected
            results.append({
                "eventId": event_id,
                "eventType": spec["eventType"],
                "name": mutation["name"],
                "mutation": mutation["id"],
                "expected": expected,
                "baseline": baseline_codes,
                "fullDetected": full_codes,
                "newDetected": new_codes,
                "missing": missing,
                "unexpected": unexpected,
                "details": details,
                "verification": verification,
                "passed": passed,
            })

    write_report(results, control_status, output)
    sim.copy_latest(output, report_root / "latest")
    passed = sum(1 for result in results if result["passed"])
    print(f"Event adversarial validation: {passed}/{len(results)}. Report: {report_root / 'latest' / 'index.html'}")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
