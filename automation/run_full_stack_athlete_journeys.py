from __future__ import annotations

import argparse
import contextlib
import datetime as dt
import html
import json
import os
import shutil
import socket
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
AUTOMATION = ROOT / "automation"
REPORT_DIR = AUTOMATION / "full_stack_journey_reports" / "latest"
START_DATE = dt.date(2026, 8, 3)
VIEWPORT = {"width": 430, "height": 932}

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        return

@contextlib.contextmanager
def local_server(root: Path):
    class Rooted(QuietHandler):
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            super().__init__(*args, directory=str(root), **kwargs)
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0)); port = sock.getsockname()[1]
    server = ThreadingHTTPServer(("127.0.0.1", port), Rooted)
    thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
    try: yield f"http://127.0.0.1:{port}"
    finally: server.shutdown(); thread.join(timeout=3)

def find_browser() -> str | None:
    candidates=[]
    if os.name=="nt":
        for root in filter(None,[os.environ.get("PROGRAMFILES"),os.environ.get("PROGRAMFILES(X86)"),os.environ.get("LOCALAPPDATA")]):
            candidates += [str(Path(root)/"Google/Chrome/Application/chrome.exe"),str(Path(root)/"Microsoft/Edge/Application/msedge.exe")]
    else:
        candidates += ["/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/microsoft-edge","/usr/bin/chromium","/usr/bin/chromium-browser"]
    for p in candidates:
        if Path(p).exists(): return p
    for n in ("google-chrome","microsoft-edge","chromium","chromium-browser"):
        p=shutil.which(n)
        if p:return p
    return None

def date_init() -> str:
    initial=f"{START_DATE.isoformat()}T09:00:00-05:00"
    return f"""(() => {{ const NativeDate=Date; window.__bellNativeDate=NativeDate; window.__bellNowMs=new NativeDate({json.dumps(initial)}).getTime(); class D extends NativeDate{{constructor(...a){{super(...(a.length?a:[window.__bellNowMs]));}} static now(){{return window.__bellNowMs;}} static parse(v){{return NativeDate.parse(v);}} static UTC(...a){{return NativeDate.UTC(...a);}}}} window.Date=D; window.__bellSetNow=iso=>{{window.__bellNowMs=NativeDate.parse(iso);return new NativeDate(window.__bellNowMs).toISOString();}}; window.alert=()=>{{}}; window.confirm=()=>true; }})();"""

SEED_PROFILE = r"""
(cfg)=>{
 data=cloneDefaults(); normalizeData(); const today=todayKey();
 data.athleteProfile.demographics={firstName:cfg.title,age:41,sex:"Male",heightInches:66,bodyweightLb:205,goalWeightLb:195};
 data.athleteProfile.experience={level:"Intermediate",trainingAgeYears:6};
 data.athleteProfile.baselines={maxes:{squat:405,bench:285,deadlift:455},endurance:{fiveKMinutes:29}};
 data.athleteProfile.availability={normalDays:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],sessionMinutes:75,preferredTime:"Flexible",reliability:"Mostly consistent",minimumDays:4};
 data.settings.athleteName=cfg.title; data.settings.sex="Male"; data.settings.weight=205; data.settings.goal=195;
 data.settings.maxes={...data.settings.maxes,squat:405,bench:285,deadlift:455}; data.settings.trainingExperience="Intermediate"; data.settings.appControlMode="coach";
 data.settings.firstFlightStage="complete"; data.settings.firstFlightTourComplete=true; data.settings.pendingFirstFlightTour=false;
 data.settings.equipmentSetup={locations:[{id:"journey",name:"Commercial Gym",environment:"commercial",equipment:["barbell","rack","bench","dumbbells","cables","machines","smith","kettlebells","bands","pullupBar","dipStation","plyoBox","treadmill","bike","rower","skiErg","sled","airBike","jumpRope","outdoor"]}],activeLocationId:"journey"};
 data.settings.trainingAvailability={normalDays:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],weekOverrides:{},updatedAt:new Date().toISOString()};
 data.dayNavigation={selectedDate:today,lastLocalDate:today}; data.history=[]; data.readinessLog=[]; data.sessionFeedbackLog=[]; data.missedSessionLog=[]; data.dailySessionStatus={}; data.responseEngine={};
 if(typeof bellSetNormalTrainingDays==="function")bellSetNormalTrainingDays(data.settings.trainingAvailability.normalDays);
 if(window.BellAthleteProfile?.syncToLegacy)window.BellAthleteProfile.syncToLegacy(); if(typeof bpApplyEnvironment==="function")bpApplyEnvironment();
 saveData({render:false}); renderApp(); return true;
}
"""

