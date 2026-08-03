"use strict";

/* Bell Performance 13.8.5 — Independent Daily Sessions
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
    const identity=String(record?.name||record?.mission||"");
    if(record?.optionalCore||/^C-/i.test(identity))return "core";
    if(/^M-/i.test(identity)||/mobility|daily reset|recovery flow/i.test(identity))return "mobility";
    if(record?.cardioType||record?.engineMetrics||/^R-/i.test(identity))return "engine";
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
  function safeSessionType(session){
    const mission=String(session?.mission||"").trim();
    const text=`${mission} ${session?.label||""} ${session?.detail||""}`.toLowerCase();
    if(/^M-/i.test(mission)||/mobility|daily reset|recovery flow/.test(text))return "mobility";
    if(/^C-/i.test(mission)||/\bcore\b|\bab\b|trunk stability/.test(text))return "core";
    try{return premiumSessionType(session);}catch(_){return /^R-/i.test(mission)?"engine":"strength";}
  }
  function stripDurationLanguage(value){
    let text=String(value||"").replace(/\s+/g," ").trim();
    text=text.replace(/(^|[•·;,.]\s*)\d+\s*(?:[–—-]\s*\d+\s*)?(?:min(?:ute)?s?)\b\s*(?:of\s*)?/gi,(match,prefix)=>prefix?prefix.replace(/[•·;,.]\s*$/,''):"");
    text=text.replace(/^\s*[•·;,.:-]+\s*/,"").replace(/\s*([•·])\s*([•·])\s*/g," $1 ").trim();
    return text?text.charAt(0).toUpperCase()+text.slice(1):"Complete the prescribed work with controlled effort and quality execution.";
  }
  function plannedMinutes(session){
    let fallback=30;
    try{fallback=Number(scaledTemplate(session?.mission)?.duration)||30;}catch(_){}
    return Math.max(10,Number(session?.prescribedDuration)||Number(session?.allocatedMinutes)||fallback);
  }
  function rowLabel(row,key=currentKey()){
    if(row.type==="core"){
      try{return String(coreTemplate(coreSessionName(key)).label||"Core Training").replace(/\s*\+\s*Mobility.*$/i,"").trim();}catch(_){return "Core Training";}
    }
    if(row.type==="mobility"){
      try{return `${resolvedMobilityFocus()} Mobility`;}catch(_){return "Daily Mobility";}
    }
    try{return premiumDisplayLabel(row.session);}catch(_){return String(row.session?.label||row.session?.mission||"Training");}
  }
  function rowDescription(row){
    if(row.type==="core")return "Optional trunk and ab work scaled to your normal training availability.";
    if(row.type==="mobility")return row.recoveryFocus
      ? "Optional mobility, easy movement, and breathing are today’s main recovery focus."
      : "Optional movement-quality work that can be completed separately from training.";
    let description="";
    try{description=bellMissionSessionDescription(row.session)||"";}catch(_){}
    if(!description){try{description=premiumSessionDescription(row.session)||"";}catch(_){}}
    if(row.type==="engine")description=stripDurationLanguage(description);
    return description||"Complete the prescribed work with controlled effort and quality execution.";
  }

  function buildRows(key=currentKey()){
    let sessions=[];
    try{sessions=(typeof premiumAllSessions==="function"?premiumAllSessions():[]).slice();}catch(_){}
    const typeOrder={strength:0,engine:1,core:2,mobility:3};
    sessions.sort((a,b)=>(typeOrder[safeSessionType(a)]??4)-(typeOrder[safeSessionType(b)]??4));
    const state=seedFromExisting(key);
    const available=todayMinutes(key);
    const usual=usualMinutes();
    const rows=sessions.map(session=>({
      session,
      type:safeSessionType(session),
      planned:plannedMinutes(session),
      optional:sessionOptional(session,sessions),
      synthetic:false
    }));
    const hasTraining=rows.some(row=>row.type==="strength"||row.type==="engine");
    const recoveryDay=!hasTraining;

    // Core and mobility are optional support sessions. They never block completion
    // and never inflate the athlete's required training-time budget.
    if(!rows.some(row=>row.type==="core"))rows.push({type:"core",planned:coreMinutes(),optional:true,outsideBudget:true,synthetic:true});
    else rows.filter(row=>row.type==="core").forEach(row=>{row.optional=true;row.outsideBudget=true;});
    if(!rows.some(row=>row.type==="mobility"))rows.push({type:"mobility",planned:Math.max(5,Number(data.mobility?.minutes)||10),optional:true,outsideBudget:true,synthetic:true});
    else rows.filter(row=>row.type==="mobility").forEach(row=>{row.optional=true;row.outsideBudget=true;});

    // Only required Strength and Engine work share today's selected availability.
    const required=rows.filter(row=>(row.type==="strength"||row.type==="engine")&&!row.optional);
    const remaining=Math.max(0,available);
    if(required.length===1){
      required[0].minutes=Math.max(15,remaining);
    }else if(required.length>1){
      const strength=required.find(row=>row.type==="strength");
      const engine=required.find(row=>row.type==="engine");
      if(strength&&engine){
        const minimumEngine=available<=45?10:available<=75?15:20;
        const desiredEngine=Math.round(Math.min(engine.planned,Math.max(minimumEngine,remaining*.28))/5)*5;
        engine.minutes=Math.max(10,Math.min(desiredEngine,Math.max(10,remaining-15)));
        strength.minutes=Math.max(15,remaining-engine.minutes);
      }else{
        const total=required.reduce((sum,row)=>sum+row.planned,0)||1;
        let assigned=0;
        required.forEach((row,index)=>{
          row.minutes=index===required.length-1?Math.max(10,remaining-assigned):Math.max(10,Math.round((remaining*row.planned/total)/5)*5);
          assigned+=row.minutes;
        });
      }
    }
    rows.filter(row=>row.optional&&(row.type==="strength"||row.type==="engine")).forEach(row=>{row.minutes=Math.min(row.planned,20);});
    rows.filter(row=>row.type==="core").forEach(row=>{row.minutes=coreMinutes();});
    rows.filter(row=>row.type==="mobility").forEach(row=>{row.minutes=Math.max(5,Number(data.mobility?.minutes)||row.planned||10);row.recoveryFocus=recoveryDay;});

    rows.sort((a,b)=>{
      if(recoveryDay){const order={mobility:0,core:1,strength:2,engine:3};return (order[a.type]??4)-(order[b.type]??4);}
      return (typeOrder[a.type]??4)-(typeOrder[b.type]??4);
    });
    rows.forEach(row=>{
      row.completed=Boolean(state[row.type]?.status==="completed"||row.session?.completed);
      row.label=rowLabel(row,key);
      row.description=rowDescription(row);
      row.key=key;
      row.required=(row.type==="strength"||row.type==="engine")&&!row.optional;
      row.status=row.completed?"Complete":row.recoveryFocus?"Recovery Focus · Optional":row.optional?"Optional":"Required";
    });
    const requiredRows=rows.filter(row=>row.required);
    const requiredMinutes=requiredRows.reduce((sum,row)=>sum+Number(row.minutes||0),0);
    return {rows,available,usual,key,recoveryDay,required:requiredRows,requiredMinutes};
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
      if(typeof beginWorkout==="function")beginWorkout(name,{optionalCore:true,scheduledDate:key,prescribedDuration:row.minutes,displayLabel:row.label});
      attachActiveIdentity("core",key,row.minutes);
      return;
    }
    if(!row.session)return;
    setPendingIdentity(type,key,row.minutes);
    const mission=typeof bellCanonicalWorkoutMission==="function"?bellCanonicalWorkoutMission(row.session.mission):row.session.mission;
    if(typeof beginWorkout==="function")beginWorkout(mission,{planId:row.session.planId,sessionKey:row.session.sessionKey,scheduledDate:key,prescribedDuration:row.minutes,displayLabel:row.label});
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
        openWorkoutPreview({...template,name,label:row.label,duration:row.minutes},()=>{closeWorkoutPreview();start("core",key);});
      }else start("core",key);
      return;
    }
    const mission=typeof bellCanonicalWorkoutMission==="function"?bellCanonicalWorkoutMission(row.session.mission):row.session.mission;
    let workout=null;
    try{workout=typeof workoutTemplatePreview==="function"?workoutTemplatePreview(mission,{planId:row.session.planId,sessionKey:row.session.sessionKey}):null;}catch(_){}
    if(workout&&typeof openWorkoutPreview==="function"){
      openWorkoutPreview({...workout,label:row.label,duration:row.minutes},()=>{closeWorkoutPreview();start(type,key);});
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
