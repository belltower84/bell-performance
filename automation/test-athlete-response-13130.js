"use strict";
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
global.window=global;
global.data={settings:{readiness:{}},trainingBlock:{},history:[],plan:[],missedSessionLog:[],responseEngine:{}};
global.strengthProgression=()=>({load:1,setScale:1,label:"Base progression",note:""});
global.cardioPrescriptionForBlock=()=>({duration:60,detail:"Base engine"});
global.progressionRecord=()=>({history:[]});
global.activeStrengthGoal=()=>"General Strength";
global.incrementFor=()=>5;
global.nearestIncrement=(value,increment)=>Math.round(value/increment)*increment;
global.sessionsFromPlanItem=item=>[item];
vm.runInThisContext(fs.readFileSync(path.join(root,"js/athlete-response-13130.js"),"utf8"),{filename:"athlete-response-13130.js"});
const scenarios=JSON.parse(fs.readFileSync(path.join(__dirname,"athlete_response_scenarios.json"),"utf8")).cases;
const base=(raw={},i=0)=>({schema_version:1,session_id:`js-${i}`,session_type:"strength",duration_minutes:60,session_rpe:7,performance_ratio:1,difficulty:"right",planned:{duration_minutes:60},readiness:{score:78},pain:{},technique_issues:[],symptoms:[],exercise_results:[],...raw});
const structured=bellBuildStructuredCompletion({
  name:"S-1 Strength",duration:60,prescribedDuration:60,elapsed:3600,rpe:8,difficulty:"right",painSeverity:0,painArea:"",techniqueIssue:false,notes:"Solid session",readiness:{score:82,status:"GREEN"},
  exercises:[{name:"Back Squat",block:"Primary",plannedReps:"5",recommendedWeight:225,feedback:"right",sets:[{set:1,plannedWeight:225,plannedReps:"5",weight:225,reps:"5",rpe:8,rir:2,done:true},{set:2,plannedWeight:225,plannedReps:"5",weight:225,reps:"5",rpe:8.5,rir:1.5,done:true}]}]
});
if(structured.planned.exercises[0].sets[0].weight!==225)throw new Error("Structured completion lost planned load");
if(structured.actual.exercise_results[0].sets[0].rpe!==8)throw new Error("Structured completion lost per-set RPE");
if(structured.actual.exercise_results[0].sets[0].rir!==2)throw new Error("Structured completion lost per-set RIR");
if(structured.performance_ratio<=0)throw new Error("Structured completion did not calculate performance ratio");
let passed=0;
for(const item of scenarios){
  const current=base(item.current,99),recent=(item.recent||[]).map(base);
  const evidence=item.type==="exercise"?bellExerciseProgressionDecisions(current,recent)[0]:bellEvaluateAthleteResponse(current,recent,item.context||{});
  const actual=evidence?.status||"missing";
  if(actual!==item.expected_status)throw new Error(`${item.id}: expected ${item.expected_status}; observed ${actual}`);
  if(item.type!=="exercise"){
    if(evidence.intensity_factor<.9||evidence.intensity_factor>1.05)throw new Error(`${item.id}: intensity cap violated`);
    if(evidence.volume_factor<.6||evidence.volume_factor>1.1)throw new Error(`${item.id}: volume cap violated`);
    if(evidence.engine_duration_factor<.7||evidence.engine_duration_factor>1.1)throw new Error(`${item.id}: engine cap violated`);
  }
  passed++;
}
console.log(`PASS: ${passed}/${scenarios.length} JavaScript athlete-response cases.`);
