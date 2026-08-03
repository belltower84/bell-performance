from __future__ import annotations

import argparse
import contextlib
import csv
import dataclasses
import datetime as dt
import hashlib
import html
import json
import math
import os
import random
import shutil
import socket
import statistics
import threading
import time
import traceback
from collections import Counter, defaultdict
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

START_DATE = dt.date(2026, 8, 3)  # Monday
VIEWPORT = {"width": 430, "height": 932}


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        return


@contextlib.contextmanager
def local_server(root: Path):
    class RootedHandler(QuietHandler):
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            super().__init__(*args, directory=str(root), **kwargs)

    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    server = ThreadingHTTPServer(("127.0.0.1", port), RootedHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{port}"
    finally:
        server.shutdown()
        thread.join(timeout=3)


def find_browser_executable() -> str | None:
    candidates: list[str] = []
    if os.name == "nt":
        roots = [os.environ.get("PROGRAMFILES"), os.environ.get("PROGRAMFILES(X86)"), os.environ.get("LOCALAPPDATA")]
        for root in filter(None, roots):
            candidates.extend([
                str(Path(root) / "Google/Chrome/Application/chrome.exe"),
                str(Path(root) / "Microsoft/Edge/Application/msedge.exe"),
            ])
    elif sys_platform() == "darwin":
        candidates.extend([
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ])
    else:
        candidates.extend([
            "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/microsoft-edge",
            "/usr/bin/microsoft-edge-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
        ])
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    for name in ("google-chrome", "microsoft-edge", "chromium", "chromium-browser"):
        found = shutil.which(name)
        if found:
            return found
    return None


def sys_platform() -> str:
    import platform
    return platform.system().lower()


def mutable_date_script() -> str:
    initial = f"{START_DATE.isoformat()}T09:00:00-05:00"
    return f"""
(() => {{
  const NativeDate = Date;
  window.__bellNativeDate = NativeDate;
  window.__bellNowMs = new NativeDate({json.dumps(initial)}).getTime();
  class BellJourneyDate extends NativeDate {{
    constructor(...args) {{ super(...(args.length ? args : [window.__bellNowMs])); }}
    static now() {{ return window.__bellNowMs; }}
    static parse(value) {{ return NativeDate.parse(value); }}
    static UTC(...args) {{ return NativeDate.UTC(...args); }}
  }}
  window.Date = BellJourneyDate;
  window.__bellSetNow = iso => {{ window.__bellNowMs = NativeDate.parse(iso); return new NativeDate(window.__bellNowMs).toISOString(); }};
  window.alert = message => {{ (window.__bellTestAlerts ||= []).push(String(message)); }};
  window.confirm = () => true;
}})();
"""


SEED_PROFILE_JS = r"""
(cfg) => {
  const equipmentByEnvironment = {
    commercial:["barbell","rack","bench","dumbbells","cables","machines","smith","kettlebells","bands","pullupBar","dipStation","plyoBox","treadmill","bike","rower","skiErg","sled","airBike","jumpRope","outdoor"],
    home:["barbell","rack","bench","dumbbells","kettlebells","bands","pullupBar","bike","treadmill","outdoor"],
    minimal:["dumbbells","kettlebells","bands","jumpRope","outdoor"],
    bodyweight:["outdoor"]
  };
  data = cloneDefaults();
  normalizeData();
  const today = todayKey();
  data.athleteProfile.demographics = {
    firstName:cfg.name, age:cfg.age, sex:cfg.sex, heightInches:cfg.heightInches,
    bodyweightLb:cfg.bodyweightLb, goalWeightLb:cfg.goalWeightLb || null
  };
  data.athleteProfile.experience = {level:cfg.experience, trainingAgeYears:cfg.experience === "Beginner" ? 0.5 : cfg.experience === "Advanced" ? 10 : 4};
  data.athleteProfile.baselines = {maxes:{...(cfg.maxes || {})}, endurance:{...(cfg.endurance || {})}};
  data.athleteProfile.availability = {normalDays:[...cfg.days], sessionMinutes:cfg.usualMinutes, preferredTime:"Flexible", reliability:"Mostly consistent", minimumDays:Math.min(3,cfg.days.length)};
  data.athleteProfile.coaching = {...(data.athleteProfile.coaching||{}), controlMode:"coach", style:"Performance", detailLevel:"Balanced", checkInFrequency:"Weekly", scriptureFrequency:"Occasionally"};
  data.settings.athleteName=cfg.name;
  data.settings.sex=cfg.sex;
  data.settings.weight=cfg.bodyweightLb;
  data.settings.goal=cfg.goalWeightLb||null;
  data.settings.maxes={...data.settings.maxes,...(cfg.maxes||{})};
  data.settings.trainingExperience=cfg.experience;
  data.settings.appControlMode="coach";
  data.settings.coachMessages={setupComplete:true,style:"Performance",scriptureFrequency:"Occasionally"};
  data.settings.firstFlightStage="complete";
  data.settings.firstFlightTourComplete=true;
  data.settings.pendingFirstFlightTour=false;
  data.settings.equipmentSetup={locations:[{id:"journey",name:"Journey Environment",environment:cfg.environment,equipment:equipmentByEnvironment[cfg.environment]||equipmentByEnvironment.commercial}],activeLocationId:"journey"};
  data.settings.trainingAvailability={normalDays:[...cfg.days],weekOverrides:{},updatedAt:new Date().toISOString()};
  data.dayNavigation={selectedDate:today,lastLocalDate:today};
  data.mobility={...data.mobility,minutes:10,completedDates:[]};
  data.dailySessionStatus={};
  data.history=[];
  data.readinessLog=[];
  data.sessionFeedbackLog=[];
  data.activeWorkout=null;
  if(typeof bellSetNormalTrainingDays==="function")bellSetNormalTrainingDays(cfg.days);
  if(window.BellAthleteProfile?.syncToLegacy)window.BellAthleteProfile.syncToLegacy();
  if(typeof bpApplyEnvironment==="function")bpApplyEnvironment();
  document.querySelectorAll(".modal").forEach(el=>el.classList.add("hidden"));
  document.body.classList.remove("modal-open","workout-open","engine-session","female-session");
  saveData({render:false});
  if(typeof renderApp==="function")renderApp();
  if(typeof showScreen==="function")showScreen("home");
  if(typeof renderBellCommercialHome==="function")renderBellCommercialHome();
  return {today};
}
"""


APPLY_PHASE_JS = r"""
(cfg) => {
  const today=todayKey();
  const eventDate=cfg.journeyMode==="event_preparation"?addLocalDays(today,Math.max(1,Number(cfg.weeks))*7-1):"";
  const journeyName=cfg.journeyMode==="event_preparation"?`${cfg.eventName||cfg.eventType} Preparation`:`${cfg.identity} · ${cfg.objective}`;
  data.athleteProfile.identity={
    primary:cfg.identity, objective:cfg.objective, journeyMode:cfg.journeyMode, journeyName,
    eventType:cfg.eventType||"", eventName:cfg.eventName||cfg.eventType||"", eventDate
  };
  data.athleteProfile.availability={...(data.athleteProfile.availability||{}),normalDays:[...cfg.days],sessionMinutes:Number(cfg.usualMinutes)};
  data.athleteProfile.updatedAt=new Date().toISOString();
  data.settings.primaryTrainingIdentity=cfg.identity;
  data.settings.secondaryTrainingGoal=cfg.objective;
  data.settings.secondaryTargetDate=eventDate;
  data.settings.athleteMode=cfg.identity;
  data.settings.cardioType=cfg.engineMode==="General Conditioning"?"Air Bike":(cfg.engineMode||"Running");
  data.settings.trainingAvailability={normalDays:[...cfg.days],weekOverrides:{},updatedAt:new Date().toISOString()};
  const mission=cfg.journeyMode==="event_preparation"
    ? {path:"event",eventType:cfg.eventType,eventName:cfg.eventName||cfg.eventType,eventDate,objective:"perform",developmentObjective:cfg.objective,identity:cfg.identity,experience:String(data.settings.trainingExperience||"Intermediate").toLowerCase()}
    : {path:"development",developmentGoal:cfg.objective,priority:cfg.objective,identity:cfg.identity};
  const previousBlock=data.trainingBlock?.enabled?JSON.parse(JSON.stringify(data.trainingBlock)):null;
  if(previousBlock?.mission?.path==="event"){
    const previousFamily=window.BellLongitudinal1390?.blockFamily?.(previousBlock)||"";
    data.settings.lastCompletedEvent={family:previousFamily,eventType:previousBlock.mission.eventType,eventName:previousBlock.mission.eventName,completedAt:new Date().toISOString()};
  }
  const transitionType=/post[- ]?meet/i.test(cfg.name)?"post_meet":/post[- ]?show/i.test(cfg.name)?"post_show":/post[- ]?race/i.test(cfg.name)?"post_race":"";
  data.trainingBlock={
    ...data.trainingBlock,enabled:true,status:"active",goalType:cfg.goalType,targetDate:eventDate,
    lengthWeeks:Number(cfg.weeks),currentWeek:1,trainingDays:cfg.days.length,
    strengthDays:Number(cfg.strengthDays),runDays:Number(cfg.engineDays),sessionMinutes:Number(cfg.usualMinutes),
    secondaryGoal:cfg.objective,startDate:today,generatedAt:new Date().toISOString(),activatedAt:new Date().toISOString(),
    mission,journeyPhaseName:cfg.name,transitionType,
    dualGoals:{strengthGoal:cfg.goalType,engineMode:cfg.engineMode,engineGoal:cfg.engineGoal,trainingCoordination:"Coach Decides",engineSessions:Number(cfg.engineDays),targetValue:0},
    availableDays:[...cfg.days],weeks:[]
  };
  if(typeof bellSetNormalTrainingDays==="function")bellSetNormalTrainingDays(cfg.days);
  if(window.BellAthleteProfile?.syncToLegacy)window.BellAthleteProfile.syncToLegacy();
  if(typeof bpPrepareBlockPlan==="function")bpPrepareBlockPlan(data.trainingBlock);
  if(typeof bpLoadActiveWeekFromPlan==="function")bpLoadActiveWeekFromPlan(); else if(typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();
  saveData({render:false});
  return {eventDate,weekCount:(data.trainingBlock.weeks||[]).length,planCount:(data.plan||[]).length,mission:data.trainingBlock.mission};
}
"""


SET_READINESS_JS = r"""
(cfg) => {
  const map={
    GREEN:{sleepState:"good",bodyState:"fresh",energyState:"fired-up",sleepQuality:5,recoveryStatus:5,energy:5,motivation:5,painToday:false},
    YELLOW:{sleepState:"okay",bodyState:"normal",energyState:"steady",sleepQuality:4,recoveryStatus:3,energy:3,motivation:4,painToday:false},
    RED:{sleepState:"poor",bodyState:"beat-up",energyState:"drained",sleepQuality:2,recoveryStatus:2,energy:2,motivation:2,painToday:Boolean(cfg.pain)}
  };
  const values={...map[cfg.status],checkInVersion:"quick-v1",painNotes:cfg.pain?String(cfg.note||"Simulated pain or recovery restriction"):"",timeMinutes:Number(cfg.minutes),timeAvailability:({30:1,45:2,60:3,75:4,90:5,105:6,120:7})[Number(cfg.minutes)]||3,sleepHours:cfg.status==="GREEN"?8:cfg.status==="YELLOW"?6:5,sleepMinutes:0};
  if(typeof commitReadiness==="function")commitReadiness(values); else {
    data.settings.readiness={...(data.settings.readiness||{}),...values,lastPromptDate:todayKey()};
    data.readinessLog.push({date:todayKey(),score:cfg.status==="GREEN"?95:cfg.status==="YELLOW"?65:40,status:cfg.status,...values});
  }
  saveData({render:false});
  return {score:typeof readinessScore==="function"?readinessScore():data.settings.readiness.score,status:typeof readinessStatus==="function"?readinessStatus():cfg.status};
}
"""


PREPARE_WEEK_JS = r"""
(cfg) => {
  data.trainingBlock.currentWeek=Number(cfg.week);
  if(typeof bpPrepareBlockPlan==="function")bpPrepareBlockPlan(data.trainingBlock);
  const entry=(data.trainingBlock.weeks||[]).find(w=>Number(w.week)===Number(cfg.week));
  if(entry?.plan?.length)data.plan=JSON.parse(JSON.stringify(entry.plan));
  else if(typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();
  data.dayNavigation.selectedDate=cfg.monday;
  saveData({render:false});
  return {
    currentWeek:data.trainingBlock.currentWeek,
    formalWeekCount:(data.trainingBlock.weeks||[]).length,
    phase:window.BellLongitudinal1390?.phaseFor?.(data.trainingBlock,Number(cfg.week))?.label||(typeof dualBlockPhase==="function"?dualBlockPhase():(typeof blockPhase==="function"?blockPhase():"Training")),
    eventSummary:typeof eventCoachingSummary==="function"?eventCoachingSummary():null,
    plan:(data.plan||[]).map(x=>{
      const mission=x.mission||"";
      let template=null;
      try{template=typeof scaledTemplate==="function"?scaledTemplate(mission):(typeof getWorkoutTemplate==="function"?getWorkoutTemplate(mission):null);}catch(_){template=null;}
      const exercises=(template?.exercises||[]).map(ex=>({
        name:ex.name||"",block:ex.block||"",sets:Number(ex.sets)||0,reps:String(ex.reps||""),rest:Number(ex.rest)||0,
        recommendedWeight:Number(ex.recommendedWeight)||null,primary:(typeof findExercise==="function"?(findExercise(ex.name)?.primary||[]):[]),
        secondary:(typeof findExercise==="function"?(findExercise(ex.name)?.secondary||[]):[]),pattern:(typeof findExercise==="function"?(findExercise(ex.name)?.pattern||""):"")
      }));
      return {day:x.day,mission,label:x.customLabel||x.label||x.mission,detail:x.detail||"",duration:Number(x.prescribedDuration)||Number(template?.duration)||0,eventPhase:x.eventPhase||"",eventRole:x.eventRole||"",exerciseRole:x.exerciseRole||"",enduranceRole:x.enduranceRole||"",physiqueRole:x.physiqueRole||"",longitudinalPhase:x.longitudinalPhase||"",optional:Boolean(x.optional),exercises};
    })
  };
}
"""


DAY_SNAPSHOT_JS = r"""
(key) => {
  data.dayNavigation.selectedDate=key;
  if(typeof saveData==="function")saveData({render:false});
  const model=window.BellDailySessions?.buildRows?window.BellDailySessions.buildRows(key):{rows:[],required:[],available:0,recoveryDay:true};
  const rows=(model.rows||[]).map(row=>({
    type:row.type,label:row.label,description:row.description||"",minutes:Number(row.minutes)||0,
    planned:Number(row.planned)||0,optional:Boolean(row.optional),outsideBudget:Boolean(row.outsideBudget),
    recoveryFocus:Boolean(row.recoveryFocus),completed:Boolean(row.completed),synthetic:Boolean(row.synthetic),
    mission:row.session?.mission||"",eventRole:row.session?.eventRole||"",eventPhase:row.session?.eventPhase||"",
    exerciseRole:row.session?.exerciseRole||"",enduranceRole:row.session?.enduranceRole||"",physiqueRole:row.session?.physiqueRole||"",longitudinalPhase:row.session?.longitudinalPhase||""
  }));
  return {
    key,available:Number(model.available)||0,recoveryDay:Boolean(model.recoveryDay),
    requiredMinutes:rows.filter(r=>!r.optional&&(r.type==="strength"||r.type==="engine")).reduce((a,r)=>a+r.minutes,0),
    requiredTypes:rows.filter(r=>!r.optional&&(r.type==="strength"||r.type==="engine")).map(r=>r.type),
    rows,
    readinessScore:typeof readinessScore==="function"?readinessScore():null,
    readinessStatus:typeof readinessStatus==="function"?readinessStatus():null,
    coach:typeof coachRecommendation==="function"?coachRecommendation():"",
    phase:typeof dualBlockPhase==="function"?dualBlockPhase():(typeof blockPhase==="function"?blockPhase():"Training")
  };
}
"""


COMPLETE_SESSION_JS = r"""
(cfg) => {
  const key=cfg.key,type=cfg.type,row=cfg.row||{};
  if(window.BellDailySessions?.setComplete)window.BellDailySessions.setComplete(type,key,new Date().toISOString());
  const id=`journey-${key}-${type}-${(data.history||[]).length+1}`;
  const record={
    id,name:row.mission||row.label||type,displayLabel:row.label||type,dailySessionType:type,
    dailySessionDate:key,scheduledDate:key,completedAt:new Date().toISOString(),completed:true,status:"completed",
    prescribedDuration:Number(row.minutes)||0,elapsed:(Number(row.minutes)||0)*60,
    cardioType:type==="engine"?(data.settings.cardioType||"Engine"):undefined,
    optionalCore:type==="core"
  };
  data.history=Array.isArray(data.history)?data.history:[];
  data.history.push(record);
  if(type==="mobility"){
    data.mobility=data.mobility||{};
    data.mobility.completedDates=Array.isArray(data.mobility.completedDates)?data.mobility.completedDates:[];
    if(!data.mobility.completedDates.includes(key))data.mobility.completedDates.push(key);
  }
  const dayName=new Date(`${key}T12:00:00`).toLocaleDateString("en-US",{weekday:"long"});
  (data.plan||[]).forEach(item=>{
    const mission=String(item.mission||"");
    const inferred=/^R-/i.test(mission)?"engine":/^M-/i.test(mission)?"mobility":/^C-/i.test(mission)?"core":"strength";
    if(String(item.day||"")===dayName&&inferred===type){item.done=true;item.completed=true;item.status="completed";}
  });
  saveData({render:false});
  return true;
}
"""


FINAL_STATE_JS = r"""
() => ({
  historyCount:(data.history||[]).length,
  readinessCount:(data.readinessLog||[]).length,
  dailyStatusCount:Object.keys(data.dailySessionStatus||{}).length,
  currentWeek:Number(data.trainingBlock?.currentWeek)||0,
  blockLength:Number(data.trainingBlock?.lengthWeeks)||0,
  athlete:data.athleteProfile,
  consoleAlerts:window.__bellTestAlerts||[]
})
"""


@dataclasses.dataclass
class JourneyRun:
    config: dict[str, Any]
    weeks: list[dict[str, Any]]
    days: list[dict[str, Any]]
    phases: list[dict[str, Any]]
    screenshots: list[dict[str, str]]
    warnings: list[str]
    checks: list[dict[str, Any]]
    final_state: dict[str, Any]
    errors: list[str]


def esc(value: Any) -> str:
    return html.escape(str(value if value is not None else ""))


def stable_seed(text: str) -> int:
    return int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:12], 16)


