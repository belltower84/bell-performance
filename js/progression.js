"use strict";

const DISCIPLINE_METHODS = {
  "Powerlifting": { name:"Specificity + RPE", description:"Competition-lift exposure, training maxes, RPE guardrails, planned accumulation, intensification, peak, and taper." },
  "Olympic Lifting": { name:"Technical quality + percentage", description:"Snatch and clean & jerk derivatives progress only when speed, positions, and successful-lift quality are maintained." },
  "Athlete": { name:"Velocity and power progression", description:"Strength, jumps, throws, unilateral work, acceleration, and sport-specific capacity progress without sacrificing movement quality." },
  "Hybrid": { name:"Concurrent periodization", description:"Strength and Engine progress together with interference controls, fatigue caps, and coordinated hard-day placement." },
  "Bodybuilding": { name:"Double progression", description:"Loads rise after the top of the rep range is achieved at the prescribed effort with stable technique." }
};

function activeStrengthGoal(){
  return data.trainingBlock?.dualGoals?.strengthGoal || data.trainingBlock?.goalType || "Hybrid";
}
function exerciseKey(name){ return String(name||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
function progressionStore(){ data.exerciseProgression=data.exerciseProgression||{}; return data.exerciseProgression; }
function progressionRecord(name){
  const key=exerciseKey(name), store=progressionStore();
  store[key]=store[key]||{exerciseId:key,name,currentLoad:null,nextLoad:null,lastFeedback:"",successfulSessions:0,failedSessions:0,estimated1RM:null,history:[],progressionReason:"No completed sessions yet."};
  return store[key];
}
function nearestIncrement(load, increment=5){ return Math.max(increment, Math.round(Number(load||0)/increment)*increment); }
function parseTargetReps(value){
  const nums=String(value||"").match(/\d+/g)?.map(Number)||[];
  if(!nums.length)return {min:0,max:0};
  return {min:Math.min(...nums),max:Math.max(...nums)};
}
function completedNumericReps(exercise){ return (exercise.sets||[]).filter(s=>s.done).map(s=>Number(String(s.reps).match(/\d+/)?.[0]||0)).filter(Boolean); }
function actualWorkingLoad(exercise){
  const loads=(exercise.sets||[]).filter(s=>s.done).map(s=>Number(s.weight)).filter(v=>Number.isFinite(v)&&v>0);
  return loads.length ? loads[Math.floor(loads.length/2)] : Number(exercise.recommendedWeight)||0;
}
function exerciseCategory(name){
  const n=String(name||"");
  if(/Snatch|Clean|Jerk|High Pull|Hang Clean|Power Clean/.test(n))return "olympic";
  if(/Jump|Sprint|Throw|Bound|Plyo|Med Ball/.test(n))return "power";
  if(/Squat|Deadlift|Bench Press|Overhead Press|Push Press/.test(n))return "primary";
  if(/Dumbbell|Row|Lunge|Curl|Extension|Pressdown|Raise|Fly|Machine|Cable|Hamstring/.test(n))return "accessory";
  return "general";
}
function incrementFor(exercise, goal){
  const cat=exerciseCategory(exercise.name), load=actualWorkingLoad(exercise);
  if(cat==="olympic")return load>=220?5:2.5;
  if(cat==="primary")return /Squat|Deadlift/.test(exercise.name)?10:5;
  if(cat==="accessory")return load>=100?5:2.5;
  if(goal==="Athlete"&&cat==="power")return 0;
  return 5;
}
function methodologyForExercise(exercise){
  const goal=activeStrengthGoal(), cat=exerciseCategory(exercise.name), method=DISCIPLINE_METHODS[goal]||DISCIPLINE_METHODS.Hybrid;
  if(goal==="Olympic Lifting"&&cat!=="olympic"&&cat!=="primary")return {...method,name:"Technical support work"};
  if(goal==="Athlete"&&cat==="power")return {...method,name:"Quality / velocity progression"};
  return method;
}
function prescribedWeightForExercise(name, fallback){
  const rec=progressionRecord(name);
  const candidate=Number(rec.nextLoad||rec.currentLoad);
  return Number.isFinite(candidate)&&candidate>0?candidate:fallback;
}
function progressionDecision(exercise){
  const goal=activeStrengthGoal(), feedback=exercise.feedback||"", load=actualWorkingLoad(exercise), inc=incrementFor(exercise,goal), reps=completedNumericReps(exercise), target=parseTargetReps(exercise.prescription), allDone=(exercise.sets||[]).length>0&&(exercise.sets||[]).every(s=>s.done), cat=exerciseCategory(exercise.name);
  let next=load, reason="Repeat the load and collect another quality exposure.", success=false, failed=false;
  if(feedback==="pain") { next=load; reason="Increase blocked: pain or technique issue reported. Review or substitute the movement."; failed=true; }
  else if(feedback==="heavy" || !allDone) { next=nearestIncrement(load*0.95, inc||2.5); reason="Load reduced about 5% because the prescription was too heavy or incomplete."; failed=true; }
  else if(goal==="Bodybuilding") {
    const topReached=reps.length&&target.max&&reps.every(r=>r>=target.max);
    if(feedback==="easy"&&topReached){next=nearestIncrement(load+inc,inc);reason="Top of the rep range reached with reserve; advance the load next exposure.";success=true;}
    else if(feedback==="easy"){next=load;reason="Keep the load and add reps toward the top of the range before increasing weight.";success=true;}
    else {next=load;reason="Continue double progression at the same load until all sets reach the top of the range.";success=allDone;}
  } else if(goal==="Olympic Lifting") {
    if(feedback==="easy"&&cat==="olympic"){next=nearestIncrement(load+inc,inc);reason="Fast, technically sound work: use the smallest available increase next exposure.";success=true;}
    else if(feedback==="easy"){next=nearestIncrement(load+inc,inc);reason="Support strength progressed conservatively while preserving positions and speed.";success=true;}
    else {next=load;reason="Repeat until technique and bar speed are consistently strong.";success=allDone;}
  } else if(goal==="Athlete"&&cat==="power") {
    next=load; reason=feedback==="easy"?"Do not chase load. Progress speed, jump distance, height, or movement complexity next session.":"Repeat the quality target before adding complexity."; success=feedback==="easy";
  } else if(goal==="Powerlifting") {
    if(feedback==="easy"&&allDone){next=nearestIncrement(load+inc,inc);reason="All prescribed work was completed below target effort; advance the working load conservatively.";success=true;}
    else {next=load;reason="Hold the load until it is completed at the intended RPE, then advance the training max.";success=allDone;}
  } else if(goal==="Hybrid") {
    const readiness=data.settings.readiness?.status||"GREEN";
    if(feedback==="easy"&&allDone&&readiness!=="RED"){next=nearestIncrement(load+inc,inc);reason="Strength progressed without a recovery red flag; advance conservatively around Engine demands.";success=true;}
    else {next=load;reason="Hold load to protect concurrent Strength and Engine recovery.";success=allDone;}
  } else {
    if(feedback==="easy"&&allDone){next=nearestIncrement(load+inc,inc);reason="Quality prescription completed with reserve; progress next session.";success=true;}
  }
  return {goal,method:methodologyForExercise(exercise).name,currentLoad:load,nextLoad:next,reason,success,failed};
}
function applyCompletedWorkoutProgression(session){
  if(!session||session.cardioType)return;
  (session.exercises||[]).forEach(exercise=>{
    const decision=progressionDecision(exercise), rec=progressionRecord(exercise.name);
    rec.currentLoad=decision.currentLoad||rec.currentLoad; rec.nextLoad=decision.nextLoad||rec.currentLoad; rec.lastFeedback=exercise.feedback||"unrated";
    rec.successfulSessions=(rec.successfulSessions||0)+(decision.success?1:0); rec.failedSessions=(rec.failedSessions||0)+(decision.failed?1:0); rec.progressionReason=decision.reason;
    const reps=completedNumericReps(exercise), load=decision.currentLoad;
    if(load&&reps.length){const best=Math.max(...reps);rec.estimated1RM=Math.round(load*(1+best/30));}
    rec.history=(rec.history||[]).slice(-19);rec.history.push({date:session.completedAt,load:decision.currentLoad,nextLoad:decision.nextLoad,feedback:exercise.feedback||"unrated",method:decision.method,reason:decision.reason});
  });
}
function exerciseProgressionSummary(name){
  const rec=progressionRecord(name), method=DISCIPLINE_METHODS[activeStrengthGoal()]||DISCIPLINE_METHODS.Hybrid;
  return {nextLoad:rec.nextLoad,reason:rec.progressionReason,method:method.name};
}
