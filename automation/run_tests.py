from __future__ import annotations

import argparse
import contextlib
import dataclasses
import datetime as dt
import html
import json
import os
import platform
import shutil
import socket
import threading
import time
import traceback
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from playwright.sync_api import Browser, BrowserContext, Page, TimeoutError as PlaywrightTimeoutError, sync_playwright

FIXED_NOW = "2026-08-03T09:00:00-05:00"  # Monday in Central Time
VIEWPORT = {"width": 390, "height": 844}


@dataclasses.dataclass
class Result:
    profile: str
    section: str
    name: str
    passed: bool
    detail: str = ""
    screenshot: str | None = None


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
    system = platform.system().lower()
    if system == "windows":
        roots = [
            os.environ.get("PROGRAMFILES"),
            os.environ.get("PROGRAMFILES(X86)"),
            os.environ.get("LOCALAPPDATA"),
        ]
        for root in filter(None, roots):
            candidates.extend(
                [
                    str(Path(root) / "Google/Chrome/Application/chrome.exe"),
                    str(Path(root) / "Microsoft/Edge/Application/msedge.exe"),
                ]
            )
    elif system == "darwin":
        candidates.extend(
            [
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            ]
        )
    else:
        candidates.extend(
            [
                "/usr/bin/google-chrome",
                "/usr/bin/google-chrome-stable",
                "/usr/bin/microsoft-edge",
                "/usr/bin/microsoft-edge-stable",
                "/usr/bin/chromium",
                "/usr/bin/chromium-browser",
            ]
        )
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    for name in ("google-chrome", "microsoft-edge", "chromium", "chromium-browser"):
        resolved = shutil.which(name)
        if resolved:
            return resolved
    return None