def disruption_map(config: dict[str, Any]) -> dict[tuple[int, str], dict[str, Any]]:
    return {(int(x["week"]), str(x["day"])): x for x in config.get("disruptions", [])}


def choose_day_conditions(config: dict[str, Any], global_week: int, day_name: str, rng: random.Random) -> dict[str, Any]:
    disruption = disruption_map(config).get((global_week, day_name))
    usual = int(config.get("usualMinutes", 60))
    if disruption:
        kind = disruption.get("kind")
        if kind == "missed":
            return {"status": "GREEN", "minutes": usual, "missed": True, "note": disruption.get("note", "Scripted missed day")}
        if kind == "red":
            return {"status": "RED", "minutes": int(disruption.get("minutes", max(30, usual - 30))), "missed": False, "pain": True, "note": disruption.get("note", "Scripted red-readiness day")}
        if kind == "yellow":
            return {"status": "YELLOW", "minutes": int(disruption.get("minutes", max(30, usual - 15))), "missed": False, "note": disruption.get("note", "Scripted yellow-readiness day")}
        if kind == "short":
            return {"status": "GREEN", "minutes": int(disruption.get("minutes", max(30, usual - 30))), "missed": False, "note": disruption.get("note", "Scripted short-availability day")}
    roll = rng.random()
    status = "GREEN" if roll < 0.78 else "YELLOW" if roll < 0.95 else "RED"
    minute_roll = rng.random()
    allowed = [30, 45, 60, 75, 90, 105, 120]
    if minute_roll < 0.82:
        minutes = usual
    elif minute_roll < 0.96:
        lower = [x for x in allowed if x < usual]
        minutes = lower[-1] if lower else usual
    else:
        higher = [x for x in allowed if x > usual]
        minutes = higher[0] if higher else usual
    return {"status": status, "minutes": minutes, "missed": False, "pain": status == "RED" and rng.random() < 0.35, "note": ""}


