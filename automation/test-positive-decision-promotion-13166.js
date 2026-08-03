"use strict";
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
global.window=global;
global.data={settings:{readiness:{}},trainingBlock:{phaseId:"build"},history:[],plan:[],missedSessionLog:[],responseEngine:{}};
global.strengthProgression=()=>({load:1,setScale:1,label:"Base progression",note:""});
global.cardioPrescriptionForBlock=()=>({duration:60,detail:"Base engine"});
global.progressionRecord=()=>({history:[]});
global.activeStrengthGoal=()=>"General Strength";
global.incrementFor=()=>5;
global.nearestIncrement=(value,increment)=>Math.round(value/increment)*increment;
global.sessionsFromPlanItem=item=>[item];
global.bellStabilizeLongitudinalProgression=(raw,state)=>({decision:raw,state:state||{},record:{}});
global.bellScheduleClosedLoopApplication=()=>null;
for(const file of ["js/real-world-chaos-13160.js","js/athlete-response-13130.js"]){
  vm.runInThisContext(fs.readFileSync(path.join(root,file),"utf8"),{filename:file});
}
function raw(id,{loadFactor=1,rpe=7.5,role="primary-strength"}={}){
  const session={
    id,name:"S-1 Strength",planId:"plan-1",planSessionKey:id,weekIndex:Number(id.split("-").pop())||1,
    scheduledDate:`2026-08-${String(Number(id.split("-").pop())||1).padStart(2,"0")}`,
    sessionRole:role,dailySessionType:"strength",sessionType:"strength",duration:60,prescribedDuration:60,
    elapsed:3600,officialElapsed:3600,sessionRpe:rpe,rpe,difficulty:"appropriate",painSeverity:0,readiness:{score:85},
    exercises:[{name:"Back Squat",plannedReps:"5",recommendedWeight:225,sets:[1,2,3].map(set=>({set,done:true,plannedWeight:225,weight:225*loadFactor,plannedReps:"5",reps:"5",rpe,rir:rpe<=7?3:2}))}]
  };
  const structured=bellBuildStructuredCompletion(session);
  structured.completion_identity={athleteId:"athlete-1",planId:"plan-1",weekIndex:session.weekIndex,scheduledDate:session.scheduledDate,sessionKey:id,attempt:1};
  structured.session_role=role;
  structured.completion_id=bellCompletionFingerprint(structured);
  return structured;
}
let passed=0;
const check=(condition,message)=>{if(!condition)throw new Error(message);passed++;};
const steady1=raw("steady-1");
const steady2=raw("steady-2");
const rapid1=raw("rapid-1",{loadFactor:1.05,rpe:6.5});
const rapid2=raw("rapid-2",{loadFactor:1.05,rpe:6.5});
const rapid3=raw("rapid-3",{loadFactor:1.05,rpe:6.5});
const gate1=bellRealWorldConfidenceGate(steady1,[]);
check(gate1.confidence>=.7,"structured strength evidence confidence must permit upward decisions");
check(gate1.allow_upward===true,"structured strength evidence must allow upward decisions");
check(gate1.normalized.exercises.length===1,"exercise_results must normalize as exercises");
check(gate1.normalized.readiness===85,"readiness.score must normalize correctly");
check(bellEvaluateAthleteResponse(steady1,[],{session_completion:1,session_role:"primary-strength"}).status==="observe","first success must observe");
const progress=bellEvaluateAthleteResponse(steady2,[steady1],{session_completion:1,session_role:"primary-strength"});
check(progress.status==="progress","second comparable success must progress");
check(progress.evidence.comparable_exposure_key==="strength:primary-strength","comparable key must be stable by channel and role");
check(progress.evidence.promotion_eligible===true,"promotion diagnostics must show eligibility");
const accelerate=bellEvaluateAthleteResponse(rapid3,[rapid1,rapid2],{session_completion:1,session_role:"primary-strength"});
check(accelerate.status==="accelerate","third rapid comparable success must accelerate");
check(accelerate.evidence.rapid_success_streak===3,"rapid streak must accumulate across scheduled occurrences");
check(bellCompletionFingerprint(steady1)!==bellCompletionFingerprint(steady2),"different scheduled occurrences must remain distinct");
check(bellRealWorldConfidenceGate(steady1,[steady1]).duplicate===true,"same scheduled occurrence must remain duplicate");
console.log(`PASS: ${passed}/12 positive decision promotion checks.`);
