from __future__ import annotations
import json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; AUTO=ROOT/'automation'; REPORT=AUTO/'real_world_chaos_reports'/'latest'; REPORT.mkdir(parents=True,exist_ok=True)
node=subprocess.run(['node',str(AUTO/'test-real-world-chaos-13160.js')],cwd=ROOT,text=True,capture_output=True)
print(node.stdout,end='')
if node.returncode:
 print(node.stderr,file=sys.stderr); raise SystemExit(node.returncode)
js=json.loads((REPORT/'js-results.json').read_text())
sys.path.insert(0,str(ROOT/'backend'))
from intelligence.real_world_chaos import normalize_completion, confidence_gate, completion_fingerprint
from intelligence.longitudinal_progression import stabilize_longitudinal_progression
from intelligence.prescription_application import build_prescription_application, apply_prescription_application
checks=[]
def check(name,fn):
 try: fn(); checks.append({'name':name,'passed':True,'detail':'Passed'})
 except Exception as exc: checks.append({'name':name,'passed':False,'detail':str(exc)})
def require(v,msg):
 if not v: raise AssertionError(msg)
check('Out-of-range telemetry is bounded',lambda: require(normalize_completion({'session_id':'x','session_rpe':99,'readiness':-3,'pain_severity':22,'completed_duration_minutes':9999})['session_rpe']==10,'RPE not bounded'))
a={'session_id':'dup','session_type':'strength','completed_at':'2026-08-01T12:00:00Z','completed_duration_minutes':60,'session_rpe':7,'readiness':4,'pain_severity':0,'exercises':[{'exercise_name':'Squat','completed_sets':4}]}
check('Duplicate completion is rejected',lambda: require(confidence_gate(a,[{**a,'completion_id':completion_fingerprint(a)}])['duplicate'],'duplicate accepted'))
check('Sparse evidence blocks upward adaptation',lambda: require(not confidence_gate({'session_id':'sparse','session_type':'strength'},[])['allow_upward'],'sparse input allowed upward'))
check('Contradictory pain feedback blocks upward adaptation',lambda: require(not confidence_gate({'session_id':'pain','pain_severity':7,'session_feedback':'great','session_rpe':5,'readiness':4,'completed_duration_minutes':60,'exercises':[{'exercise_name':'Squat','completed_sets':4}]},[])['allow_upward'],'contradiction allowed upward'))
def parity_safety():
 state=None
 for i in range(30):
  raw={'status':'accelerate','intensity_factor':1.05,'volume_factor':1.08,'engine_duration_factor':1.1,'reason_codes':[],'explanation':'fast'}
  out=stabilize_longitudinal_progression(raw,state,{'session_type':'strength','phase_id':'build'});state=out['state'];d=out['decision']
  require(.9<=d['intensity_factor']<=1.1 and .6<=d['volume_factor']<=1.15,'cap failed')
check('Thirty rapid Python exposures remain capped',parity_safety)
def prescription_guard():
 d={'status':'progress','intensity_factor':1.025,'volume_factor':1.04,'engine_duration_factor':1.05,'longitudinal':{'channel':'strength','global_exposure':2,'channel_exposure':2}}
 app=build_prescription_application(d,[],'source',source_session_type='strength')
 session={'session_type':'strength','session':{'id':'s1'},'event_role':'primary_lift','exercise_blocks':[{'name':'Back Squat','prescription':{'sets':4,'target_load':300,'target_rpe':8}}],'programming':{'event_role':'primary_lift'}}
 once=apply_prescription_application(session,app);twice=apply_prescription_application(once,app)
 require(once==twice,'application compounded');require(once['programming']['event_role']=='primary_lift','event role lost')
check('Python prescription application remains idempotent and specific',prescription_guard)
passed=sum(c['passed'] for c in checks); result={'version':'13.16.0','journeys':js['journeys'],'journeys_passed':js['passed'],'exposures':js['exposures'],'python_checks':len(checks),'python_passed':passed,'checks':checks}
(REPORT/'results.json').write_text(json.dumps(result,indent=2))
cards=''.join(f"<article class={'pass' if c['passed'] else 'fail'}><h3>{c['name']}</h3><p><b>{'PASS' if c['passed'] else 'FAIL'}</b></p><p>{c['detail']}</p></article>" for c in checks)
report=f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Bell 13.16.0 Real-World Chaos Validation</title><style>body{{font-family:Segoe UI,Arial;background:#090b0f;color:#f5f5f3;margin:0}}main{{max-width:1500px;margin:auto;padding:28px}}header,article{{background:#12161d;border:1px solid #303641;border-radius:18px;padding:22px;margin-bottom:16px}}.metric{{font-size:2.4rem;font-weight:900}}p{{color:#b6bdc8}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:14px}}.pass b{{color:#64d69a}}.fail b{{color:#ff7777}}</style></head><body><main><header><h1>Real-World Athlete Simulation & Chaos Testing</h1><p>Twelve athlete archetypes across ten deterministic seeds test incomplete, duplicated, contradictory, delayed, painful, travel-interrupted, overreaching, plateaued, goal-changing, and mixed-channel behavior.</p><div class='metric'>{js['passed']}/{js['journeys']} journeys passed</div><p>{js['exposures']} completed, missed, malformed, or duplicated exposures processed. Python guard checks: {passed}/{len(checks)} passed.</p></header><section class='grid'>{cards}</section></main></body></html>"""
(REPORT/'index.html').write_text(report)
print(f"{js['passed']}/{js['journeys']} chaos journeys and {passed}/{len(checks)} Python checks passed")
raise SystemExit(0 if js['failed']==0 and passed==len(checks) else 1)
