from __future__ import annotations

import html
import json
import sys
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from intelligence.prescription_application import (  # noqa: E402
    apply_application_to_plan,
    apply_prescription_application,
    build_prescription_application,
)

REPORT_DIR = ROOT / "automation" / "prescription_application_reports" / "latest"
JS_PATH = REPORT_DIR / "js-results.json"


def decision(status="progress", channel="strength", intensity=1.025, volume=1.04, engine=1.05):
    return {
        "status": status,
        "intensity_factor": intensity,
        "volume_factor": volume,
        "engine_duration_factor": engine,
        "reason_codes": ["TEST"],
        "explanation": "Apply the stabilized response.",
        "longitudinal": {"channel": channel, "global_exposure": 2, "channel_exposure": 2},
    }


def application(status="progress", channel="strength", intensity=1.025, volume=1.04, engine=1.05, exercises=None):
    return build_prescription_application(
        decision(status, channel, intensity, volume, engine), exercises or [], "source-1", source_session_type=channel
    )


def strength(sid="S1"):
    return {
        "session_type": "strength",
        "session": {"session_id": sid, "title": "Squat Focus", "estimated_minutes": 60, "requested_minutes": 60},
        "event_role": "primary_lift",
        "session_role": "competition_squat",
        "programming": {"block_phase": "build"},
        "exercise_blocks": [
            {"exercise_id": "back-squat", "name": "Back Squat", "prescription": {"sets": 4, "target_load": 300, "target_rpe": 8}},
            {"exercise_id": "barbell-row", "name": "Barbell Row", "prescription": {"sets": 3, "target_load": 150, "target_rpe": 8}},
        ],
    }


def engine(sid="E1"):
    return {
        "session_type": "engine",
        "session": {"session_id": sid, "title": "Long Run", "estimated_minutes": 60, "requested_minutes": 60},
        "event_role": "long",
        "session_role": "event_long",
        "programming": {"block_phase": "build"},
        "engine_prescription": {"duration_minutes": 60},
    }


rows = []

def check(case_id, title, function):
    try:
        detail = function() or "Passed"
        rows.append({"id": case_id, "title": title, "passed": True, "detail": str(detail)})
    except Exception as exc:  # pragma: no cover - validation report path
        rows.append({"id": case_id, "title": title, "passed": False, "detail": f"{type(exc).__name__}: {exc}"})


def require(value, message):
    if not value:
        raise AssertionError(message)


check("strength-progress", "Strength progress changes the next dose", lambda: require(apply_prescription_application(strength(), application())["exercise_blocks"][0]["prescription"]["target_load"] > 300, "load did not increase"))
check("strength-accelerate", "Accelerated progression stays inside ceiling", lambda: require(apply_prescription_application(strength(), application("accelerate", intensity=1.1, volume=1.15))["exercise_blocks"][0]["prescription"]["target_load"] == 330, "wrong accelerated load"))
check("strength-hold", "Hold caps effort without progressing movement", lambda: require(apply_prescription_application(strength(), application("hold", intensity=.98, volume=.9))["exercise_blocks"][0]["prescription"]["target_load"] <= 300, "hold progressed"))
check("strength-regress", "Regression reduces load and volume", lambda: require(apply_prescription_application(strength(), application("regress", intensity=.95, volume=.8, exercises=[{"exercise_key": "back-squat", "status": "regress", "load_factor": .95}]))["exercise_blocks"][0]["prescription"]["target_load"] == 285, "wrong regression"))
check("strength-rebuild", "Rebuild returns with reduced prescription", lambda: require(apply_prescription_application(strength(), application("rebuild", intensity=.95, volume=.8))["exercise_blocks"][0]["prescription"]["target_rpe"] <= 7, "rebuild RPE not capped"))
check("strength-deload", "Deload limits work sets and effort", lambda: require(apply_prescription_application(strength(), application("deload", intensity=.95, volume=.75))["exercise_blocks"][0]["prescription"]["target_rpe"] <= 6.5, "deload RPE not capped"))
check("strength-reentry", "Re-entry keeps the next exposure conservative", lambda: require(apply_prescription_application(strength(), application("reentry", intensity=.98, volume=.9))["exercise_blocks"][0]["prescription"]["target_rpe"] <= 7, "re-entry RPE not capped"))
check("exercise-protect-squat", "Pain protects only the affected squat", lambda: require(apply_prescription_application(strength(), application("protect", intensity=.95, volume=.75, exercises=[{"exercise_key": "back-squat", "status": "protect"}]))["exercise_blocks"][1]["name"] == "Barbell Row", "unaffected movement changed"))
check("exercise-protect-row", "Technique concern protects only the affected pull", lambda: require("Pain-Free" in apply_prescription_application(strength(), application("protect", intensity=.95, volume=.75, exercises=[{"exercise_key": "barbell-row", "status": "protect"}]))["exercise_blocks"][1]["name"], "pull not protected"))
check("safety-hold", "Safety hold replaces hard training with recovery", lambda: require(apply_prescription_application(strength(), application("safety_hold", intensity=.9, volume=.6, engine=.7))["session_type"] == "recovery", "hard session remained"))
check("engine-progress", "Engine progress changes duration only", lambda: require(apply_prescription_application(engine(), application(channel="engine", engine=1.05))["session"]["estimated_minutes"] == 63, "duration wrong"))
check("engine-accelerate", "Engine acceleration respects ten-percent step", lambda: require(apply_prescription_application(engine(), application("accelerate", "engine", engine=1.1))["session"]["estimated_minutes"] == 66, "duration wrong"))
check("engine-hold", "Engine hold reduces next duration", lambda: require(apply_prescription_application(engine(), application("hold", "engine", engine=.92))["session"]["estimated_minutes"] == 55, "duration wrong"))
check("engine-rebuild", "Engine rebuild reduces next duration", lambda: require(apply_prescription_application(engine(), application("rebuild", "engine", engine=.85))["session"]["estimated_minutes"] == 51, "duration wrong"))
check("channel-isolation", "Engine decision cannot change strength prescription", lambda: require(apply_prescription_application(strength(), application(channel="engine")) == strength(), "cross-channel mutation"))