CREATE_BLOCK = r"""
(cfg)=>{
 const today=todayKey(),eventDate=cfg.journeyMode==="event_preparation"?addLocalDays(today,Number(cfg.weeks)*7-1):"";
 data.athleteProfile.identity={primary:cfg.identity,objective:cfg.objective,journeyMode:cfg.journeyMode,journeyName:cfg.title,eventType:cfg.eventType||"",eventName:cfg.eventName||cfg.eventType||"",eventDate};
 data.settings.primaryTrainingIdentity=cfg.identity; data.settings.secondaryTrainingGoal=cfg.objective; data.settings.secondaryTargetDate=eventDate; data.settings.athleteMode=cfg.identity; data.settings.cardioType=cfg.engineMode;
 const mission=cfg.journeyMode==="event_preparation"?{path:"event",eventType:cfg.eventType,eventName:cfg.eventName,eventDate,objective:"perform",developmentObjective:cfg.objective,identity:cfg.identity,experience:"intermediate"}:{path:"development",developmentGoal:cfg.objective,priority:cfg.objective,identity:cfg.identity};
 data.trainingBlock={...data.trainingBlock,enabled:true,status:"active",goalType:cfg.goalType,targetDate:eventDate,lengthWeeks:Number(cfg.weeks),currentWeek:1,trainingDays:6,strengthDays:Number(cfg.strengthDays),runDays:Number(cfg.engineDays),sessionMinutes:75,secondaryGoal:cfg.objective,startDate:today,generatedAt:new Date().toISOString(),activatedAt:new Date().toISOString(),mission,journeyPhaseName:cfg.title,dualGoals:{strengthGoal:cfg.goalType,engineMode:cfg.engineMode,engineGoal:cfg.objective,trainingCoordination:"Coach Decides",engineSessions:Number(cfg.engineDays),targetValue:0},availableDays:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],weeks:[]};
 bpPrepareBlockPlan(data.trainingBlock); if(typeof bpLoadActiveWeekFromPlan==="function")bpLoadActiveWeekFromPlan(); else buildCurrentWeekPlan(); saveData({render:false});
 return {formalWeeks:(data.trainingBlock.weeks||[]).length,planCount:(data.plan||[]).length,eventDate};
}
"""

PREPARE_WEEK = r"""
(cfg)=>{
 data.trainingBlock.currentWeek=Number(cfg.week); bpPrepareBlockPlan(data.trainingBlock); const entry=(data.trainingBlock.weeks||[]).find(w=>Number(w.week)===Number(cfg.week));
 data.plan=entry?.plan?.length?JSON.parse(JSON.stringify(entry.plan)):(buildCurrentWeekPlan(),data.plan);
 data.plan.forEach((item,i)=>{item.id=item.id||`week-${cfg.week}-plan-${i}`; item.scheduledDate=addLocalDays(cfg.monday,["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].indexOf(item.day||"Monday"));});
 data.dayNavigation.selectedDate=cfg.monday; if(typeof bellReconcileClosedLoopApplications==="function")bellReconcileClosedLoopApplications(); saveData({render:false});
 const channelOf=(s)=>{
  let resolved="";
  try{if(typeof scheduleTypeForMission==="function")resolved=String(scheduleTypeForMission(s?.mission,s?.label,s?.detail)||"").toLowerCase();}catch(_){}
  if(resolved==="engine"||resolved==="strength")return resolved;
  const explicit=String(s?.sessionType||s?.dailySessionType||s?.type||"").toLowerCase();
  if(["engine","running","cycling","endurance","cardio"].includes(explicit))return "engine";
  if(explicit==="strength")return "strength";
  const text=String(`${s?.mission||""} ${s?.label||""} ${s?.detail||""}`).toLowerCase();
  return /^r-/i.test(String(s?.mission||""))||/(run|engine|bike|cycle|row|ski|conditioning|aerobic|tempo|interval|zone 2)/.test(text)?"engine":"strength";
 };
 return {plan:data.plan.map((item,i)=>({id:item.id,day:item.day,mission:item.mission,label:item.customLabel||item.label||item.mission,eventRole:item.eventRole||"",eventPhase:item.eventPhase||"",longitudinalPhase:item.longitudinalPhase||"",scheduledDate:item.scheduledDate,sessions:(typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(item):[]).map(s=>{const resolved=channelOf(s);let template=null;try{template=typeof scaledTemplate==="function"?scaledTemplate(s.mission):(typeof getWorkoutTemplate==="function"?getWorkoutTemplate(s.mission):null);}catch(_){}return{sessionKey:s.sessionKey,sessionType:resolved,mission:s.mission,label:s.label||"",detail:s.detail||"",exerciseCount:Array.isArray(template?.exercises)?template.exercises.length:0,hasEngineFields:Boolean(template?.engineMetrics||template?.cardioType||resolved==="engine")};})}))};
}
"""

