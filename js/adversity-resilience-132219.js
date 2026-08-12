"use strict";
/* Bell Performance 13.22.19 — calendar anchoring + resilient mid-week schedule adaptation. */
(function(){
  const VERSION="13.22.19";
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const weekdays=()=>Array.isArray(window.BELL_WEEKDAYS)?window.BELL_WEEKDAYS:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const canonical=value=>typeof bellCanonicalWorkoutMission==="function"?bellCanonicalWorkoutMission(value):String(value||"").trim();
  const localKey=value=>{
    if(!value)return "";
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return String(value);
    const d=new Date(value);if(Number.isNaN(d.getTime()))return String(value).slice(0,10);
    return typeof localDateKey==="function"?localDateKey(d):`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const recordDate=record=>record?.scheduledDate||record?.completionIdentity?.scheduledDate||record?.dailySessionDate||localKey(record?.completedAt);
  const recordMission=record=>canonical(record?.completionIdentity?.mission||record?.mission||record?.name||record?.label);
  const blockLength=block=>Math.max(1,Number(block?.lengthWeeks)||12);
  const today=()=>typeof localDateKey==="function"?localDateKey():new Date().toISOString().slice(0,10);
  const weekStart=(block,week)=>{
    const base=block?.startDate||today();
    const monday=typeof mondayKeyFor==="function"?mondayKeyFor(base):base;
    return typeof addLocalDays==="function"?addLocalDays(monday,(Math.max(1,Number(week)||1)-1)*7):monday;
  };
  const dateDiffDays=(a,b)=>{
    const da=typeof localDateFromKey==="function"?localDateFromKey(a):new Date(`${a}T12:00:00`);
    const db=typeof localDateFromKey==="function"?localDateFromKey(b):new Date(`${b}T12:00:00`);
    return Math.round((db-da)/86400000);
  };
  function expectedWeek(block=data.trainingBlock,key=today()){
    if(!block?.enabled||!block.startDate)return Number(block?.currentWeek)||1;
    const startMonday=typeof mondayKeyFor==="function"?mondayKeyFor(block.startDate):block.startDate;
    const todayMonday=typeof mondayKeyFor==="function"?mondayKeyFor(key):key;
    const raw=Math.floor(dateDiffDays(startMonday,todayMonday)/7)+1;
    return Math.max(1,Math.min(blockLength(block),raw));
  }
  function formalPlan(plan){
    return (plan||[]).filter(item=>{
      if(!item||["skipped","replaced"].includes(item.status))return false;
      if(typeof bellSessionProfile==="function"){
        const p=bellSessionProfile(item);return Boolean(p.strength||p.engine);
      }
      return !String(item.mission||"").startsWith("M-");
    });
  }
  function archiveWeekSnapshot(block,week,plan=data.plan){
    if(!block||!week||!Array.isArray(plan))return;
    block.weeks=Array.isArray(block.weeks)?block.weeks:[];
    const index=block.weeks.findIndex(entry=>Number(entry.week)===Number(week));
    const previous=index>=0?block.weeks[index]:{};
    const entry={...previous,week:Number(week),status:Number(week)<Number(block.currentWeek||week)?"complete":previous.status||"planned",generatedAt:previous.generatedAt||new Date().toISOString(),lastViewedAt:new Date().toISOString(),plan:clone(plan)};
    if(index>=0)block.weeks[index]=entry;else block.weeks.push(entry);
  }
  function loadWeekEntry(block,week){
    block.weeks=Array.isArray(block.weeks)?block.weeks:[];
    let entry=block.weeks.find(x=>Number(x.week)===Number(week));
    if(!entry||!formalPlan(entry.plan).length){
      const plan=typeof bpGenerateWeekForBlock==="function"?bpGenerateWeekForBlock(block,week):[];
      entry={...(entry||{}),week:Number(week),status:"active",generatedAt:new Date().toISOString(),plan:clone(plan)};
      block.weeks=block.weeks.filter(x=>Number(x.week)!==Number(week));block.weeks.push(entry);
    }
    return entry;
  }
  function resetHomeWeekPointer(week){
    try{if(typeof bpScheduleWeekNumber!=="undefined")bpScheduleWeekNumber=Number(week);}catch(_){ }
    try{if(typeof bpPreviewedWeekNumber!=="undefined")bpPreviewedWeekNumber=null;}catch(_){ }
  }
  function syncActiveWeek(options={}){
    const block=data.trainingBlock;
    if(!block?.enabled||!block.startDate)return false;
    const stored=Math.max(1,Number(block.currentWeek)||1),calendar=expectedWeek(block);
    // Calendar time may advance the plan automatically. Never force an explicitly advanced week backward.
    const target=Math.max(stored,calendar);
    let changed=false;
    if(target>stored){
      archiveWeekSnapshot(block,stored,data.plan||[]);
      block.currentWeek=target;
      const entry=loadWeekEntry(block,target);
      data.plan=clone(entry.plan||[]);
      if(typeof stampCurrentPlanDates==="function")stampCurrentPlanDates();
      if(typeof bellRepairScheduleCompletionIdentity==="function")bellRepairScheduleCompletionIdentity();
      block.lastCalendarAdvance={fromWeek:stored,toWeek:target,date:today(),at:new Date().toISOString(),reason:"calendar_progression"};
      data.dayNavigation=data.dayNavigation||{};data.dayNavigation.selectedDate=today();data.dayNavigation.lastLocalDate=today();
      changed=true;
    }
    resetHomeWeekPointer(block.currentWeek);
    if(changed&&options.save!==false&&typeof saveData==="function")saveData({render:false});
    return changed;
  }
  function weekDateRange(block,week){const start=weekStart(block,week);return {start,end:typeof addLocalDays==="function"?addLocalDays(start,6):start};}
  function typeFor(value){
    const p=typeof bellSessionProfile==="function"?bellSessionProfile(value):null;
    if(p?.strength)return "strength";if(p?.engine)return "engine";
    const t=String(value?.type||"").toLowerCase();if(t==="strength"||t==="engine")return t;
    return "other";
  }
  function completedWeekRecords(block,week){
    const {start,end}=weekDateRange(block,week);
    return (data.history||[]).filter(record=>{
      if(!(record?.completed||record?.status==="completed"))return false;
      if(record?.optionalCore||/^C-|^M-/i.test(String(record?.name||record?.mission||"")))return false;
      const d=recordDate(record);if(!d||d<start||d>end)return false;
      return ["strength","engine"].includes(typeFor({...record,mission:recordMission(record)}));
    });
  }
  function historicalItem(record,index){
    const date=recordDate(record),d=typeof localDateFromKey==="function"?localDateFromKey(date):new Date(`${date}T12:00:00`);
    const day=new Intl.DateTimeFormat("en-US",{weekday:"long"}).format(d);
    const mission=recordMission(record)||record.name||record.mission||"Completed Session";
    return {
      id:`bell-history-${date}-${index}-${String(mission).replace(/[^a-z0-9]+/gi,"-").toLowerCase()}`,
      day,scheduledDate:date,mission,
      customLabel:record.label||record.displayName||record.customLabel||record.name||mission,
      detail:"Completed before this week's schedule was adjusted.",
      prescribedDuration:Number(record.durationMinutes)||Number(record.prescribedDuration)||undefined,
      done:true,status:"completed",completedAt:record.completedAt||new Date(`${date}T12:00:00`).toISOString(),
      adversityPreserved:true
    };
  }
  function remainingAvailableDays(block,week,normalDays){
    const start=weekStart(block,week),now=today();
    return weekdays().filter((day,index)=>{
      const key=typeof addLocalDays==="function"?addLocalDays(start,index):start;
      return (normalDays||[]).includes(day)&&key>=now;
    });
  }
  function weeklyTargets(block,availableDays){
    let targets=typeof bellDisciplineExposureTargets==="function"?bellDisciplineExposureTargets(block):{strength:Number(block?.strengthDays)||3,engine:Number(block?.runDays)||2};
    if(typeof bellMissionAlignedExposureTargets==="function")targets=bellMissionAlignedExposureTargets(targets,block,availableDays);
    return {strength:Math.max(0,Number(targets.strength)||0),engine:Math.max(0,Number(targets.engine)||0)};
  }
  function adaptationFuturePlan(block,week,generatedPlan,normalDays,completedRecords){
    const remainingDays=remainingAvailableDays(block,week,normalDays);
    if(!remainingDays.length)return [];
    const desired=weeklyTargets(block,normalDays);
    const completed={strength:0,engine:0};completedRecords.forEach(record=>{const t=typeFor({...record,mission:recordMission(record)});if(t in completed)completed[t]++;});
    let target={strength:Math.max(0,desired.strength-completed.strength),engine:Math.max(0,desired.engine-completed.engine)};
    if(typeof bellPartialWeekTargets==="function")target=bellPartialWeekTargets(target,remainingDays);
    const completedMissions=new Set(completedRecords.map(record=>recordMission(record)).filter(Boolean));
    let atomic=typeof bellExplodeConcurrentPlan==="function"?bellExplodeConcurrentPlan(generatedPlan||[]):clone(generatedPlan||[]);
    atomic=atomic.filter(item=>["strength","engine"].includes(typeFor(item))&&!completedMissions.has(canonical(item.mission)));
    if(typeof bellIntegrateMobilityAndCore==="function")atomic=bellIntegrateMobilityAndCore(atomic);
    if(typeof bellEnsureDisciplineExposures==="function")atomic=bellEnsureDisciplineExposures(atomic,block,target);
    if(typeof bellTrimPlanToTargets==="function")atomic=bellTrimPlanToTargets(atomic,target);
    if(typeof bellApplyDaysToPlan==="function")atomic=bellApplyDaysToPlan(atomic,remainingDays);
    return atomic.map(item=>({...item,done:false,status:"planned",adversityRescheduled:true}));
  }
  function mergeHistoricalCompleted(futurePlan,records){
    const represented=new Set((futurePlan||[]).map(item=>`${item.scheduledDate||""}|${canonical(item.mission)}`));
    const historical=[];
    records.forEach((record,index)=>{
      const key=`${recordDate(record)}|${recordMission(record)}`;
      if(!represented.has(key)){historical.push(historicalItem(record,index));represented.add(key);}
    });
    const order=Object.fromEntries(weekdays().map((d,i)=>[d,i]));
    return [...historical,...(futurePlan||[])].sort((a,b)=>(a.scheduledDate||"").localeCompare(b.scheduledDate||"")||(order[a.day]??99)-(order[b.day]??99));
  }
  function recordAdaptation(block,oldDays,newDays,week){
    data.scheduleAdaptations=Array.isArray(data.scheduleAdaptations)?data.scheduleAdaptations:[];
    data.scheduleAdaptations.push({at:new Date().toISOString(),date:today(),week:Number(week),type:"availability_change",fromDays:[...(oldDays||[])],toDays:[...(newDays||[])],policy:"preserve_completed_rebuild_remaining"});
    if(data.scheduleAdaptations.length>50)data.scheduleAdaptations=data.scheduleAdaptations.slice(-50);
    block.lastScheduleAdaptation=data.scheduleAdaptations[data.scheduleAdaptations.length-1];
  }
  function rebuildAroundAvailability(newDays,oldDays){
    const block=data.trainingBlock;if(!block?.enabled)return;
    syncActiveWeek({save:false});
    const week=Number(block.currentWeek)||1;
    const completedRecords=completedWeekRecords(block,week);
    // Preserve completed/archived weeks. Current and future prescriptions are rebuilt from the new constraint.
    block.weeks=Array.isArray(block.weeks)?block.weeks.filter(entry=>Number(entry.week)<week):[];
    const generated=typeof bpGenerateWeekForBlock==="function"?bpGenerateWeekForBlock(block,week):(()=>{if(typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();return clone(data.plan||[]);})();
    const future=adaptationFuturePlan(block,week,generated,newDays,completedRecords);
    data.plan=mergeHistoricalCompleted(future,completedRecords);
    if(typeof stampCurrentPlanDates==="function"){
      // Historical entries already own their exact dates; only stamp missing regenerated dates.
      const stamped=data.plan.filter(x=>!x.adversityPreserved);const preserved=data.plan.filter(x=>x.adversityPreserved);
      const saved=data.plan;data.plan=stamped;stampCurrentPlanDates();const restamped=data.plan;data.plan=[...preserved,...restamped].sort((a,b)=>(a.scheduledDate||"").localeCompare(b.scheduledDate||""));
      void saved;
    }
    if(typeof bellRepairScheduleCompletionIdentity==="function")bellRepairScheduleCompletionIdentity();
    block.weeks.push({week,status:"active",generatedAt:new Date().toISOString(),scheduleAdapted:true,plan:clone(data.plan)});
    recordAdaptation(block,oldDays,newDays,week);
    resetHomeWeekPointer(week);
    data.dayNavigation=data.dayNavigation||{};data.dayNavigation.selectedDate=today();
  }
  function cloudSync(){try{if(typeof bellSyncMissionAndPlan==="function"&&typeof bellCloudConnected==="function"&&bellCloudConnected())typeof bellRunInBackground==="function"?bellRunInBackground(bellSyncMissionAndPlan()):bellSyncMissionAndPlan();}catch(_){ }}

  const priorModern=window.saveModernTrainingAvailability;
  window.saveModernTrainingAvailability=function(){
    const host=document.getElementById("settingsWeekdayChoices"),newDays=host&&typeof bellSelectedCheckboxDays==="function"?bellSelectedCheckboxDays(host):[];
    if(newDays.length<2)return alert("Select at least two normal training days.");
    const oldDays=typeof bellNormalTrainingDays==="function"?[...bellNormalTrainingDays()]:[];
    const p=window.BellAthleteProfile?.get?.();
    if(p?.availability){p.availability.normalDays=[...newDays];p.availability.sessionMinutes=Number(document.getElementById("settingsSessionMinutes")?.value)||60;p.availability.preferredTime=document.getElementById("settingsPreferredTime")?.value||"Flexible";p.availability.reliability=document.getElementById("settingsScheduleReliability")?.value||"Mostly consistent";p.availability.minimumDays=Math.min(newDays.length,Number(document.getElementById("settingsMinimumDays")?.value)||3);}
    if(typeof bellSetNormalTrainingDays==="function")bellSetNormalTrainingDays(newDays);
    try{window.BellAthleteProfile?.syncToLegacy?.();}catch(_){ }
    rebuildAroundAvailability(newDays,oldDays);
    if(typeof saveData==="function")saveData({render:false});cloudSync();if(typeof renderApp==="function")renderApp();
    alert("Training availability saved. Bell preserved completed work and rebuilt only the remaining week around your new days.");
  };
  const priorSimple=window.bellSaveSettingsAvailability;
  window.bellSaveSettingsAvailability=function(){
    const host=document.getElementById("settingsWeekdayChoices"),newDays=host&&typeof bellSelectedCheckboxDays==="function"?bellSelectedCheckboxDays(host):[];
    if(newDays.length<2)return alert("Select at least two normal training days.");
    const oldDays=typeof bellNormalTrainingDays==="function"?[...bellNormalTrainingDays()]:[];
    if(typeof bellSetNormalTrainingDays==="function")bellSetNormalTrainingDays(newDays);
    const p=window.BellAthleteProfile?.get?.();if(p?.availability)p.availability.normalDays=[...newDays];
    try{window.BellAthleteProfile?.syncToLegacy?.();}catch(_){ }
    rebuildAroundAvailability(newDays,oldDays);
    if(typeof saveData==="function")saveData({render:false});cloudSync();if(typeof renderApp==="function")renderApp();
    alert("Training availability saved. Bell preserved completed work and rebuilt only the remaining week around your new days.");
  };

  const priorRender=window.renderApp;
  if(typeof priorRender==="function")window.renderApp=function(){syncActiveWeek({save:false});return priorRender.apply(this,arguments);};
  const priorShow=window.showScreen;
  if(typeof priorShow==="function")window.showScreen=function(name){
    if(name==="home"){
      syncActiveWeek({save:false});resetHomeWeekPointer(Number(data.trainingBlock?.currentWeek)||1);
      data.dayNavigation=data.dayNavigation||{};data.dayNavigation.selectedDate=today();
    }
    return priorShow.apply(this,arguments);
  };

  window.BellAdversityResilience={version:VERSION,expectedWeek,syncActiveWeek,rebuildAroundAvailability,completedWeekRecords,remainingAvailableDays};
  document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{
    const changed=syncActiveWeek({save:false});
    if(changed&&typeof saveData==="function")saveData({render:false});
    try{if(typeof renderApp==="function")renderApp();}catch(error){console.warn("Bell adversity-resilience startup render failed",error);}
  },220));
})();
