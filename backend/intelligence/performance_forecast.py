from __future__ import annotations
from typing import Any
VERSION='0.1.0'
RATES={'strength':0.006,'hypertrophy':0.004,'aerobic_base':0.007,'lactate_threshold':0.006,'body_composition':0.005,'power':0.004,'work_capacity':0.007,'general_fitness':0.004}
class BellPerformanceForecastEngine:
    def forecast(self, mission:dict[str,Any], program:dict[str,Any], athlete_state:dict[str,Any]|None=None)->dict[str,Any]:
        s=athlete_state or {}; compliance=float(s.get('compliance_rate',s.get('compliance',{}).get('rate',.85))); compliance=compliance/100 if compliance>1 else compliance
        readiness=float(s.get('readiness',{}).get('current',75))/100; weeks=program['total_weeks']; preds=[]
        for a in mission.get('required_adaptations',[]):
            rate=RATES.get(a,.004); delta=(1+rate*compliance*(.65+.35*readiness))**weeks-1
            preds.append({'adaptation':a,'expected_relative_change':round(delta,3),'range':[round(delta*.55,3),round(delta*1.35,3)],'confidence':round(min(.9,.45+.03*weeks+.2*compliance),2)})
        fatigue=[]
        for b in program['blocks']:
            fatigue.append({'block_id':b['block_id'],'expected_peak':75 if b['target_fatigue']=='high' else 58 if b['target_fatigue']=='moderate' else 38})
        return {'performance_forecast_version':VERSION,'predictions':preds,'fatigue_forecast':fatigue,'assumptions':{'compliance':round(compliance,2),'readiness':round(readiness,2),'model':'deterministic bounded heuristic'},'warning':'Forecasts are planning estimates, not guarantees.'}