def phase_for_week(config: dict[str, Any], global_week: int) -> tuple[int, dict[str, Any], int]:
    cursor = 0
    for index, phase in enumerate(config["phases"]):
        end = cursor + int(phase["weeks"])
        if global_week <= end:
            return index, phase, global_week - cursor
        cursor = end
    raise ValueError(f"Week {global_week} exceeds configured journey")


def event_global_weeks(config: dict[str, Any]) -> list[int]:
    result: list[int] = []
    cursor = 0
    for phase in config["phases"]:
        cursor += int(phase["weeks"])
        if phase.get("journeyMode") == "event_preparation":
            result.append(cursor)
    return result


def projected_metric(config: dict[str, Any], week: int) -> dict[str, Any]:
    projection = config.get("projection", {})
    ptype = projection.get("type")
    progress = max(0.0, min(1.0, week / 52.0))
    if ptype == "strength":
        factor = 1 + (float(projection.get("yearEndPercent", 1.05)) - 1) * progress
        maxes = config.get("maxes", {})
        values = {k: round(float(v) * factor / 5) * 5 for k, v in maxes.items() if isinstance(v, (int, float)) and k in {"squat", "bench", "deadlift"}}
        values["total"] = sum(values.values())
        return {"label": "Illustrative strength projection", "values": values}
    if ptype == "physique":
        start = float(config.get("bodyweightLb", 0))
        stage = float(projection.get("stageWeight", start - 10))
        rebound = float(projection.get("reboundWeight", stage + 4))
        event_week = event_global_weeks(config)[0] if event_global_weeks(config) else 36
        if week <= 12:
            weight = start + 2 * week / 12
        elif week <= event_week:
            weight = (start + 2) + (stage - (start + 2)) * ((week - 12) / max(1, event_week - 12))
        elif week <= event_week + 4:
            weight = stage + (rebound - stage) * ((week - event_week) / 4)
        else:
            weight = rebound + 2 * ((week - event_week - 4) / max(1, 52 - event_week - 4))
        return {"label": "Illustrative bodyweight projection", "values": {"bodyweightLb": round(weight, 1)}}
    if ptype == "running":
        start = int(projection.get("tenKStartSeconds", 3240))
        event = int(projection.get("tenKEventSeconds", 3060))
        first_event = event_global_weeks(config)[0] if event_global_weeks(config) else 20
        if week <= first_event:
            seconds = round(start + (event - start) * week / first_event)
            return {"label": "Illustrative 10K projection", "values": {"seconds": seconds, "display": format_seconds(seconds)}}
        half = int(projection.get("halfEventSeconds", 6900))
        return {"label": "Illustrative half-marathon projection", "values": {"seconds": half, "display": format_seconds(half)}}
    if ptype == "bodyweight":
        start = float(config.get("bodyweightLb", 0))
        end = float(projection.get("yearEndWeight", start))
        weight = start + (end - start) * progress
        return {"label": "Illustrative bodyweight projection", "values": {"bodyweightLb": round(weight, 1)}}
    return {"label": "", "values": {}}


