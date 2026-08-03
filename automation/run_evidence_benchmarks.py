from __future__ import annotations
import argparse, copy, datetime as dt, html, json, math, re, statistics, sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import run_year_simulations as sim

SCENARIOS=[("ideal",1.0,"100%"),("real_world",.90,"90%"),("inconsistent",.75,"75%"),("disrupted",.60,"60%")]
RX_WEIGHTS={"science":.30,"legitimacy":.25,"progression":.25,"recovery":.20}

KEY_ROLES={"competition_squat","competition_bench","competition_deadlift","quality_run","long_run","race_rehearsal","event_day","physique_resistance","runner_strength"}

def clamp(x,lo=0,hi=100): return max(lo,min(hi,round(x)))
def text_all(run): return " ".join((x+" "+d).lower() for w in run.weeks for x,d in zip(w.get("planLabels",[]),w.get("planDetails",[])))
def roles_all(run): return " ".join(x.lower() for w in run.weeks for x in w.get("planRoles",[]))
def phase_unique(run): return [len({x for w in run.weeks if p["startWeek"]<=w["globalWeek"]<=p["endWeek"] for x in w.get("planLabels",[]) if x}) for p in run.phases]
def parse_rpe(s):
    m=re.search(r'RPE\s*(\d+(?:\.\d+)?)',str(s),re.I); return float(m.group(1)) if m else None
def parse_reps(s):
    t=str(s); m=re.match(r'\s*(\d+)',t); return int(m.group(1)) if m else None

def dose_metrics(run):
    weekly=[]; muscle=defaultdict(float); patterns=Counter(); rpes=[]; total_sets=0; hard_sets=0; endurance_minutes=Counter(); weekly_minutes=[]
    for w in run.weeks:
        wsets=0; wmus=Counter(); wrpe=[]; zone=Counter()
        for item in w.get("plan",[]):
            role=str(item.get("enduranceRole") or item.get("exerciseRole") or item.get("physiqueRole") or item.get("eventRole") or "").lower()
            dur=float(item.get("duration") or 0)
            if role:
                if any(k in role for k in ("easy","recovery")): zone["low"]+=dur
                elif any(k in role for k in ("quality","threshold","interval","race_rehearsal","event_day")): zone["high"]+=dur
                elif "long" in role: zone["low"]+=dur
            for ex in item.get("exercises",[]):
                sets=float(ex.get("sets") or 0); wsets+=sets; total_sets+=sets
                rpe=parse_rpe(ex.get("reps")); reps=parse_reps(ex.get("reps"))
                if rpe is not None: rpes.append(rpe); wrpe.append(rpe)
                if (rpe is not None and rpe>=7) or (rpe is None and reps is not None and reps<=15): hard_sets+=sets
                patterns[str(ex.get("pattern") or "Unknown")]+=sets
                prim=ex.get("primary") or []
                sec=ex.get("secondary") or []
                for m in prim: muscle[m]+=sets; wmus[m]+=sets
                for m in sec: muscle[m]+=.5*sets; wmus[m]+=.5*sets
        endurance_minutes.update(zone); weekly_minutes.append(sum(zone.values()))
        weekly.append({"week":w["globalWeek"],"sets":wsets,"muscle":dict(wmus),"avgRpe":statistics.mean(wrpe) if wrpe else None,"zones":dict(zone)})
    load_jumps=[]
    for a,b in zip(weekly_minutes,weekly_minutes[1:]):
        if a>0: load_jumps.append((b-a)/a)
    return {"weekly":weekly,"totalSets":total_sets,"hardSetShare":hard_sets/max(1,total_sets),"avgRpe":statistics.mean(rpes) if rpes else None,"muscleTotals":dict(muscle),"patterns":dict(patterns),"enduranceMinutes":dict(endurance_minutes),"maxWeeklyEnduranceJump":max(load_jumps) if load_jumps else 0,"dataCompleteness":sum([total_sets>0, bool(rpes), sum(endurance_minutes.values())>0])/3}

def key_adherence(run):
    p=Counter(); c=Counter()
    for w in run.weeks:
        p.update({k:v for k,v in w.get("rolePrescribed",{}).items() if k})
        c.update({k:v for k,v in w.get("roleCompleted",{}).items() if k})
    key_p=sum(v for k,v in p.items() if k in KEY_ROLES or any(x in k for x in KEY_ROLES))
    key_c=sum(c.get(k,0) for k in p if k in KEY_ROLES or any(x in k for x in KEY_ROLES))
    return key_c/key_p if key_p else sim.journey_summary(run)["adherence"]

