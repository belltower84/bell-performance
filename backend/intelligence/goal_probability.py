from __future__ import annotations
from typing import Any
VERSION='0.1.0'
class BellGoalProbabilityEngine:
    def estimate(self,mission:dict[str,Any],forecast:dict[str,Any],athlete_state:dict[str,Any],patterns:dict[str,Any]|None=None)->dict[str,Any]:
        compliance=float(athlete_state.get('compliance_rate',athlete_state.get('compliance',{}).get('rate',.85))); compliance=compliance/100 if compliance>1 else compliance
        readiness=float(athlete_state.get('readiness',{}).get('current',75))/100
        momentum=float(athlete_state.get('momentum_score',athlete_state.get('momentum',{}).get('score',70)))/100
        pred=forecast.get('predictions',[]); forecast_support=sum(min(1,max(0,x['expected_relative_change']/.05)) for x in pred)/max(1,len(pred))
        risk=mission.get('risk_profile',{}).get('risk_count',0); pattern_penalty=.05*len((patterns or {}).get('patterns',[]))
        p=.18+.30*compliance+.18*readiness+.18*momentum+.20*forecast_support-.06*risk-pattern_penalty
        p=max(.05,min(.95,p)); conf=min(.92,.5+.03*mission.get('timeline_weeks',12)+.15*compliance)
        return {'goal_probability_version':VERSION,'probability':round(p,2),'confidence':round(conf,2),'contributors':{'compliance':round(.30*compliance,2),'readiness':round(.18*readiness,2),'momentum':round(.18*momentum,2),'forecast_support':round(.20*forecast_support,2),'risk_penalty':round(.06*risk+pattern_penalty,2)},'primary_limiters':[k for k,v in [('compliance',compliance),('readiness',readiness),('momentum',momentum)] if v<.7]}