def idempotency():
    app = application()
    once = apply_prescription_application(strength(), app)
    twice = apply_prescription_application(once, app)
    require(once == twice, "application compounded")
check("idempotency", "The same application cannot compound twice", idempotency)
check("role-invariant", "Event roles remain present after dose application", lambda: require(apply_prescription_application(strength(), application())["programming"]["closed_loop_application"]["identity_invariant"]["event_roles_preserved"], "event role changed"))
check("exercise-hold", "Exercise hold blocks a movement-specific increase", lambda: require(apply_prescription_application(strength(), application(intensity=1.05, exercises=[{"exercise_key": "back-squat", "status": "hold"}]))["exercise_blocks"][0]["prescription"]["target_load"] == 300, "held exercise increased"))

def next_channel():
    plan = {"weeks": [{"week": 1, "sessions": [strength("S0"), engine("E1"), strength("S2")]}]}
    result = apply_application_to_plan(plan, application(), source_session_id="S0")
    require(result["target_session_id"] == "S2", "wrong target")
    require("closed_loop_application" not in result["plan"]["weeks"][0]["sessions"][1]["programming"], "engine changed")
check("next-comparable-routing", "Application targets the next same-channel session", next_channel)

def consumed_skip():
    plan = {"weeks": [{"week": 1, "sessions": [strength("S0"), strength("S1"), strength("S2")]}]}
    result = apply_application_to_plan(plan, application(), source_session_id="S0", completed_session_ids={"S1"})
    require(result["target_session_id"] == "S2", "completed target not skipped")
check("application-consumption", "Completed prescriptions are skipped during retargeting", consumed_skip)

js = json.loads(JS_PATH.read_text(encoding="utf-8")) if JS_PATH.exists() else {"cases": []}
js_by_id = {item["id"]: item for item in js.get("cases", [])}
for row in rows:
    peer = js_by_id.get(row["id"])
    row["javascript_passed"] = bool(peer and peer.get("passed"))
    row["parity_passed"] = row["passed"] and row["javascript_passed"]

passed = sum(1 for row in rows if row["parity_passed"])
result = {"version": "13.15.0", "total": len(rows), "passed": passed, "failed": len(rows) - passed, "cases": rows}
REPORT_DIR.mkdir(parents=True, exist_ok=True)
(REPORT_DIR / "results.json").write_text(json.dumps(result, indent=2), encoding="utf-8")

cards = []
for row in rows:
    cls = "pass" if row["parity_passed"] else "fail"
    cards.append(
        f"<article class='{cls}'><h3>{html.escape(row['title'])}</h3>"
        f"<p><b>{'PASS' if row['parity_passed'] else 'FAIL'}</b></p>"
        f"<ul><li>JavaScript application: {'PASS' if row['javascript_passed'] else 'FAIL'}</li>"
        f"<li>Python/Bell Core application: {'PASS' if row['passed'] else 'FAIL'}</li>"
        f"<li>{html.escape(row['detail'])}</li></ul></article>"
    )
report = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Bell 13.15.0 Closed-Loop Prescription Validation</title><style>body{{font-family:Segoe UI,Arial;background:#090b0f;color:#f5f5f3;margin:0}}main{{max-width:1500px;margin:auto;padding:28px}}header,article{{background:#12161d;border:1px solid #303641;border-radius:18px;padding:22px;margin-bottom:16px}}.metric{{font-size:2.4rem;font-weight:900}}p,li{{color:#b6bdc8;line-height:1.5}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:14px}}.grid article{{margin:0}}.pass b{{color:#64d69a}}.fail b{{color:#ff7777}}</style></head><body><main><header><h1>Closed-Loop Prescription Application</h1><p>Twenty deterministic controls verify that longitudinal decisions rewrite the next comparable prescription in both the browser and Bell Core while preserving mission identity, event roles, channel independence, and idempotency.</p><div class='metric'>{passed}/{len(rows)} cases passed</div></header><section class='grid'>{''.join(cards)}</section></main></body></html>"""
(REPORT_DIR / "index.html").write_text(report, encoding="utf-8")
print(f"{passed}/{len(rows)} closed-loop prescription cases passed")
raise SystemExit(0 if passed == len(rows) else 1)
