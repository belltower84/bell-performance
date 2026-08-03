from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import sys
import time
from pathlib import Path
from typing import Any

import run_full_stack_athlete_journeys as base
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
AUTOMATION = ROOT / "automation"
REPORT_DIR = AUTOMATION / "dynamic_52_week_reports" / "latest"
START_DATE = dt.date(2026, 8, 3)
VERSION = "13.17.2"

DYNAMIC_COMPLETE = base.COMPLETE_REAL_SESSION.replace(
    'if(behavior==="messy"&&idx%4===0){sparse=true;quality="sparse";} if(behavior==="messy"&&idx===5){pain=6;contradictory=true;quality="hard";}',
    'if(behavior==="messy"&&idx%4===0){sparse=true;quality="sparse";} if(behavior==="messy"&&idx===5){pain=6;contradictory=true;quality="hard";} '
    'if(behavior==="injury_active"){quality="hard";pain=Number(cfg.injurySeverity||6);technique=true;contradictory=true;} '
    'if(behavior==="reentry"){quality="success";pain=0;technique=false;}'
)

APPLY_TRANSITION = r"""
(cfg)=>{
 const before={
  identity:data.athleteProfile?.identity?.primary||data.settings?.primaryTrainingIdentity||"",
  objective:data.athleteProfile?.identity?.objective||data.settings?.secondaryTrainingGoal||"",
  journeyMode:data.athleteProfile?.identity?.journeyMode||"",
  goalType:data.trainingBlock?.goalType||"",
  engineMode:data.settings?.cardioType||data.trainingBlock?.dualGoals?.engineMode||"",
  strengthDays:Number(data.trainingBlock?.strengthDays||0),
  engineDays:Number(data.trainingBlock?.runDays||0),
  historyCount:(data.history||[]).length
 };
 const t=cfg.transition||{};
 data.athleteProfile=data.athleteProfile||{};
 data.athleteProfile.constraints=data.athleteProfile.constraints||{};
 data.settings=data.settings||{};
 data.trainingBlock=data.trainingBlock||{};
 if(t.type==="injury_start"){
  data.athleteProfile.constraints.activeInjury={area:t.injury||"unspecified",severity:Number(t.severity||5),startedAt:cfg.date,active:true};
  data.settings.activeInjury=data.athleteProfile.constraints.activeInjury;
 }
 if(t.type==="injury_clear"){
  const prior=data.athleteProfile.constraints.activeInjury||{};
  data.athleteProfile.constraints.activeInjury={...prior,active:false,clearedAt:cfg.date};
  data.settings.activeInjury=data.athleteProfile.constraints.activeInjury;
 }
 if(t.type==="track_change"){
  if(t.engineMode){data.settings.cardioType=t.engineMode;data.trainingBlock.dualGoals=data.trainingBlock.dualGoals||{};data.trainingBlock.dualGoals.engineMode=t.engineMode;}
  if(t.objective){data.settings.secondaryTrainingGoal=t.objective;data.athleteProfile.identity=data.athleteProfile.identity||{};data.athleteProfile.identity.objective=t.objective;data.trainingBlock.secondaryGoal=t.objective;}
  data.trainingBlock.weeks=[];
  data.trainingBlock.startDate=cfg.date;
  data.trainingBlock.currentWeek=1;
  data.trainingBlock.lengthWeeks=Number(cfg.remainingWeeks||1);
  bpPrepareBlockPlan(data.trainingBlock);
 }
 if(t.type==="goal_change"){
  const mode=t.journeyMode||"development";
  const eventDate=mode==="event_preparation"?addLocalDays(cfg.date,Number(cfg.remainingWeeks||1)*7-1):"";
  data.athleteProfile.identity={...(data.athleteProfile.identity||{}),primary:t.identity||before.identity,objective:t.objective||before.objective,journeyMode:mode,journeyName:t.objective||t.identity||"Updated Goal",eventType:t.eventType||"",eventName:t.eventName||t.eventType||"",eventDate};
  data.settings.primaryTrainingIdentity=t.identity||before.identity;
  data.settings.secondaryTrainingGoal=t.objective||before.objective;
  data.settings.secondaryTargetDate=eventDate;
  data.settings.athleteMode=t.identity||before.identity;
  if(t.engineMode)data.settings.cardioType=t.engineMode;
  const mission=mode==="event_preparation"?{path:"event",eventType:t.eventType||"",eventName:t.eventName||t.eventType||"",eventDate,objective:"perform",developmentObjective:t.objective||"",identity:t.identity||before.identity,experience:"intermediate"}:{path:"development",developmentGoal:t.objective||"",priority:t.objective||"",identity:t.identity||before.identity};
  data.trainingBlock={...data.trainingBlock,enabled:true,status:"active",goalType:t.goalType||before.goalType,targetDate:eventDate,lengthWeeks:Number(cfg.remainingWeeks||1),currentWeek:1,strengthDays:Number(t.strengthDays||before.strengthDays||3),runDays:Number(t.engineDays||before.engineDays||2),secondaryGoal:t.objective||before.objective,startDate:cfg.date,generatedAt:new Date().toISOString(),activatedAt:new Date().toISOString(),mission,journeyPhaseName:t.objective||t.identity||"Updated Goal",dualGoals:{...(data.trainingBlock.dualGoals||{}),strengthGoal:t.goalType||before.goalType,engineMode:t.engineMode||before.engineMode,engineGoal:t.objective||before.objective,engineSessions:Number(t.engineDays||before.engineDays||2)},weeks:[]};
  bpPrepareBlockPlan(data.trainingBlock);
 }
 if(typeof bpLoadActiveWeekFromPlan==="function")bpLoadActiveWeekFromPlan(); else buildCurrentWeekPlan();
 saveData({render:false});
 const after={
  identity:data.athleteProfile?.identity?.primary||data.settings?.primaryTrainingIdentity||"",
  objective:data.athleteProfile?.identity?.objective||data.settings?.secondaryTrainingGoal||"",
  journeyMode:data.athleteProfile?.identity?.journeyMode||"",
  goalType:data.trainingBlock?.goalType||"",
  engineMode:data.settings?.cardioType||data.trainingBlock?.dualGoals?.engineMode||"",
  strengthDays:Number(data.trainingBlock?.strengthDays||0),
  engineDays:Number(data.trainingBlock?.runDays||0),
  activeInjury:Boolean(data.athleteProfile?.constraints?.activeInjury?.active),
  injuryArea:data.athleteProfile?.constraints?.activeInjury?.area||"",
  historyCount:(data.history||[]).length,
  generatedWeeks:(data.trainingBlock?.weeks||[]).length
 };
 return {before,after};
}
"""

