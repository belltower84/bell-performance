from __future__ import annotations

import argparse
import html
import json
import sys
from pathlib import Path
from typing import Any

VERSION = "13.14.0"
UPWARD = {"progress", "accelerate"}
DOWNWARD = {"regress", "rebuild"}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def expand(case: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for segment in case.get("segments", []):
        for _ in range(int(segment.get("count", 1))):
            rows.append({
                "completion": json.loads(json.dumps(segment.get("completion") or {})),
                "context": json.loads(json.dumps(segment.get("context") or {})),
            })
    return rows


def simulate(case: dict[str, Any], response_module: Any, longitudinal_module: Any) -> dict[str, Any]:
    state = None
    recent: list[dict[str, Any]] = []
    records: list[dict[str, Any]] = []
    for index, exposure in enumerate(expand(case), start=1):
        completion = {
            "schema_version": 1,
            "session_id": f"{case['id']}-{index}",
            "session_type": "strength",
            "performance_ratio": 1.0,
            "session_rpe": 7.0,
            "difficulty": "right",
            "planned": {"duration_minutes": 60},
            "duration_minutes": 60,
            "readiness": {"score": 78},
            "pain": {},
            "technique_issues": [],
            "symptoms": [],
            **exposure["completion"],
        }
        context = exposure["context"]
        raw = response_module.evaluate_athlete_response(completion, recent[-8:], context)
        result = longitudinal_module.stabilize_longitudinal_progression(
            raw,
            state,
            {**context, "session_type": completion.get("session_type")},
        )
        state = result["state"]
        decision = result["decision"]
        record = {
            "exposure": index,
            "channel": decision["longitudinal"]["channel"],
            "phase_id": decision["longitudinal"]["phase_id"],
            "raw_status": decision.get("raw_status"),
            "status": decision.get("status"),
            "intensity_factor": decision.get("intensity_factor"),
            "volume_factor": decision.get("volume_factor"),
            "engine_duration_factor": decision.get("engine_duration_factor"),
            "fatigue_score": decision["longitudinal"].get("fatigue_score"),
            "protective_lock": decision["longitudinal"].get("protective_lock"),
            "deload_remaining": decision["longitudinal"].get("deload_remaining"),
            "specificity_preserved": decision["longitudinal"].get("preserve_event_specificity"),
            "strength_intensity_target": state["channels"]["strength"]["intensity_target"],
            "strength_volume_target": state["channels"]["strength"]["volume_target"],
            "engine_duration_target": state["channels"]["engine"]["duration_target"],
        }
        records.append(record)
        recent.append(completion)
    checks = evaluate_checks(case.get("checks") or {}, records)
    return {
        "id": case["id"],
        "title": case["title"],
        "passed": all(item["passed"] for item in checks),
        "checks": checks,
        "records": records,
        "state": state,
    }


def _check(label: str, passed: bool, detail: str) -> dict[str, Any]:
    return {"label": label, "passed": bool(passed), "detail": detail}


def evaluate_checks(spec: dict[str, Any], records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    checks: list[dict[str, Any]] = []
    statuses = [row["status"] for row in records]
    upward = [row for row in records if row["status"] in UPWARD]
    downward = [row for row in records if row["status"] in DOWNWARD]
    for expected in spec.get("must_include", []):
        checks.append(_check(f"Includes {expected}", expected in statuses, f"Observed statuses: {', '.join(statuses)}"))
    for forbidden in spec.get("forbid", []):
        checks.append(_check(f"Excludes {forbidden}", forbidden not in statuses, f"Observed statuses: {', '.join(statuses)}"))
    if "max_upward" in spec:
        checks.append(_check("Upward decision limit", len(upward) <= spec["max_upward"], f"{len(upward)} upward decisions; maximum {spec['max_upward']}"))
    if "max_intensity" in spec:
        observed = max(row["intensity_factor"] for row in records)
        checks.append(_check("Intensity ceiling", observed <= spec["max_intensity"] + 1e-9, f"Maximum {observed}; ceiling {spec['max_intensity']}"))
    if "min_intensity" in spec:
        observed = min(row["intensity_factor"] for row in records)
        checks.append(_check("Intensity floor", observed >= spec["min_intensity"] - 1e-9, f"Minimum {observed}; floor {spec['min_intensity']}"))
    if "max_volume" in spec:
        observed = max(row["volume_factor"] for row in records)
        checks.append(_check("Volume ceiling", observed <= spec["max_volume"] + 1e-9, f"Maximum {observed}; ceiling {spec['max_volume']}"))
    if "min_volume" in spec:
        observed = min(row["volume_factor"] for row in records)
        checks.append(_check("Volume floor", observed >= spec["min_volume"] - 1e-9, f"Minimum {observed}; floor {spec['min_volume']}"))
    if "max_engine" in spec:
        observed = max(row["engine_duration_factor"] for row in records)
        checks.append(_check("Engine-duration ceiling", observed <= spec["max_engine"] + 1e-9, f"Maximum {observed}; ceiling {spec['max_engine']}"))
    if "first_accelerate_at_or_after" in spec:
        positions = [row["exposure"] for row in records if row["status"] == "accelerate"]
        observed = positions[0] if positions else None
        checks.append(_check("Acceleration evidence threshold", observed is not None and observed >= spec["first_accelerate_at_or_after"], f"First accelerate at {observed}; required >= {spec['first_accelerate_at_or_after']}"))
    if "max_consecutive_downward" in spec:
        longest = current = 0
        for row in records:
            if row["status"] in DOWNWARD:
                current += 1
                longest = max(longest, current)
            else:
                current = 0
        checks.append(_check("No regression spiral", longest <= spec["max_consecutive_downward"], f"Longest consecutive downward run {longest}"))
    follow = spec.get("no_upward_for_after")
    if follow:
        positions = [i for i, row in enumerate(records) if row["status"] == follow["status"]]
        ok = bool(positions)
        evidence: list[str] = []
        for position in positions:
            after = records[position + 1:position + 1 + int(follow["count"])]
            evidence.extend(row["status"] for row in after)
            ok = ok and len(after) == int(follow["count"]) and all(row["status"] not in UPWARD for row in after)
        checks.append(_check("Protected re-entry window", ok, f"Statuses after {follow['status']}: {', '.join(evidence) or 'none'}"))
    if spec.get("require_specificity_preserved"):
        ok = all(row["specificity_preserved"] is True for row in records)
        checks.append(_check("Event specificity preserved", ok, "Every decision retained canonical event-role protection." if ok else "A decision did not preserve event specificity."))
    phases = set(spec.get("no_upward_in_phases") or [])
    if phases:
        violations = [row for row in records if row["phase_id"] in phases and row["status"] in UPWARD]
        checks.append(_check("Phase protection", not violations, f"Upward violations: {len(violations)}"))
    if spec.get("engine_must_progress"):
        ok = any(row["channel"] == "engine" and row["status"] in UPWARD for row in records)
        checks.append(_check("Engine channel progresses", ok, "Engine received an independent upward decision." if ok else "No engine progression found."))
    if spec.get("strength_must_not_progress"):
        ok = not any(row["channel"] == "strength" and row["status"] in UPWARD for row in records)
        checks.append(_check("Strength channel remains protected", ok, "No strength upward decision followed strength underperformance."))
    episodes = []
    for row in records:
        if row["status"] == "deload" and (not episodes or row["exposure"] != episodes[-1][-1] + 1):
            episodes.append([row["exposure"]])
        elif row["status"] == "deload":
            episodes[-1].append(row["exposure"])
    if "max_deload_episodes" in spec:
        checks.append(_check("Deload episode limit", len(episodes) <= spec["max_deload_episodes"], f"{len(episodes)} deload episode(s); maximum {spec['max_deload_episodes']}"))
    if "min_deload_episode_gap" in spec and len(episodes) > 1:
        starts = [episode[0] for episode in episodes]
        gaps = [b - a for a, b in zip(starts, starts[1:])]
        ok = all(gap >= spec["min_deload_episode_gap"] for gap in gaps)
        checks.append(_check("Deload cooldown", ok, f"Episode start gaps {gaps}; required >= {spec['min_deload_episode_gap']}"))
    elif "min_deload_episode_gap" in spec:
        checks.append(_check("Deload cooldown", True, "Only one deload episode occurred."))
    if spec.get("no_catchup_volume"):
        rebuild_positions = [i for i, row in enumerate(records) if row["status"] == "rebuild"]
        ok = bool(rebuild_positions)
        details = []
        for i in rebuild_positions:
            prior = records[max(0, i - 1)]["strength_volume_target"]
            after = records[i:min(len(records), i + 3)]
            maximum = max(row["strength_volume_target"] for row in after)
            details.append(f"prior {prior}; next-window max {maximum}")
            ok = ok and maximum <= max(prior, 1.0) + 1e-9
        checks.append(_check("No catch-up volume", ok, "; ".join(details) or "No rebuild decision found."))
    if spec.get("target_not_reset_by_hold"):
        progress_positions = [i for i, row in enumerate(records) if row["status"] in UPWARD]
        hold_positions = [i for i, row in enumerate(records) if row["status"] in {"hold", "deload"}]
        ok = bool(progress_positions and hold_positions)
        if ok:
            earned = records[progress_positions[0]]["strength_intensity_target"]
            later_targets = [records[i]["strength_intensity_target"] for i in hold_positions if i > progress_positions[0]]
            ok = bool(later_targets) and min(later_targets) >= earned - 1e-9
            detail = f"Earned target {earned}; hold-window minimum {min(later_targets) if later_targets else 'none'}"
        else:
            detail = "Required progress and hold evidence were not both present."
        checks.append(_check("Holds preserve earned target", ok, detail))
    # Always-on invariants.
    checks.append(_check("Cumulative hard caps", all(.90 <= r["intensity_factor"] <= 1.10 and .60 <= r["volume_factor"] <= 1.15 and .70 <= r["engine_duration_factor"] <= 1.20 for r in records), "All effective factors remained inside longitudinal ceilings and floors."))
    checks.append(_check("Specificity invariant present", all(r["specificity_preserved"] for r in records), "Every longitudinal decision declared event-specificity preservation."))
    return checks


def write_report(results: list[dict[str, Any]], output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    passed = sum(1 for result in results if result["passed"])
    total_exposures = sum(len(result["records"]) for result in results)
    cards = []
    for result in results:
        check_items = "".join(
            f"<li class='{'pass' if item['passed'] else 'fail'}'><b>{html.escape(item['label'])}</b> — {html.escape(item['detail'])}</li>"
            for item in result["checks"]
        )
        trajectory = " → ".join(row["status"] for row in result["records"])
        factors = result["records"][-1]
        cards.append(
            f"<article><h3>{html.escape(result['title'])}</h3><p><b>{'PASS' if result['passed'] else 'FAIL'}</b> · {len(result['records'])} exposures</p>"
            f"<p class='trajectory'>{html.escape(trajectory)}</p><p>Final factors: load {factors['intensity_factor']:.3f} · volume {factors['volume_factor']:.3f} · engine {factors['engine_duration_factor']:.3f}</p><ul>{check_items}</ul></article>"
        )
    document = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Bell {VERSION} Longitudinal Adaptive Coaching Validation</title><style>body{{font-family:Segoe UI,Arial;background:#090b0f;color:#f5f5f3;margin:0}}main{{max-width:1500px;margin:auto;padding:28px}}header,article{{background:#12161d;border:1px solid #303641;border-radius:18px;padding:22px;margin-bottom:16px}}.metric{{font-size:2.4rem;font-weight:900}}p,li{{color:#b6bdc8;line-height:1.5}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(390px,1fr));gap:14px}}.grid article{{margin:0}}li.pass b{{color:#64d69a}}li.fail b{{color:#ff7777}}.trajectory{{font-size:.88rem;color:#d6b45c}}</style></head><body><main><header><h1>Longitudinal Adaptive Coaching</h1><p>Eighteen deterministic athlete trajectories test progression stability, protective re-entry, deload spacing, phase integrity, channel independence, and cumulative dose ceilings across {total_exposures} completed exposures.</p><div class='metric'>{passed}/{len(results)} trajectories passed</div></header><section class='grid'>{''.join(cards)}</section></main></body></html>"""
    (output / "index.html").write_text(document, encoding="utf-8")
    (output / "results.json").write_text(json.dumps({"version": VERSION, "passed": passed, "total": len(results), "total_exposures": total_exposures, "results": results}, indent=2), encoding="utf-8")


def write_fixture(results: list[dict[str, Any]], path: Path) -> None:
    fixture = {
        "version": VERSION,
        "cases": {
            result["id"]: [
                {
                    "status": row["status"],
                    "raw_status": row["raw_status"],
                    "intensity_factor": row["intensity_factor"],
                    "volume_factor": row["volume_factor"],
                    "engine_duration_factor": row["engine_duration_factor"],
                }
                for row in result["records"]
            ]
            for result in results
        },
    }
    path.write_text(json.dumps(fixture, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--app-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--scenarios", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--write-fixture", action="store_true")
    args = parser.parse_args()
    app_root = args.app_root.resolve()
    sys.path.insert(0, str(app_root / "backend"))
    from intelligence import athlete_response, longitudinal_progression
    scenarios = load_json(args.scenarios or app_root / "automation" / "longitudinal_adaptation_scenarios.json")["cases"]
    results = [simulate(case, athlete_response, longitudinal_progression) for case in scenarios]
    output = args.output or app_root / "automation" / "longitudinal_adaptation_reports" / "latest"
    write_report(results, output)
    if args.write_fixture:
        write_fixture(results, app_root / "automation" / "longitudinal_adaptation_expected.json")
    passed = sum(1 for result in results if result["passed"])
    exposures = sum(len(result["records"]) for result in results)
    print(f"Bell {VERSION} longitudinal adaptation validation: {passed}/{len(results)} trajectories passed across {exposures} exposures")
    for result in results:
        if not result["passed"]:
            print(f"FAIL {result['id']}")
            for item in result["checks"]:
                if not item["passed"]:
                    print(f"  - {item['label']}: {item['detail']}")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