def format_seconds(seconds: int) -> str:
    seconds = int(seconds)
    hours, rem = divmod(seconds, 3600)
    minutes, secs = divmod(rem, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}" if hours else f"{minutes}:{secs:02d}"


def phase_payload(config: dict[str, Any], phase: dict[str, Any]) -> dict[str, Any]:
    payload = dict(phase)
    payload.update({
        "days": config["days"],
        "experience": config["experience"],
    })
    return payload


def create_context(browser: Browser, base_url: str, journey_id: str) -> tuple[BrowserContext, Page, list[str]]:
    context = browser.new_context(viewport=VIEWPORT, timezone_id="America/Chicago", locale="en-US")
    context.add_init_script(mutable_date_script())
    page = context.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(f"PAGE ERROR: {error}"))
    page.on("console", lambda msg: errors.append(f"CONSOLE {msg.type.upper()}: {msg.text}") if msg.type == "error" else None)
    page.goto(f"{base_url}/index.html?journey={journey_id}&ts={time.time_ns()}", wait_until="domcontentloaded", timeout=60_000)
    page.wait_for_function("typeof cloneDefaults==='function' && typeof renderApp==='function' && typeof window.BellDailySessions==='object' && typeof bpPrepareBlockPlan==='function'", timeout=60_000)
    return context, page, errors


def set_now(page: Page, date: dt.date) -> None:
    page.evaluate("iso => window.__bellSetNow(iso)", f"{date.isoformat()}T09:00:00-05:00")


def capture_dashboard(page: Page, report_dir: Path, journey_id: str, label: str, date: dt.date) -> str:
    set_now(page, date)
    page.evaluate("key => {data.dayNavigation.selectedDate=key; saveData({render:false}); renderApp(); if(typeof showScreen==='function')showScreen('home'); if(typeof renderBellCommercialHome==='function')renderBellCommercialHome();}", date.isoformat())
    page.wait_for_timeout(200)
    filename = f"{journey_id}-{label}.png"
    page.screenshot(path=str(report_dir / filename), full_page=True)
    return filename