def score_prescription(run,dose):
    s=sim.journey_summary(run); text=text_all(run); role=roles_all(run)
    checks=sum(c["passed"] for c in run.checks)/max(1,len(run.checks)); formal=all(p["formalWeekCount"]==p["weeks"] for p in run.phases)
    variation=statistics.mean(min(1,u/8) for u in phase_unique(run)) if run.phases else 0
    science=62+18*checks+8*formal+8*dose["dataCompleteness"]
    legitimacy=60+18*variation+10*(s["timeViolations"]==0)+8*dose["dataCompleteness"]
    progression=55+20*variation+15*formal+10*(dose["maxWeeklyEnduranceJump"]<=.25)
    recovery=62+20*checks+10*("recovery" in text or "restore" in text)+8*(s["timeViolations"]==0)
    critical=[]; findings=[]
    if "powerlifting" in run.config["id"]:
        spec=all(x in role or x.replace("competition_","") in text for x in ("competition_squat","competition_bench","competition_deadlift")); taper=("taper" in text or "opener" in text)
        legitimacy+=8*spec+5*taper; progression+=7*spec+5*taper
        if not spec: critical.append("Competition-lift specificity missing")
        if dose["avgRpe"] is None: findings.append("RPE coverage is incomplete; intensity validation remains moderate confidence.")
    elif "physique" in run.config["id"]:
        resistance=("resistance" in role or "physique" in text); cardio="cardio" in text; restore="post-show" in text and "restore" in text
        legitimacy+=5*resistance+5*cardio+5*restore; recovery+=8*restore
        weekly_muscle=[sum(v.values()) for v in [w["muscle"] for w in dose["weekly"]] if v]
        if not resistance: critical.append("Physique resistance emphasis missing")
        if not weekly_muscle: findings.append("Muscle-set distribution could not be calculated.")
    elif "endurance" in run.config["id"]:
        quality=("quality_run" in role or "threshold" in text or "goal-pace" in text); long=("long_run" in role or "race_rehearsal" in role or "long run" in text); taper="taper" in text
        legitimacy+=5*quality+5*long+5*taper; progression+=7*quality+7*long
        if not quality: critical.append("Event-specific quality running missing")
        if not long: critical.append("Long run or race rehearsal missing")
        low=dose["enduranceMinutes"].get("low",0); high=dose["enduranceMinutes"].get("high",0); share=low/max(1,low+high)
        if share<.65: findings.append(f"Low-intensity share is only {share:.0%}; review intensity distribution.")
        elif share>.95: findings.append(f"Low-intensity share is {share:.0%}; verify enough quality work is retained.")
        if dose["maxWeeklyEnduranceJump"]>.30: findings.append(f"Largest modeled endurance-duration increase is {dose['maxWeeklyEnduranceJump']:.0%}.")
    else:
        foundation="foundation a" in text and "foundation b" in text; legitimacy+=12*foundation; progression+=8*foundation
        if not foundation: critical.append("Beginner movement foundation missing")
        if dose["avgRpe"] and dose["avgRpe"]>8: findings.append("Average prescribed RPE appears too high for a beginner journey.")
    components={"science":clamp(science,0,94),"legitimacy":clamp(legitimacy,0,94),"progression":clamp(progression,0,94),"recovery":clamp(recovery,0,94)}
    score=clamp(sum(components[k]*RX_WEIGHTS[k] for k in RX_WEIGHTS),0,94)
    if critical: score=min(score,69)
    confidence="High" if dose["dataCompleteness"]>=.95 else "Moderate" if dose["dataCompleteness"]>=.5 else "Low"
    return score,components,critical,findings,confidence

def score_outcome(run,target,prescription_score):
    s=sim.journey_summary(run); actual=s["adherence"]; key=key_adherence(run)
    target_accuracy=max(0,1-abs(actual-target)/.20)
    interruptions=sum(1 for w in run.weeks if w.get("adherence",1)<.35)
    continuity=max(0,1-interruptions/8)
    response=(.48*actual+.32*key+.12*target_accuracy+.08*continuity)*100
    # Poor adherence must materially reduce expected results, even when prescription quality is strong.
    if actual<.65: response=min(response,58)
    elif actual<.78: response=min(response,72)
    elif actual<.88: response=min(response,84)
    response=clamp(response)
    combined=clamp(.55*prescription_score+.45*response)
    outcome="High" if response>=88 else "Moderate" if response>=75 else "Low" if response>=60 else "Very low"
    return {"executionViability":response,"keySessionAdherence":key,"continuity":continuity,"combined":combined,"outcomeConfidence":outcome}

def expand(base):
    out=[]
    for athlete in base:
        for sid,target,label in SCENARIOS:
            x=copy.deepcopy(athlete); x["baseId"]=athlete["id"]; x["scenarioId"]=sid; x["targetCompliance"]=target
            x["id"]=f"{athlete['id']}-{sid}"; x["title"]=f"{athlete['title']} · {label} compliance"; x["adherence"]=target
            if sid=="disrupted": x.setdefault("disruptions",[]).extend([{"week":18,"day":x["days"][0],"kind":"missed","note":"Simulated illness interruption"},{"week":19,"day":x["days"][0],"kind":"missed","note":"Simulated illness interruption"}])
            out.append(x)
    return out

