from __future__ import annotations
from copy import deepcopy
from hashlib import sha256
from typing import Any

def _num(v, default=None):
    try: return float(v)
    except (TypeError, ValueError): return default

def _clamp(v,a,b): return max(a,min(b,v))
def _text(v): return str(v or '').strip()

def normalize_completion(raw: dict[str,Any] | None) -> dict[str,Any]:
    out=deepcopy(raw or {}); flags=[]
    out['session_id']=_text(out.get('session_id') or out.get('sessionId') or out.get('id')) or 'unknown-'+sha256(repr(out).encode()).hexdigest()[:8]
    out['session_type']='engine' if _text(out.get('session_type') or out.get('sessionType')).lower() in {'engine','running','cycling','endurance'} else 'strength'
    for source,target,lo,hi,flag in [('session_rpe','session_rpe',1,10,'RPE_CLAMPED'),('readiness','readiness',1,5,'READINESS_CLAMPED'),('pain_severity','pain_severity',0,10,'PAIN_CLAMPED'),('completed_duration_minutes','completed_duration_minutes',0,480,'DURATION_CLAMPED'),('distance','distance',0,500,'DISTANCE_CLAMPED'),('average_heart_rate','average_heart_rate',35,230,'HEART_RATE_CLAMPED')]:
        value=_num(out.get(source))
        if value is not None:
            clean=_clamp(value,lo,hi); out[target]=clean
            if clean != value: flags.append(flag)
    exercises=[]
    for i,e in enumerate((out.get('exercises') or [])[:100]):
        if not isinstance(e,dict): continue
        item=deepcopy(e); item['exercise_name']=_text(item.get('exercise_name') or item.get('name')) or f'Exercise {i+1}'
        item['completed_sets']=_clamp(_num(item.get('completed_sets'),0),0,20); item['planned_sets']=_clamp(_num(item.get('planned_sets'),0),0,20)
        if _num(item.get('average_rpe')) is not None: item['average_rpe']=_clamp(_num(item.get('average_rpe')),1,10)
        item['pain_severity']=_clamp(_num(item.get('pain_severity'),0),0,10); exercises.append(item)
    out['exercises']=exercises
    supplied=sum(v is not None for v in [out.get('session_rpe'),out.get('readiness'),out.get('completed_duration_minutes'),out.get('pain_severity'),1 if exercises else None])
    out['data_quality']=round(supplied/5,2); out['chaos_flags']=flags
    return out

def completion_fingerprint(raw: dict[str,Any]) -> str:
    n=normalize_completion(raw)
    identity=raw.get('completion_identity') or raw.get('completionIdentity') or {}
    athlete=_text(identity.get('athleteId') or identity.get('athlete_id') or raw.get('athlete_id') or raw.get('athleteId') or 'athlete')
    plan=_text(identity.get('planId') or identity.get('plan_id') or raw.get('plan_id') or raw.get('planId'))
    week=_text(identity.get('weekIndex') if identity.get('weekIndex') is not None else identity.get('week_index') if identity.get('week_index') is not None else raw.get('week_index') if raw.get('week_index') is not None else raw.get('weekIndex'))
    date=_text(identity.get('scheduledDate') or identity.get('scheduled_date') or raw.get('scheduled_date') or raw.get('scheduledDate') or raw.get('dailySessionDate'))
    session=_text(identity.get('sessionKey') or identity.get('session_key') or raw.get('planSessionKey') or raw.get('session_key') or raw.get('sessionKey') or n['session_id'])
    attempt=_text(identity.get('attempt') if identity.get('attempt') is not None else raw.get('completion_attempt') if raw.get('completion_attempt') is not None else raw.get('completionAttempt') if raw.get('completionAttempt') is not None else 1)
    token='~'.join([athlete,plan,week,date,session,attempt]) if (plan or date or session) else '~'.join([n['session_id'],_text(raw.get('completed_at') or raw.get('completedAt'))[:16],attempt])
    return 'completion-'+sha256(token.encode()).hexdigest()[:16]

def confidence_gate(raw: dict[str,Any], history: list[dict[str,Any]] | None=None) -> dict[str,Any]:
    history=history or []; n=normalize_completion(raw); contradictions=[]
    if _num(n.get('session_rpe'),99)<=3 and _num(n.get('readiness'),99)<=2: contradictions.append('LOW_RPE_LOW_READINESS')
    if _num(n.get('pain_severity'),0)>=5 and 'great' in _text(raw.get('session_feedback')).lower(): contradictions.append('PAIN_FEEDBACK_CONFLICT')
    if _num(n.get('completed_duration_minutes'),-1)==0 and _text(raw.get('status')).lower()=='completed': contradictions.append('ZERO_DURATION_COMPLETED')
    fingerprint=raw.get('completion_id') or completion_fingerprint(raw)
    duplicate=any((item.get('completion_id') or completion_fingerprint(item))==fingerprint for item in history)
    confidence=n['data_quality']-(.25 if contradictions else 0); confidence=0 if duplicate else _clamp(confidence,0,1)
    return {'normalized':n,'confidence':round(confidence,2),'duplicate':duplicate,'contradictions':contradictions,'allow_adaptation':not duplicate and confidence>=.4,'allow_upward':not duplicate and confidence>=.7 and not contradictions,'reason':'DUPLICATE_COMPLETION' if duplicate else 'INSUFFICIENT_EVIDENCE' if confidence<.4 else 'CONTRADICTORY_INPUT' if contradictions else 'SUFFICIENT_EVIDENCE'}
