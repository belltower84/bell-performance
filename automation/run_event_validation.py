from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import shutil
from pathlib import Path
from typing import Any

import run_year_simulations as sim

VERSION = "13.12.3"


def esc(value: Any) -> str:
    return html.escape(str(value if value is not None else ""))


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


ROLE_FIELDS = ("eventRole", "enduranceRole", "exerciseRole", "physiqueRole", "sessionRole")


def item_roles(item: dict[str, Any]) -> set[str]:
    return {str(item.get(field) or "").strip().lower() for field in ROLE_FIELDS if str(item.get(field) or "").strip()}


def item_role(item: dict[str, Any]) -> str:
    roles = item_roles(item)
    return sorted(roles)[0] if roles else ""


def item_label(item: dict[str, Any]) -> str:
    return str(item.get("label") or item.get("title") or item.get("name") or item.get("mission") or item_role(item) or "session")


def item_blob(item: dict[str, Any]) -> str:
    return " ".join(
        str(item.get(key) or "")
        for key in (
            "label", "title", "name", "mission", "detail", "description",
            "eventRole", "enduranceRole", "exerciseRole", "physiqueRole", "sessionRole",
            "eventScopeStatus", "eventScopeReason",
        )
    ).lower()


def week_blob(week: dict[str, Any]) -> str:
    return " ".join(item_blob(item) for item in week.get("plan", []))


def event_weeks(run: sim.JourneyRun, event_type: str) -> list[dict[str, Any]]:
    return [week for week in run.weeks if str(week.get("eventType") or "") == event_type]


def planned_minutes(week: dict[str, Any]) -> float:
    return sum(max(0.0, float(item.get("duration") or 0)) for item in week.get("plan", []))


def phase_weeks(run: sim.JourneyRun, name_fragment: str) -> list[dict[str, Any]]:
    needle = name_fragment.lower()
    return [week for week in run.weeks if needle in str(week.get("phaseName") or "").lower()]


def add_check(run: sim.JourneyRun, name: str, passed: bool, detail: str) -> None:
    record = {"name": name, "passed": bool(passed), "detail": detail}
    run.checks.append(record)
    if not passed:
        run.warnings.append(f"CHECK FAILED — {name}: {detail}")


def term_matches_item(item: dict[str, Any], term: str) -> bool:
    needle = str(term).strip().lower()
    if not needle:
        return False
    roles = item_roles(item)
    return any(needle == role or needle in role for role in roles) or needle in item_blob(item)


def concept_result(weeks: list[dict[str, Any]], terms: list[str]) -> tuple[bool, str]:
    matches: list[str] = []
    for week in weeks:
        for item in week.get("plan", []):
            if any(term_matches_item(item, term) for term in terms):
                roles = ", ".join(sorted(item_roles(item))) or "untyped"
                matches.append(f"week {week.get('globalWeek')}: {item_label(item)} ({roles})")
                if len(matches) >= 4:
                    return True, "; ".join(matches)
    return bool(matches), "; ".join(matches) if matches else "No matching prescription found."


def rehearsal_evidence(weeks: list[dict[str, Any]], spec: dict[str, Any]) -> list[str]:
    if spec.get("rehearsalMode") == "powerlifting_openers":
        required = {"competition_squat", "competition_bench", "competition_deadlift"}
        evidence: list[str] = []
        for week in weeks:
            roles = set().union(*(item_roles(item) for item in week.get("plan", []))) if week.get("plan") else set()
            blob = week_blob(week)
            if required.issubset(roles) and any(term in blob for term in ("opener", "attempt", "command")):
                evidence.append(f"week {week.get('globalWeek')}: all three competition lifts with opener/attempt/command preparation")
        return evidence

    required_roles = {str(role).lower() for role in spec.get("rehearsalRoles", [])}
    terms = [str(term).lower() for term in spec.get("rehearsalTerms", [])]
    evidence: list[str] = []
    for week in weeks:
        for item in week.get("plan", []):
            roles = item_roles(item)
            blob = item_blob(item)
            if roles.intersection(required_roles) or any(term in blob for term in terms):
                evidence.append(f"week {week.get('globalWeek')}: {item_label(item)} ({', '.join(sorted(roles)) or 'untyped'})")
    return evidence