def fixed_date_script() -> str:
    return f"""
(() => {{
  const NativeDate = Date;
  const fixedMs = new NativeDate({json.dumps(FIXED_NOW)}).getTime();
  class BellTestDate extends NativeDate {{
    constructor(...args) {{ super(...(args.length ? args : [fixedMs])); }}
    static now() {{ return fixedMs; }}
    static parse(value) {{ return NativeDate.parse(value); }}
    static UTC(...args) {{ return NativeDate.UTC(...args); }}
  }}
  window.Date = BellTestDate;
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
  const eventDate = cfg.eventWeeks ? addLocalDays(today, Number(cfg.eventWeeks) * 7) : "";
  const journeyName = cfg.journeyMode === "event_preparation"
    ? `${cfg.eventName || cfg.eventType} Preparation`
    : `${cfg.identity} · ${cfg.objective}`;

  data.athleteProfile.demographics = {
    firstName:cfg.name, age:cfg.age, sex:cfg.sex, heightInches:cfg.heightInches,
    bodyweightLb:cfg.bodyweightLb, goalWeightLb:cfg.goalWeightLb || null
  };
  data.athleteProfile.identity = {
    primary:cfg.identity,
    objective:cfg.objective,
    journeyMode:cfg.journeyMode,
    journeyName,
    eventType:cfg.eventType || "",
    eventName:cfg.eventName || cfg.eventType || "",
    eventDate
  };
  data.athleteProfile.experience = {level:cfg.experience, trainingAgeYears:cfg.experience === "Beginner" ? 0.5 : cfg.experience === "Advanced" ? 10 : 4};
  data.athleteProfile.availability = {
    normalDays:[...cfg.days], sessionMinutes:cfg.usualMinutes,
    preferredTime:"Flexible", reliability:"Mostly consistent", minimumDays:Math.min(3,cfg.days.length)
  };
  data.athleteProfile.baselines = {
    maxes:{...(cfg.maxes || {})},
    endurance:{...(cfg.endurance || {})}
  };
  data.athleteProfile.coaching = {
    ...(data.athleteProfile.coaching || {}), controlMode:"coach", style:"Performance",
    detailLevel:"Balanced", checkInFrequency:"Weekly", scriptureFrequency:"Occasionally"
  };
  data.athleteProfile.updatedAt = new Date().toISOString();

  data.settings.athleteName = cfg.name;
  data.settings.sex = cfg.sex;
  data.settings.weight = cfg.bodyweightLb;
  data.settings.goal = cfg.goalWeightLb || null;
  data.settings.maxes = {...data.settings.maxes, ...(cfg.maxes || {})};
  data.settings.primaryTrainingIdentity = cfg.identity;
  data.settings.secondaryTrainingGoal = cfg.objective;
  data.settings.secondaryTargetDate = eventDate;
  data.settings.athleteMode = cfg.identity;
  data.settings.trainingExperience = cfg.experience;
  data.settings.appControlMode = "coach";
  data.settings.cardioType = cfg.engineMode === "General Conditioning" ? "Air Bike" : (cfg.engineMode || "Running");
  data.settings.coachMessages = {setupComplete:true, style:"Performance", scriptureFrequency:"Occasionally"};
  data.settings.firstFlightStage = "complete";
  data.settings.firstFlightTourComplete = true;
  data.settings.pendingFirstFlightTour = false;
  data.settings.readiness = {
    ...data.settings.readiness,
    checkInVersion:"quick-v1", sleepState:"good", bodyState:"fresh", energyState:"fired-up",
    painToday:false, painNotes:"", timeMinutes:cfg.usualMinutes,
    timeAvailability:({30:1,45:2,60:3,75:4,90:5,105:6,120:7})[cfg.usualMinutes] || 3,
    sleepHours:8, sleepMinutes:0, sleepQuality:5, recoveryStatus:5, energy:5, motivation:5,
    score:95, status:"GREEN", lastPromptDate:today
  };
  data.readinessLog = [{date:today, score:95, status:"GREEN", timeMinutes:cfg.usualMinutes, timeAvailability:data.settings.readiness.timeAvailability, sleepQuality:5, recoveryStatus:5, energy:5, motivation:5}];
  data.settings.equipmentSetup = {
    locations:[{id:"test", name:"Test Environment", environment:cfg.environment, equipment:equipmentByEnvironment[cfg.environment] || equipmentByEnvironment.commercial}],
    activeLocationId:"test"
  };
  data.settings.trainingAvailability = {normalDays:[...cfg.days], weekOverrides:{}, updatedAt:new Date().toISOString()};

  const mission = cfg.journeyMode === "event_preparation"
    ? {path:"event", eventType:cfg.eventType, eventName:cfg.eventName || cfg.eventType, eventDate, objective:"perform", developmentObjective:cfg.objective, identity:cfg.identity, experience:String(cfg.experience).toLowerCase()}
    : {path:"development", developmentGoal:cfg.objective, priority:cfg.objective, identity:cfg.identity};

  data.trainingBlock = {
    ...data.trainingBlock,
    enabled:true, status:"active", goalType:cfg.goalType, targetDate:eventDate,
    lengthWeeks:cfg.eventWeeks || 12, currentWeek:1, trainingDays:cfg.days.length,
    strengthDays:cfg.strengthDays, runDays:cfg.engineDays, sessionMinutes:cfg.usualMinutes,
    secondaryGoal:cfg.objective, startDate:today, generatedAt:new Date().toISOString(), activatedAt:new Date().toISOString(),
    mission,
    dualGoals:{strengthGoal:cfg.goalType, engineMode:cfg.engineMode, engineGoal:cfg.engineGoal, trainingCoordination:"Coach Decides", engineSessions:cfg.engineDays, targetValue:0},
    availableDays:[...cfg.days]
  };
  data.nutrition.age = cfg.age;
  data.nutrition.height = cfg.heightInches;
  data.dayNavigation = {selectedDate:today, lastLocalDate:today};
  data.mobility = {...data.mobility, minutes:10, completedDates:[]};
  data.dailySessionStatus = {};
  data.history = [];
  data.activeWorkout = null;

  if (typeof bellSetNormalTrainingDays === "function") bellSetNormalTrainingDays(cfg.days);
  if (window.BellAthleteProfile?.syncToLegacy) window.BellAthleteProfile.syncToLegacy();
  if (typeof bpApplyEnvironment === "function") bpApplyEnvironment();
  if (typeof bpPrepareBlockPlan === "function") {
    data.trainingBlock.weeks = [];
    bpPrepareBlockPlan(data.trainingBlock);
  }
  if (typeof bpLoadActiveWeekFromPlan === "function") bpLoadActiveWeekFromPlan();
  else if (typeof buildCurrentWeekPlan === "function") buildCurrentWeekPlan();
  if (!(data.plan || []).length && typeof buildCurrentWeekPlan === "function") buildCurrentWeekPlan();

  document.querySelectorAll(".modal").forEach(el => el.classList.add("hidden"));
  document.body.classList.remove("modal-open","workout-open","engine-session","female-session");
  saveData({render:false});
  renderApp();
  if (typeof showScreen === "function") showScreen("home");
  if (typeof renderBellCommercialHome === "function") renderBellCommercialHome();
  return {
    today,
    planCount:(data.plan || []).length,
    weekCount:(data.trainingBlock.weeks || []).length,
    journey:data.athleteProfile.identity,
    block:data.trainingBlock
  };
}
"""