COMPLETE_REAL_SESSION = r"""
(cfg)=>{
 const planItem=(data.plan||[]).find(x=>String(x.id)===String(cfg.planId)); if(!planItem)throw new Error(`Plan item not found ${cfg.planId}`);
 const sessions=typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(planItem):[]; const session=sessions.find(s=>s.sessionKey===cfg.sessionKey)||sessions[0];
 if(!session)throw new Error("No real plan session found");
 let channel=""; try{if(typeof scheduleTypeForMission==="function")channel=String(scheduleTypeForMission(session.mission,session.label,session.detail)||"").toLowerCase();}catch(_){}
 if(channel!=="engine"&&channel!=="strength"){const explicit=String(session.sessionType||session.dailySessionType||session.type||"").toLowerCase();const text=String(`${session.mission||""} ${session.label||""} ${session.detail||""}`).toLowerCase();channel=["engine","running","cycling","endurance","cardio"].includes(explicit)||/^R-/i.test(session.mission||"")||/(run|engine|bike|cycle|row|ski|conditioning|aerobic|tempo|interval|zone 2)/.test(text)?"engine":"strength";}
 let base=typeof scaledTemplate==="function"?scaledTemplate(session.mission):(typeof getWorkoutTemplate==="function"?getWorkoutTemplate(session.mission):null); base=JSON.parse(JSON.stringify(base||{name:session.mission,duration:45,exercises:[]}));
 const pending=typeof bellPrescriptionApplicationForPlanSession==="function"?bellPrescriptionApplicationForPlanSession(planItem,session.sessionKey,session.mission):null;
 data.trainingBlock.currentPhase={id:planItem.longitudinalPhase||planItem.eventPhase||"build"}; data.trainingBlock.phase=planItem.longitudinalPhase||planItem.eventPhase||"build";
 const phaseMeta={sessionType:channel,eventRole:planItem.eventRole||"",mission:session.mission,eventPhase:planItem.eventPhase||"",longitudinalPhase:planItem.longitudinalPhase||"",scheduledDate:planItem.scheduledDate||cfg.date};
 const prescribed=pending&&typeof bellApplyClosedLoopPrescription==="function"?bellApplyClosedLoopPrescription(base,pending,phaseMeta):base;
 const behavior=cfg.behavior,idx=Number(cfg.exposureIndex),week=Number(cfg.week); let quality="success",pain=0,technique=false,missed=false,sparse=false,contradictory=false;
 if(behavior==="rapid")quality="rapid";
 if(behavior==="struggle")quality=idx%3===0?"hard":"struggle";
 if(behavior==="inconsistent")quality=idx%2===0?"success":"hard";
 if(behavior==="pain"&&idx===3){quality="hard";pain=5;contradictory=true;} else if(behavior==="pain"&&idx===4)quality="success";
 if(behavior==="travel"&&week===4){missed=true;quality="missed";}
 if(behavior==="messy"&&idx%4===0){sparse=true;quality="sparse";} if(behavior==="messy"&&idx===5){pain=6;contradictory=true;quality="hard";}
 let ratio=quality==="rapid"?1.08:quality==="success"?1.0:quality==="hard"?.82:quality==="struggle"?.7:0;
 let rpe=quality==="rapid"?6.5:quality==="success"?7.5:quality==="hard"?9.2:quality==="struggle"?9.8:7;
 let duration=Math.max(0,Math.round(Number(prescribed.duration||planItem.prescribedDuration||45)*ratio));
 const exercises=(prescribed.exercises||[]).map((ex,ei)=>{const sets=Math.max(1,Number(ex.sets)||3),done=missed?0:Math.max(0,Math.round(sets*ratio));return{name:ex.name||`Exercise ${ei+1}`,recommendedWeight:Number(ex.recommendedWeight)||100,plannedReps:ex.reps||"5",sets:Array.from({length:sets},(_,si)=>({set:si+1,done:si<done,plannedWeight:Number(ex.recommendedWeight)||100,weight:(Number(ex.recommendedWeight)||100)*(quality==="rapid"?1.05:1),plannedReps:ex.reps||"5",reps:ex.reps||"5",rpe,rir:quality==="rapid"?3:quality==="success"?2:0})),painSeverity:pain,techniqueIssue:technique};});
 const id=`full-${cfg.journeyId}-${cfg.week}-${cfg.exposureIndex}-${channel}`; const completion={id,name:session.mission,displayLabel:planItem.customLabel||planItem.label||session.mission,planId:planItem.id,planSessionKey:session.sessionKey,weekIndex:week,completionAttempt:1,dailySessionType:channel,sessionType:channel,dailySessionDate:cfg.date,scheduledDate:cfg.date,completedAt:new Date().toISOString(),completed:!missed,status:missed?"missed":"completed",prescribedDuration:Number(prescribed.duration||planItem.prescribedDuration||45),elapsed:duration*60,officialElapsed:duration*60,sessionRpe:sparse?null:rpe,rpe:sparse?null:rpe,difficulty:quality==="hard"||quality==="struggle"?"hard":"appropriate",painSeverity:pain,sessionFeedback:contradictory?"felt great":"",readiness:{score:quality==="struggle"?42:quality==="hard"?52:85},cardioType:channel==="engine"?(data.settings.cardioType||"Running"):undefined,engineMetrics:channel==="engine"?{distance:duration/10,distanceUnit:"mi",pace:"10:00",avgHeartRate:quality==="struggle"?188:150}:undefined,exercises,eventRole:planItem.eventRole||"",sessionRole:planItem.enduranceRole||planItem.exerciseRole||""};
 if(missed){data.missedSessionLog=Array.isArray(data.missedSessionLog)?data.missedSessionLog:[];data.missedSessionLog.push({date:cfg.date,sessionKey:session.sessionKey,createdAt:new Date().toISOString()});}
 data.history=Array.isArray(data.history)?data.history:[]; data.history.push(completion); let response=null;
 if(!missed)response=bellRecordAthleteResponse(completion); else {completion.structuredCompletion=bellBuildStructuredCompletion(completion); response={decision:bellEvaluateAthleteResponse(completion.structuredCompletion,(data.history||[]).slice(-8),{missed_sessions:(data.missedSessionLog||[]).length,compliance:.4,interruption_days:week===4?10:0}),exerciseDecisions:[]}; const longitudinal=bellStabilizeLongitudinalProgression(response.decision,data.responseEngine?.longitudinalState,{session_type:channel,phase_id:planItem.longitudinalPhase||planItem.eventPhase||"build",event_role:planItem.eventRole||""}); data.responseEngine=data.responseEngine||{};data.responseEngine.longitudinalState=longitudinal.state;response.decision=longitudinal.decision;completion.athleteResponse=response;completion.prescriptionApplication=bellScheduleClosedLoopApplication(completion,response);}
 planItem.done=true;planItem.completed=true;planItem.status="completed"; if(window.BellDailySessions?.setComplete)window.BellDailySessions.setComplete(channel,cfg.date,new Date().toISOString()); saveData({render:false});
 const gate=completion.responseInputQuality||bellRealWorldConfidenceGate(completion.structuredCompletion||completion,(data.history||[]).filter(x=>x!==completion).slice(-8).map(x=>x.structuredCompletion||x));
 const structured=completion.structuredCompletion||{};
 const strengthDiagnostics=channel==="strength"?{
   planned_exercises:(structured.planned?.exercises||[]).length,
   planned_sets:(structured.planned?.exercises||[]).reduce((n,x)=>n+Number(x.planned_sets||0),0),
   completed_sets:(structured.exercise_results||[]).reduce((n,x)=>n+Number(x.completed_sets||0),0),
   set_completion:structured.strength_evidence?.set_completion??null,
   rep_ratio:structured.strength_evidence?.rep_ratio??null,
   load_ratio:structured.strength_evidence?.load_ratio??null,
   performance_ratio:structured.performance_ratio??null,
   session_rpe:structured.session_rpe??null,
   readiness_score:structured.readiness?.score??null,
   data_quality:gate?.quality_score??gate?.score??null,
   gate_reason:gate?.reason??null,
   raw_status:response?.rawDecision?.status??null,
   raw_reasons:response?.rawDecision?.reason_codes||[],
   final_status:response?.decision?.status??null
 }:null;
 const phaseId=String(planItem.longitudinalPhase||planItem.eventPhase||"build").toLowerCase();
 const protectedPhase=typeof bellProtectedPrescriptionPhase==="function"?bellProtectedPrescriptionPhase(phaseMeta):(/taper|race[_ -]?week|event[_ -]?week|peak[_ -]?week|competition|meet[_ -]?week|late[_ -]?specific/.test(phaseId));
 const blockedApplications=(data.responseEngine?.prescriptionApplications||[]).filter(app=>app.state==="blocked"&&String(app.targetPlanId)===String(planItem.id));
 return {channel,mission:session.mission,planId:planItem.id,sessionKey:session.sessionKey,eventPhase:planItem.eventPhase||"",longitudinalPhase:planItem.longitudinalPhase||"",phaseId,protectedPhase,base,prescribed,hadPending:Boolean(pending),pendingId:pending?.applicationId||null,pendingStatus:pending?.status||null,blockedApplications,completionId:id,decision:response?.decision||null,rawDecision:response?.rawDecision||null,gate,strengthDiagnostics,scheduled:completion.prescriptionApplication||null,historyCount:data.history.length,applicationCount:data.responseEngine?.prescriptionApplications?.length||0};
}
"""

