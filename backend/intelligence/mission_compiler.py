from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Any
import re
VERSION='0.1.0'
ADAPTATIONS={'strength':['strength','squat','bench','deadlift','powerlifting'],'hypertrophy':['muscle','size','bodybuilding','hypertrophy'],'aerobic_base':['10k','5k','marathon','run','endurance'],'lactate_threshold':['10k','5k','threshold','race pace'],'body_composition':['fat','weight loss','body fat','recomp'],'power':['power','sprint','jump','hockey','lacrosse'],'work_capacity':['tactical','conditioning','work capacity']}
class BellMissionCompiler:
    def compile(self, request:dict[str,Any])->dict[str,Any]:
        text=(request.get('goal') or request.get('mission_text') or '').lower()
        explicit=request.get('objectives',[])
        objectives=[]
        for name,keys in ADAPTATIONS.items():
            if any(k in text for k in keys): objectives.append({'id':name,'priority':0.7,'direction':'improve'})
        for x in explicit:
            objectives.append({'id':x.get('id',x) if isinstance(x,dict) else x,'priority':float(x.get('priority',0.7)) if isinstance(x,dict) else 0.7,'direction':x.get('direction','improve') if isinstance(x,dict) else 'improve'})
        seen={}; [seen.setdefault(x['id'],x) for x in objectives]; objectives=list(seen.values())
        if not objectives: objectives=[{'id':'general_fitness','priority':0.7,'direction':'improve'}]
        # infer preservation constraints
        preserve=[]
        for metric in ('squat','bench','deadlift','body_weight','body_fat'):
            if re.search(rf'(keep|maintain|without losing).{{0,25}}{metric.replace("_"," ")}',text): preserve.append(metric)
        deadline=request.get('competition_date') or request.get('deadline')
        weeks=int(request.get('timeline_weeks',12))
        constraints=request.get('constraints',{})
        conflicts=[]
        ids={o['id'] for o in objectives}
        if 'body_composition' in ids and 'hypertrophy' in ids: conflicts.append({'between':['body_composition','hypertrophy'],'type':'energy_availability','resolution':'phase calorie deficit conservatively and preserve resistance volume'})
        if 'aerobic_base' in ids and 'strength' in ids: conflicts.append({'between':['aerobic_base','strength'],'type':'concurrent_interference','resolution':'separate high-cost lower and running sessions and prioritize mission order'})
        priority=request.get('priority_order') or [o['id'] for o in objectives]
        metrics=[]
        for o in objectives:
            m={'strength':['estimated_1rm','rep_pr'],'hypertrophy':['circumference','training_volume'],'aerobic_base':['time_trial','weekly_duration'],'lactate_threshold':['threshold_pace'],'body_composition':['body_weight_trend','body_fat_estimate'],'power':['jump_or_sprint_test'],'work_capacity':['mixed_modal_test']}.get(o['id'],['adherence','readiness'])
            metrics += [{'objective':o['id'],'metric':x} for x in m]
        return {'mission_compiler_version':VERSION,'mission_text':request.get('goal') or request.get('mission_text'),'timeline_weeks':weeks,'deadline':deadline,'priority_stack':priority,'objectives':objectives,'required_adaptations':[o['id'] for o in objectives],'preservation_constraints':preserve,'tradeoffs':conflicts,'success_metrics':metrics,'constraints':constraints,'risk_profile':self._risk(request,conflicts),'status':'compiled'}
    def _risk(self,r,c):
        n=len(c)+int(r.get('timeline_weeks',12)<6)+int(r.get('constraints',{}).get('training_days',5)<3)
        return {'level':'high' if n>=3 else 'moderate' if n else 'low','risk_count':n}
