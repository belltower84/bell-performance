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

function completion(id,{loadFactor=1,rpe=7.5,rir=2}={}){
  return bellBuildStructuredCompletion({
    id,name:"S-1 Strength",planSessionKey:id,dailySessionType:"strength",sessionType:"strength",
    duration:60,prescribedDuration:60,elapsed:3600,officialElapsed:3600,sessionRpe:rpe,rpe,
    difficulty:"appropriate",painSeverity:0,readiness:{score:85},
    exercises:[{name:"Back Squat",plannedReps:"5",recommendedWeight:225,sets:[1,2,3].map(set=>({set,done:true,plannedWeight:225,weight:225*loadFactor,plannedReps:"5",reps:"5",rpe,rir}))}]
  });
}
const steady1=completion("steady-1");
const steady2=completion("steady-2");
if(steady1.performance_ratio<.95)throw new Error(`steady evidence too low: ${steady1.performance_ratio}`);
if(bellEvaluateAthleteResponse(steady1,[],{compliance:1,missed_sessions:0,interruption_days:0}).status!=="observe")throw new Error("first steady exposure should be observed");
if(bellEvaluateAthleteResponse(steady2,[steady1],{compliance:1,missed_sessions:0,interruption_days:0}).status!=="progress")throw new Error("second steady exposure should progress");
const rapid=[1,2,3].map(i=>completion(`rapid-${i}`,{loadFactor:1.05,rpe:6.5,rir:3}));
if(rapid[0].performance_ratio<1.05)throw new Error(`rapid evidence too low: ${rapid[0].performance_ratio}`);
if(bellEvaluateAthleteResponse(rapid[2],rapid.slice(0,2),{compliance:1,missed_sessions:0,interruption_days:0}).status!=="accelerate")throw new Error("third rapid exposure should accelerate");
if(steady1.strength_evidence.load_ratio!==1)throw new Error("planned load ratio was not preserved");
if(rapid[0].strength_evidence.load_ratio<1.049)throw new Error("above-plan load ratio was not captured");
console.log("PASS: 8/8 positive-response calibration checks.");