STATE_SNAPSHOT = r"""
()=>{
 const apps=data.responseEngine?.prescriptionApplications||[];
 return {historyCount:(data.history||[]).length,applicationCount:apps.length,applicationIds:apps.map(x=>x.applicationId),applicationTargets:apps.map(x=>({id:x.applicationId,state:x.state,channel:x.channel,targetPlanId:x.targetPlanId,targetSessionKey:x.targetSessionKey,targetMission:x.targetMission})),decisions:(data.responseEngine?.decisions||[]).map(x=>x.status),last:data.responseEngine?.lastEvaluation||null,longitudinal:data.responseEngine?.longitudinalState||null,plan:(data.plan||[]).map(x=>({id:x.id,status:x.status,mission:x.mission,applications:x.prescriptionApplications||{}})),storageBytes:(localStorage.getItem("bellPerformanceData")||localStorage.getItem("bell-performance-data")||"").length};
}
"""

DUPLICATE_CHECK = r"""
(completionId)=>{const found=(data.history||[]).find(x=>x.id===completionId); if(!found)return{found:false}; const gate=bellRealWorldConfidenceGate(found.structuredCompletion||found,(data.history||[]).map(x=>x.structuredCompletion||x)); const before=data.responseEngine?.prescriptionApplications?.length||0; return{found:true,duplicate:gate.duplicate,reason:gate.reason,before,after:data.responseEngine?.prescriptionApplications?.length||0};}
"""