def simulate_journey(browser: Browser, base_url: str, config: dict[str, Any], report_dir: Path) -> JourneyRun:
    context, page, errors = create_context(browser, base_url, config["id"])
    rng = random.Random(stable_seed(config["id"]))
    weeks: list[dict[str, Any]] = []
    days: list[dict[str, Any]] = []
    phases_out: list[dict[str, Any]] = []
    screenshots: list[dict[str, str]] = []
    warnings: list[str] = []
    checks: list[dict[str, Any]] = []
    try:
        set_now(page, START_DATE)
        page.evaluate(SEED_PROFILE_JS, config)
        phase_cursor = 0
        current_phase_index = -1
        snapshot_weeks = {1, 52}
        phase_starts: list[int] = []
        event_weeks = event_global_weeks(config)
        cursor = 1
        for phase in config["phases"]:
            phase_starts.append(cursor)
            if phase.get("journeyMode") == "event_preparation":
                snapshot_weeks.add(cursor)
                snapshot_weeks.add(cursor + max(0, int(phase["weeks"]) // 2))
                snapshot_weeks.add(cursor + int(phase["weeks"]) - 2)
                snapshot_weeks.add(cursor + int(phase["weeks"]) - 1)
            cursor += int(phase["weeks"])

        for global_week in range(1, 53):
            phase_index, phase, phase_week = phase_for_week(config, global_week)
            monday = START_DATE + dt.timedelta(weeks=global_week - 1)
            if phase_index != current_phase_index:
                current_phase_index = phase_index
                set_now(page, monday)
                phase_summary = page.evaluate(APPLY_PHASE_JS, phase_payload(config, phase))
                phase_record = {
                    "index": phase_index + 1,
                    "name": phase["name"],
                    "startWeek": global_week,
                    "endWeek": global_week + int(phase["weeks"]) - 1,
                    "weeks": int(phase["weeks"]),
                    "journeyMode": phase["journeyMode"],
                    "eventType": phase.get("eventType", ""),
                    "eventDate": phase_summary.get("eventDate", ""),
                    "mission": phase_summary.get("mission", {}),
                    "formalWeekCount": phase_summary.get("weekCount", 0),
                    "initialPlanCount": phase_summary.get("planCount", 0),
                }
                phases_out.append(phase_record)
                if phase_record["formalWeekCount"] != phase_record["weeks"]:
                    warnings.append(f"{phase['name']}: formal plan contains {phase_record['formalWeekCount']} weeks; expected {phase_record['weeks']}.")

            # Use Monday conditions to rebuild this week's plan so weekly readiness can influence generation.
            condition_config = {**config, "usualMinutes": int(phase.get("usualMinutes", config.get("usualMinutes", 60)))}
            monday_conditions = choose_day_conditions(condition_config, global_week, "Monday", rng)
            set_now(page, monday)
            page.evaluate(SET_READINESS_JS, {"status": monday_conditions["status"], "minutes": monday_conditions["minutes"], "pain": monday_conditions.get("pain", False), "note": monday_conditions.get("note", "")})
            week_plan = page.evaluate(PREPARE_WEEK_JS, {"week": phase_week, "monday": monday.isoformat()})
            week_days: list[dict[str, Any]] = []
            prescribed_counter: Counter[str] = Counter()
            completed_counter: Counter[str] = Counter()
            required_prescribed_counter: Counter[str] = Counter()
            required_completed_counter: Counter[str] = Counter()
            week_required_minutes = 0
            week_completed_minutes = 0
            week_readiness: list[int] = []
            week_time_violations = 0
            week_missed_required = 0

            for offset in range(7):
                date = monday + dt.timedelta(days=offset)
                day_name = date.strftime("%A")
                conditions = monday_conditions if offset == 0 else choose_day_conditions(condition_config, global_week, day_name, rng)
                set_now(page, date)
                readiness = page.evaluate(SET_READINESS_JS, {"status": conditions["status"], "minutes": conditions["minutes"], "pain": conditions.get("pain", False), "note": conditions.get("note", "")})
                snapshot = page.evaluate(DAY_SNAPSHOT_JS, date.isoformat())
                snapshot["globalWeek"] = global_week
                snapshot["phaseWeek"] = phase_week
                snapshot["phaseName"] = phase["name"]
                snapshot["dayName"] = day_name
                snapshot["conditions"] = conditions
                week_readiness.append(int(readiness.get("score") or 0))
                if snapshot["requiredMinutes"] > snapshot["available"]:
                    week_time_violations += 1
                required_rows = [r for r in snapshot["rows"] if not r["optional"] and r["type"] in {"strength", "engine"}]
                optional_rows = [r for r in snapshot["rows"] if r["optional"]]
                completed_types: list[str] = []
                missed_types: list[str] = []

                for row in snapshot["rows"]:
                    prescribed_counter[row["type"]] += 1
                week_required_minutes += sum(r["minutes"] for r in required_rows)
                for row in required_rows:
                    required_prescribed_counter[row["type"]] += 1

                for row in required_rows:
                    should_complete = not conditions.get("missed", False)
                    if should_complete:
                        base = float(config.get("adherence", 0.9))
                        if conditions["status"] == "YELLOW":
                            base -= 0.08
                        elif conditions["status"] == "RED":
                            base -= 0.30
                        should_complete = rng.random() < max(0.1, min(0.99, base))
                    if should_complete:
                        page.evaluate(COMPLETE_SESSION_JS, {"key": date.isoformat(), "type": row["type"], "row": row})
                        completed_types.append(row["type"])
                        completed_counter[row["type"]] += 1
                        required_completed_counter[row["type"]] += 1
                        week_completed_minutes += row["minutes"]
                    else:
                        missed_types.append(row["type"])
                        week_missed_required += 1

                for row in optional_rows:
                    optional_rate = float(config.get("optionalCompletion", 0.4))
                    if conditions["status"] == "RED":
                        optional_rate *= 0.25
                    elif conditions["status"] == "YELLOW":
                        optional_rate *= 0.65
                    if not conditions.get("missed", False) and rng.random() < optional_rate:
                        page.evaluate(COMPLETE_SESSION_JS, {"key": date.isoformat(), "type": row["type"], "row": row})
                        completed_types.append(row["type"])
                        completed_counter[row["type"]] += 1

                day_record = {
                    "date": date.isoformat(),
                    "day": day_name,
                    "globalWeek": global_week,
                    "phaseWeek": phase_week,
                    "phaseName": phase["name"],
                    "programPhase": snapshot.get("phase", ""),
                    "readinessScore": snapshot.get("readinessScore"),
                    "readinessStatus": snapshot.get("readinessStatus"),
                    "availableMinutes": snapshot["available"],
                    "requiredMinutes": snapshot["requiredMinutes"],
                    "recoveryDay": snapshot["recoveryDay"],
                    "rows": snapshot["rows"],
                    "completedTypes": completed_types,
                    "missedTypes": missed_types,
                    "note": conditions.get("note", ""),
                    "coach": snapshot.get("coach", ""),
                }
                days.append(day_record)
                week_days.append(day_record)

            plan_labels = [str(x.get("label") or x.get("mission") or "") for x in week_plan.get("plan", [])]
            plan_details = [str(x.get("detail") or "") for x in week_plan.get("plan", [])]
            plan_roles = [str(x.get("exerciseRole") or x.get("enduranceRole") or x.get("physiqueRole") or x.get("eventRole") or "") for x in week_plan.get("plan", [])]
            role_prescribed = Counter()
            role_completed = Counter()
            for d in week_days:
                done_types=set(d.get("completedTypes", []))
                for row in d.get("rows", []):
                    if row.get("optional") or row.get("type") not in {"strength","engine"}:
                        continue
                    role=str(row.get("enduranceRole") or row.get("exerciseRole") or row.get("physiqueRole") or row.get("eventRole") or row.get("type") or "").lower()
                    role_prescribed[role]+=1
                    if row.get("type") in done_types:
                        role_completed[role]+=1
            projection = projected_metric(config, global_week)
            required_sessions = sum(required_prescribed_counter[t] for t in ("strength", "engine"))
            completed_required = sum(required_completed_counter[t] for t in ("strength", "engine"))
            adherence = completed_required / required_sessions if required_sessions else 1.0
            week_record = {
                "globalWeek": global_week,
                "phaseWeek": phase_week,
                "weekStart": monday.isoformat(),
                "weekEnd": (monday + dt.timedelta(days=6)).isoformat(),
                "phaseName": phase["name"],
                "journeyMode": phase["journeyMode"],
                "eventType": phase.get("eventType", ""),
                "programPhase": week_plan.get("phase", ""),
                "eventSummary": week_plan.get("eventSummary"),
                "plan": week_plan.get("plan", []),
                "planLabels": plan_labels,
                "planDetails": plan_details,
                "planRoles": plan_roles,
                "rolePrescribed": dict(role_prescribed),
                "roleCompleted": dict(role_completed),
                "prescribed": dict(prescribed_counter),
                "completed": dict(completed_counter),
                "requiredSessions": required_sessions,
                "completedRequired": completed_required,
                "adherence": adherence,
                "requiredMinutes": week_required_minutes,
                "completedMinutes": week_completed_minutes,
                "averageReadiness": round(statistics.mean(week_readiness), 1) if week_readiness else 0,
                "timeViolations": week_time_violations,
                "missedRequired": week_missed_required,
                "projection": projection,
            }
            weeks.append(week_record)

            if global_week in snapshot_weeks:
                # Prefer a day with prescribed Strength or Engine.
                chosen = next((d for d in week_days if any(r["type"] in {"strength", "engine"} for r in d["rows"])), week_days[0])
                try:
                    filename = capture_dashboard(page, report_dir, config["id"], f"week-{global_week:02d}", dt.date.fromisoformat(chosen["date"]))
                    screenshots.append({"week": str(global_week), "label": f"Week {global_week} · {phase['name']}", "file": filename})
                except Exception as exc:
                    warnings.append(f"Week {global_week} screenshot failed: {exc}")

        final_state = page.evaluate(FINAL_STATE_JS)
        errors = [e for e in errors if "favicon" not in e.lower()]

        # Journey-level checks.
        total_time_violations = sum(w["timeViolations"] for w in weeks)
        checks.append({"name": "All 52 weeks simulated", "passed": len(weeks) == 52, "detail": f"Observed {len(weeks)} weeks"})
        checks.append({"name": "No required-time budget violations", "passed": total_time_violations == 0, "detail": f"Violations: {total_time_violations}"})
        checks.append({"name": "Every phase generated a formal week plan", "passed": all(p["formalWeekCount"] == p["weeks"] for p in phases_out), "detail": "; ".join(f"{p['name']}: {p['formalWeekCount']}/{p['weeks']}" for p in phases_out)})
        checks.append({"name": "Core and Mobility remain optional support", "passed": all(all(r["optional"] for r in d["rows"] if r["type"] in {"core", "mobility"}) for d in days), "detail": "Checked every simulated day"})
        checks.append({"name": "No browser runtime errors", "passed": len(errors) == 0, "detail": "\n".join(errors[:10])})

        event_phases = [p for p in phases_out if p["journeyMode"] == "event_preparation"]
        if event_phases:
            for p in event_phases:
                phase_weeks = [w for w in weeks if p["startWeek"] <= w["globalWeek"] <= p["endWeek"]]
                phases_seen = {str(w.get("programPhase", "")) for w in phase_weeks}
                has_event_week = any("Event Week" in x for x in phases_seen)
                has_taper = any("Taper" in x or "Competition Preparation" in x for x in phases_seen)
                checks.append({"name": f"{p['name']} includes event week", "passed": has_event_week, "detail": ", ".join(sorted(phases_seen))})
                checks.append({"name": f"{p['name']} includes competition-specific taper/preparation", "passed": has_taper, "detail": ", ".join(sorted(phases_seen))})

        joined_labels = " ".join(label for w in weeks for label in w["planLabels"]).lower()
        joined_details = " ".join(detail for w in weeks for detail in w["planDetails"]).lower()
        joined_roles = " ".join(role for w in weeks for role in w.get("planRoles", [])).lower()
        if config["id"] == "powerlifting-year":
            expected_roles = (("Competition Squat", "competition_squat"), ("Competition Bench", "competition_bench"), ("Competition Deadlift", "competition_deadlift"))
            for lift, role in expected_roles:
                found = role in joined_roles or lift.lower() in joined_labels
                checks.append({"name": f"Meet preparation prescribes {lift}", "passed": found, "detail": "Found by canonical role" if role in joined_roles else ("Found by label" if found else "Missing")})
            post_meet = [w for w in weeks if w["phaseName"] == "Post-Meet Recovery"]
            post_text = " ".join(label for w in post_meet for label in w["planLabels"]).lower()
            checks.append({"name": "Post-meet recovery removes competition-volume work", "passed": "competition volume" not in post_text and "heavy squat" not in post_text and "heavy deadlift" not in post_text, "detail": post_text[:240]})
        if config["id"] == "physique-show-year":
            checks.append({"name": "Physique prep includes resistance-training emphasis", "passed": "resistance" in joined_roles or ("physique upper" in joined_labels and "physique lower" in joined_labels), "detail": "Canonical resistance role or Physique Upper/Lower labels"})
            checks.append({"name": "Physique prep includes contest cardio", "passed": "contest prep cardio" in joined_labels or "cardio" in joined_roles, "detail": "Expected contest-prep cardio"})
            bad_posing = "posing practice" in joined_labels or "posing practice" in joined_details
            checks.append({"name": "No posing practice is prescribed as a workout", "passed": not bad_posing, "detail": "No posing-practice prescription found" if not bad_posing else "Posing practice appeared in plan text"})
            post_show = [w for w in weeks if w["phaseName"] == "Post-Show Recovery"]
            post_show_text = " ".join(label for w in post_show for label in w["planLabels"]).lower()
            checks.append({"name": "Post-show recovery uses low-fatigue restore sessions", "passed": "post-show" in post_show_text and "contest prep cardio" not in post_show_text, "detail": post_show_text[:240]})
        if config["id"] == "endurance-year":
            checks.append({"name": "Running event plan includes quality sessions", "passed": ("quality_run" in joined_roles or "quality" in joined_roles) or "threshold development" in joined_labels or "goal-pace" in joined_labels, "detail": "Expected event-specific quality running"})
            checks.append({"name": "Running event plan includes long run or rehearsal", "passed": ("long_run" in joined_roles or "race_rehearsal" in joined_roles or "long" in joined_roles) or "progressive long run" in joined_labels or "race rehearsal" in joined_labels, "detail": "Expected long-run progression"})
            post_race = [w for w in weeks if w["phaseName"] == "Post-Race Recovery"]
            post_race_text = " ".join((label + " " + detail) for w in post_race for label, detail in zip(w["planLabels"], w["planDetails"])).lower()
            checks.append({"name": "Post-race recovery removes quality and long-run stress", "passed": "threshold" not in post_race_text and "race rehearsal" not in post_race_text and "progressive long run" not in post_race_text, "detail": post_race_text[:240]})
        # Every long journey should show more than one athlete-facing prescription label per phase.
        for phase_record in phases_out:
            phase_weeks = [w for w in weeks if phase_record["startWeek"] <= w["globalWeek"] <= phase_record["endWeek"]]
            unique_labels = {label for w in phase_weeks for label in w["planLabels"] if label}
            checks.append({"name": f"{phase_record['name']} contains purposeful prescription variation", "passed": len(unique_labels) >= 3 or phase_record["weeks"] <= 2, "detail": f"{len(unique_labels)} unique labels"})

        for check in checks:
            if not check["passed"]:
                warnings.append(f"CHECK FAILED — {check['name']}: {check['detail']}")

        return JourneyRun(config, weeks, days, phases_out, screenshots, warnings, checks, final_state, errors)
    except Exception:
        errors.append(traceback.format_exc())
        return JourneyRun(config, weeks, days, phases_out, screenshots, warnings, checks, {}, errors)
    finally:
        context.close()


def svg_line_chart(values: list[float], width: int = 900, height: int = 240, label: str = "") -> str:
    if not values:
        return ""
    pad = 32
    lo, hi = min(values), max(values)
    if math.isclose(lo, hi):
        hi = lo + 1
    points = []
    for i, value in enumerate(values):
        x = pad + i * (width - pad * 2) / max(1, len(values) - 1)
        y = height - pad - (value - lo) * (height - pad * 2) / (hi - lo)
        points.append(f"{x:.1f},{y:.1f}")
    return f"<svg class='chart' viewBox='0 0 {width} {height}' role='img' aria-label='{esc(label)}'><line x1='{pad}' y1='{height-pad}' x2='{width-pad}' y2='{height-pad}'/><line x1='{pad}' y1='{pad}' x2='{pad}' y2='{height-pad}'/><polyline points='{' '.join(points)}'/><text x='{pad}' y='20'>{esc(f'{hi:.0f}')}</text><text x='{pad}' y='{height-7}'>{esc(f'{lo:.0f}')}</text></svg>"


def journey_summary(run: JourneyRun) -> dict[str, Any]:
    required = sum(w["requiredSessions"] for w in run.weeks)
    completed = sum(w["completedRequired"] for w in run.weeks)
    total_minutes = sum(w["requiredMinutes"] for w in run.weeks)
    completed_minutes = sum(w["completedMinutes"] for w in run.weeks)
    readiness = [w["averageReadiness"] for w in run.weeks if w["averageReadiness"]]
    return {
        "requiredSessions": required,
        "completedSessions": completed,
        "adherence": completed / required if required else 1.0,
        "requiredMinutes": total_minutes,
        "completedMinutes": completed_minutes,
        "averageReadiness": statistics.mean(readiness) if readiness else 0,
        "timeViolations": sum(w["timeViolations"] for w in run.weeks),
        "missedRequired": sum(w["missedRequired"] for w in run.weeks),
        "checksPassed": sum(1 for c in run.checks if c["passed"]),
        "checksFailed": sum(1 for c in run.checks if not c["passed"]),
    }


def write_csv(run: JourneyRun, report_dir: Path) -> tuple[str, str]:
    weeks_file = f"{run.config['id']}-weeks.csv"
    days_file = f"{run.config['id']}-days.csv"
    with (report_dir / weeks_file).open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["global_week", "phase_week", "week_start", "phase", "program_phase", "event_type", "required_sessions", "completed_required", "adherence", "required_minutes", "completed_minutes", "average_readiness", "time_violations", "key_sessions"])
        for w in run.weeks:
            writer.writerow([w["globalWeek"], w["phaseWeek"], w["weekStart"], w["phaseName"], w["programPhase"], w["eventType"], w["requiredSessions"], w["completedRequired"], f"{w['adherence']:.3f}", w["requiredMinutes"], w["completedMinutes"], w["averageReadiness"], w["timeViolations"], " | ".join(w["planLabels"])])
    with (report_dir / days_file).open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "day", "global_week", "phase", "program_phase", "readiness", "readiness_score", "available_minutes", "required_minutes", "completed_types", "missed_types", "sessions", "note"])
        for d in run.days:
            sessions = " | ".join(f"{r['type']}:{r['label']}:{r['minutes']}m:{'optional' if r['optional'] else 'required'}" for r in d["rows"])
            writer.writerow([d["date"], d["day"], d["globalWeek"], d["phaseName"], d["programPhase"], d["readinessStatus"], d["readinessScore"], d["availableMinutes"], d["requiredMinutes"], ",".join(d["completedTypes"]), ",".join(d["missedTypes"]), sessions, d["note"]])
    return weeks_file, days_file


