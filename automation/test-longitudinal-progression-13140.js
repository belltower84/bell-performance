"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.resolve(__dirname,"..");
global.window=global;
global.data={settings:{readiness:{}},trainingBlock:{},history:[],plan:[],missedSessionLog:[],responseEngine:{}};
global.strengthProgression=()=>({load:1,setScale:1,label:"Base",note:""});
global.cardioPrescriptionForBlock=()=>({duration:60,detail:"Base"});
global.progressionRecord=()=>({history:[]});
global.activeStrengthGoal=()=>"General Strength";
global.incrementFor=()=>5;
global.nearestIncrement=(v,i)=>Math.round(v/i)*i;
global.sessionsFromPlanItem=i=>[i];
vm.runInThisContext(fs.readFileSync(path.join(root,"js/longitudinal-progression-13140.js"),"utf8"),{filename:"longitudinal-progression-13140.js"});
vm.runInThisContext(fs.readFileSync(path.join(root,"js/athlete-response-13130.js"),"utf8"),{filename:"athlete-response-13130.js"});
const scenarios=JSON.parse(fs.readFileSync(path.join(__dirname,"longitudinal_adaptation_scenarios.json"),"utf8")).cases;
const expected=JSON.parse(fs.readFileSync(path.join(__dirname,"longitudinal_adaptation_expected.json"),"utf8")).cases;
const expand=segments=>segments.flatMap(segment=>Array.from({length:Number(segment.count||1)},()=>({completion:JSON.parse(JSON.stringify(segment.completion||{})),context:JSON.parse(JSON.stringify(segment.context||{}))})));
const base=(raw,id)=>({schema_version:1,session_id:id,session_type:"strength",performance_ratio:1,session_rpe:7,difficulty:"right",planned:{duration_minutes:60},duration_minutes:60,readiness:{score:78},pain:{},technique_issues:[],symptoms:[],...raw});
let passed=0,exposures=0;
for(const scenario of scenarios){
  let state=null;const recent=[];const actual=[];
  expand(scenario.segments).forEach((row,index)=>{
    const completion=base(row.completion,`${scenario.id}-${index+1}`),context=row.context||{};
    const raw=bellEvaluateAthleteResponse(completion,recent.slice(-8),context);
    const result=bellStabilizeLongitudinalProgression(raw,state,{...context,session_type:completion.session_type});
    state=result.state;
    actual.push({status:result.decision.status,raw_status:result.decision.raw_status,intensity_factor:result.decision.intensity_factor,volume_factor:result.decision.volume_factor,engine_duration_factor:result.decision.engine_duration_factor});
    recent.push(completion);
  });
  const fixture=expected[scenario.id];
  if(!fixture)throw new Error(`${scenario.id}: expected fixture missing`);
  if(JSON.stringify(actual)!==JSON.stringify(fixture)){
    const at=actual.findIndex((item,i)=>JSON.stringify(item)!==JSON.stringify(fixture[i]));
    throw new Error(`${scenario.id}: JS/Python parity failed at exposure ${at+1}\nexpected ${JSON.stringify(fixture[at])}\nobserved ${JSON.stringify(actual[at])}`);
  }
  passed++;exposures+=actual.length;
}
console.log(`PASS: ${passed}/${scenarios.length} longitudinal trajectories and ${exposures} exposure decisions match Python.`);
// Integration: the live completion recorder must store raw and stabilized decisions.
data.history=[];data.responseEngine={};data.trainingBlock={phaseId:"build"};
for(let i=0;i<4;i++){
  const completed={completedAt:`2026-08-0${i+1}T12:00:00Z`,planSessionKey:`integration-${i}`,structuredCompletion:base({session_type:"strength",performance_ratio:1,session_rpe:7},`integration-${i}`),exercises:[]};
  bellRecordAthleteResponse(completed);
  if(!completed.athleteResponse.rawDecision||!completed.athleteResponse.decision)throw new Error("Live athlete-response recorder did not preserve raw and stabilized decisions");
  data.history.push(completed);
}
if(data.responseEngine.longitudinalState?.total_exposures!==4)throw new Error("Live response engine did not persist longitudinal exposure state");
console.log("PASS: live athlete-response recorder persists longitudinal state.");
