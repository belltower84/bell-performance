"use strict";
/* Bell Performance 13.16.6 — structured evidence confidence, completion identity, and chaos guards. */
(function(global){
  const num=(v,d=null)=>Number.isFinite(Number(v))?Number(v):d;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const text=v=>String(v??"").trim();
  const hash=value=>{let h=2166136261,s=String(value);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,"0");};
  function normalize(raw={}){
    const out=JSON.parse(JSON.stringify(raw||{})), flags=[];
    const sessionId=text(out.session_id||out.sessionId||out.id)||`unknown-${hash(JSON.stringify(out).slice(0,500))}`;
    out.session_id=sessionId; out.session_type=["engine","running","cycling","endurance"].includes(text(out.session_type||out.sessionType).toLowerCase())?"engine":"strength";
    const rpe=num(out.session_rpe??out.rpe); if(rpe!==null){out.session_rpe=clamp(rpe,1,10);if(rpe!==out.session_rpe)flags.push("RPE_CLAMPED");}
    const readiness=num(out.readiness?.score??out.readiness_score??out.readiness); if(readiness!==null){out.readiness=clamp(readiness,1,100);if(readiness!==out.readiness)flags.push("READINESS_CLAMPED");}
    const painValues=Object.values(out.pain||{}).map(v=>num(v)).filter(v=>v!==null);
    const pain=num(out.pain_severity??out.pain?.general??(painValues.length?Math.max(...painValues):null)); if(pain!==null){out.pain_severity=clamp(pain,0,10);if(pain!==out.pain_severity)flags.push("PAIN_CLAMPED");}
    const duration=num(out.completed_duration_minutes??out.duration_minutes??out.actual?.duration_minutes); if(duration!==null){out.completed_duration_minutes=clamp(duration,0,480);if(duration!==out.completed_duration_minutes)flags.push("DURATION_CLAMPED");}
    const distance=num(out.distance); if(distance!==null){out.distance=clamp(distance,0,500);if(distance!==out.distance)flags.push("DISTANCE_CLAMPED");}
    const hr=num(out.average_heart_rate??out.heart_rate); if(hr!==null){out.average_heart_rate=clamp(hr,35,230);if(hr!==out.average_heart_rate)flags.push("HEART_RATE_CLAMPED");}
    const exerciseSource=Array.isArray(out.exercise_results)?out.exercise_results:Array.isArray(out.actual?.exercise_results)?out.actual.exercise_results:out.exercises;
    out.exercises=Array.isArray(exerciseSource)?exerciseSource.filter(Boolean).slice(0,100).map((e,i)=>({
      ...e, exercise_name:text(e.exercise_name||e.name)||`Exercise ${i+1}`,
      completed_sets:clamp(num(e.completed_sets,0),0,40), planned_sets:clamp(num(e.planned_sets,0),0,40),
      average_rpe:num(e.average_rpe)!==null?clamp(num(e.average_rpe),1,10):null,
      pain_severity:num(e.pain_severity??e.pain)!==null?clamp(num(e.pain_severity??e.pain),0,10):0
    })):[];
    const hasStrengthEvidence=out.session_type==="strength"&&out.exercises.length>0;
    const hasEngineEvidence=out.session_type==="engine"&&out.completed_duration_minutes!==null;
    const supplied=[out.session_rpe,out.readiness,out.pain_severity,(hasStrengthEvidence||hasEngineEvidence)?1:null,out.performance_ratio??out.actual?.performance_ratio].filter(v=>v!==null&&v!==undefined).length;
    out.data_quality=+(supplied/5).toFixed(2);out.chaos_flags=flags;out.normalized_at=new Date().toISOString();return out;
  }
  function fingerprint(raw={}){
    const n=normalize(raw), identity=raw.completion_identity||raw.completionIdentity||{};
    const athlete=text(identity.athleteId||identity.athlete_id||raw.athlete_id||raw.athleteId||"athlete");
    const plan=text(identity.planId||identity.plan_id||raw.plan_id||raw.planId);
    const week=text(identity.weekIndex??identity.week_index??raw.week_index??raw.weekIndex);
    const date=text(identity.scheduledDate||identity.scheduled_date||raw.scheduled_date||raw.scheduledDate||raw.dailySessionDate);
    const session=text(identity.sessionKey||identity.session_key||raw.planSessionKey||raw.session_key||raw.sessionKey||n.session_id);
    const attempt=text(identity.attempt??raw.completion_attempt??raw.completionAttempt??1);
    const canonical=[athlete,plan,week,date,session,attempt].join("~");
    // Fall back to the normalized session id only for legacy records lacking all
    // scheduled identity. Workout contents are deliberately not primary identity.
    return `completion-${hash((plan||date||session)?canonical:[n.session_id,text(raw.completed_at||raw.completedAt).slice(0,16),attempt].join("~"))}`;
  }
  function dedupe(items=[]){const seen=new Set(),accepted=[],duplicates=[];for(const item of items){const id=text(item.completion_id||item.completionId)||fingerprint(item);if(seen.has(id)){duplicates.push({...item,completion_id:id});continue;}seen.add(id);accepted.push({...item,completion_id:id});}return{accepted,duplicates};}
  function confidenceGate(input={},history=[]){const n=normalize(input), contradictions=[];
    if(n.session_rpe<=3&&n.readiness<=2)contradictions.push("LOW_RPE_LOW_READINESS");
    if(n.pain_severity>=5&&text(input.session_feedback).toLowerCase().includes("great"))contradictions.push("PAIN_FEEDBACK_CONFLICT");
    if(n.completed_duration_minutes===0&&text(input.status).toLowerCase()==="completed")contradictions.push("ZERO_DURATION_COMPLETED");
    const duplicate=history.some(h=>(h.completion_id||fingerprint(h))===(input.completion_id||fingerprint(input)));
    let confidence=n.data_quality;if(contradictions.length)confidence-=.25;if(duplicate)confidence=0;confidence=clamp(confidence,0,1);
    return{normalized:n,confidence:+confidence.toFixed(2),duplicate,contradictions,allow_adaptation:!duplicate&&confidence>=.4,allow_upward:!duplicate&&confidence>=.7&&!contradictions.length,reason:duplicate?"DUPLICATE_COMPLETION":confidence<.4?"INSUFFICIENT_EVIDENCE":contradictions.length?"CONTRADICTORY_INPUT":"SUFFICIENT_EVIDENCE"};
  }
  global.bellNormalizeRealWorldCompletion=normalize;global.bellCompletionFingerprint=fingerprint;global.bellDedupeCompletions=dedupe;global.bellRealWorldConfidenceGate=confidenceGate;global.BELL_REAL_WORLD_CHAOS_GUARDS=true;
})(typeof window!=="undefined"?window:globalThis);
