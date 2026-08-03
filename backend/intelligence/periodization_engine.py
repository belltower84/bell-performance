from __future__ import annotations
from typing import Any
VERSION='0.1.0'
class BellPeriodizationEngine:
    def select(self, mission:dict[str,Any], athlete_state:dict[str,Any]|None=None)->dict[str,Any]:
        s=athlete_state or {}; age=str(s.get('training_age','intermediate')).lower(); ads=set(mission.get('required_adaptations',[])); weeks=int(mission.get('timeline_weeks',12)); event=bool(mission.get('deadline'))
        if {'aerobic_base','lactate_threshold'} & ads and 'strength' in ads: model='hybrid_concurrent_block'
        elif {'aerobic_base','lactate_threshold'} & ads: model='polarized_block'
        elif len(ads)>2: model='block_with_weekly_undulation'
        elif age in ('novice','beginner'): model='linear'
        elif event and weeks<=10: model='block'
        else: model='daily_undulating'
        rationale=[]
        if 'hybrid' in model: rationale.append('Concurrent goals require separated high-cost stimuli and rotating emphasis.')
        if 'polarized' in model: rationale.append('Endurance development benefits from mostly low intensity with limited high-intensity work.')
        if model=='linear': rationale.append('Lower training age supports simple progressive overload.')
        if event: rationale.append('A fixed deadline requires a realization and taper sequence.')
        return {'periodization_engine_version':VERSION,'model':model,'rationale':rationale,'weekly_variation':'undulating' if 'undulat' in model or 'hybrid' in model else 'progressive','block_sequence':self._sequence(weeks,event,ads)}
    def _sequence(self,w,event,ads):
        if event:
            if w<=6: return ['specific_preparation','realization','taper']
            return ['foundation','accumulation','intensification','specificity','taper']
        return ['foundation','accumulation','intensification','deload'] if w>=8 else ['accumulation','deload']
