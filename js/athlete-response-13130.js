"use strict";

/* Bell Performance 13.16.6 — positive decision promotion, comparable evidence, completion identity, and closed-loop scheduling. */
(function(){
  const VERSION=1;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const num=(value,fallback=null)=>{const n=Number(value);return Number.isFinite(n)?n:fallback;};
  const avg=values=>{const valid=values.map(Number).filter(Number.isFinite);return valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null;};
  const key=value=>String(value||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const isEngine=session=>Boolean(session?.cardioType||session?.engineMetrics)||String(session?.name||"").startsWith("R-");
  const parseTarget=value=>{const values=String(value||"").match(/\d+(?:\.\d+)?/g)?.map(Number)||[];return values.length?{min:Math.min(...values),max:Math.max(...values),target:Math.max(...values)}:{min:0,max:0,target:0};};
  const actualReps=value=>num(String(value??"").match(/\d+(?:\.\d+)?/)?.[0],0)||0;
  const RED_FLAGS=new Set(["chest_pain","fainting","syncope","new_neurologic_symptom","severe_shortness_of_breath","acute_trauma","loss_of_function"]);

  function state(){
    data.responseEngine=data.responseEngine&&typeof data.responseEngine==="object"?data.responseEngine:{};
    data.responseEngine={schemaVersion:VERSION,decisions:[],exerciseDecisions:{},lastEvaluation:null,trend:{},...(data.responseEngine||{})};
    data.responseEngine.decisions=Array.isArray(data.responseEngine.decisions)?data.responseEngine.decisions:[];
    data.responseEngine.exerciseDecisions=data.responseEngine.exerciseDecisions&&typeof data.responseEngine.exerciseDecisions==="object"?data.responseEngine.exerciseDecisions:{};
    return data.responseEngine;
  }

  function setResult(exercise,set){
    const plannedReps=set.plannedReps??exercise.plannedReps??exercise.prescription;
    const target=parseTarget(plannedReps);
    const completed=Boolean(set.done);
    const unchanged=String(set.reps??"").trim()===String(plannedReps??"").trim();
    const reps=completed&&unchanged&&target.target>0?target.target:actualReps(set.reps);
    const plannedWeight=num(set.plannedWeight,num(exercise.recommendedWeight,0))||0;
    const weight=num(set.weight,0)||0;
    return {
      set:Number(set.set)||0,
      completed,
      planned_weight:plannedWeight,
      actual_weight:weight,
      load_ratio:plannedWeight>0?clamp(weight/plannedWeight,0,2):(completed?1:0),
      planned_reps:String(set.plannedReps??exercise.plannedReps??exercise.prescription??""),
      actual_reps:reps,
      rpe:num(set.rpe),
      rir:num(set.rir),
      rep_ratio:target.target>0?clamp(reps/target.target,0,2):(completed?1:0)
    };
  }

  function exerciseResult(exercise){
    const sets=(exercise.sets||[]).map(set=>setResult(exercise,set));
    const completed=sets.filter(set=>set.completed);
    const plannedCount=Math.max(1,sets.length);
    return {
      exercise_key:key(exercise.name),
      name:exercise.name,
      block:exercise.block||"",
      planned_sets:sets.length,
      completed_sets:completed.length,
      completion_ratio:clamp(completed.length/plannedCount,0,1),
      rep_ratio:avg(completed.map(set=>set.rep_ratio))??0,
      average_rpe:avg(completed.map(set=>set.rpe)),
      average_rir:avg(completed.map(set=>set.rir)),
      load_ratio:avg(completed.map(set=>set.load_ratio))??0,
      feedback:exercise.feedback||"",
      pain:exercise.feedback==="pain"?Math.max(4,num(exercise.painSeverity,4)||4):num(exercise.painSeverity,0)||0,
      technique_issue:Boolean(exercise.feedback==="pain"||exercise.techniqueIssue),
      sets
    };
  }

  function bellBuildStructuredCompletion(session){
    const engine=isEngine(session);
    const actualDuration=Math.max(1,Math.round((num(session.officialElapsed,num(session.elapsed,0))||0)/60));
    const plannedDuration=Math.max(1,num(session.prescribedDuration,num(session.duration,actualDuration))||actualDuration);
    const exercises=(session.exercises||[]).map(exerciseResult);
    const allSets=exercises.flatMap(item=>item.sets);
    const completedSets=allSets.filter(item=>item.completed);
    const setCompletion=allSets.length?completedSets.length/allSets.length:1;
    const repRatio=completedSets.length?(avg(completedSets.map(item=>item.rep_ratio))??1):setCompletion;
    const sessionRpe=clamp(num(session.sessionRpe,num(session.rpe,7)),0,10);
    const painSeverity=clamp(num(session.painSeverity,0),0,10);
    const loadRatio=completedSets.length?(avg(completedSets.map(item=>item.load_ratio))??1):setCompletion;
    // Strength response must distinguish merely completing the prescription from
    // completing more load with clear reserve. Earlier versions ignored actual
    // versus planned load, making a legitimate rapid strength response nearly
    // impossible to classify.
    const strengthExecution=setCompletion*.50+repRatio*.25+loadRatio*.25;
    const performanceRatio=clamp(
      engine
        ? ((actualDuration/plannedDuration)*(.96+Math.max(-.12,Math.min(.12,(7-sessionRpe)*.025))))
        : strengthExecution*(1+Math.max(-.12,Math.min(.12,(7.5-sessionRpe)*.04))),
      0,2
    );
    const readiness={
      score:num(session.readiness?.score,num(data.settings?.readiness?.score)),
      status:session.readiness?.status||data.settings?.readiness?.status||"",
      sleep_hours:(num(data.settings?.readiness?.sleepHours,0)||0)+(num(data.settings?.readiness?.sleepMinutes,0)||0)/60,
      energy:num(data.settings?.readiness?.energy),
      recovery:num(data.settings?.readiness?.recoveryStatus)
    };
    const structured={
      schema_version:VERSION,
      // Completion identity is tied to the scheduled plan occurrence, not the reusable
      // workout template. The same workout in a later week is new evidence; a second
      // submission for this exact scheduled occurrence is a duplicate.
      completion_identity:{
        athleteId:String(data.settings?.athleteId||data.settings?.profileId||data.settings?.name||"athlete"),
        planId:String(session.planId||""),
        weekIndex:num(session.weekIndex,num(session.planWeekIndex)),
        scheduledDate:String(session.scheduledDate||session.dailySessionDate||""),
        sessionKey:String(session.planSessionKey||session.sessionKey||session.cloudSessionId||session.id||""),
        attempt:num(session.completionAttempt,1)||1
      },
      session_id:[String(session.planId||""),String(session.planSessionKey||session.sessionKey||session.cloudSessionId||session.id||""),String(session.scheduledDate||session.dailySessionDate||""),String(num(session.completionAttempt,1)||1)].join("|"),
      session_type:engine?"engine":"strength",
      planned:{
        duration_minutes:plannedDuration,
        session_rpe_target:7.5,
        mission:session.name,
        exercises:exercises.map(item=>({exercise_key:item.exercise_key,name:item.name,planned_sets:item.planned_sets,sets:item.sets.map(set=>({set:set.set,weight:set.planned_weight,reps:set.planned_reps}))}))
      },
      actual:{
        duration_minutes:actualDuration,
        session_rpe:sessionRpe,
        performance_ratio:Number(performanceRatio.toFixed(3)),
        pain:{[String(session.painArea||"general")]:painSeverity},
        technique_issues:session.techniqueIssue?[String(session.techniqueIssueNote||session.painArea||"session technique concern")]:[],
        exercise_results:exercises,
        engine_results:engine?{
          modality:session.cardioType||"Running",
          time_seconds:num(session.officialElapsed,num(session.elapsed,0))||0,
          distance:num(session.engineMetrics?.distance),
          distance_unit:session.engineMetrics?.distanceUnit||"",
          pace:session.engineMetrics?.pace||"",
          average_heart_rate:num(session.engineMetrics?.avgHeartRate),
          elevation_gain:num(session.engineMetrics?.elevationGain)
        }:{}
      },
      readiness,
      feedback:{
        difficulty:session.difficulty||"right",
        notes:session.notes||"",
        pain_severity:painSeverity,
        pain_area:session.painArea||"",
        technique_issue:Boolean(session.techniqueIssue)
      },
      duration_minutes:actualDuration,
      session_rpe:sessionRpe,
      performance_ratio:Number(performanceRatio.toFixed(3)),
      strength_evidence:engine?null:{set_completion:Number(setCompletion.toFixed(3)),rep_ratio:Number(repRatio.toFixed(3)),load_ratio:Number(loadRatio.toFixed(3)),execution_score:Number(strengthExecution.toFixed(3))},
      difficulty:session.difficulty||"right",
      pain:{[String(session.painArea||"general")]:painSeverity},
      technique_issues:session.techniqueIssue?[String(session.techniqueIssueNote||session.painArea||"session technique concern")]:[],
      symptoms:Array.isArray(session.symptoms)?session.symptoms:[],
      exercise_results:exercises,
      engine_results:engine?{
        modality:session.cardioType||"Running",
        time_seconds:num(session.officialElapsed,num(session.elapsed,0))||0,
        distance:num(session.engineMetrics?.distance),
        distance_unit:session.engineMetrics?.distanceUnit||"",
        pace:session.engineMetrics?.pace||"",
        average_heart_rate:num(session.engineMetrics?.avgHeartRate),
        elevation_gain:num(session.engineMetrics?.elevationGain)
      }:{},
      notes:session.notes||""
    };
    return structured;
  }

  function normalized(item){
    const source=item?.structuredCompletion||item||{};
    const actual=source.actual||{};
    const feedback=source.feedback||{};
    const readiness=source.readiness||{};
    return {
      session_type:source.session_type||(isEngine(item)?"engine":"strength"),
      performance_ratio:clamp(num(source.performance_ratio,num(actual.performance_ratio,1)),0,2),
      duration_ratio:clamp((num(source.duration_minutes,num(actual.duration_minutes,1))||1)/(num(source.planned?.duration_minutes,num(item?.prescribedDuration,num(item?.duration,1)))||1),0,2),
      session_rpe:clamp(num(source.session_rpe,num(actual.session_rpe,num(item?.rpe,7))),0,10),
      pain_severity:clamp(Math.max(...Object.values(source.pain||actual.pain||{general:feedback.pain_severity||item?.painSeverity||0}).map(value=>num(value,0)||0)),0,10),
      technique_issues:source.technique_issues||actual.technique_issues||(item?.techniqueIssue?["technique"]:[]),
      readiness_score:num(readiness.score,num(item?.readiness?.score)),
      difficulty:String(source.difficulty||feedback.difficulty||item?.difficulty||"").toLowerCase(),
      symptoms:(source.symptoms||feedback.symptoms||item?.symptoms||[]).map(value=>key(value).replace(/-/g,"_")),
      exercise_results:source.exercise_results||actual.exercise_results||[]
    };
  }
  const success=item=>item.performance_ratio>=.95&&item.duration_ratio>=.9&&item.session_rpe<=8.5&&item.pain_severity<4&&!item.technique_issues.length;
  const rapid=item=>item.performance_ratio>=1.05&&item.duration_ratio>=.95&&item.session_rpe<=7&&item.pain_severity<3&&!item.technique_issues.length;
  const struggle=item=>item.performance_ratio<.85||item.duration_ratio<.75||item.session_rpe>=9.5||item.pain_severity>=4;
  function trailing(window,test){let count=0;for(let i=window.length-1;i>=0;i--){if(!test(window[i]))break;count++;}return count;}

  function bellEvaluateAthleteResponse(completion,recent=[],context={}){
    const current=normalized(completion),same=recent.map(normalized).filter(item=>item.session_type===current.session_type).slice(-5),window=[...same,current].slice(-5);
    const successes=trailing(window,success),rapidStreak=trailing(window,rapid),struggles=trailing(window,struggle);
    const readinessLow=current.readiness_score!==null&&current.readiness_score<55;
    const redFlags=(current.symptoms||[]).filter(value=>RED_FLAGS.has(value));
    const compliance=num(context.compliance);
    const sessionCompletion=num(context.session_completion);
    const missed=num(context.missed_sessions,0)||0;
    const interrupted=num(context.interruption_days,0)||0;
    // Session evidence takes precedence over broader adherence. A fully completed
    // current session cannot be labeled LOW_SESSION_COMPLETION because future or
    // unrelated sessions are unfinished. Legacy callers without session evidence
    // retain the prior compliance behavior for compatibility.
    const lowSessionCompletion=sessionCompletion!==null&&sessionCompletion<.55;
    const legacyLowCompletion=sessionCompletion===null&&compliance!==null&&compliance<.55;
    let decision;
    const make=(status,intensity,volume,engineDuration,reasonCodes,explanation,confidence)=>({schema_version:VERSION,status,intensity_factor:clamp(intensity,.9,1.05),volume_factor:clamp(volume,.6,1.1),engine_duration_factor:clamp(engineDuration,.7,1.1),reason_codes:reasonCodes,explanation,confidence,guardrails:["No catch-up volume after missed training.","Pain blocks progression.","One exceptional session cannot trigger accelerated progression.","Strength intensity changes are capped at five percent.","Engine duration changes are capped at ten percent."],evidence:{sample_size:window.length,success_streak:successes,rapid_success_streak:rapidStreak,struggle_streak:struggles,comparable_exposure_key:`${current.session_type}:${key(context.session_role||context.event_role||"general")||"general"}`,required_successes:2,required_rapid_successes:3,promotion_eligible:successes>=2,promotion_blocker:successes>=2?null:"MORE_COMPARABLE_EVIDENCE_REQUIRED",current}});
    if(redFlags.length||current.pain_severity>=7)decision=make("safety_hold",.9,.6,.7,[redFlags.length?"RED_FLAG_SYMPTOM":"SEVERE_PAIN"],"Progression is stopped. Bell removes painful loading and requires reassessment before hard training.",.98);
    else if(current.pain_severity>=4||current.technique_issues.length)decision=make("protect",.95,.75,.85,["PAIN_OR_TECHNIQUE_LIMIT"],"Bell holds load, trims nonessential work, and uses a pain-free technique or purpose-matched substitution.",.93);
    else if(interrupted>=10||lowSessionCompletion||legacyLowCompletion||missed>=3){
      const reason=interrupted>=10?"INTERRUPTION":lowSessionCompletion?"LOW_SESSION_COMPLETION":missed>=3?"LOW_WEEKLY_ADHERENCE":"LOW_COMPLETION";
      decision=make("rebuild",.95,.8,.85,[reason],"Bell rebuilds the last successful exposure instead of assigning catch-up work.",.9);
    }
    else if(struggles>=2)decision=make("regress",.95,.8,.85,["REPEATED_UNDERPERFORMANCE"],"Repeated difficult exposures show the current dose is not being absorbed. Bell reduces the next prescription.",.91);
    else if(readinessLow||struggle(current)||["hard","very_hard"].includes(current.difficulty))decision=make("hold",.98,.9,.92,[readinessLow?"LOW_READINESS":"SINGLE_DIFFICULT_EXPOSURE"],"Bell holds progression and trims optional work. One difficult day is not treated as failure.",.78);
    else if(rapidStreak>=3)decision=make("accelerate",1.05,1.08,1.1,["RAPID_POSITIVE_RESPONSE"],"Three consecutive high-quality exposures with reserve support a capped progression.",.91);
    else if(successes>=2)decision=make("progress",1.025,1.04,1.05,["REPEATED_SUCCESS"],"Two consecutive quality exposures support the smallest useful progression.",.86);
    else decision=make("observe",1,1,1,["MORE_EVIDENCE_REQUIRED"],"Bell records the response and waits for another comparable exposure before changing the prescription.",.62);
    return decision;
  }

  function exerciseDecisions(structured,recent){
    const current=normalized(structured);
    const prior={};
    recent.map(normalized).forEach(item=>(item.exercise_results||[]).forEach(result=>{const id=key(result.name);if(id)(prior[id]||(prior[id]=[])).push(result);}));
    return (current.exercise_results||[]).map(result=>{
      const id=key(result.name),history=(prior[id]||[]).slice(-2);
      const completed=num(result.completion_ratio,1)||0,rep=num(result.rep_ratio,completed)||0,rpe=num(result.average_rpe,current.session_rpe)||current.session_rpe,rir=num(result.average_rir),pain=num(result.pain,0)||0,technique=Boolean(result.technique_issue);
      const priorSuccess=history.length&&history[history.length-1].completion_ratio>=.95&&num(history[history.length-1].average_rpe,8)<=8.5&&!history[history.length-1].technique_issue;
      const priorStruggle=history.length&&(history[history.length-1].completion_ratio<.85||num(history[history.length-1].average_rpe,0)>=9.5);
      let status="hold",factor=1,reason="Repeat the prescription until performance and effort agree.";
      if(pain>=4||technique){status="protect";reason="Pain or technique feedback blocks load progression.";}
      else if(completed<.85||rep<.85||rpe>=9.5){if(priorStruggle){status="regress";factor=.95;reason="Repeated incomplete or maximal-effort work requires a five-percent load reduction.";}else reason="A single difficult exposure is repeated before load changes.";}
      else if(completed>=.95&&rep>=.95&&rpe<=8.5&&(rir===null||rir>=1)){if(priorSuccess){status="progress";factor=1.025;reason="Two quality exposures support the smallest practical load increase.";}else reason="One successful exposure is banked before increasing load.";}
      return{exercise_key:id,exercise_name:result.name,status,load_factor:factor,reason,evidence:{completion_ratio:completed,rep_ratio:rep,average_rpe:rpe,average_rir:rir,pain_severity:pain,prior_comparable_exposures:history.length}};
    });
  }

  function localContext(currentCompletion=null){
    const today=new Date();
    const todayKey=today.toISOString().slice(0,10);
    const cutoff=new Date(today);cutoff.setDate(cutoff.getDate()-14);
    const misses=(data.missedSessionLog||[]).filter(item=>new Date(item.date||item.createdAt||0)>=cutoff).length;
    const eligibleItems=(data.plan||[]).filter(item=>{const key=item.scheduledDate||"";return !key||key<=todayKey;});
    const sessions=eligibleItems.flatMap(item=>{
      const discovered=typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(item):[item];
      return discovered.map(session=>({item,session}));
    }).filter(({session})=>session.mission&&!String(session.mission).startsWith("M-")&&!session.optionalCore);
    const currentPlanId=String(currentCompletion?.planId||currentCompletion?.completionIdentity?.planId||"");
    const currentSessionKey=String(currentCompletion?.planSessionKey||currentCompletion?.completionIdentity?.sessionKey||"");
    const completed=sessions.filter(({item,session})=>{
      if(currentPlanId&&currentSessionKey&&String(item?.id)===currentPlanId&&String(session?.sessionKey)===currentSessionKey)return true;
      try{if(typeof bellPlannedSessionCompleted==="function")return Boolean(bellPlannedSessionCompleted(item,session.sessionKey,session.mission,session.scheduledDate));}catch(_){}
      return Boolean(session.completed||session.done||item?.sessionCompletions?.[session.sessionKey]||item?.done||item?.status==="completed");
    }).length;
    const weeklyCompliance=sessions.length?completed/sessions.length:null;
    const source=currentCompletion?.structuredCompletion||currentCompletion||{};
    const strengthEvidence=source.strength_evidence||{};
    const exerciseResults=source.exercise_results||[];
    const plannedSets=exerciseResults.reduce((sum,item)=>sum+Math.max(0,num(item.planned_sets,0)||0),0);
    const completedSets=exerciseResults.reduce((sum,item)=>sum+Math.max(0,num(item.completed_sets,0)||0),0);
    const currentSessionCompletion=source.session_type==="engine"
      ?clamp(num(source.duration_minutes,num(source.actual?.duration_minutes,0))/(num(source.planned?.duration_minutes,1)||1),0,2)
      :num(strengthEvidence.set_completion,plannedSets?completedSets/plannedSets:null);
    const dates=[...(data.history||[]),...(currentCompletion?[currentCompletion]:[])].map(item=>new Date(item.completedAt||0)).filter(date=>Number.isFinite(date.getTime())).sort((a,b)=>b-a);
    const interruption=dates.length?Math.max(0,Math.floor((today-dates[0])/86400000)):0;
    return{
      missed_sessions:misses,
      compliance:weeklyCompliance,
      weekly_adherence:weeklyCompliance,
      block_adherence:weeklyCompliance,
      session_completion:currentSessionCompletion,
      interruption_days:interruption
    };
  }

  function applyExerciseDecisions(decisions,completed){
    decisions.forEach(decision=>{
      if(typeof progressionRecord!=="function")return;
      const result=(completed.exercises||[]).find(item=>key(item.name)===decision.exercise_key);
      const record=progressionRecord(decision.exercise_name);
      const loads=(result?.sets||[]).filter(set=>set.done).map(set=>num(set.weight)).filter(value=>value>0);
      const current=loads.length?loads[Math.floor(loads.length/2)]:num(record.currentLoad,num(result?.recommendedWeight));
      if(!current)return;
      const increment=typeof incrementFor==="function"?incrementFor(result||{name:decision.exercise_name,sets:[]},activeStrengthGoal()):5;
      let next=current;
      if(decision.status==="progress")next=typeof nearestIncrement==="function"?nearestIncrement(current*decision.load_factor,increment||2.5):current*decision.load_factor;
      if(decision.status==="regress")next=typeof nearestIncrement==="function"?nearestIncrement(current*.95,increment||2.5):current*.95;
      record.currentLoad=current;record.nextLoad=next;record.progressionReason=decision.reason;record.lastResponseStatus=decision.status;record.lastResponseAt=completed.completedAt;
      record.history=(record.history||[]).slice(-19);record.history.push({date:completed.completedAt,load:current,nextLoad:next,method:"Athlete response",reason:decision.reason,status:decision.status});
    });
  }

  function bellRecordAthleteResponse(completed){
    const engine=state();
    const structured=completed.structuredCompletion||bellBuildStructuredCompletion(completed);
    completed.structuredCompletion=structured;
    const recent=(data.history||[]).filter(item=>item!==completed&&item.structuredCompletion).slice(0,8).reverse();
    const inputGate=typeof bellRealWorldConfidenceGate==="function"?bellRealWorldConfidenceGate(structured,recent.map(item=>item.structuredCompletion||item)):null;
    completed.responseInputQuality=inputGate;
    let rawDecision=bellEvaluateAthleteResponse(structured,recent,localContext(completed));
    if(inputGate&&!inputGate.allow_adaptation)rawDecision={...rawDecision,status:"observe",intensity_factor:1,volume_factor:1,engine_duration_factor:1,reason_codes:[...(rawDecision.reason_codes||[]),inputGate.reason],explanation:"Bell held adaptation because the completion did not contain enough reliable evidence."};
    else if(inputGate&&!inputGate.allow_upward&&["progress","accelerate"].includes(rawDecision.status))rawDecision={...rawDecision,status:"observe",intensity_factor:1,volume_factor:1,engine_duration_factor:1,reason_codes:[...(rawDecision.reason_codes||[]),inputGate.reason],explanation:"Bell collected the result but withheld upward progression because the input was incomplete or contradictory."};
    const phaseId=data.trainingBlock?.currentPhase?.id||data.trainingBlock?.phaseId||data.trainingBlock?.phase?.id||data.trainingBlock?.phase||"build";
    const longitudinal=typeof bellStabilizeLongitudinalProgression==="function"
      ?bellStabilizeLongitudinalProgression(rawDecision,engine.longitudinalState,{session_type:structured.session_type,phase_id:phaseId,weeks_to_event:data.trainingBlock?.weeksToEvent,event_role:completed.eventRole||completed.sessionRole||""})
      :{decision:rawDecision,state:engine.longitudinalState||null,record:null};
    const decision=longitudinal.decision||rawDecision;
    engine.longitudinalState=longitudinal.state||engine.longitudinalState||null;
    const exercises=exerciseDecisions(structured,recent);
    completed.athleteResponse={decision,rawDecision,longitudinal:longitudinal.record,exerciseDecisions:exercises};
    engine.lastEvaluation={...decision,completedAt:completed.completedAt,sessionId:structured.session_id};
    engine.decisions=(engine.decisions||[]).slice(-39);engine.decisions.push(engine.lastEvaluation);
    exercises.forEach(item=>{engine.exerciseDecisions[item.exercise_key]={...item,updatedAt:completed.completedAt};});
    engine.trend={status:decision.status,intensityFactor:decision.intensity_factor,volumeFactor:decision.volume_factor,engineDurationFactor:decision.engine_duration_factor,updatedAt:completed.completedAt};
    if(data.trainingBlock)data.trainingBlock.responseAdjustment={...engine.trend,reasonCodes:decision.reason_codes,explanation:decision.explanation,sourceSessionId:structured.session_id};
    applyExerciseDecisions(exercises,completed);
    if(typeof bellScheduleClosedLoopApplication==="function")completed.prescriptionApplication=bellScheduleClosedLoopApplication(completed,completed.athleteResponse);
    return completed.athleteResponse;
  }

  function bellAthleteResponseSummary(){
    const evaluation=state().lastEvaluation;
    if(!evaluation)return{status:"collecting",label:"Collecting response data",detail:"Complete comparable sessions so Bell can distinguish a trend from one unusual day.",factors:{intensity:1,volume:1,engine:1}};
    const labels={safety_hold:"Safety hold",protect:"Protected progression",rebuild:"Rebuild consistency",regress:"Reduced next dose",hold:"Hold and absorb",observe:"Collecting evidence",reentry:"Protected re-entry",deload:"Planned deload",progress:"Measured progression",accelerate:"Capped accelerated progression"};
    return{status:evaluation.status,label:labels[evaluation.status]||evaluation.status,detail:evaluation.explanation,factors:{intensity:evaluation.intensity_factor,volume:evaluation.volume_factor,engine:evaluation.engine_duration_factor},reasonCodes:evaluation.reason_codes||[]};
  }


  function renderAthleteResponseReview(){
    const container=document.getElementById("athleteResponseReview");if(!container)return;
    const summary=bellAthleteResponseSummary(),last=state().lastEvaluation;
    const factors=summary.factors||{intensity:1,volume:1,engine:1};
    const longitudinal=last?.longitudinal||{};
    const application=state().lastApplication;
    container.innerHTML=`<article class="card athlete-response-review-card"><div><span class="metric-label">Longitudinal Athlete Response</span><h3>${summary.label}</h3><p>${summary.detail}</p>${longitudinal.phase_id?`<p class="athlete-response-phase">${String(longitudinal.phase_id).replaceAll("_"," ")} phase • exposure ${longitudinal.channel_exposure||0} • fatigue ${longitudinal.fatigue_score||0}/8</p>`:""}${application?`<p class="athlete-response-phase">Applied to ${application.targetMission||"the next comparable session"} • ${application.state}</p>`:""}</div><div class="athlete-response-factor-grid"><span><small>Strength load</small><strong>${Math.round((factors.intensity||1)*100)}%</strong></span><span><small>Training volume</small><strong>${Math.round((factors.volume||1)*100)}%</strong></span><span><small>Engine duration</small><strong>${Math.round((factors.engine||1)*100)}%</strong></span><span><small>Trend evidence</small><strong>${longitudinal.global_exposure||last?.evidence?.sample_size||0} exposure${(longitudinal.global_exposure||last?.evidence?.sample_size||0)===1?"":"s"}</strong></span></div></article>`;
  }

  window.bellBuildStructuredCompletion=bellBuildStructuredCompletion;
  window.bellEvaluateAthleteResponse=bellEvaluateAthleteResponse;
  window.bellRecordAthleteResponse=bellRecordAthleteResponse;
  window.bellExerciseProgressionDecisions=exerciseDecisions;
  window.bellAthleteResponseSummary=bellAthleteResponseSummary;
  window.bellEnsureResponseEngine=state;
  window.renderAthleteResponseReview=renderAthleteResponseReview;
  if(typeof renderHistory==="function"){
    const baseRenderHistory=renderHistory;
    renderHistory=function(){const result=baseRenderHistory.apply(this,arguments);renderAthleteResponseReview();return result;};
  }

  if(!window.BELL_CLOSED_LOOP_APPLICATION&&typeof strengthProgression==="function"){
    const base=strengthProgression;
    strengthProgression=function(){
      const prescription=base(),adjustment=data.trainingBlock?.responseAdjustment||state().trend||{};
      const status=adjustment.status||"";
      const intensity=clamp(num(adjustment.intensityFactor,num(adjustment.intensity_factor,1)),.9,1.05);
      const volume=clamp(num(adjustment.volumeFactor,num(adjustment.volume_factor,1)),.6,1.1);
      if(!status)return prescription;
      return{...prescription,load:clamp((num(prescription.load,1)||1)*intensity,.45,1.2),setScale:clamp((num(prescription.setScale,1)||1)*volume,.45,1.1),label:`${prescription.label} • ${bellAthleteResponseSummary().label}`,note:`${prescription.note||""} ${adjustment.explanation||bellAthleteResponseSummary().detail}`.trim(),responseStatus:status};
    };
  }
  if(!window.BELL_CLOSED_LOOP_APPLICATION&&typeof cardioPrescriptionForBlock==="function"){
    const base=cardioPrescriptionForBlock;
    cardioPrescriptionForBlock=function(type){
      const prescription=base(type),adjustment=data.trainingBlock?.responseAdjustment||state().trend||{};
      const factor=clamp(num(adjustment.engineDurationFactor,num(adjustment.engine_duration_factor,1)),.7,1.1);
      if(!adjustment.status||!prescription)return prescription;
      return{...prescription,duration:Math.max(10,Math.round((num(prescription.duration,30)||30)*factor)),detail:`${prescription.detail} • ${bellAthleteResponseSummary().label}`};
    };
  }
})();
