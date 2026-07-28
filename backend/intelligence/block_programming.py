from __future__ import annotations
from typing import Any
VERSION='0.1.0'
PHASE={'foundation':(.85,.80),'accumulation':(1.0,.88),'intensification':(.82,1.0),'specificity':(.75,1.02),'realization':(.58,1.05),'taper':(.40,.90),'deload':(.55,.82),'specific_preparation':(.80,.96)}
class BellBlockProgrammingEngine:
    def build(self, mission:dict[str,Any], periodization:dict[str,Any], athlete_state:dict[str,Any]|None=None)->dict[str,Any]:
        weeks=int(mission.get('timeline_weeks',12)); seq=periodization['block_sequence']; lengths=self._allocate(weeks,len(seq))
        blocks=[]; cursor=1
        for i,(phase,length) in enumerate(zip(seq,lengths),1):
            vol,inten=PHASE.get(phase,(1,1)); objectives=self._objectives(phase,mission.get('required_adaptations',[]))
            week_plan=[]
            for j in range(length):
                deload=(phase=='deload' or (j==length-1 and length>=4 and phase not in ('taper','realization')))
                week_plan.append({'week':cursor+j,'purpose':'recovery' if deload else phase,'volume_multiplier':round(vol*(0.60 if deload else 0.92+0.04*j),2),'intensity_multiplier':round(inten*(0.9 if deload else 1.0),2),'objectives':objectives,'testing':phase in ('realization','specificity') and j==length-1})
            blocks.append({'block_id':f'B{i:02d}','phase':phase,'start_week':cursor,'duration_weeks':length,'objectives':objectives,'target_fatigue':'low' if phase in ('taper','deload') else 'high' if phase=='accumulation' else 'moderate','success_metrics':[m for m in mission.get('success_metrics',[]) if m['objective'] in objectives],'weeks':week_plan})
            cursor+=length
        return {'block_programming_version':VERSION,'periodization_model':periodization['model'],'total_weeks':weeks,'blocks':blocks,'transition_rules':['advance when compliance >= 80% and no unresolved red flags','repeat or reduce load when block success metrics fail','insert recovery when fatigue trend exceeds tolerance']}
    def _allocate(self,w,n):
        base=[w//n]*n
        for i in range(w%n): base[i]+=1
        return base
    def _objectives(self,phase,ads):
        if phase in ('taper','realization'): return ['performance_expression'] + ads[:2]
        if phase=='foundation': return list(dict.fromkeys(['work_capacity','movement_quality']+ads))
        return ads