def long_or_simulation_minutes(weeks: list[dict[str, Any]], spec: dict[str, Any]) -> tuple[float, str]:
    accepted_roles = {str(role).lower() for role in spec.get("doseRoles", [])}
    accepted_terms = [str(term).lower() for term in spec.get("doseTerms", [])]
    candidates: list[tuple[float, int, str, str]] = []
    for week in weeks:
        for item in week.get("plan", []):
            roles = item_roles(item)
            blob = item_blob(item)
            if roles.intersection(accepted_roles) or any(term in blob for term in accepted_terms):
                candidates.append((float(item.get("duration") or 0), int(week.get("globalWeek") or 0), item_label(item), ", ".join(sorted(roles)) or "untyped"))
    if not candidates:
        return 0.0, "No canonical long-session or event-rehearsal prescription found."
    value, week_no, label, roles = max(candidates)
    return value, f"Maximum {value:g} minutes in week {week_no}: {label} ({roles})."


def validate_event_run(run: sim.JourneyRun, spec: dict[str, Any]) -> dict[str, Any]:
    event_type = str(spec["eventType"])
    expected_family = str(spec["family"])
    weeks = event_weeks(run, event_type)

    add_check(
        run,
        f"{event_type}: explicit event-preparation phase generated",
        bool(weeks),
        f"Observed {len(weeks)} event-preparation weeks; expected {spec['prepWeeks']}.",
    )
    if not weeks:
        return {"eventType": event_type, "family": expected_family, "maxLongMinutes": 0, "eventWeeks": 0, "taperReduction": None, "scopeStatus": "UNKNOWN"}

    add_check(
        run,
        f"{event_type}: configured preparation length persisted",
        len(weeks) == int(spec["prepWeeks"]),
        f"Observed {len(weeks)} weeks; configured {spec['prepWeeks']}.",
    )

    observed_families = sorted({
        str((week.get("eventSummary") or {}).get("family") or "")
        for week in weeks
        if week.get("eventSummary")
    })
    add_check(
        run,
        f"{event_type}: correct event family selected",
        observed_families == [expected_family],
        f"Expected {expected_family}; observed {', '.join(observed_families) or 'none'}.",
    )

    phases_seen = sorted({str(week.get("programPhase") or "") for week in weeks})
    required_phases = ["General Preparation", "Capacity Build", "Specific Development", "Competition Preparation", "Event Week"]
    if int(spec.get("taperWeeks") or 0) >= 2:
        required_phases.append("Peak & Taper")
    missing_phases = [phase for phase in required_phases if not any(phase.lower() in seen.lower() for seen in phases_seen)]
    add_check(
        run,
        f"{event_type}: progressive event-phase architecture",
        not missing_phases,
        f"Observed: {', '.join(phases_seen)}. Missing: {', '.join(missing_phases) or 'none'}.",
    )

    event_blob = " ".join(week_blob(week) for week in weeks)
    if event_type in {"5K Race", "10K Race", "Half Marathon", "Marathon"}:
        event_token = event_type.replace(" Race", "").lower()
        add_check(
            run,
            f"{event_type}: distance identity appears in prescriptions",
            event_token in event_blob,
            f"Required explicit athlete-facing target identity '{event_token}' in event-plan labels or details.",
        )

    for concept, terms in spec.get("concepts", {}).items():
        found, detail = concept_result(weeks, list(terms))
        add_check(run, f"{event_type}: {concept}", found, detail)

    scope_statuses = sorted({
        str((week.get("eventSummary") or {}).get("scopeStatus") or "")
        for week in weeks if week.get("eventSummary")
    })
    scope_status = scope_statuses[0] if len(scope_statuses) == 1 else ", ".join(scope_statuses) or "UNKNOWN"
    scope_limited = bool(spec.get("scopeLimitedWhenUndefined"))
    if scope_limited:
        add_check(
            run,
            f"{event_type}: scope-limited boundary is explicit",
            scope_statuses == ["SCOPE_LIMITED"],
            f"Observed event scope status: {scope_status}.",
        )

    rehearsals: list[str] = []
    if bool(spec.get("rehearsalRequired", True)):
        rehearsals = rehearsal_evidence(weeks, spec)
        add_check(
            run,
            f"{event_type}: controlled event rehearsal is prescribed",
            bool(rehearsals),
            "; ".join(rehearsals[:6]) or "No canonical event-specific rehearsal found.",
        )

    max_long, max_long_detail = long_or_simulation_minutes(weeks, spec)
    minimum = float(spec.get("minLongMinutes") or 0)
    if minimum > 0 and not scope_limited:
        add_check(
            run,
            f"{event_type}: event-specific long/rehearsal dose",
            max_long >= minimum,
            f"Minimum {minimum:g} minutes. {max_long_detail}",
        )

    taper = [week for week in weeks if "taper" in str(week.get("programPhase") or "").lower()]
    event_week = [week for week in weeks if "event week" in str(week.get("programPhase") or "").lower()]
    volume_reduction: float | None = None
    taper_targets = taper or event_week
    if taper_targets:
        first_taper_global = min(int(week.get("globalWeek") or 0) for week in taper_targets)
        prior = [week for week in weeks if int(week.get("globalWeek") or 0) < first_taper_global and "recovery" not in str(week.get("programPhase") or "").lower()]
        baseline = prior[-2:]
        baseline_avg = sum(planned_minutes(week) for week in baseline) / len(baseline) if baseline else 0
        taper_avg = sum(planned_minutes(week) for week in taper_targets) / len(taper_targets)
        if baseline_avg:
            volume_reduction = 1 - taper_avg / baseline_avg
        taper_ok = baseline_avg > 0 and 0.10 <= (volume_reduction or 0) <= 0.70
        add_check(
            run,
            f"{event_type}: taper reduces volume without deleting practice",
            taper_ok,
            f"Pre-taper average {baseline_avg:.1f} min; taper/event-week average {taper_avg:.1f} min; reduction {(volume_reduction or 0):.0%}.",
        )
    else:
        add_check(run, f"{event_type}: taper reduces volume without deleting practice", False, "No taper or event-week phase was generated.")

    recovery = phase_weeks(run, "post-")
    recovery_text = " ".join(week_blob(week) for week in recovery)
    recovery_positive = any(term in recovery_text for term in ("recovery", "restore", "easy", "walk", "mobility", "re-entry"))
    recovery_high_stress = any(term in recovery_text for term in (
        "simulation", "race rehearsal", "mock meet", "competition squat",
        "competition deadlift", "full test / tactical simulation", "ocr course simulation",
        "tournament round simulation", "hyrox simulation", "competition simulation",
    ))
    add_check(
        run,
        f"{event_type}: post-event recovery is low stress",
        bool(recovery) and recovery_positive and not recovery_high_stress,
        f"Recovery weeks: {[week.get('globalWeek') for week in recovery]}; restore language={recovery_positive}; high-stress event work={recovery_high_stress}.",
    )

    if event_type == "Bodybuilding / Physique Competition":
        bad_posing = "posing practice" in event_blob
        add_check(run, f"{event_type}: posing is not prescribed as a workout", not bad_posing, "No posing-practice workout found." if not bad_posing else "Posing practice appeared as a workout.")

    if event_type == "Custom Sport Event":
        event_phase = next((phase for phase in run.phases if phase.get("journeyMode") == "event_preparation"), {})
        mission = event_phase.get("mission") or {}
        custom_name = str(mission.get("eventName") or "")
        add_check(
            run,
            f"{event_type}: user-defined event name persists",
            bool(custom_name) and custom_name != event_type,
            f"Generated mission event name: {custom_name or 'none'}.",
        )

    return {
        "eventType": event_type,
        "family": expected_family,
        "maxLongMinutes": max_long,
        "eventWeeks": len(weeks),
        "taperReduction": volume_reduction,
        "simulations": len(rehearsals),
        "scopeStatus": scope_status,
    }