SET_READINESS_JS = r"""
(minutes, sleep="good", body="fresh", energy="fired-up") => {
  const key=todayKey();
  const values={
    checkInVersion:"quick-v1", sleepState:sleep, bodyState:body, energyState:energy,
    painToday:false, painNotes:"", timeMinutes:Number(minutes),
    timeAvailability:({30:1,45:2,60:3,75:4,90:5,105:6,120:7})[Number(minutes)] || 3,
    sleepHours:sleep==="poor"?5:8, sleepMinutes:0,
    sleepQuality:sleep==="poor"?2:sleep==="okay"?4:5,
    recoveryStatus:body==="beat-up"?2:body==="normal"?4:5,
    energy:energy==="drained"?2:energy==="steady"?4:5,
    motivation:energy==="drained"?2:energy==="steady"?4:5,
    lastPromptDate:key
  };
  data.settings.readiness={...data.settings.readiness,...values};
  const raw=typeof rawDailyReadinessScore==="function"?rawDailyReadinessScore(data.settings.readiness):90;
  const entry={date:key,score:raw,status:typeof readinessStatus==="function"?readinessStatus(raw):"GREEN",...values};
  const index=(data.readinessLog||[]).findIndex(x=>x.date===key);
  if(index>=0)data.readinessLog[index]=entry;else data.readinessLog.push(entry);
  data.settings.readiness.score=typeof readinessScore==="function"?readinessScore():raw;
  data.settings.readiness.status=typeof readinessStatus==="function"?readinessStatus():entry.status;
  saveData({render:false});
  renderApp();
  if(typeof renderBellCommercialHome==="function")renderBellCommercialHome();
  return window.BellDailySessions.buildRows(key);
}
"""


def normalize_model(model: dict[str, Any]) -> dict[str, Any]:
    return json.loads(json.dumps(model))