def write_journey_report(run: JourneyRun, report_dir: Path) -> str:
    summary = journey_summary(run)
    weeks_csv, days_csv = write_csv(run, report_dir)
    filename = f"{run.config['id']}.html"
    week_rows = []
    for w in run.weeks:
        event = f"<span class='tag'>{esc(w['eventType'])}</span>" if w["eventType"] else ""
        key_sessions = "<br>".join(esc(x) for x in w["planLabels"][:7])
        projection = w["projection"]
        projection_text = " · ".join(f"{k}: {v}" for k, v in projection.get("values", {}).items())
        week_rows.append(
            f"<tr><td>{w['globalWeek']}</td><td>{esc(w['weekStart'])}</td><td><strong>{esc(w['phaseName'])}</strong><br>{event}</td><td>{esc(w['programPhase'])}</td><td>{w['completedRequired']}/{w['requiredSessions']}<br><small>{w['adherence']:.0%}</small></td><td>{w['completedMinutes']}/{w['requiredMinutes']} min</td><td>{w['averageReadiness']:.0f}</td><td>{key_sessions}</td><td><small>{esc(projection.get('label',''))}<br>{esc(projection_text)}</small></td></tr>"
        )
    phase_cards = "".join(
        f"<article class='phase'><span>Weeks {p['startWeek']}–{p['endWeek']}</span><h3>{esc(p['name'])}</h3><p>{esc(p['journeyMode'].replace('_',' ').title())}{' · '+esc(p['eventType']) if p['eventType'] else ''}</p><small>Formal weeks: {p['formalWeekCount']}/{p['weeks']}{' · Event date '+esc(p['eventDate']) if p['eventDate'] else ''}</small></article>"
        for p in run.phases
    )
    checks = "".join(f"<tr class='{'pass' if c['passed'] else 'fail'}'><td>{'PASS' if c['passed'] else 'FAIL'}</td><td>{esc(c['name'])}</td><td>{esc(c['detail'])}</td></tr>" for c in run.checks)
    warnings = "".join(f"<li>{esc(x)}</li>" for x in run.warnings) or "<li>No journey-level warnings.</li>"
    shots = "".join(f"<figure><a href='{esc(s['file'])}'><img src='{esc(s['file'])}' alt='{esc(s['label'])}'></a><figcaption>{esc(s['label'])}</figcaption></figure>" for s in run.screenshots)
    minutes_chart = svg_line_chart([w["requiredMinutes"] for w in run.weeks], label="Weekly required training minutes")
    readiness_chart = svg_line_chart([w["averageReadiness"] for w in run.weeks], label="Average weekly readiness")
    document = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>{esc(run.config['title'])}</title>