PROFILE_SNAPSHOT = r"""
()=>({
 identity:data.athleteProfile?.identity?.primary||data.settings?.primaryTrainingIdentity||"",
 objective:data.athleteProfile?.identity?.objective||data.settings?.secondaryTrainingGoal||"",
 journeyMode:data.athleteProfile?.identity?.journeyMode||"",
 goalType:data.trainingBlock?.goalType||"",
 engineMode:data.settings?.cardioType||data.trainingBlock?.dualGoals?.engineMode||"",
 activeInjury:Boolean(data.athleteProfile?.constraints?.activeInjury?.active),
 injuryArea:data.athleteProfile?.constraints?.activeInjury?.area||"",
 historyCount:(data.history||[]).length,
 applicationCount:(data.responseEngine?.prescriptionApplications||[]).length
})
"""


def behavior_for_week(default: str, injury_active: bool, reentry_until: int, week: int) -> str:
    if injury_active:
        return "injury_active"
    if week <= reentry_until:
        return "reentry"
    return default


def run_journey(browser: Any, base_url: str, cfg: dict[str, Any]) -> dict[str, Any]:
    context, page, errors = base.launch_context(browser, base_url, cfg["id"])
    checks: list[dict[str, Any]] = []
    records: list[dict[str, Any]] = []
    transition_records: list[dict[str, Any]] = []
    exposure = 0
    segment_start = 1
    injury_active = False
    injury_severity = 0
    reentry_until = 0
    transitions = {int(t["week"]): t for t in cfg.get("transitions", [])}
    try:
        base.set_now(page, START_DATE)
        page.evaluate(base.SEED_PROFILE, cfg)
        block = page.evaluate(base.CREATE_BLOCK, cfg)
        checks.append({"name": "52-week formal plan generated", "passed": block["formalWeeks"] == 52, "detail": f"{block['formalWeeks']} weeks"})

        for global_week in range(1, 53):
            monday = START_DATE + dt.timedelta(weeks=global_week - 1)
            base.set_now(page, monday)
            if global_week in transitions:
                t = transitions[global_week]
                result = page.evaluate(APPLY_TRANSITION, {
                    "transition": t,
                    "date": monday.isoformat(),
                    "remainingWeeks": 53 - global_week,
                })
                transition_records.append({"week": global_week, "transition": t, **result})
                checks.append({
                    "name": f"week {global_week} transition applied: {t['type']}",
                    "passed": result["after"]["historyCount"] == result["before"]["historyCount"],
                    "detail": json.dumps(result, sort_keys=True),
                })
                if t["type"] in ("goal_change", "track_change"):
                    segment_start = global_week
                    expected_identity = t.get("identity")
                    expected_engine = t.get("engineMode")
                    if expected_identity:
                        checks.append({"name": f"week {global_week} identity changed", "passed": result["after"]["identity"] == expected_identity, "detail": result["after"]["identity"]})
                    if expected_engine:
                        checks.append({"name": f"week {global_week} engine track changed", "passed": result["after"]["engineMode"] == expected_engine, "detail": result["after"]["engineMode"]})
                if t["type"] == "injury_start":
                    injury_active = True
                    injury_severity = int(t.get("severity", 6))
                    checks.append({"name": f"week {global_week} injury persisted in athlete profile", "passed": result["after"]["activeInjury"], "detail": result["after"]["injuryArea"]})
                if t["type"] == "injury_clear":
                    injury_active = False
                    reentry_until = global_week + 2
                    checks.append({"name": f"week {global_week} injury cleared in athlete profile", "passed": not result["after"]["activeInjury"], "detail": result["after"]["injuryArea"]})

            segment_week = global_week - segment_start + 1
            week_state = page.evaluate(base.PREPARE_WEEK, {"week": segment_week, "monday": monday.isoformat()})
            real: list[tuple[dict[str, Any], dict[str, Any]]] = []
            for item in week_state["plan"]:
                for sess in item.get("sessions", []):
                    if sess.get("sessionType") in ("strength", "engine"):
                        real.append((item, sess))
            checks.append({"name": f"week {global_week} executable plan discovered", "passed": bool(real), "detail": f"{len(real)} sessions"})
            if not real:
                raise RuntimeError(f"No executable sessions in global week {global_week}, segment week {segment_week}")

            weekly_statuses: list[str] = []
            for item, sess in real:
                exposure += 1
                day_index = max(0, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].index(item.get("day", "Monday")))
                date = monday + dt.timedelta(days=day_index)
                base.set_now(page, date)
                behavior = behavior_for_week(cfg.get("behavior", "steady"), injury_active, reentry_until, global_week)
                result = page.evaluate(DYNAMIC_COMPLETE, {
                    "journeyId": cfg["id"],
                    "week": global_week,
                    "exposureIndex": exposure,
                    "behavior": behavior,
                    "injurySeverity": injury_severity,
                    "date": date.isoformat(),
                    "planId": item["id"],
                    "sessionKey": sess["sessionKey"],
                })
                result["globalWeek"] = global_week
                result["segmentWeek"] = segment_week
                result["behaviorUsed"] = behavior
                records.append(result)
                status = (result.get("decision") or {}).get("status")
                weekly_statuses.append(status)
                d = result.get("decision") or {}
                bounded = .9 <= float(d.get("intensity_factor", 1)) <= 1.1 and .6 <= float(d.get("volume_factor", 1)) <= 1.15 and .7 <= float(d.get("engine_duration_factor", 1)) <= 1.2
                checks.append({"name": f"week {global_week} exposure {exposure} bounded", "passed": bounded, "detail": f"{status} {d.get('intensity_factor')}/{d.get('volume_factor')}/{d.get('engine_duration_factor')}"})

            if injury_active:
                protective_statuses = {"safety_hold", "protect", "hold", "regress", "deload", "rebuild"}
                upward_statuses = {"progress", "accelerate"}
                checks.append({
                    "name": f"week {global_week} injury used protective status semantics",
                    "passed": bool(weekly_statuses) and all(s in protective_statuses for s in weekly_statuses),
                    "detail": str(weekly_statuses),
                })
                checks.append({
                    "name": f"week {global_week} active injury blocked upward coaching",
                    "passed": not any(s in upward_statuses for s in weekly_statuses),
                    "detail": str(weekly_statuses),
                })
            if global_week <= reentry_until and not injury_active:
                checks.append({"name": f"week {global_week} return remained conservative", "passed": not any(s == "accelerate" for s in weekly_statuses), "detail": str(weekly_statuses)})

            if global_week in (13, 26, 39):
                before = page.evaluate(base.STATE_SNAPSHOT)
                page.reload(wait_until="domcontentloaded", timeout=60000)
                page.wait_for_function("typeof bellRecordAthleteResponse==='function' && typeof bpPrepareBlockPlan==='function'", timeout=60000)
                base.set_now(page, monday)
                after = page.evaluate(base.STATE_SNAPSHOT)
                checks.append({"name": f"week {global_week} reload preserved history", "passed": before["historyCount"] == after["historyCount"], "detail": f"{before['historyCount']} -> {after['historyCount']}"})
                checks.append({"name": f"week {global_week} reload preserved applications", "passed": before["applicationIds"] == after["applicationIds"], "detail": f"{len(before['applicationIds'])} IDs"})

        final = page.evaluate(base.STATE_SNAPSHOT)
        statuses = [(r.get("decision") or {}).get("status") for r in records]
        checks.append({"name": "all 52 weeks completed", "passed": max((r["globalWeek"] for r in records), default=0) == 52, "detail": f"{len(records)} real exposures"})
        checks.append({"name": "positive adaptation observed", "passed": any(s in ("progress", "accelerate") for s in statuses), "detail": str(sorted(set(statuses)))})
        checks.append({"name": "application identifiers remain unique", "passed": len(final.get("applicationIds", [])) == len(set(final.get("applicationIds", []))), "detail": f"{len(final.get('applicationIds', []))} IDs"})
        checks.append({"name": "goal and injury transitions all executed", "passed": len(transition_records) == len(cfg.get("transitions", [])), "detail": f"{len(transition_records)}/{len(cfg.get('transitions', []))}"})
        if records:
            dup = page.evaluate(base.DUPLICATE_CHECK, records[-1]["completionId"])
            checks.append({"name": "true duplicate still rejected", "passed": bool(dup.get("duplicate")) and dup.get("before") == dup.get("after"), "detail": json.dumps(dup)})
        passed = all(c["passed"] for c in checks) and not errors
        return {"id": cfg["id"], "title": cfg["title"], "passed": passed, "weeks": 52, "exposures": len(records), "statuses": statuses, "checks": checks, "transitions": transition_records, "records": records, "final": final, "errors": errors}
    except Exception as exc:
        return {"id": cfg["id"], "title": cfg["title"], "passed": False, "weeks": 52, "exposures": len(records), "statuses": [(r.get("decision") or {}).get("status") for r in records], "checks": checks, "transitions": transition_records, "records": records, "errors": errors + [repr(exc)]}
    finally:
        context.close()