class Suite:
    def __init__(self, app_root: Path, profiles: list[dict[str, Any]], report_dir: Path, base_url: str):
        self.app_root = app_root
        self.profiles = profiles
        self.report_dir = report_dir
        self.base_url = base_url
        self.results: list[Result] = []
        self.console_errors: dict[str, list[str]] = {}

    def add(self, profile: str, section: str, name: str, passed: bool, detail: str = "", screenshot: str | None = None) -> None:
        self.results.append(Result(profile, section, name, bool(passed), detail, screenshot))

    def safe_check(self, profile: str, section: str, name: str, fn, detail_fn=None) -> bool:
        try:
            value = fn()
            passed = bool(value)
            detail = detail_fn(value) if detail_fn else ("" if passed else f"Observed: {value!r}")
            self.add(profile, section, name, passed, detail)
            return passed
        except Exception as exc:
            self.add(profile, section, name, False, f"{type(exc).__name__}: {exc}")
            return False

    def create_context(self, browser: Browser, profile_id: str) -> tuple[BrowserContext, Page]:
        context = browser.new_context(viewport=VIEWPORT, timezone_id="America/Chicago", locale="en-US")
        context.add_init_script(fixed_date_script())
        page = context.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(f"PAGE ERROR: {error}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE {msg.type.upper()}: {msg.text}") if msg.type == "error" else None)
        self.console_errors[profile_id] = errors
        page.goto(f"{self.base_url}/index.html?automation={profile_id}&ts={time.time_ns()}", wait_until="domcontentloaded", timeout=60_000)
        page.wait_for_function("typeof cloneDefaults==='function' && typeof window.BellDailySessions==='object' && typeof renderApp==='function'", timeout=60_000)
        return context, page

    def screenshot(self, page: Page, profile_id: str, name: str) -> str:
        filename = f"{profile_id}-{name}.png"
        path = self.report_dir / filename
        page.screenshot(path=str(path), full_page=True)
        return filename

    def first_flight_smoke(self, browser: Browser) -> None:
        profile_id = "fresh-install"
        context, page = self.create_context(browser, profile_id)
        try:
            self.safe_check(profile_id, "First Flight", "First Flight opens for a fresh profile", lambda: page.locator("#onboardingModal:not(.hidden)").count() == 1)
            labels = page.locator("#onboardingModal label").all_text_contents()
            self.safe_check(profile_id, "First Flight", "Profile field is labeled Sex", lambda: any(text.strip() == "Sex" for text in labels), lambda _: "Expected a visible field label named ‘Sex’." if not _ else "")
            options = page.locator("#onboardingSessionMinutes option").evaluate_all("els => els.map(e => Number(e.value))")
            self.safe_check(profile_id, "First Flight", "Time choices span 30–120 minutes", lambda: options == [30,45,60,75,90,105,120], lambda _: f"Observed options: {options}")
            shot = self.screenshot(page, profile_id, "first-flight")
            self.results[-1].screenshot = shot
        finally:
            context.close()

    def seed(self, page: Page, cfg: dict[str, Any]) -> dict[str, Any]:
        return page.evaluate(SEED_PROFILE_JS, cfg)

    def ensure_training_date(self, page: Page) -> str:
        return page.evaluate(
            """() => {
              const today=todayKey();
              const weekStart=typeof mondayKeyFor==='function'?mondayKeyFor(today):today;
              const keys=Array.from({length:7},(_,i)=>addLocalDays(weekStart,i));
              for(const key of keys){
                data.dayNavigation.selectedDate=key;
                const model=window.BellDailySessions.buildRows(key);
                if(model.rows.some(row=>row.type==='strength'||row.type==='engine')){
                  saveData({render:false}); renderApp(); renderBellCommercialHome(); return key;
                }
              }
              data.dayNavigation.selectedDate=today; saveData({render:false}); renderApp(); renderBellCommercialHome(); return today;
            }"""
        )

    def test_profile(self, browser: Browser, cfg: dict[str, Any]) -> None:
        pid = cfg["id"]
        context, page = self.create_context(browser, pid)
        try:
            summary = self.seed(page, cfg)
            self.add(pid, "Profile", "Training block generated", summary["planCount"] > 0, f"Plan items: {summary['planCount']}; weeks: {summary['weekCount']}")
            self.add(pid, "Profile", "Athlete identity persisted", summary["journey"]["primary"] == cfg["identity"], f"Observed: {summary['journey'].get('primary')}")
            if cfg.get("eventType"):
                self.add(pid, "Profile", "Event family persisted", summary["journey"].get("eventType") == cfg["eventType"], f"Observed: {summary['journey'].get('eventType')}")

            training_date = self.ensure_training_date(page)
            page.wait_for_timeout(250)
            model = normalize_model(page.evaluate("key => window.BellDailySessions.buildRows(key)", training_date))
            self.add(pid, "Dashboard", "Independent session cards render", page.locator(".b1384-session").count() >= 2, f"Rendered cards: {page.locator('.b1384-session').count()}")
            types = [row["type"] for row in model["rows"]]
            self.add(pid, "Dashboard", "Core is visible", "core" in types, f"Rows: {types}")
            self.add(pid, "Dashboard", "Mobility is visible", "mobility" in types, f"Rows: {types}")
            core = next((r for r in model["rows"] if r["type"] == "core"), None)
            mobility = next((r for r in model["rows"] if r["type"] == "mobility"), None)
            self.add(pid, "Dashboard", "Core is optional and outside required time", bool(core and core.get("optional") and core.get("outsideBudget")), f"Core: {core}")
            self.add(pid, "Dashboard", "Mobility is optional and outside required time", bool(mobility and mobility.get("optional") and mobility.get("outsideBudget")), f"Mobility: {mobility}")
            for row in model["rows"]:
                if row["type"] == "engine":
                    desc = row.get("description", "")
                    has_duration = bool(__import__("re").search(r"\b\d+\s*(?:min|minute)s?\b", desc, __import__("re").I))
                    self.add(pid, "Dashboard", "Engine description omits template minutes", not has_duration, desc)

            dashboard_shot = self.screenshot(page, pid, "dashboard")
            self.results[-1].screenshot = dashboard_shot

            # Time-budget matrix on the current day. Move selection back to today so the daily check-in applies.
            page.evaluate("() => { data.dayNavigation.selectedDate=todayKey(); saveData({render:false}); renderApp(); renderBellCommercialHome(); }")
            for minutes in cfg.get("dailyTimeTests", [cfg["usualMinutes"]]):
                test_model = normalize_model(page.evaluate(SET_READINESS_JS, minutes))
                required = [r for r in test_model["rows"] if r.get("required")]
                total = sum(int(r.get("minutes") or 0) for r in required)
                self.add(pid, "Time Budget", f"Required sessions fit {minutes} minutes", total <= minutes, f"Required total: {total}; rows: {[(r['type'],r.get('minutes')) for r in required]}")
                if required:
                    self.add(pid, "Time Budget", f"Required budget uses the selected {minutes} minutes", total == minutes, f"Required total: {total}")

            # Restore usual availability and exercise actual launch/completion wiring.
            page.evaluate(SET_READINESS_JS, cfg["usualMinutes"])
            current_model = normalize_model(page.evaluate("() => window.BellDailySessions.buildRows(todayKey())"))
            required_types = [r["type"] for r in current_model["rows"] if r.get("required")]
            for session_type in required_types:
                selector = f'[data-independent-start="{session_type}"]'
                button = page.locator(selector)
                if button.count() != 1:
                    self.add(pid, "Completion", f"{session_type.title()} start button exists", False, f"Selector count: {button.count()}")
                    continue
                button.click()
                page.wait_for_timeout(200)
                launched = page.evaluate("type => Boolean(data.activeWorkout) && String(data.activeWorkout.dailySessionType||'').toLowerCase()===type", session_type)
                self.add(pid, "Completion", f"{session_type.title()} launches the correct workout", launched, page.evaluate("() => data.activeWorkout ? JSON.stringify({name:data.activeWorkout.name,type:data.activeWorkout.dailySessionType,date:data.activeWorkout.dailySessionDate}) : 'No active workout'"))
                if launched:
                    page.evaluate("() => completeWorkout()")
                    page.wait_for_timeout(300)
                    page.evaluate("() => { if(typeof skipSessionFeedback==='function')skipSessionFeedback(); document.querySelectorAll('.modal').forEach(el=>{ if(el.id!=='onboardingModal') el.classList.add('hidden'); }); if(typeof renderBellCommercialHome==='function')renderBellCommercialHome(); }")
                    completed = page.evaluate("type => window.BellDailySessions.isComplete(type,todayKey())", session_type)
                    card_completed = page.locator(f'.b1384-session[data-session-type="{session_type}"].completed').count() == 1
                    disabled = page.locator(f'.b1384-session[data-session-type="{session_type}"] [data-independent-start="{session_type}"]:disabled').count() == 1
                    self.add(pid, "Completion", f"{session_type.title()} records completion", completed and card_completed and disabled, f"State={completed}; card={card_completed}; disabled={disabled}")

            required_after = normalize_model(page.evaluate("() => window.BellDailySessions.buildRows(todayKey())"))["required"]
            all_done = bool(required_after) and all(row.get("completed") for row in required_after)
            tomorrow_visible = page.locator("#b1384PreviewTomorrow").count() == 1
            self.add(pid, "Completion", "Mission Complete appears after required sessions", all_done and tomorrow_visible, f"All required done={all_done}; Preview Tomorrow={tomorrow_visible}")
            completion_shot = self.screenshot(page, pid, "mission-complete")
            self.results[-1].screenshot = completion_shot

            page.reload(wait_until="domcontentloaded", timeout=60_000)
            page.wait_for_function("typeof window.BellDailySessions==='object' && typeof renderBellCommercialHome==='function'", timeout=60_000)
            page.evaluate("() => { document.querySelectorAll('.modal').forEach(el=>el.classList.add('hidden')); renderApp(); showScreen('home'); renderBellCommercialHome(); }")
            persisted = normalize_model(page.evaluate("() => window.BellDailySessions.buildRows(todayKey())"))
            persisted_required = [r for r in persisted["rows"] if r.get("required")]
            self.add(pid, "Persistence", "Required completion survives reload", bool(persisted_required) and all(r.get("completed") for r in persisted_required), f"Required rows: {[(r['type'],r.get('completed')) for r in persisted_required]}")

            # Recovery-day behavior within the same week.
            recovery = page.evaluate(
                """() => {
                  const monday=mondayKeyFor(todayKey());
                  for(let i=0;i<7;i++){
                    const key=addLocalDays(monday,i); data.dayNavigation.selectedDate=key;
                    const model=window.BellDailySessions.buildRows(key);
                    if(model.recoveryDay){ saveData({render:false}); renderApp(); renderBellCommercialHome(); return {key,model}; }
                  }
                  return null;
                }"""
            )
            if recovery:
                rows = recovery["model"]["rows"]
                first_type = rows[0]["type"] if rows else None
                recovery_mobility = next((r for r in rows if r["type"] == "mobility"), None)
                self.add(pid, "Recovery", "Mobility becomes the recovery focus", bool(recovery_mobility and recovery_mobility.get("recoveryFocus") and first_type == "mobility"), f"First row={first_type}; mobility={recovery_mobility}")
                self.add(pid, "Recovery", "Recovery day has no required sessions", len(recovery["model"].get("required", [])) == 0, f"Required: {recovery['model'].get('required', [])}")
            else:
                self.add(pid, "Recovery", "Recovery day exists in the active week", False, "No recovery day found in Week 1.")

            # Week 2 continuity.
            week2 = page.evaluate(
                """() => {
                  data.trainingBlock.currentWeek=2;
                  if(typeof bpLoadActiveWeekFromPlan==='function')bpLoadActiveWeekFromPlan();
                  else if(typeof buildCurrentWeekPlan==='function')buildCurrentWeekPlan();
                  saveData({render:false}); renderApp(); renderBellCommercialHome();
                  return {count:(data.plan||[]).length,week:data.trainingBlock.currentWeek,dates:(data.plan||[]).map(x=>x.scheduledDate).filter(Boolean)};
                }"""
            )
            self.add(pid, "Training Cycle", "Week 2 generates without losing the plan", week2["week"] == 2 and week2["count"] > 0, f"Plan items: {week2['count']}; dated items: {len(week2['dates'])}")

            # Mission editor routing.
            page.evaluate("() => { document.querySelectorAll('.modal').forEach(el=>el.classList.add('hidden')); openMissionEditor(); }")
            active_step = page.locator('#onboardingModal [data-onboarding-step].active').get_attribute('data-onboarding-step')
            self.add(pid, "Settings Flow", "Edit Mission opens First Flight page 2", active_step == "1", f"Active onboarding step index: {active_step}")

            errors = [e for e in self.console_errors.get(pid, []) if "favicon" not in e.lower()]
            self.add(pid, "Runtime", "No browser console or page errors", len(errors) == 0, "\n".join(errors[:10]))
        except Exception as exc:
            shot = None
            try:
                shot = self.screenshot(page, pid, "fatal-error")
            except Exception:
                pass
            self.add(pid, "Fatal", "Profile test completed", False, f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}", shot)
        finally:
            context.close()

    def run(self, browser: Browser) -> None:
        self.first_flight_smoke(browser)
        for profile in self.profiles:
            self.test_profile(browser, profile)

    def write_report(self, browser_name: str) -> None:
        passed = sum(1 for r in self.results if r.passed)
        failed = len(self.results) - passed
        grouped: dict[str, list[Result]] = {}
        for result in self.results:
            grouped.setdefault(result.profile, []).append(result)

        sections = []
        for profile, items in grouped.items():
            rows = []
            for item in items:
                image = f'<a href="{html.escape(item.screenshot)}">Screenshot</a>' if item.screenshot else ""
                rows.append(
                    f"<tr class={'pass' if item.passed else 'fail'}><td>{html.escape(item.section)}</td><td>{html.escape(item.name)}</td><td>{'PASS' if item.passed else 'FAIL'}</td><td><pre>{html.escape(item.detail or '')}</pre></td><td>{image}</td></tr>"
                )
            sections.append(f"<section><h2>{html.escape(profile)}</h2><table><thead><tr><th>Area</th><th>Check</th><th>Result</th><th>Details</th><th>Evidence</th></tr></thead><tbody>{''.join(rows)}</tbody></table></section>")

        generated = dt.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")
        document = f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>Bell Performance Automated Test Report</title>
