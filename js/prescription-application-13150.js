"use strict";

/* Bell Performance 13.15.0 — closed-loop prescription application.
   Converts a stabilized athlete-response decision into one idempotent change to
   the next comparable prescription. Mission identity and event roles are retained. */
(function(global){
  global.BELL_CLOSED_LOOP_APPLICATION=true;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const num=(value,fallback=1)=>Number.isFinite(Number(value))?Number(value):fallback;
  const clone=value=>JSON.parse(JSON.stringify(value??null));
  const key=value=>String(value||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const channelOf=value=>{
    const mission=String(value?.mission||value?.name||value?.label||"");
    const explicit=String(value?.sessionType||value?.session_type||value?.type||"").toLowerCase();
    return explicit==="engine"||value?.cardioType||value?.engineMetrics||/^R-/i.test(mission)?"engine":"strength";
  };
  const roles=value=>Object.fromEntries(Object.entries({eventRole:value?.eventRole,enduranceRole:value?.enduranceRole,sessionRole:value?.sessionRole,exerciseRole:value?.exerciseRole,physiqueRole:value?.physiqueRole}).filter(([,v])=>v!==undefined&&v!==null&&v!==""));
  const UPWARD=new Set(["progress","accelerate"]);
  const PROTECTED_PHASES=new Set(["taper","peak","peak_week","race_week","event_week","competition","meet_week","late_specific"]);
  const phaseId=value=>key(value?.longitudinalPhase||value?.eventPhase||value?.phaseId||value?.phase_id||value?.currentPhase?.id||value?.phase||"");
  const protectedPhase=value=>{const phase=phaseId(value);return PROTECTED_PHASES.has(phase)||phase.startsWith("taper")||phase.startsWith("race-week")||phase.startsWith("event-week")||phase.startsWith("peak-week");};
  const upwardApplication=application=>UPWARD.has(String(application?.status||""));
  function blockApplication(application,reason,meta={}){
    if(!application)return null;
    application.state="blocked";application.blockReason=reason;application.blockedAt=new Date().toISOString();application.blockedTargetPhase=phaseId(meta)||null;
    const store=engineStore();const canonical=store?.prescriptionApplications?.find(item=>item.applicationId===application.applicationId);
    if(canonical&&canonical!==application){canonical.state=application.state;canonical.blockReason=application.blockReason;canonical.blockedAt=application.blockedAt;canonical.blockedTargetPhase=application.blockedTargetPhase;}
    return application;
  }
  function revalidateApplication(application,sessionMeta={}){
    if(!application)return{allowed:false,reason:"NO_APPLICATION"};
    if(upwardApplication(application)&&protectedPhase(sessionMeta)){blockApplication(application,"TAPER_PROTECTION",sessionMeta);return{allowed:false,reason:"TAPER_PROTECTION"};}
    return{allowed:true,reason:"ALLOWED"};
  }
  const idFor=(source,decision)=>{
    const text=[source,decision?.status||"observe",decision?.longitudinal?.global_exposure||0,decision?.longitudinal?.channel_exposure||0].join("|");
    let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return`rxapp-${(hash>>>0).toString(16).padStart(8,"0")}`;
  };
  function protectedSubstitute(name){
    const lower=String(name||"").toLowerCase();
    if(lower.includes("squat"))return"Pain-Free Box Squat Variation";
    if(lower.includes("deadlift")||lower.includes("hinge"))return"Pain-Free Supported Hinge Variation";
    if(lower.includes("bench")||lower.includes("chest press"))return"Pain-Free Neutral-Grip Press Variation";
    if(lower.includes("overhead")||lower.includes("shoulder press"))return"Pain-Free Landmine Press Variation";
    if(lower.includes("row")||lower.includes("pull"))return"Pain-Free Chest-Supported Pull Variation";
    if(lower.includes("lunge")||lower.includes("split squat"))return"Pain-Free Supported Single-Leg Variation";
    return`Pain-Free ${name||"Movement"} Variation`;
  }
  function buildApplication(decision,exerciseDecisions,sourceSessionId,sourceType){
    const channel=decision?.longitudinal?.channel||sourceType||"strength";
    return{schemaVersion:1,applicationId:idFor(sourceSessionId,decision),sourceSessionId,targetSessionKey:null,channel:channel==="engine"?"engine":"strength",status:decision?.status||"observe",intensityFactor:+clamp(num(decision?.intensity_factor,1),.9,1.1).toFixed(3),volumeFactor:+clamp(num(decision?.volume_factor,1),.6,1.15).toFixed(3),engineDurationFactor:+clamp(num(decision?.engine_duration_factor,1),.7,1.2).toFixed(3),exerciseDecisions:clone(exerciseDecisions||[]),reasonCodes:[...(decision?.reason_codes||[])],explanation:decision?.explanation||"",scope:"next_comparable_exposure",state:"pending",preserveEventSpecificity:true,createdAt:new Date().toISOString()};
  }
  function decisionMap(application){const map={};(application?.exerciseDecisions||[]).forEach(item=>{const id=item.exercise_key||key(item.exercise_name);if(id)map[id]=item;});return map;}
  function applyTemplate(template,application,sessionMeta={}){
    const result=clone(template||{});if(!application||channelOf({...result,...sessionMeta})!==application.channel)return result;
    const validation=revalidateApplication(application,sessionMeta);if(!validation.allowed)return result;
    if(result.closedLoopApplicationId===application.applicationId)return result;
    const roleSnapshot=roles(sessionMeta),status=application.status||"observe";
    if(status==="safety_hold")return{...result,label:"Athlete Response Safety Hold",duration:Math.min(25,Math.max(10,num(result.duration,20))),exercises:[{name:"Pain-Free Recovery Movement",block:"Safety Hold",sets:1,reps:"10–20 minutes easy",rest:0,cue:"Do not repeat the painful hard exposure. Stop if symptoms worsen and seek qualified evaluation for red-flag symptoms."}],closedLoopApplicationId:application.applicationId,prescriptionApplication:{...clone(application),state:"applied",rolesBefore:roleSnapshot,rolesAfter:roleSnapshot,identityInvariant:true},originalMission:sessionMeta.mission||result.name,preserveEventSpecificity:true};
    const intensity=clamp(num(application.intensityFactor,1),.9,1.1),volume=clamp(num(application.volumeFactor,1),.6,1.15),duration=clamp(num(application.engineDurationFactor,1),.7,1.2),map=decisionMap(application),changes=[];
    if(application.channel==="engine"){
      const before=num(result.duration,30);result.duration=Math.max(10,Math.round(before*duration));changes.push({field:"duration",before,after:result.duration});
    }else{
      result.exercises=(result.exercises||[]).map(exercise=>{
        const revised={...exercise},originalName=exercise.name||"Exercise",decision=map[key(exercise.exerciseId||originalName)]||map[key(originalName)];
        const beforeSets=Math.max(1,Math.round(num(exercise.sets,1)));revised.sets=Math.max(1,Math.min(10,Math.round(beforeSets*volume)));if(revised.sets!==beforeSets)changes.push({exercise:originalName,field:"sets",before:beforeSets,after:revised.sets});
        let factor=intensity;
        if(decision?.status==="progress")factor=Math.max(intensity,num(decision.load_factor,1.025));
        else if(decision?.status==="regress")factor=Math.min(intensity,num(decision.load_factor,.95));
        else if(decision?.status==="hold")factor=Math.min(intensity,1);
        else if(decision?.status==="protect"){
          factor=Math.min(intensity,.8);revised.originalExercise=originalName;revised.name=protectedSubstitute(originalName);revised.protectedSubstitution=true;revised.sets=Math.min(revised.sets,2);revised.cue=`${revised.cue||""} Use only a pain-free variation and stop if symptoms worsen.`.trim();changes.push({exercise:originalName,field:"exercise",before:originalName,after:revised.name});
        }
        if(Number.isFinite(Number(revised.recommendedWeight))&&Number(revised.recommendedWeight)>0){const before=Number(revised.recommendedWeight);revised.recommendedWeight=Math.max(0,Math.round(before*factor*4)/4);revised.recommendationDisplay=`${revised.recommendedWeight} lb`;changes.push({exercise:originalName,field:"recommendedWeight",before,after:revised.recommendedWeight});}
        if(status==="deload"){revised.sets=Math.min(revised.sets,2);revised.responseRpeCap=6.5;}else if(["protect","rebuild","regress","reentry"].includes(status))revised.responseRpeCap=7;else if(status==="hold")revised.responseRpeCap=7.5;
        return revised;
      });
    }
    result.closedLoopApplicationId=application.applicationId;result.prescriptionApplication={...clone(application),state:"applied",changes,rolesBefore:roleSnapshot,rolesAfter:roleSnapshot,identityInvariant:true};result.preserveEventSpecificity=true;result.coachBrief=`${result.coachBrief||""} ${application.explanation||"Bell applied the latest athlete-response decision to this prescription."}`.trim();return result;
  }
  function engineStore(){if(typeof data==="undefined")return null;data.responseEngine=data.responseEngine&&typeof data.responseEngine==="object"?data.responseEngine:{};data.responseEngine.prescriptionApplications=Array.isArray(data.responseEngine.prescriptionApplications)?data.responseEngine.prescriptionApplications:[];return data.responseEngine;}
  function sessions(item){try{return typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(item):[{mission:item?.mission,sessionKey:`${item?.id}:primary`,sessionType:channelOf(item),scheduledDate:item?.scheduledDate}];}catch(_){return[];}}
  function completedSession(item,session){try{return typeof bellPlannedSessionCompleted==="function"?bellPlannedSessionCompleted(item,session.sessionKey,session.mission,session.scheduledDate):Boolean(item?.done);}catch(_){return Boolean(item?.done);}}
  function attach(item,session,application){
    item.prescriptionApplications=item.prescriptionApplications&&typeof item.prescriptionApplications==="object"?item.prescriptionApplications:{};
    application.targetSessionKey=session.sessionKey;application.targetPlanId=item.id;application.targetMission=session.mission;application.targetScheduledDate=session.scheduledDate||item.scheduledDate||null;application.targetEventPhase=item.eventPhase||null;application.targetLongitudinalPhase=item.longitudinalPhase||null;
    if(!revalidateApplication(application,{...item,...session}).allowed){delete item.prescriptionApplications[session.sessionKey];return application;}
    application.state="scheduled";item.prescriptionApplications[session.sessionKey]=clone(application);return application;
  }
  function findNext(application,sourcePlanId){
    const plan=(typeof data!=="undefined"&&Array.isArray(data.plan))?data.plan:[];let start=Math.max(-1,plan.findIndex(item=>String(item.id)===String(sourcePlanId)));
    const eligible=(item,session)=>channelOf(session)===application.channel&&!completedSession(item,session)&&!(upwardApplication(application)&&protectedPhase({...item,...session}));
    for(let i=start+1;i<plan.length;i++){const item=plan[i];if(["skipped","replaced","completed"].includes(item.status))continue;const target=sessions(item).find(session=>eligible(item,session));if(target)return{item,session:target};}
    for(let i=0;i<=start;i++){const item=plan[i];if(!item||["skipped","replaced","completed"].includes(item.status))continue;const target=sessions(item).find(session=>eligible(item,session));if(target)return{item,session:target};}
    return null;
  }
  function consume(completed){const store=engineStore();if(!store)return;const id=completed?.prescriptionApplicationId||completed?.prescriptionApplication?.applicationId;if(!id)return;const app=store.prescriptionApplications.find(item=>item.applicationId===id);if(app){app.state="consumed";app.consumedAt=completed.completedAt;app.consumedSessionKey=completed.planSessionKey||completed.completionIdentity?.sessionKey||null;}}
  function schedule(completed,response){const store=engineStore();if(!store||!response?.decision)return null;consume(completed);const application=buildApplication(response.decision,response.exerciseDecisions,completed?.structuredCompletion?.session_id||completed?.completedAt,completed?.sessionType||channelOf(completed));const target=findNext(application,completed?.planId);if(target)attach(target.item,target.session,application);else application.state="awaiting_future_session";store.prescriptionApplications=store.prescriptionApplications.slice(-39);store.prescriptionApplications.push(application);store.lastApplication=application;if(typeof data!=="undefined"&&data.trainingBlock)data.trainingBlock.responseAdjustment={status:application.status,intensityFactor:application.intensityFactor,volumeFactor:application.volumeFactor,engineDurationFactor:application.engineDurationFactor,reasonCodes:application.reasonCodes,explanation:application.explanation,sourceSessionId:application.sourceSessionId,targetSessionKey:application.targetSessionKey,applicationId:application.applicationId};return application;}
  function reconcile(){const store=engineStore();if(!store)return;store.prescriptionApplications.filter(app=>["scheduled","awaiting_future_session"].includes(app.state)).forEach(app=>{const found=(data.plan||[]).some(item=>Boolean(item?.prescriptionApplications?.[app.targetSessionKey]));if(found)return;const target=findNext(app,app.targetPlanId);if(target)attach(target.item,target.session,app);});}
  function forPlanSession(item,sessionKey,mission){
    reconcile();const meta={...item,mission};let direct=item?.prescriptionApplications?.[sessionKey];const store=engineStore();
    let application=direct||store?.prescriptionApplications?.find(app=>app.state==="scheduled"&&String(app.targetPlanId)===String(item?.id)&&(String(app.targetSessionKey)===String(sessionKey)||String(app.targetMission)===String(mission)))||null;
    if(!application)return null;
    const validation=revalidateApplication(application,meta);
    if(!validation.allowed){if(item?.prescriptionApplications&&sessionKey)delete item.prescriptionApplications[sessionKey];return null;}
    return application;
  }
  global.bellBuildPrescriptionApplication=buildApplication;
  global.bellApplyClosedLoopPrescription=applyTemplate;
  global.bellScheduleClosedLoopApplication=schedule;
  global.bellReconcileClosedLoopApplications=reconcile;
  global.bellPrescriptionApplicationForPlanSession=forPlanSession;
  global.bellConsumeClosedLoopApplication=consume;
  global.bellRevalidateClosedLoopApplication=revalidateApplication;
  global.bellProtectedPrescriptionPhase=protectedPhase;
})(typeof window!=="undefined"?window:globalThis);
