from __future__ import annotations
from typing import Any
from statistics import mean
VERSION='0.1.0'
class BellPatternRecognitionEngine:
    def analyze(self,events:list[dict[str,Any]])->dict[str,Any]:
        patterns=[]
        sleep_perf=[]; high_pain=0; missed=0
        for e in events:
            d=e.get('data',e); typ=e.get('type','')
            if 'sleep_hours' in d and 'performance_score' in d: sleep_perf.append((float(d['sleep_hours']),float(d['performance_score'])))
            if max([float(x) for x in (d.get('pain',{}) or {}).values()] or [0])>=6: high_pain+=1
            if typ in ('workout_missed','session_missed'): missed+=1
        if len(sleep_perf)>=4:
            low=[p for s,p in sleep_perf if s<6]; normal=[p for s,p in sleep_perf if s>=6]
            if low and normal and mean(low)<mean(normal)-5: patterns.append({'id':'sleep_performance_association','strength':round(min(1,(mean(normal)-mean(low))/20),2),'finding':'Performance is lower after short sleep.','action':'protect high-priority sessions after adequate sleep when possible'})
        if high_pain>=3: patterns.append({'id':'recurring_pain','strength':min(1,high_pain/6),'finding':'Repeated elevated pain reports detected.','action':'reduce conflicting loading and seek appropriate assessment if persistent'})
        if missed>=3: patterns.append({'id':'compliance_pattern','strength':min(1,missed/6),'finding':'Repeated missed sessions detected.','action':'reduce schedule complexity or session count'})
        return {'pattern_recognition_version':VERSION,'event_count':len(events),'patterns':patterns,'confidence':round(min(.95,.35+len(events)*.025),2)}