def render_report(results: list[dict[str, Any]], elapsed: float) -> tuple[int, int, int, int, int]:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    total_exposures = sum(r["exposures"] for r in results)
    passed = sum(bool(r["passed"]) for r in results)
    checks = sum(len(r["checks"]) for r in results)
    checks_passed = sum(sum(1 for c in r["checks"] if c["passed"]) for r in results)
    payload = {"version": VERSION, "elapsedSeconds": elapsed, "journeys": results}
    (REPORT_DIR / "results.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    cards = []
    for r in results:
        transition_html = "".join(
            f"<li><b>Week {t['week']} {html.escape(t['transition']['type'])}</b> — {html.escape(json.dumps(t['after'], sort_keys=True))}</li>"
            for t in r.get("transitions", [])
        )
        check_html = "".join(
            f"<li class={'pass' if c['passed'] else 'fail'}><b>{html.escape(c['name'])}</b> — {html.escape(c['detail'])}</li>"
            for c in r["checks"]
        )
        error_html = "".join(f"<li class=fail><b>Runtime error</b> — {html.escape(e)}</li>" for e in r.get("errors", []))
        counts = {s: r["statuses"].count(s) for s in sorted(set(r["statuses"])) if s}
        cards.append(f"<article><h2>{html.escape(r['title'])}</h2><p><b>{'PASS' if r['passed'] else 'FAIL'}</b> · 52 weeks · {r['exposures']} real sessions</p><p class=trajectory>{html.escape(json.dumps(counts, sort_keys=True))}</p><h3>Transitions</h3><ul>{transition_html}</ul><h3>Checks</h3><ul>{check_html}{error_html}</ul></article>")
    doc = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Bell 13.17.2 52-Week Dynamic Athlete Journeys</title><style>body{{font-family:Segoe UI,Arial;background:#090b0f;color:#f5f5f3;margin:0}}main{{max-width:1500px;margin:auto;padding:28px}}header,article{{background:#12161d;border:1px solid #303641;border-radius:18px;padding:22px;margin-bottom:16px}}p,li{{color:#b6bdc8;line-height:1.5}}.metric{{font-size:2.4rem;font-weight:900}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(500px,1fr));gap:14px}}.pass b{{color:#64d69a}}.fail b{{color:#ff7777}}.trajectory{{color:#d6b45c;font-size:.9rem}}</style></head><body><main><header><h1>Protective Status Semantics & Long-Horizon Baseline Lock</h1><p>These Chromium journeys execute full generated plans for one year while athletes change goals, switch conditioning tracks, sustain injuries, clear injuries, return conservatively, reload state, and continue closed-loop coaching.</p><div class=metric>{passed}/{len(results)} journeys passed</div><p>{total_exposures} real plan exposures · {checks_passed}/{checks} checks passed · runtime {elapsed:.1f} seconds</p></header><section class=grid>{''.join(cards)}</section></main></body></html>"""
    (REPORT_DIR / "index.html").write_text(doc, encoding="utf-8")
    return passed, len(results), total_exposures, checks_passed, checks


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--app-root", type=Path, default=ROOT)
    parser.add_argument("--config", type=Path, default=AUTOMATION / "full_stack_dynamic_52_week_journeys_13172.json")
    args = parser.parse_args()
    cfg = json.loads(args.config.read_text(encoding="utf-8"))
    start = time.perf_counter()
    with base.local_server(args.app_root) as base_url, sync_playwright() as pw:
        exe = base.find_browser()
        browser = pw.chromium.launch(headless=True, executable_path=exe) if exe else pw.chromium.launch(headless=True)
        results = []
        for journey in cfg["journeys"]:
            print(f"Running {journey['title']}...")
            result = run_journey(browser, base_url, journey)
            results.append(result)
            print(f"  {'PASS' if result['passed'] else 'FAIL'}: {result['exposures']} exposures")
        browser.close()
    elapsed = time.perf_counter() - start
    passed, total, exposures, cp, ct = render_report(results, elapsed)
    print(f"{passed}/{total} dynamic 52-week journeys passed across {exposures} real plan exposures in {elapsed:.1f}s ({cp}/{ct} checks).")
    if passed != total:
        sys.exit(1)


if __name__ == "__main__":
    main()