def validate_configuration(journeys: list[dict[str, Any]], matrix: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    specs = matrix.get("eventTypes", [])
    spec_ids = {str(spec.get("id")) for spec in specs}
    journey_ids = {str(journey.get("eventValidationId")) for journey in journeys}
    if spec_ids != journey_ids:
        errors.append(f"Matrix/journey IDs differ. Matrix-only={sorted(spec_ids-journey_ids)} Journey-only={sorted(journey_ids-spec_ids)}")
    seen: set[str] = set()
    for journey in journeys:
        jid = str(journey.get("id") or "")
        if not jid or jid in seen:
            errors.append(f"Duplicate or missing journey id: {jid!r}")
        seen.add(jid)
        total = sum(int(phase.get("weeks") or 0) for phase in journey.get("phases", []))
        if total != 52:
            errors.append(f"{jid}: phases total {total}, expected 52")
        event_phases = [phase for phase in journey.get("phases", []) if phase.get("journeyMode") == "event_preparation"]
        if len(event_phases) != 1:
            errors.append(f"{jid}: expected one event-preparation phase, observed {len(event_phases)}")
    return errors


def write_event_index(
    runs: list[sim.JourneyRun],
    metrics: dict[str, dict[str, Any]],
    specs: dict[str, dict[str, Any]],
    report_dir: Path,
    browser_name: str,
) -> None:
    rows: list[str] = []
    total_checks = 0
    failed_checks = 0
    for run in runs:
        summary = sim.journey_summary(run)
        total_checks += len(run.checks)
        failed = [check for check in run.checks if not check.get("passed")]
        failed_checks += len(failed)
        spec = specs[str(run.config["eventValidationId"])]
        metric = metrics.get(str(run.config["eventValidationId"]), {})
        status = "PASS" if not failed and not run.errors else "REVIEW"
        failures = "<br>".join(esc(check["name"] + ": " + check["detail"]) for check in failed[:4]) or "None"
        taper = metric.get("taperReduction")
        taper_text = "—" if taper is None else f"{taper:.0%}"
        rows.append(
            f"<tr class='{status.lower()}'><td>{status}</td><td><a href='{esc(run.config['id'])}.html'>{esc(spec['eventType'])}</a>"
            f"<small>{esc(spec['family'])}</small></td><td>{metric.get('eventWeeks', 0)}</td><td>{summary['adherence']:.0%}</td>"
            f"<td>{summary['timeViolations']}</td><td>{metric.get('maxLongMinutes', 0):g}</td><td>{taper_text}</td>"
            f"<td>{len(run.checks)-len(failed)}/{len(run.checks)}</td><td>{failures}</td><td>{esc(spec.get('limitation',''))}</td></tr>"
        )

    running = [metrics.get(key, {}) for key in ("5k-race", "10k-race", "half-marathon", "marathon")]
    running_values = [float(x.get("maxLongMinutes") or 0) for x in running]
    running_differentiated = (
        len(running_values) == 4
        and all(a <= b for a, b in zip(running_values, running_values[1:]))
        and running_values[-1] - running_values[0] >= 30
    )
    running_detail = (
        f"Maximum long/rehearsal minutes: 5K={running_values[0]:g}, 10K={running_values[1]:g}, "
        f"Half={running_values[2]:g}, Marathon={running_values[3]:g}."
        if len(running_values) == 4 else f"Full running matrix not present in this run: {running_values}."
    )
    aggregate_checks = [
        {
            "name": "Running-event dose differentiates 5K through marathon",
            "passed": running_differentiated,
            "detail": running_detail,
        },
        {
            "name": "All 16 selectable event types have clean controls",
            "passed": len(runs) == 16,
            "detail": f"Observed {len(runs)} controls.",
        },
    ]
    total_checks += len(aggregate_checks)
    failed_checks += sum(1 for check in aggregate_checks if not check["passed"])
    aggregate_html = "".join(
        f"<article class='check {'pass' if check['passed'] else 'fail'}'><b>{'PASS' if check['passed'] else 'REVIEW'}</b><h3>{esc(check['name'])}</h3><p>{esc(check['detail'])}</p></article>"
        for check in aggregate_checks
    )
    generated = dt.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")
    passed = total_checks - failed_checks
    doc = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Bell {VERSION} Event Routing & Clean-Control Calibration</title><style>
:root{{--bg:#080a0e;--panel:#12161d;--border:#303641;--text:#f5f5f3;--muted:#b6bdc8;--gold:#e0ae32;--good:#64d69a;--bad:#ff7777}}*{{box-sizing:border-box}}body{{font-family:Segoe UI,Arial;background:var(--bg);color:var(--text);margin:0}}main{{max-width:1700px;margin:auto;padding:28px}}header,section{{background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:22px;margin-bottom:18px}}h1{{font-size:clamp(2rem,5vw,4rem);margin:.2em 0}}p,small{{color:var(--muted);line-height:1.5}}.metric{{font-size:2rem;font-weight:900}}.summary{{display:flex;gap:10px;flex-wrap:wrap}}.summary span{{background:#191e27;border:1px solid var(--border);padding:9px 13px;border-radius:999px}}.wrap{{overflow:auto}}table{{width:100%;border-collapse:collapse;min-width:1600px}}th,td{{padding:10px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}}th{{color:var(--gold)}}td small{{display:block}}tr.pass td:first-child,.check.pass b{{color:var(--good);font-weight:900}}tr.review td:first-child,.check.fail b{{color:var(--bad);font-weight:900}}a{{color:var(--gold)}}.checks{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}}.check{{background:#0d1117;border:1px solid var(--border);border-radius:14px;padding:16px}}.check h3{{margin:.4em 0}}</style></head><body><main>
<header><div style='color:var(--gold);font-weight:900;letter-spacing:.14em;text-transform:uppercase'>Bell Performance · Event-Type Coaching Audit</div><h1>Event Routing & Clean-Control Calibration</h1><p>Sixteen clean 52-week controls test canonical event routing, preservation of event-critical sessions, context-appropriate rehearsal evidence, dose, taper, time feasibility, post-event recovery, and explicit scope boundaries. This validates prescriptions against declared guardrails; it does not validate predicted outcomes.</p><div class='metric'>{passed}/{total_checks} checks passed</div><div class='summary'><span>{len(runs)} event controls</span><span>{sum(len(run.weeks) for run in runs)} simulated weeks</span><span>{sum(len(run.days) for run in runs):,} simulated days</span><span>Primary compliance: 90%</span><span>Browser: {esc(browser_name)}</span><span>Generated: {esc(generated)}</span></div></header>
<section><h2>Cross-event checks</h2><div class='checks'>{aggregate_html}</div></section>
<section><h2>Event results</h2><div class='wrap'><table><thead><tr><th>Status</th><th>Event</th><th>Prep weeks</th><th>Adherence</th><th>Time violations</th><th>Max long/rehearsal min</th><th>Taper reduction</th><th>Checks</th><th>Failed checks</th><th>Scope boundary</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></section>
<section><h2>Interpretation</h2><p>A clean pass means Bell generated a complete and internally consistent control that met the event’s context-appropriate rubric. Rehearsal evidence must come from canonical event roles, powerlifting opener/command practice, or another explicitly defined event-specific prescription. Undefined custom events must report SCOPE_LIMITED rather than claim scientific specificity.</p></section>
</main></body></html>"""
    (report_dir / "index.html").write_text(doc, encoding="utf-8")
    payload = {
        "version": VERSION,
        "generatedAt": generated,
        "browser": browser_name,
        "checksPassed": passed,
        "checksTotal": total_checks,
        "aggregateChecks": aggregate_checks,
        "events": [
            {
                "id": run.config["eventValidationId"],
                "eventType": specs[str(run.config["eventValidationId"])]["eventType"],
                "summary": sim.journey_summary(run),
                "metrics": metrics.get(str(run.config["eventValidationId"]), {}),
                "checks": run.checks,
                "warnings": run.warnings,
                "errors": run.errors,
            }
            for run in runs
        ],
    }
    (report_dir / "summary.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Bell Performance event-type scientific validation.")
    parser.add_argument("--app-root", required=True, type=Path)
    parser.add_argument("--journeys", type=Path)
    parser.add_argument("--matrix", type=Path)
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--config-only", action="store_true")
    args = parser.parse_args()

    app_root = args.app_root.resolve()
    journeys_path = args.journeys or app_root / "automation" / "event_validation_journeys.json"
    matrix_path = args.matrix or app_root / "automation" / "event_validation_matrix.json"
    journeys = load_json(journeys_path)
    matrix = load_json(matrix_path)
    errors = validate_configuration(journeys, matrix)
    if errors:
        for error in errors:
            print(f"CONFIG ERROR: {error}")
        return 2
    print(f"Configuration valid: {len(journeys)} event journeys, all 52 weeks.")
    if args.config_only:
        return 0

    specs = {str(spec["id"]): spec for spec in matrix["eventTypes"]}
    reports_root = app_root / "automation" / "event_validation_reports"
    timestamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    report_dir = reports_root / timestamp
    report_dir.mkdir(parents=True, exist_ok=True)
    runs: list[sim.JourneyRun] = []
    metrics: dict[str, dict[str, Any]] = {}

    with sim.local_server(app_root) as base_url:
        with sim.sync_playwright() as playwright:
            executable = sim.find_browser_executable()
            launch: dict[str, Any] = {"headless": not args.headed}
            browser_name = "Playwright Chromium"
            if executable:
                launch["executable_path"] = executable
                browser_name = Path(executable).name
            browser = playwright.chromium.launch(**launch)
            try:
                for index, journey in enumerate(journeys, start=1):
                    spec = specs[str(journey["eventValidationId"])]
                    print(f"[{index}/{len(journeys)}] Simulating {spec['eventType']}...")
                    run = sim.simulate_journey(browser, base_url, journey, report_dir)
                    metrics[str(journey["eventValidationId"])] = validate_event_run(run, spec)
                    runs.append(run)
                    sim.write_journey_report(run, report_dir)
                    summary = sim.journey_summary(run)
                    print(f"  {summary['checksPassed']}/{len(run.checks)} checks passed · {summary['timeViolations']} time violations")
                write_event_index(runs, metrics, specs, report_dir, browser_name)
            finally:
                browser.close()

    latest = reports_root / "latest"
    sim.copy_latest(report_dir, latest)
    failed = sum(1 for run in runs for check in run.checks if not check.get("passed"))
    failed += sum(1 for run in runs if run.errors)
    print(f"Bell Performance {VERSION} event validation complete: {len(runs)} events, {sum(len(run.weeks) for run in runs)} weeks.")
    print(f"Report: {latest / 'index.html'}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
