"use strict";

/* Bell Performance 13.8.4 — Independent Daily Sessions
   One dashboard state per date and broad session type. The commercial Home renderer
   reads this module directly; this file does not attempt to replace another renderer. */
(function(){
  const TYPES=["strength","engine","core","mobility"];
  const sameDay=(value,key)=>String(value||"").slice(0,10)===String(key||"").slice(0,10);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));

  function currentKey(){
    try{return typeof selectedDashboardDateKey==="function"?selectedDashboardDateKey():localDateKey();}
    catch(_){return new Date().toISOString().slice(0,10);}
  }
  function today(){
    try{return typeof todayKey==="function"?todayKey():localDateKey();}
    catch(_){return new Date().toISOString().slice(0,10);}
  }
  function ensureStore(){
    data.dailySessionStatus=data.dailySessionStatus&&typeof data.dailySessionStatus==="object"?data.dailySessionStatus:{};
    return data.dailySessionStatus;
  }
  function dayState(key=currentKey()){
    const store=ensureStore();
    store[key]=store[key]&&typeof store[key]==="object"?store[key]:{};
    TYPES.forEach(type=>{
      store[key][type]=store[key][type]&&typeof store[key][type]==="object"?store[key][type]:{status:"planned"};
    });
    return store[key];
  }
  function inferHistoryType(record){
    const explicit=String(record?.dailySessionType||record?.sessionType||record?.completionIdentity?.type||"").toLowerCase();
    if(TYPES.includes(explicit))return explicit;
    if(record?.optionalCore||/^C-/i.test(String(record?.name||record?.mission||"")))return "core";
    if(record?.cardioType||record?.engineMetrics||/^R-/i.test(String(record?.name||record?.mission||"")))return "engine";
    return "strength";
  }
  function seedFromExisting(key=currentKey()){
    const state=dayState(key);
    (data.history||[]).forEach(record=>{
      if(!(record?.completed||record?.status==="completed"))return;
      if(!sameDay(record?.dailySessionDate||record?.scheduledDate||record?.completedAt,key))return;
      const type=inferHistoryType(record);
      if(TYPES.includes(type))state[type]={status:"completed",completedAt:record.completedAt||new Date().toISOString()};
    });
    try{if(typeof optionalCoreCompletedForDate==="function"&&optionalCoreCompletedForDate(key))state.core={status:"completed"};}catch(_){}
    try{if(data.mobility?.completedDates?.includes(key))state.mobility={status:"completed"};}catch(_){}
    return state;
  }
  function setComplete(type,key=currentKey(),completedAt=new Date().toISOString()){
    if(!TYPES.includes(type))return;
    dayState(key)[type]={status:"completed",completedAt};
    if(typeof saveData==="function")saveData({render:false});
  }
  function isComplete(type,key=currentKey()){
    return seedFromExisting(key)?.[type]?.status==="completed";
  }

  function usualMinutes(){
    let profile=null;
    try{profile=typeof athleteProfile==="function"?athleteProfile():data.athleteProfile;}catch(_){}
    return clamp(profile?.availability?.sessionMinutes||data.trainingBlock?.sessionMinutes||data.settings?.sessionMinutes||60,30,120);
  }
  function todayMinutes(key=currentKey()){
    const readiness=data.settings?.readiness||{};
    const current=key===today();
    const checked=current&&(readiness.lastPromptDate===today()||readiness.lastPromptDate===key||readiness.checkInVersion);
    return checked?clamp(readiness.timeMinutes||usualMinutes(),30,120):usualMinutes();
  }
  function coreMinutes(){
    const usual=usualMinutes();
    if(usual<=45)return 5;
    if(usual<=75)return 8;
    if(usual<=90)return 10;
    if(usual<=105)return 12;
    return 15;
  }
  function sessionOptional(session,sessions){
    if(session?.optional===true)return true;
    const text=`${session?.label||""} ${session?.detail||""} ${session?.mission||""}`.toLowerCase();
    if(/optional|if time allows|bonus/.test(text))return true;
    try{if(typeof bellSessionOptional==="function")return bellSessionOptional(session,sessions);}catch(_){}
    return false;
  }
  function plannedMinutes(session){
    let fallback=30;
    try{fallback=Number(scaledTemplate(session?.mission)?.duration)||30;}catch(_){}
    return Math.max(10,Number(session?.prescribedDuration)||Number(session?.allocatedMinutes)||fallback);
  }
  function rowLabel(row,key=currentKey()){
    if(row.type==="core"){
      try{return coreTemplate(coreSessionName(key)).label;}catch(_){return "Core Training";}
    }
    if(row.type==="mobility"){
      try{return `${resolvedMobilityFocus()} Mobility`;}catch(_){return "Daily Mobility";}
    }
    try{return premiumDisplayLabel(row.session);}catch(_){return String(row.session?.label||row.session?.mission||"Training");}
  }
  function rowDescription(row){
    if(row.type==="core")return "Focused trunk training programmed to support lifting, posture, and athletic control.";
    if(row.type==="mobility")return "Daily movement-quality work outside the required training-time budget.";
    try{return bellMissionSessionDescription(row.session);}catch(_){}
    try{return premiumSessionDescription(row.session);}catch(_){}
    return "Complete the prescribed work with controlled effort and quality execution.";
  }

  function buildRows(key=currentKey()){
    let sessions=[];
    try{sessions=(typeof premiumAllSessions==="function"?premiumAllSessions():[]).slice();}catch(_){}
    sessions.sort((a,b)=>({strength:0,engine:1}[premiumSessionType(a)]??2)-({strength:0,engine:1}[premiumSessionType(b)]??2));
    const state=seedFromExisting(key);
    const available=todayMinutes(key);
    const usual=usualMinutes();
    const rows=sessions.map(session=>({
      session,
      type:premiumSessionType(session),
      planned:plannedMinutes(session),
      optional:sessionOptional(session,sessions),
      synthetic:false
    }));
    const hasTraining=rows.some(row=>row.type==="strength"||row.type==="engine");
    if(hasTraining)rows.push({type:"core",planned:coreMinutes(),optional:false,synthetic:true});
    rows.push({type:"mobility",planned:Math.max(5,Number(data.mobility?.minutes)||10),optional:true,outsideBudget:true,synthetic:true});

    const required=rows.filter(row=>!row.optional&&!row.outsideBudget);
    const core=required.find(row=>row.type==="core");
    const coreAllocation=Math.min(core?.planned||0,Math.max(0,available-20));
    let remaining=Math.max(0,available-coreAllocation);
    const training=required.filter(row=>row.type!=="core");

    if(training.length===1){
      training[0].minutes=Math.max(15,remaining);
    }else if(training.length>1){
      const strength=training.find(row=>row.type==="strength");
      const engine=training.find(row=>row.type==="engine");
      if(strength&&engine){
        const minimumEngine=available<=45?10:available<=75?15:20;
        const desiredEngine=Math.round(Math.min(engine.planned,Math.max(minimumEngine,remaining*.28))/5)*5;
        engine.minutes=Math.max(10,Math.min(desiredEngine,Math.max(10,remaining-15)));
        strength.minutes=Math.max(15,remaining-engine.minutes);
      }else{
        const total=training.reduce((sum,row)=>sum+row.planned,0)||1;
        let assigned=0;
        training.forEach((row,index)=>{
          row.minutes=index===training.length-1?Math.max(10,remaining-assigned):Math.max(10,Math.round((remaining*row.planned/total)/5)*5);
          assigned+=row.minutes;
        });
      }
    }
    if(core)core.minutes=coreAllocation||Math.min(core.planned,5);
    rows.filter(row=>row.optional&&!row.outsideBudget).forEach(row=>{row.minutes=Math.min(row.planned,20);});
    rows.filter(row=>row.outsideBudget).forEach(row=>{row.minutes=row.planned;});

    rows.forEach(row=>{
      row.completed=Boolean(state[row.type]?.status==="completed"||row.session?.completed);
      row.label=rowLabel(row,key);
      row.description=rowDescription(row);
      row.key=key;
      row.required=!row.optional&&!row.outsideBudget;
      row.status=row.completed?"Complete":row.outsideBudget?"Daily":row.optional?"Optional":"Required";
    });
    return {rows,available,usual,key,required:rows.filter(row=>row.required)};
  }

  function setPendingIdentity(type,key,minutes){
    window.BellPendingDailySession={type,key,minutes};
  }
  function attachActiveIdentity(type,key,minutes){
    setPendingIdentity(type,key,minutes);
    if(!data.activeWorkout)return;
    data.activeWorkout.dailySessionType=type;
    data.activeWorkout.dailySessionDate=key;
    data.activeWorkout.dailyAllocatedMinutes=minutes;
    data.activeWorkout.duration=minutes;
    data.activeWorkout.prescribedDuration=minutes;
    if(typeof saveData==="function")saveData({render:false});
  }
  function findRow(type,key=currentKey()){
    return buildRows(key).rows.find(row=>row.type===type);
  }
  function start(type,key=currentKey()){
    const row=findRow(type,key);if(!row||row.completed)return;
    if(type==="mobility"){
      if(typeof openMobilityRoutine==="function")openMobilityRoutine(key);
      return;
    }
    if(type==="core"){
      const name=typeof coreSessionName==="function"?coreSessionName(key):"C-A Optional Core";
      if(typeof beginWorkout==="function")beginWorkout(name,{optionalCore:true,scheduledDate:key,prescribedDuration:row.minutes});
      attachActiveIdentity("core",key,row.minutes);
      return;
    }
    if(!row.session)return;
    setPendingIdentity(type,key,row.minutes);
    const mission=typeof bellCanonicalWorkoutMission==="function"?bellCanonicalWorkoutMission(row.session.mission):row.session.mission;
    if(typeof beginWorkout==="function")beginWorkout(mission,{planId:row.session.planId,sessionKey:row.session.sessionKey,scheduledDate:key,prescribedDuration:row.minutes});
    else if(typeof beginPlannedWorkout==="function")beginPlannedWorkout(row.session.planId,row.session.sessionKey,row.session.mission);
    attachActiveIdentity(type,key,row.minutes);
  }
  function preview(type,key=currentKey()){
    const row=findRow(type,key);if(!row)return;
    if(type==="mobility"){
      if(typeof openMobilityRoutine==="function")openMobilityRoutine(key);
      return;
    }
    if(type==="core"){
      const name=typeof coreSessionName==="function"?coreSessionName(key):"C-A Optional Core";
      const template=typeof coreTemplate==="function"?coreTemplate(name):null;
      if(template&&typeof openWorkoutPreview==="function"){
        openWorkoutPreview({...template,name,duration:row.minutes},()=>{closeWorkoutPreview();start("core",key);});
      }else start("core",key);
      return;
    }
    const mission=typeof bellCanonicalWorkoutMission==="function"?bellCanonicalWorkoutMission(row.session.mission):row.session.mission;
    let workout=null;
    try{workout=typeof workoutTemplatePreview==="function"?workoutTemplatePreview(mission,{planId:row.session.planId,sessionKey:row.session.sessionKey}):null;}catch(_){}
    if(workout&&typeof openWorkoutPreview==="function"){
      openWorkoutPreview({...workout,duration:row.minutes},()=>{closeWorkoutPreview();start(type,key);});
    }else if(typeof previewPlannedWorkout==="function")previewPlannedWorkout(row.session.planId,row.session.sessionKey,row.session.mission);
  }

  // Attach a stable broad session identity every time a planned workout is launched,
  // including launches from the preview modal.
  if(typeof beginPlannedWorkout==="function"){
    const originalBegin=beginPlannedWorkout;
    beginPlannedWorkout=function(planId,sessionKey,mission){
      let type="strength",key=currentKey(),minutes=30;
      try{
        const row=buildRows(key).rows.find(item=>item.session&&String(item.session.sessionKey)===String(sessionKey));
        if(row){type=row.type;minutes=row.minutes;}
        else if(/^R-/i.test(String(mission||"")))type="engine";
      }catch(_){}
      setPendingIdentity(type,key,minutes);
      const result=originalBegin.apply(this,arguments);
      attachActiveIdentity(type,key,minutes);
      return result;
    };
    window.beginPlannedWorkout=beginPlannedWorkout;
  }

  if(typeof completeWorkout==="function"){
    const originalComplete=completeWorkout;
    completeWorkout=function(){
      const active=data.activeWorkout?{...data.activeWorkout}:null;
      const pending=window.BellPendingDailySession||{};
      const key=active?.dailySessionDate||pending.key||active?.scheduledDate||today();
      const type=String(active?.dailySessionType||pending.type||inferHistoryType(active)).toLowerCase();
      const completedAt=new Date().toISOString();
      if(TYPES.includes(type))setComplete(type,key,completedAt);
      let result;
      try{result=originalComplete.apply(this,arguments);}
      finally{
        if(TYPES.includes(type))setComplete(type,key,completedAt);
        window.BellPendingDailySession=null;
        if(typeof renderBellCommercialHome==="function")setTimeout(renderBellCommercialHome,0);
      }
      return result;
    };
    window.completeWorkout=completeWorkout;
  }

  if(typeof finishMobilityRoutine==="function"){
    const originalMobility=finishMobilityRoutine;
    finishMobilityRoutine=function(){
      let key=currentKey();
      try{key=activeMobilityDateKey||key;}catch(_){}
      const result=originalMobility.apply(this,arguments);
      try{if(data.mobility?.completedDates?.includes(key))setComplete("mobility",key);}catch(_){}
      if(typeof renderBellCommercialHome==="function")setTimeout(renderBellCommercialHome,0);
      return result;
    };
    window.finishMobilityRoutine=finishMobilityRoutine;
  }

  window.BellDailySessions={buildRows,dayState,setComplete,isComplete,usualMinutes,todayMinutes,start,preview,rowLabel,rowDescription};
})();