<style>
:root{{--bg:#080a0e;--panel:#11151b;--panel2:#171b22;--border:#2b313b;--text:#f5f5f3;--muted:#aab1bc;--gold:#e0ae32;--good:#64d69a;--bad:#ff7777}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font-family:Inter,Segoe UI,Arial,sans-serif}}main{{max-width:1440px;margin:auto;padding:26px}}a{{color:var(--gold)}}header,.panel{{background:linear-gradient(145deg,#151a21,#0d1015);border:1px solid var(--border);border-radius:20px;padding:22px;margin-bottom:20px}}h1,h2,h3{{margin-top:0}}h1{{font-size:clamp(2rem,5vw,4rem);margin-bottom:8px}}.eyebrow{{color:var(--gold);text-transform:uppercase;letter-spacing:.16em;font-weight:800;font-size:.78rem}}.summary{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:18px}}.metric{{background:var(--panel2);border:1px solid var(--border);border-radius:16px;padding:16px}}.metric strong{{font-size:1.65rem;display:block}}.metric span,small,p{{color:var(--muted)}}.phases{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}}.phase{{background:var(--panel2);border:1px solid var(--border);border-radius:16px;padding:16px}}.phase>span,.tag{{color:var(--gold);font-weight:800;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em}}table{{width:100%;border-collapse:collapse;min-width:1120px}}.table-wrap{{overflow:auto}}th,td{{padding:11px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}}th{{color:var(--gold);position:sticky;top:0;background:#11151b}}tr.pass td:first-child{{color:var(--good);font-weight:900}}tr.fail td:first-child{{color:var(--bad);font-weight:900}}.chart{{width:100%;height:auto;background:#0b0e13;border-radius:14px}}.chart line{{stroke:#414957;stroke-width:1}}.chart polyline{{fill:none;stroke:var(--gold);stroke-width:4;stroke-linecap:round;stroke-linejoin:round}}.chart text{{fill:var(--muted);font-size:13px}}.charts{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}.shots{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}}figure{{margin:0}}figure img{{width:100%;border:1px solid var(--border);border-radius:14px}}figcaption{{color:var(--muted);padding:8px 2px}}.warning{{border-left:4px solid var(--gold)}}@media(max-width:800px){{main{{padding:14px}}.charts{{grid-template-columns:1fr}}}}
</style></head><body><main>
<header><div class='eyebrow'>Bell Performance · 12-Month Journey Simulation</div><h1>{esc(run.config['title'])}</h1><p>{esc(run.config['name'])} · {esc(run.config['experience'])} · {esc(run.config['usualMinutes'])}-minute normal availability · Simulation window {START_DATE} through {START_DATE + dt.timedelta(days=363)}</p><div class='summary'><div class='metric'><strong>{summary['adherence']:.0%}</strong><span>Required-session adherence</span></div><div class='metric'><strong>{summary['completedSessions']}/{summary['requiredSessions']}</strong><span>Required sessions completed</span></div><div class='metric'><strong>{summary['completedMinutes']:,}</strong><span>Completed required minutes</span></div><div class='metric'><strong>{summary['averageReadiness']:.0f}</strong><span>Average readiness</span></div><div class='metric'><strong>{summary['checksPassed']}</strong><span>Checks passed</span></div><div class='metric'><strong>{summary['checksFailed']}</strong><span>Checks failed</span></div></div><p><a href='index.html'>← All journeys</a> · <a href='{weeks_csv}'>Weekly CSV</a> · <a href='{days_csv}'>Daily CSV</a> · <a href='{run.config['id']}.json'>Machine JSON</a></p></header>
<section class='panel'><div class='eyebrow'>Year architecture</div><h2>Training phases</h2><div class='phases'>{phase_cards}</div></section>
<section class='panel'><div class='eyebrow'>Longitudinal load</div><h2>Weekly training and readiness</h2><div class='charts'><div><h3>Required minutes</h3>{minutes_chart}</div><div><h3>Readiness</h3>{readiness_chart}</div></div><p class='warning'>Projected bodyweight, strength, and race-performance values are illustrative scenario assumptions. They are not physiological guarantees and are not generated by the Bell coaching engine.</p></section>
<section class='panel'><div class='eyebrow'>Quality audit</div><h2>Journey checks</h2><div class='table-wrap'><table><thead><tr><th>Result</th><th>Check</th><th>Detail</th></tr></thead><tbody>{checks}</tbody></table></div><h3>Warnings</h3><ul>{warnings}</ul></section>
<section class='panel'><div class='eyebrow'>Visual snapshots</div><h2>Dashboard at key points</h2><div class='shots'>{shots}</div></section>
<section class='panel'><div class='eyebrow'>Week-by-week journey</div><h2>52-week prescription audit</h2><div class='table-wrap'><table><thead><tr><th>Week</th><th>Start</th><th>Journey phase</th><th>Program phase</th><th>Completion</th><th>Minutes</th><th>Readiness</th><th>Key prescribed sessions</th><th>Illustrative projection</th></tr></thead><tbody>{''.join(week_rows)}</tbody></table></div></section>
</main></body></html>"""
    (report_dir / filename).write_text(document, encoding="utf-8")
    machine = dataclasses.asdict(run)
    (report_dir / f"{run.config['id']}.json").write_text(json.dumps(machine, indent=2), encoding="utf-8")
    return filename


def write_index(runs: list[JourneyRun], report_dir: Path, browser_name: str) -> None:
    cards = []
    total_checks = total_failed = 0
    for run in runs:
        s = journey_summary(run)
        total_checks += len(run.checks)
        total_failed += s["checksFailed"]
        status = "PASS" if not s["checksFailed"] and not run.errors else "REVIEW"
        cards.append(f"<article class='journey'><span class='status {status.lower()}'>{status}</span><div class='eyebrow'>12-month journey</div><h2>{esc(run.config['title'])}</h2><p>{esc(run.config['name'])} · {len(run.phases)} phases · {s['completedSessions']}/{s['requiredSessions']} required sessions complete</p><div class='stats'><b>{s['adherence']:.0%}<small>adherence</small></b><b>{s['averageReadiness']:.0f}<small>readiness</small></b><b>{s['timeViolations']}<small>time violations</small></b></div><a class='button' href='{esc(run.config['id'])}.html'>Open full journey</a></article>")
    generated = dt.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")
    doc = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Bell Performance 12-Month Journey Simulations</title><style>
:root{{--bg:#080a0e;--panel:#12161d;--border:#2c333d;--text:#f5f5f3;--muted:#aab1bc;--gold:#dfad32;--good:#64d69a;--bad:#ff7777}}*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font-family:Inter,Segoe UI,Arial,sans-serif}}main{{max-width:1180px;margin:auto;padding:28px}}header{{border:1px solid var(--border);border-radius:24px;padding:26px;background:linear-gradient(145deg,#171b23,#0d1015)}}h1{{font-size:clamp(2.3rem,6vw,5rem);margin:4px 0 12px}}p{{color:var(--muted);line-height:1.55}}.eyebrow{{color:var(--gold);text-transform:uppercase;letter-spacing:.16em;font-weight:900;font-size:.76rem}}.summary{{display:flex;gap:10px;flex-wrap:wrap}}.summary span{{padding:10px 14px;background:#191e27;border:1px solid var(--border);border-radius:999px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:22px}}.journey{{position:relative;border:1px solid var(--border);border-radius:20px;padding:22px;background:var(--panel)}}.journey h2{{font-size:1.55rem;margin:8px 0}}.status{{position:absolute;right:16px;top:16px;padding:6px 9px;border-radius:999px;font-size:.72rem;font-weight:900}}.status.pass{{background:#153326;color:var(--good)}}.status.review{{background:#3a2614;color:#ffbd62}}.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}}.stats b{{background:#0b0e13;border-radius:12px;padding:12px;text-align:center;font-size:1.35rem}}.stats small{{display:block;color:var(--muted);font-weight:500;font-size:.7rem}}.button{{display:block;text-align:center;text-decoration:none;color:#111;background:var(--gold);font-weight:900;padding:12px;border-radius:12px}}.note{{margin-top:22px;border-left:4px solid var(--gold);padding:14px 18px;background:#11151b;border-radius:8px}}</style></head><body><main><header><div class='eyebrow'>Bell Performance · Long-Horizon Coaching Audit</div><h1>12-Month Athlete Journeys</h1><p>Four deterministic athletes were advanced day by day through 52 weeks using the 13.9.0 longitudinal coaching engine. The report audits programming phases, event preparation, readiness, time budgets, adherence, missed days, recovery, and post-event transitions.</p><div class='summary'><span>{len(runs)} journeys</span><span>{sum(len(r.weeks) for r in runs)} simulated weeks</span><span>{sum(len(r.days) for r in runs):,} simulated days</span><span>{total_checks-total_failed}/{total_checks} checks passed</span><span>Browser: {esc(browser_name)}</span><span>Generated: {esc(generated)}</span></div></header><section class='grid'>{''.join(cards)}</section><p class='note'><strong>Interpretation:</strong> This suite shows what Bell prescribes and how the app responds over time. It does not prove that projected strength, weight, or race outcomes will occur. Those values are clearly labeled as illustrative scenario projections.</p></main></body></html>"""
    (report_dir / "index.html").write_text(doc, encoding="utf-8")
    aggregate = {"generatedAt": generated, "browser": browser_name, "startDate": START_DATE.isoformat(), "journeys": [{"id": r.config["id"], "summary": journey_summary(r), "checks": r.checks, "warnings": r.warnings, "errors": r.errors} for r in runs]}
    (report_dir / "summary.json").write_text(json.dumps(aggregate, indent=2), encoding="utf-8")


def copy_latest(timestamp_dir: Path, latest_dir: Path) -> None:
    if latest_dir.exists():
        shutil.rmtree(latest_dir)
    shutil.copytree(timestamp_dir, latest_dir)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Bell Performance 12-month athlete journey simulations.")
    parser.add_argument("--app-root", required=True, type=Path)
    parser.add_argument("--journeys", required=True, type=Path)
    parser.add_argument("--headed", action="store_true")
    args = parser.parse_args()
    app_root = args.app_root.resolve()
    journeys = json.loads(args.journeys.read_text(encoding="utf-8"))
    reports_root = app_root / "automation" / "journey_reports"
    timestamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    report_dir = reports_root / timestamp
    report_dir.mkdir(parents=True, exist_ok=True)
    runs: list[JourneyRun] = []

    with local_server(app_root) as base_url:
        with sync_playwright() as p:
            executable = find_browser_executable()
            kwargs: dict[str, Any] = {"headless": not args.headed}
            browser_name = "Playwright Chromium"
            if executable:
                kwargs["executable_path"] = executable
                browser_name = Path(executable).name
            browser = p.chromium.launch(**kwargs)
            try:
                for index, journey in enumerate(journeys, start=1):
                    print(f"[{index}/{len(journeys)}] Simulating {journey['title']}...")
                    run = simulate_journey(browser, base_url, journey, report_dir)
                    runs.append(run)
                    write_journey_report(run, report_dir)
                    summary = journey_summary(run)
                    print(f"  {summary['completedSessions']}/{summary['requiredSessions']} required sessions · {summary['checksPassed']} checks passed · {summary['checksFailed']} failed")
                write_index(runs, report_dir, browser_name)
            finally:
                browser.close()

    latest = reports_root / "latest"
    copy_latest(report_dir, latest)
    failed = sum(journey_summary(r)["checksFailed"] for r in runs) + sum(1 for r in runs if r.errors)
    print(f"Bell Performance 12-month simulations complete: {len(runs)} journeys, {sum(len(r.weeks) for r in runs)} weeks.")
    print(f"Report: {latest / 'index.html'}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