def write_report(results,sources,report):
    report.mkdir(parents=True,exist_ok=True); rows=[]
    for r in results:
        sc=r["score"]; oc=sc["outcome"]
        rows.append(f"<tr><td>{html.escape(r['athlete'])}</td><td>{r['target']:.0%}</td><td>{sc['actualAdherence']:.0%}</td><td><b>{sc['prescriptionQuality']}</b></td><td><b>{oc['executionViability']}</b></td><td>{oc['keySessionAdherence']:.0%}</td><td>{oc['outcomeConfidence']}</td><td>{oc['combined']}</td><td>{sc['evidenceConfidence']}</td><td>{html.escape('; '.join(sc['criticalFailures']) or 'None')}</td></tr>")
    sources_html="".join(f"<li><b>{html.escape(s['title'])}</b> — {html.escape(s['evidenceLevel'].replace('_',' '))}. {html.escape(s['use'])}</li>" for s in sources["principles"])
    findings="".join(f"<article><h3>{html.escape(r['athlete'])} · {r['target']:.0%}</h3><p>{html.escape(' '.join(r['score']['findings']) or 'No dose-level warning triggered by the available metadata.')}</p></article>" for r in results if r['scenario']=='real_world')
    doc=f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bell 13.10.1 Dose-Level Benchmark</title><style>body{{font-family:Segoe UI,Arial;background:#090b0f;color:#f5f5f3;margin:0}}main{{max-width:1500px;margin:auto;padding:28px}}section,header,article{{background:#12161d;border:1px solid #303641;border-radius:18px;padding:22px;margin-bottom:18px}}h1{{font-size:clamp(2rem,5vw,4rem)}}p,li{{color:#b6bdc8;line-height:1.55}}table{{width:100%;border-collapse:collapse;min-width:1250px}}th,td{{padding:10px;border-bottom:1px solid #303641;text-align:left}}th{{color:#e0ae32}}.wrap{{overflow:auto}}.note{{border-left:4px solid #e0ae32}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}}article{{margin:0}}</style></head><body><main><header><h1>Dose-Level Evidence & Outcome Confidence</h1><p>Sixteen 12-month journeys separate prescription quality from likely effectiveness under 100%, 90%, 75%, and 60% compliance. Scores are capped below 100 until measured athlete response is available.</p></header><section><h2>Results</h2><div class="wrap"><table><thead><tr><th>Athlete</th><th>Target</th><th>Actual</th><th>Prescription quality</th><th>Execution viability</th><th>Key-session adherence</th><th>Outcome confidence</th><th>Combined</th><th>Evidence confidence</th><th>Critical failures</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></section><section><h2>90% scenario findings</h2><div class="grid">{findings}</div></section><section><h2>Evidence corpus</h2><ul>{sources_html}</ul></section><section class="note"><h2>Interpretation</h2><p>Prescription quality evaluates structure, discipline specificity, periodization, recovery, and the dose metadata Bell currently exposes. Execution viability penalizes missed key sessions, poor continuity, and low actual adherence. No result is a guarantee. Load history, athlete-entered RPE/RIR, measured performance, sleep, nutrition, and injury response are still needed for athlete-response validation.</p></section></main></body></html>'''
    (report/'index.html').write_text(doc,encoding='utf-8')
    (report/'results.json').write_text(json.dumps({"generatedAt":dt.datetime.now().isoformat(),"version":"13.10.1","results":results,"sources":sources},indent=2),encoding='utf-8')

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--app-root',required=True,type=Path); ap.add_argument('--journeys',required=True,type=Path); ap.add_argument('--sources',required=True,type=Path); ap.add_argument('--headed',action='store_true'); a=ap.parse_args()
    app=a.app_root.resolve(); base=json.loads(a.journeys.read_text()); sources=json.loads(a.sources.read_text()); configs=expand(base)
    root=app/'automation'/'evidence_reports'; out=root/dt.datetime.now().strftime('%Y%m%d-%H%M%S'); out.mkdir(parents=True,exist_ok=True); results=[]
    with sim.local_server(app) as url:
      with sim.sync_playwright() as p:
        kwargs={'headless':not a.headed}; exe=sim.find_browser_executable();
        if exe: kwargs['executable_path']=exe
        browser=p.chromium.launch(**kwargs)
        try:
          for i,cfg in enumerate(configs,1):
            print(f"[{i}/{len(configs)}] {cfg['title']}")
            run=sim.simulate_journey(browser,url,cfg,out); dose=dose_metrics(run); pq,components,critical,findings,confidence=score_prescription(run,dose); outcome=score_outcome(run,cfg['targetCompliance'],pq); summary=sim.journey_summary(run)
            results.append({"athlete":cfg['title'].split(' · ')[0],"id":cfg['id'],"scenario":cfg['scenarioId'],"target":cfg['targetCompliance'],"score":{"prescriptionQuality":pq,"components":components,"actualAdherence":summary['adherence'],"outcome":outcome,"evidenceConfidence":confidence,"criticalFailures":critical,"findings":findings,"dose":dose}})
        finally: browser.close()
    write_report(results,sources,out); latest=root/'latest'; sim.copy_latest(out,latest); print(f"Dose benchmark complete. Report: {latest/'index.html'}")
    return 1 if any(r['score']['criticalFailures'] for r in results if r['scenario']=='real_world') else 0
if __name__=='__main__': raise SystemExit(main())