<style>
:root{{--bg:#090b10;--panel:#11151d;--border:#29303c;--text:#f4f5f7;--muted:#a7afbd;--gold:#d5a83e;--good:#64d69a;--bad:#ff7c7c}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font-family:Inter,Segoe UI,Arial,sans-serif}}main{{max-width:1240px;margin:auto;padding:28px}}header{{padding:24px;border:1px solid var(--border);border-radius:20px;background:linear-gradient(145deg,#151a24,#0d1016)}}h1{{margin:0 0 8px;color:var(--gold)}}.summary{{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}}.pill{{padding:10px 14px;border-radius:999px;background:#1a202b;border:1px solid var(--border)}}section{{margin-top:24px;padding:18px;border:1px solid var(--border);border-radius:18px;background:var(--panel);overflow:auto}}table{{width:100%;border-collapse:collapse;min-width:850px}}th,td{{text-align:left;padding:12px;border-bottom:1px solid var(--border);vertical-align:top}}th{{color:var(--gold)}}tr.pass td:nth-child(3){{color:var(--good);font-weight:800}}tr.fail td:nth-child(3){{color:var(--bad);font-weight:800}}pre{{white-space:pre-wrap;margin:0;color:var(--muted);font-family:inherit;max-width:560px}}a{{color:var(--gold)}}.warning{{margin-top:16px;color:var(--muted)}}
</style></head><body><main><header><h1>Bell Performance Automated Athlete Test Report</h1><p>Build baseline: 13.9.0 · Browser: {html.escape(browser_name)} · Generated: {html.escape(generated)}</p><div class='summary'><span class='pill'>{passed} passed</span><span class='pill'>{failed} failed</span><span class='pill'>{len(self.results)} total checks</span></div><p class='warning'>Automated results validate deterministic app behavior. Exercise appropriateness, coaching quality, and visual judgment still require human review.</p></header>{''.join(sections)}</main></body></html>"""
        (self.report_dir / "index.html").write_text(document, encoding="utf-8")
        machine = {
            "generatedAt": generated,
            "browser": browser_name,
            "passed": passed,
            "failed": failed,
            "results": [dataclasses.asdict(r) for r in self.results],
        }
        (self.report_dir / "results.json").write_text(json.dumps(machine, indent=2), encoding="utf-8")


def copy_to_latest(timestamp_dir: Path, latest_dir: Path) -> None:
    if latest_dir.exists():
        shutil.rmtree(latest_dir)
    shutil.copytree(timestamp_dir, latest_dir)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Bell Performance simulated athlete browser tests.")
    parser.add_argument("--app-root", required=True, type=Path)
    parser.add_argument("--profiles", required=True, type=Path)
    parser.add_argument("--headed", action="store_true", help="Show the browser while tests run.")
    args = parser.parse_args()

    app_root = args.app_root.resolve()
    profiles = json.loads(args.profiles.read_text(encoding="utf-8"))
    reports_root = app_root / "automation" / "reports"
    timestamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    report_dir = reports_root / timestamp
    report_dir.mkdir(parents=True, exist_ok=True)

    with local_server(app_root) as base_url:
        with sync_playwright() as p:
            executable = find_browser_executable()
            launch_kwargs: dict[str, Any] = {"headless": not args.headed}
            browser_name = "Playwright Chromium"
            if executable:
                launch_kwargs["executable_path"] = executable
                browser_name = Path(executable).name
            browser = p.chromium.launch(**launch_kwargs)
            try:
                suite = Suite(app_root, profiles, report_dir, base_url)
                suite.run(browser)
                suite.write_report(browser_name)
            finally:
                browser.close()

    copy_to_latest(report_dir, reports_root / "latest")
    failed = sum(1 for r in suite.results if not r.passed)
    print(f"Bell Performance tests complete: {len(suite.results)-failed} passed, {failed} failed")
    print(f"Report: {reports_root / 'latest' / 'index.html'}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
