from __future__ import annotations
from typing import Any
import copy
VERSION='0.1.0'
class BellDigitalTwinSimulationEngine:
    def simulate(self,state:dict[str,Any],candidates:list[dict[str,Any]],mission:dict[str,Any])->dict[str,Any]:
        out=[]
        fatigue0=max([float(v) for v in state.get('fatigue_banks',{}).values()] or [35])
        for i,c in enumerate(candidates,1):
            volume=float(c.get('volume_factor',1)); intensity=float(c.get('intensity_factor',1)); recovery=float(c.get('recovery_factor',1))
            adaptation=100*(.45*volume+.35*intensity+.20*recovery)-abs(volume-intensity)*12
            fatigue=min(100,fatigue0+25*volume+18*intensity-22*recovery)
            risk=max(2,.20*fatigue+8*max(0,volume-1.05)+8*max(0,intensity-1.03))
            mission_fit=float(c.get('mission_fit',.8))*100
            score=.42*mission_fit+.34*adaptation+.24*(100-risk)-.12*fatigue
            out.append({'candidate_id':c.get('id',f'C{i}'),'expected_adaptation':round(adaptation,1),'peak_fatigue':round(fatigue,1),'risk_index':round(risk,1),'mission_fit':round(mission_fit,1),'utility_score':round(score,1),'assumptions':copy.deepcopy(c)})
        out.sort(key=lambda x:x['utility_score'],reverse=True)
        return {'digital_twin_simulation_version':VERSION,'selected':out[0] if out else None,'candidates':out,'simulation_type':'deterministic scenario comparison','warning':'Risk index is a planning heuristic and not an injury prediction.'}
