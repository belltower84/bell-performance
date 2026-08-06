"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert");
const code=fs.readFileSync(require("path").join(__dirname,"..","js","integrated-movement-preparation-13221.js"),"utf8");
function context({injury=false,strength=true}={}){
  const ctx={
    console,setTimeout:fn=>fn(),clearTimeout(){},alert(){},confirm(){return true;},
    document:{readyState:"complete",getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];},addEventListener(){}},
    data:{mobility:{completedDates:[],checks:{},sessionLog:[]},settings:{},activeWorkout:null},
    saveData(){},todayKey(){return"2026-08-05";},selectedDashboardDateKey(){return"2026-08-05";},
    BellAdaptiveMobility:{prescription(){return {mode:injury?"rehab":"healthy",kind:injury?"Rehab Support":"Movement Preparation",title:injury?"Ankle Rehab":"Upper Press Preparation",minutes:10,blocked:false,why:"Matched prescription",evidence:"Evidence",disclaimer:"Use symptom limits",movements:[{id:"one",name:"Move One",dose:"8 reps",cue:"Control",why:"Prepare"},{id:"two",name:"Move Two",dose:"10 reps",cue:"Smooth",why:"Prime"}]};}},
    BellDailySessions:{
      buildRows(){return {key:"2026-08-05",rows:strength?[{type:"strength",optional:false,required:true,minutes:60,label:"Strength",description:"Primary work"},{type:"mobility",optional:true,required:false,minutes:10,label:"Mobility",description:"Old"}]:[{type:"engine",optional:false,required:true,minutes:30,label:"Run",description:"Run"},{type:"mobility",optional:true,required:false,minutes:10,label:"Mobility",description:"Old"}],required:[],requiredMinutes:0};},
      setComplete(){},preview(){},start(){}
    },
    bellWarmupBlueprint(){return[{id:"base",title:"Base"}]},
    bellWarmupHandled(){return true;},
    bellEnsureWarmupState(active){active.warmupItems=active.warmupItems||ctx.bellWarmupBlueprint(active).map(x=>({...x,done:false,skipped:false}));return active.warmupItems;},
    toggleWorkoutWarmupItem(){},advanceToTraining(){ctx.advanced=true;},renderWarmupPanel(){},openWorkoutPreview(){},closeWorkout(){},
    window:null
  };
  ctx.window=ctx;
  return vm.createContext(ctx);
}
{
  const c=context({strength:true});vm.runInContext(code,c);
  const workout={name:"S-3 Athletic Upper",dailySessionType:"strength",scheduledDate:"2026-08-05",exercises:[{name:"Push Press"}]};
  const items=c.bellWarmupBlueprint(workout);
  assert.equal(items.length,2);assert.equal(items[0].title,"Move One");assert(items.every(x=>x.integratedPreparation));
  const model=c.BellDailySessions.buildRows("2026-08-05");
  assert.equal(model.rows.filter(x=>x.type==="mobility").length,0);assert(model.rows[0].description.includes("required movement preparation"));
  const panel={innerHTML:"",classList:{remove(){}}};
  c.document.getElementById=id=>id==="warmupPanel"?panel:null;
  c.data.activeWorkout=workout;c.bellEnsureWarmupState(workout);c.renderWarmupPanel();
  assert(panel.innerHTML.includes("bp13221-workout-prep"));assert(panel.innerHTML.includes("Move One"));
  workout.warmupItems.forEach(item=>item.done=true);c.advanceToTraining();
  assert(c.advanced===true);assert(c.data.mobility.completedDates.includes("2026-08-05"));
  assert(c.data.mobility.sessionLog.some(entry=>entry.source==="integrated_strength_preparation"));
}
{
  const c=context({strength:false,injury:false});vm.runInContext(code,c);
  const model=c.BellDailySessions.buildRows("2026-08-05"),mob=model.rows.find(x=>x.type==="mobility");
  assert.equal(mob.label,"Optional Movement Prehab");assert.equal(mob.required,false);
  const engine={name:"R-2 Easy Run",dailySessionType:"engine",cardioType:"Running",exercises:[]};assert.equal(c.bellWarmupBlueprint(engine)[0].id,"base");
}
{
  const c=context({strength:false,injury:true});vm.runInContext(code,c);
  const model=c.BellDailySessions.buildRows("2026-08-05"),mob=model.rows.find(x=>x.type==="mobility");
  assert.equal(mob.label,"Required Rehab Support");assert.equal(mob.required,true);assert(model.required.includes(mob));
}
console.log("13.22.1 integrated movement preparation tests passed");
