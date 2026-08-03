from __future__ import annotations
from typing import Any
VERSION='0.1.0'
class BellNutritionPeriodizationEngine:
    def build(self, mission:dict[str,Any], program:dict[str,Any], athlete:dict[str,Any])->dict[str,Any]:
        kg=float(athlete.get('body_weight_kg',athlete.get('body_weight_lb',180)*0.453592)); goal=set(mission.get('required_adaptations',[])); base=float(athlete.get('maintenance_calories',kg*31))
        plans=[]
        for b in program['blocks']:
            phase=b['phase']; modifier=0
            if 'body_composition' in goal: modifier=-0.12
            elif 'hypertrophy' in goal: modifier=.06
            if phase in ('taper','deload'): modifier=min(modifier,0)
            calories=round(base*(1+modifier)/25)*25
            protein=round(kg*(2.2 if 'body_composition' in goal else 1.8))
            carbs=round(kg*(5 if phase in ('accumulation','specificity') else 3.5))
            fat=max(round(kg*.7),45)
            plans.append({'block_id':b['block_id'],'phase':phase,'daily_calories':calories,'protein_g':protein,'carbohydrate_g':carbs,'fat_g':fat,'timing':'place 25-35% of daily carbohydrate around the highest-priority session','hydration_ml':round(kg*35),'adjustment_rule':'change calories by 5% only after a 14-day trend confirms mismatch'})
        return {'nutrition_periodization_version':VERSION,'blocks':plans,'guardrails':['Do not use aggressive deficits during peaking or unresolved illness.','Medical nutrition needs require qualified clinical oversight.']}
