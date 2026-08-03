from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import sys
from pathlib import Path
from typing import Any

VERSION = "13.13.0"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def full_completion(raw: dict[str, Any], index: int = 0) -> dict[str, Any]:
    payload = {
        "schema_version": 1,
        "session_id": f"validation-{index}",
        "session_type": "strength",
        "duration_minutes": 60,
        "session_rpe": 7,
        "performance_ratio": 1.0,
        "difficulty": "right",
        "planned": {"duration_minutes": 60},
        "readiness": {"score": 78},
        "pain": {},
        "technique_issues": [],
        "symptoms": [],
        "exercise_results": [],
    }
    payload.update(raw or {})
    if "planned" not in payload or not isinstance(payload["planned"], dict):
        payload["planned"] = {"duration_minutes": 60}
    return payload


def evaluate_case(case: dict[str, Any], response_module: Any) -> dict[str, Any]:
    current = full_completion(case.get("current") or {}, 99)
    recent = [full_completion(item, idx) for idx, item in enumerate(case.get("recent") or [])]
    case_type = case.get("type", "session")
    if case_type == "exercise":
        decisions = response_module.exercise_progression_decisions(current, recent)
        actual = decisions[0]["status"] if decisions else "missing"
        evidence = decisions[0] if decisions else {}
    else:
        evidence = response_module.evaluate_athlete_response(current, recent, case.get("context") or {})
        actual = evidence["status"]
    expected = case["expected_status"]
    checks = [{"name": "Expected decision", "passed": actual == expected, "detail": f"expected {expected}; observed {actual}"}]
    if case_type == "session":
        checks.extend([
            {"name": "Intensity cap", "passed": .90 <= evidence["intensity_factor"] <= 1.05, "detail": str(evidence["intensity_factor"])},
            {"name": "Volume cap", "passed": .60 <= evidence["volume_factor"] <= 1.10, "detail": str(evidence["volume_factor"])},
            {"name": "Engine-duration cap", "passed": .70 <= evidence["engine_duration_factor"] <= 1.10, "detail": str(evidence["engine_duration_factor"])},
            {"name": "Guardrail audit", "passed": len(evidence.get("guardrails") or []) >= 5, "detail": "; ".join(evidence.get("guardrails") or [])},
        ])
        for field, value in (case.get("expected") or {}).items():
            checks.append({"name": field, "passed": abs(float(evidence.get(field)) - float(value)) < .0001, "detail": f"expected {value}; observed {evidence.get(field)}"})
        if actual == "rebuild":
            checks.append({"name": "No catch-up volume", "passed": evidence["volume_factor"] <= 1, "detail": f"volume factor {evidence['volume_factor']}"})
        if actual in {"protect", "safety_hold"}:
            checks.append({"name": "Pain blocks progression", "passed": evidence["intensity_factor"] <= 1 and evidence["volume_factor"] < 1, "detail": f"intensity {evidence['intensity_factor']}; volume {evidence['volume_factor']}"})
    return {"id": case["id"], "title": case["title"], "type": case_type, "expected": expected, "actual": actual, "passed": all(item["passed"] for item in checks), "checks": checks, "evidence": evidence}


def write_report(results: list[dict[str, Any]], output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    passed = sum(1 for result in results if result["passed"])
    total = len(results)
    payload = {"version": VERSION, "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(), "passed": passed, "total": total, "results": results}
    (output / "report.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    cards = []
    for result in results:
        rows = "".join(f"<li class='{('pass' if check['passed'] else 'fail')}'><b>{html.escape(check['name'])}</b> — {html.escape(check['detail'])}</li>" for check in result["checks"])
        cards.append(f"<article><h3>{html.escape(result['title'])}</h3><p><b>{'PASS' if result['passed'] else 'FAIL'}</b> · expected {html.escape(result['expected'])} · observed {html.escape(result['actual'])}</p><ul>{rows}</ul></article>")
    document = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Bell {VERSION} Athlete Response Validation</title><style>body{{font-family:Segoe UI,Arial;background:#090b0f;color:#f5f5f3;margin:0}}main{{max-width:1400px;margin:auto;padding:28px}}header,article{{background:#12161d;border:1px solid #303641;border-radius:18px;padding:22px;margin-bottom:16px}}.metric{{font-size:2.4rem;font-weight:900}}p,li{{color:#b6bdc8;line-height:1.5}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px}}.grid article{{margin:0}}li.pass b{{color:#64d69a}}li.fail b{{color:#ff7777}}</style></head><body><main><header><h1>Athlete Response & Adaptive Progression</h1><p>Thirty deterministic controls test structured completion data, repeated-success progression, underperformance, interruption, pain, readiness, exercise-level decisions, and progression caps.</p><div class='metric'>{passed}/{total} cases passed</div></header><section class='grid'>{''.join(cards)}</section></main></body></html>"""
    (output / "index.html").write_text(document, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--app-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--scenarios", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    app_root = args.app_root.resolve()
    scenarios_path = args.scenarios or app_root / "automation" / "athlete_response_scenarios.json"
    output = args.output or app_root / "automation" / "athlete_response_reports" / "latest"
    sys.path.insert(0, str(app_root / "backend"))
    from intelligence import athlete_response as response_module
    cases = load_json(scenarios_path)["cases"]
    results = [evaluate_case(case, response_module) for case in cases]
    write_report(results, output)
    passed = sum(1 for result in results if result["passed"])
    print(f"Bell {VERSION} athlete response validation: {passed}/{len(results)} cases passed")
    for result in results:
        if not result["passed"]:
            print(f"FAIL {result['id']}: expected {result['expected']}; observed {result['actual']}")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