def set_now(page, date: dt.date):
    page.evaluate("iso=>window.__bellSetNow(iso)", f"{date.isoformat()}T09:00:00-05:00")

def launch_context(browser, base_url, jid):
    context=browser.new_context(viewport=VIEWPORT, timezone_id="America/Chicago", locale="en-US")
    context.add_init_script(date_init()); page=context.new_page(); errors=[]
    page.on("pageerror",lambda e:errors.append(f"PAGE: {e}")); page.on("console",lambda m:errors.append(f"CONSOLE: {m.text}") if m.type=="error" else None)
    page.goto(f"{base_url}/index.html?fullJourney={jid}&ts={time.time_ns()}",wait_until="domcontentloaded",timeout=60000)
    page.wait_for_function("typeof cloneDefaults==='function' && typeof bpPrepareBlockPlan==='function' && typeof bellRecordAthleteResponse==='function' && typeof bellApplyClosedLoopPrescription==='function'",timeout=60000)
    return context,page,errors

def run_journey(browser, base_url, cfg):
    context,page,errors=launch_context(browser,base_url,cfg["id"]); records=[]; checks=[]; exposure=0; first_history_after_reload=None
    try:
        set_now(page,START_DATE); page.evaluate(SEED_PROFILE,cfg); block=page.evaluate(CREATE_BLOCK,cfg)
        checks.append({"name":"formal plan generated","passed":block["formalWeeks"]==cfg["weeks"],"detail":f"{block['formalWeeks']} weeks"})
        for week in range(1,cfg["weeks"]+1):
            monday=START_DATE+dt.timedelta(weeks=week-1); set_now(page,monday)
            week_state=page.evaluate(PREPARE_WEEK,{"week":week,"monday":monday.isoformat()})
            real=[]
            discovered=[]
            for item in week_state["plan"]:
                for sess in item.get("sessions",[]):
                    discovered.append({"planId": item.get("id"), "mission": sess.get("mission"), "sessionType": sess.get("sessionType")})
                    if sess.get("sessionType") in ("strength","engine"):
                        real.append((item,sess))
            checks.append({"name":f"week {week} executable sessions discovered","passed":len(real)>0,"detail":f"{len(real)} executable of {len(discovered)} discovered"})
            if not real:
                raise RuntimeError(f"JOURNEY_SESSION_DISCOVERY_FAILED week={week} plan_items={len(week_state['plan'])} discovered={json.dumps(discovered)}")
            # Select real sessions by the journey's required channel mix instead of
            # accidentally taking whichever channel appears first in the generated week.
            desired=list(cfg.get("weeklyChannels") or ["strength","engine"])
            selected_required=[]
            used=set()
            for channel in desired:
                match=next(((item,sess) for item,sess in real if sess.get("sessionType")==channel and (item.get("id"),sess.get("sessionKey")) not in used),None)
                if match:
                    selected_required.append(match); used.add((match[0].get("id"),match[1].get("sessionKey")))
            checks.append({"name":f"week {week} required channel mix available","passed":len(selected_required)==len(desired),"detail":f"required {desired}; selected {[sess.get('sessionType') for _,sess in selected_required]}; discovered {[x.get('sessionType') for x in discovered]}"})
            if len(selected_required)!=len(desired):
                raise RuntimeError(f"JOURNEY_CHANNEL_FIDELITY_FAILED week={week} required={desired} discovered={json.dumps(discovered)}")
            # A full journey must complete the full generated training week. The
            # earlier two-session sample falsely looked like low compliance and
            # triggered rebuild despite successful training.
            selected=real
            checks.append({"name":f"week {week} full executable plan selected","passed":len(selected)==len(real),"detail":f"{len(selected)} of {len(real)} executable sessions"})
            for item,sess in selected:
                exposure+=1; day_index=max(0,["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].index(item.get("day","Monday")))
                date=monday+dt.timedelta(days=day_index); set_now(page,date)
                result=page.evaluate(COMPLETE_REAL_SESSION,{"journeyId":cfg["id"],"week":week,"exposureIndex":exposure,"behavior":cfg["behavior"],"date":date.isoformat(),"planId":item["id"],"sessionKey":sess["sessionKey"]})
                records.append({"week":week,"date":date.isoformat(),**result})
                d=result.get("decision") or {}; gate=result.get("gate") or {}
                checks.append({"name":f"exposure {exposure} produced {result.get('channel')} decision","passed":bool(d.get("status")),"detail":str(d.get("status"))})
                checks.append({"name":f"exposure {exposure} remained bounded","passed":.9<=float(d.get("intensity_factor",1))<=1.1 and .6<=float(d.get("volume_factor",1))<=1.15 and .7<=float(d.get("engine_duration_factor",1))<=1.2,"detail":f"{d.get('intensity_factor')}/{d.get('volume_factor')}/{d.get('engine_duration_factor')}"})
                if result.get("channel")=="strength":
                    diag=result.get("strengthDiagnostics") or {}
                    checks.append({"name":f"strength evidence captured {exposure}","passed":diag.get("performance_ratio") is not None and diag.get("set_completion") is not None and diag.get("load_ratio") is not None,"detail":f"sets {diag.get('completed_sets')}/{diag.get('planned_sets')} · completion {diag.get('set_completion')} · reps {diag.get('rep_ratio')} · load {diag.get('load_ratio')} · perf {diag.get('performance_ratio')} · RPE {diag.get('session_rpe')} · raw {diag.get('raw_status')} {diag.get('raw_reasons')}"})
                if result.get("hadPending") and result.get("pendingStatus") not in (None,"observe"):
                    before=json.dumps(result.get("base"),sort_keys=True); after=json.dumps(result.get("prescribed"),sort_keys=True)
                    checks.append({"name":f"pending application changed real next template {exposure}","passed":before!=after,"detail":f"{result.get('pendingStatus')} {result.get('pendingId') or ''}"})
                if cfg["behavior"]=="messy" and (exposure%4==0 or exposure==5):
                    checks.append({"name":f"messy evidence blocks upward {exposure}","passed":d.get("status") not in ("progress","accelerate"),"detail":f"gate={gate.get('reason')} decision={d.get('status')}"})
            if week==4:
                before=page.evaluate(STATE_SNAPSHOT); page.reload(wait_until="domcontentloaded",timeout=60000); page.wait_for_function("typeof bellRecordAthleteResponse==='function' && typeof bpPrepareBlockPlan==='function'",timeout=60000); set_now(page,monday); after=page.evaluate(STATE_SNAPSHOT)
                first_history_after_reload=after["historyCount"]
                checks.append({"name":"mid-journey reload preserved history","passed":after["historyCount"]==before["historyCount"] and after["historyCount"]>0,"detail":f"{before['historyCount']} -> {after['historyCount']}"})
                checks.append({"name":"mid-journey reload preserved applications","passed":after["applicationCount"]==before["applicationCount"] and after["applicationIds"]==before["applicationIds"] and after["applicationCount"]>0,"detail":f"{before['applicationCount']} -> {after['applicationCount']} · ids preserved={after['applicationIds']==before['applicationIds']}"})
                checks.append({"name":"mid-journey reload preserved application targets","passed":after["applicationTargets"]==before["applicationTargets"],"detail":f"{len(before['applicationTargets'])} target records retained"})
        final=page.evaluate(STATE_SNAPSHOT)
        statuses=[r.get("decision",{}).get("status") for r in records]
        expected=set(cfg.get("expected",[])); observed=set(statuses)
        if cfg["id"] in ("steady-strength","rapid-hybrid"):
            first_positive=next((r for r in records if r.get("channel")=="strength" and (r.get("strengthDiagnostics") or {}).get("performance_ratio",0)>=.95),None)
            checks.append({"name":"first successful strength exposure avoided rebuild","passed":bool(first_positive) and first_positive.get("decision",{}).get("status")!="rebuild","detail":f"{first_positive.get('decision',{}).get('status') if first_positive else 'no qualifying exposure'} · {(first_positive or {}).get('strengthDiagnostics')}"})
        if cfg["id"]=="taper-protection":
            protected_records=[r for r in records if r.get("protectedPhase")]
            protected_statuses=[r.get("decision",{}).get("status") for r in protected_records]
            checks.append({"name":"protected taper avoided upward adaptation","passed":bool(protected_records) and not any(s in ("progress","accelerate") for s in protected_statuses),"detail":f"protected phases {[(r.get('week'),r.get('phaseId'),r.get('decision',{}).get('status')) for r in protected_records]}"})
        else:
            checks.append({"name":"expected adaptive state observed","passed":bool(expected&observed),"detail":f"expected any {sorted(expected)}, observed {sorted(observed)}"})
        checks.append({"name":"journey persisted after reload","passed":first_history_after_reload is not None and final["historyCount"]>=first_history_after_reload,"detail":f"final history {final['historyCount']}"})
        checks.append({"name":"closed-loop applications created","passed":final["applicationCount"]>0,"detail":f"{final['applicationCount']} applications"})
        channel_counts={channel:sum(1 for r in records if r.get("channel")==channel) for channel in ("strength","engine")}
        minimums=cfg.get("minimumChannelExposures",{})
        for channel,minimum in minimums.items():
            checks.append({"name":f"{channel} exposure minimum","passed":channel_counts.get(channel,0)>=int(minimum),"detail":f"{channel_counts.get(channel,0)} observed; minimum {minimum}"})
        checks.append({"name":"application identifiers remain unique","passed":len(final.get("applicationIds",[]))==len(set(final.get("applicationIds",[]))),"detail":f"{len(final.get('applicationIds',[]))} unique of {len(final.get('applicationIds',[]))}"})
        # Validate duplicate recognition without invoking the response engine a second time.
        if records:
            dup=page.evaluate(DUPLICATE_CHECK,records[-1]["completionId"])
            checks.append({"name":"duplicate completion recognized","passed":bool(dup.get("duplicate")) and dup.get("before")==dup.get("after"),"detail":json.dumps(dup)})
        # Specific safety assertions.
        if cfg["behavior"]=="pain": checks.append({"name":"pain caused protection","passed":"protect" in statuses,"detail":str(statuses)})
        if cfg["behavior"]=="travel": checks.append({"name":"interruption caused rebuild","passed":"rebuild" in statuses,"detail":str(statuses)})
        if cfg["id"]=="taper-protection":
            protected=[r for r in records if r.get("protectedPhase")]
            late=[r.get("decision",{}).get("status") for r in protected]
            stale_applied=[r for r in protected if r.get("hadPending") and r.get("pendingStatus") in ("progress","accelerate") and r.get("base")!=r.get("prescribed")]
            blocked=sum(len(r.get("blockedApplications") or []) for r in protected)
            checks.append({"name":"phase-marked taper prevented upward decisions","passed":bool(protected) and not any(s in ("progress","accelerate") for s in late),"detail":str([(r.get("week"),r.get("phaseId"),r.get("decision",{}).get("status")) for r in protected])})
            checks.append({"name":"stale upward applications blocked before taper prescription","passed":not stale_applied,"detail":f"protected exposures={len(protected)} blocked audits={blocked} stale applied={len(stale_applied)}"})
        passed=all(c["passed"] for c in checks) and not errors
        return {"id":cfg["id"],"title":cfg["title"],"passed":passed,"weeks":cfg["weeks"],"exposures":len(records),"statuses":statuses,"checks":checks,"records":records,"final":final,"errors":errors}
    except Exception as exc:
        return {"id":cfg["id"],"title":cfg["title"],"passed":False,"weeks":cfg["weeks"],"exposures":len(records),"statuses":[r.get("decision",{}).get("status") for r in records],"checks":checks,"records":records,"errors":errors+[repr(exc)]}
    finally:
        context.close()

def render_report(results, elapsed):
    REPORT_DIR.mkdir(parents=True,exist_ok=True)
    total=sum(r["exposures"] for r in results); passed=sum(r["passed"] for r in results); checks=sum(len(r["checks"]) for r in results); checks_passed=sum(sum(1 for c in r["checks"] if c["passed"]) for r in results)
    (REPORT_DIR/"results.json").write_text(json.dumps({"version":"13.16.7","elapsedSeconds":elapsed,"journeys":results},indent=2),encoding="utf-8")
    cards=[]
    for r in results:
        rows="".join(f"<li class={'pass' if c['passed'] else 'fail'}><b>{html.escape(c['name'])}</b> — {html.escape(c['detail'])}</li>" for c in r["checks"])
        errors="".join(f"<li class=fail><b>Runtime error</b> — {html.escape(e)}</li>" for e in r.get("errors",[]))
        trajectory=" → ".join(s or "none" for s in r["statuses"])
        cards.append(f"<article><h2>{html.escape(r['title'])}</h2><p><b>{'PASS' if r['passed'] else 'FAIL'}</b> · {r['weeks']} actual generated weeks · {r['exposures']} completed/missed real plan sessions</p><p class=trajectory>{html.escape(trajectory)}</p><ul>{rows}{errors}</ul></article>")
    doc=f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Bell 13.16.7 Taper Window Fidelity & Pending Application Revalidation</title><style>body{{font-family:Segoe UI,Arial;background:#090b0f;color:#f5f5f3;margin:0}}main{{max-width:1500px;margin:auto;padding:28px}}header,article{{background:#12161d;border:1px solid #303641;border-radius:18px;padding:22px;margin-bottom:16px}}p,li{{color:#b6bdc8;line-height:1.5}}.metric{{font-size:2.4rem;font-weight:900}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(430px,1fr));gap:14px}}.pass b{{color:#64d69a}}.fail b{{color:#ff7777}}.trajectory{{color:#d6b45c;font-size:.9rem}}</style></head><body><main><header><h1>Taper Window Fidelity & Pending Application Revalidation</h1><p>These journeys load the actual Bell app in Chromium, complete every executable session in real generated plans, identify protected taper sessions from production phase metadata, revalidate queued prescription applications against the target session phase, persist audit records, reload mid-journey, and continue. Pre-taper progression remains allowed, while protected taper sessions must reject stale upward applications.</p><div class=metric>{passed}/{len(results)} journeys passed</div><p>{total} real plan exposures · {checks_passed}/{checks} checks passed · runtime {elapsed:.1f} seconds</p></header><section class=grid>{''.join(cards)}</section></main></body></html>"""
    (REPORT_DIR/"index.html").write_text(doc,encoding="utf-8")
    return passed,len(results),total,checks_passed,checks

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--app-root",type=Path,default=ROOT); ap.add_argument("--config",type=Path,default=AUTOMATION/"full_stack_journeys_13165.json"); args=ap.parse_args()
    cfg=json.loads(args.config.read_text(encoding="utf-8")); REPORT_DIR.mkdir(parents=True,exist_ok=True)
    start=time.perf_counter();
    with local_server(args.app_root) as base_url, sync_playwright() as pw:
        exe=find_browser(); browser=pw.chromium.launch(headless=True,executable_path=exe) if exe else pw.chromium.launch(headless=True)
        results=[]
        for journey in cfg["journeys"]:
            print(f"Running {journey['title']}..."); result=run_journey(browser,base_url,journey); results.append(result); print(f"  {'PASS' if result['passed'] else 'FAIL'}: {result['exposures']} exposures")
        browser.close()
    elapsed=time.perf_counter()-start; passed,total,exposures,cp,ct=render_report(results,elapsed)
    print(f"{passed}/{total} full-stack journeys passed across {exposures} real plan exposures in {elapsed:.1f}s ({cp}/{ct} checks).")
    if passed!=total: sys.exit(1)

if __name__=="__main__": main()
