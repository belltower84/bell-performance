"use strict";

/* Bell Performance 13.8.2 — Independent Daily Sessions
   Keeps the active plan intact. Today’s Mission uses simple date + session-type state. */
(function(){
  const TYPES=["strength","engine","core","mobility"];
  const sameDay=(value,key)=>String(value||"").slice(0,10)===key;

  function dateKey(){return typeof selectedDashboardDateKey==="function"?selectedDashboardDateKey():localDateKey();}
  function ensureStore(){
    data.dailySessionStatus=data.dailySessionStatus&&typeof data.dailySessionStatus==="object"?data.dailySessionStatus:{};
    return data.dailySessionStatus;
  }
  function dayState(key=dateKey()){
    const store=ensureStore();
    store[key]=store[key]&&typeof store[key]==="object"?store[key]:{};
    TYPES.forEach(type=>{store[key][type]=store[key][type]&&typeof store[key][type]==="object"?store[key][type]:{status:"planned"};});
    return store[key];
  }
  function historyType(record){
    const explicit=String(record?.sessionType||record?.completionIdentity?.type||"").toLowerCase();
    if(TYPES.includes(explicit))return explicit;
    if(record?.optionalCore||/^C-/i.test(String(record?.name||record?.mission||"")))return "core";
    if(record?.cardioType||record?.engineMetrics||/^R-/i.test(String(record?.name||record?.mission||"")))return "engine";
    return "strength";
  }
  function seedFromExisting(key=dateKey()){
    const state=dayState(key);
    (data.history||[]).forEach(record=>{
      if(!(record?.completed||record?.status==="completed")||!sameDay(record?.scheduledDate||record?.completedAt,key))return;
      const type=historyType(record);
      if(TYPES.includes(type))state[type]={status:"completed",completedAt:record.completedAt||new Date().toISOString()};
    });
    if(typeof optionalCoreCompletedForDate==="function"&&optionalCoreCompletedForDate(key))state.core={status:"completed"};
    if(data.mobility?.completedDates?.includes(key))state.mobility={status:"completed"};
    return state;
  }
  function setComplete(type,key=dateKey(),completedAt=new Date().toISOString()){
    const state=dayState(key);state[type]={status:"completed",completedAt};
    if(typeof saveData==="function")saveData({render:false});
  }
  function isComplete(type,key=dateKey()){return seedFromExisting(key)?.[type]?.status==="completed";}

  function usualMinutes(){
    const profile=typeof athleteProfile==="function"?athleteProfile():null;
    return Math.max(30,Math.min(120,Number(profile?.availability?.sessionMinutes)||Number(data.trainingBlock?.sessionMinutes)||60));
  }
  function todayMinutes(key=dateKey()){
    const r=data.settings?.readiness||{};
    const checked=key===todayKey()&&(r.lastPromptDate===todayKey()||r.checkInVersion);
    return checked?Math.max(30,Math.min(120,Number(r.timeMinutes)||usualMinutes())):usualMinutes();
  }
  function coreMinutes(){const usual=usualMinutes();return usual<=45?5:usual<=75?8:usual<=90?10:usual<=105?12:15;}
  function sessionOptional(session,sessions){
    if(session?.optional===true)return true;
    const text=`${session?.label||""} ${session?.detail||""}`.toLowerCase();
    if(/optional|if time allows|bonus/.test(text))return true;
    if(typeof bellSessionOptional==="function")return bellSessionOptional(session,sessions);
    return false;
  }
  function plannedMinutes(session){return Math.max(10,Number(session?.prescribedDuration)||Number(scaledTemplate(session?.mission)?.duration)||30);}
  function buildRows(key=dateKey()){
    const sessions=(typeof premiumAllSessions==="function"?premiumAllSessions():[]).sort((a,b)=>({strength:0,engine:1}[premiumSessionType(a)]??2)-({strength:0,engine:1}[premiumSessionType(b)]??2));
    const state=seedFromExisting(key),available=todayMinutes(key),usual=usualMinutes();
    const rows=sessions.map(session=>({session,type:premiumSessionType(session),planned:plannedMinutes(session),optional:sessionOptional(session,sessions)}));
    const hasTraining=rows.some(r=>r.type==="strength"||r.type==="engine");
    if(hasTraining)rows.push({type:"core",planned:coreMinutes(),optional:false,synthetic:true});
    rows.push({type:"mobility",planned:Number(data.mobility?.minutes)||10,optional:true,outsideBudget:true,synthetic:true});

    const required=rows.filter(r=>!r.optional&&!r.outsideBudget),core=required.find(r=>r.type==="core");
    let remaining=available-(core?.planned||0);
    const training=required.filter(r=>r.type!=="core");
    if(training.length===1)training[0].minutes=Math.max(15,remaining);
    else if(training.length>1){
      const strength=training.find(r=>r.type==="strength"),engine=training.find(r=>r.type==="engine");
      if(strength&&engine){
        const engineMin=Math.max(10,Math.min(engine.planned,Math.round((remaining*.28)/5)*5));
        engine.minutes=engineMin;strength.minutes=Math.max(15,remaining-engineMin);
      }else{
        const total=training.reduce((s,r)=>s+r.planned,0)||1;
        training.forEach(r=>r.minutes=Math.max(10,Math.round((remaining*r.planned/total)/5)*5));
      }
    }
    if(core)core.minutes=core.planned;
    rows.filter(r=>r.optional&&!r.outsideBudget).forEach(r=>r.minutes=Math.min(r.planned,20));
    rows.filter(r=>r.outsideBudget).forEach(r=>r.minutes=r.planned);
    rows.forEach(r=>{r.completed=isComplete(r.type,key);});
    return {rows,available,usual,required:required.filter(r=>!r.optional),key};
  }

  function labelFor(row){
    if(row.type==="core")return typeof coreTemplate==="function"?coreTemplate(coreSessionName(row.key)).label:"Core Training";
    if(row.type==="mobility")return `${typeof resolvedMobilityFocus==="function"?resolvedMobilityFocus():"Daily"} Mobility`;
    return typeof premiumDisplayLabel==="function"?premiumDisplayLabel(row.session):String(row.session?.label||row.session?.mission||"Training");
  }
  function descriptionFor(row){
    if(row.type==="core")return "A focused trunk block programmed to support lifting, posture, and athletic control.";
    if(row.type==="mobility")return "Daily movement quality work. This sits outside the required training-time budget.";
    return typeof bellMissionSessionDescription==="function"?bellMissionSessionDescription(row.session):premiumSessionDescription(row.session);
  }
  function typeTitle(type){return ({strength:"Primary",engine:"Engine",core:"Core",mobility:"Mobility"})[type]||type;}
  function startRow(type,key){
    if(type==="core"){beginOptionalCore(key);return;}
    if(type==="mobility"){openMobilityRoutine(key);return;}
    const row=buildRows(key).rows.find(r=>r.type===type&&!r.synthetic);if(!row)return;
    beginPlannedWorkout(row.session.planId,row.session.sessionKey,row.session.mission);
  }
  function previewRow(type,key){
    if(type==="core"){if(typeof openExerciseLibrary==="function")openExerciseLibrary();else beginOptionalCore(key);return;}
    if(type==="mobility"){openMobilityRoutine(key);return;}
    const row=buildRows(key).rows.find(r=>r.type===type&&!r.synthetic);if(!row)return;
    previewPlannedWorkout(row.session.planId,row.session.sessionKey,row.session.mission);
  }
  window.bell1382Start=startRow;window.bell1382Preview=previewRow;

  function cardHtml(row,key){
    row.key=key;const done=row.completed,label=labelFor(row),status=done?"Complete":row.outsideBudget?"Daily":row.optional?"Optional":"Required";
    const action=done?"Completed":row.type==="strength"?"Start Strength":row.type==="engine"?"Start Engine":row.type==="core"?"Start Core":"Start Mobility";
    return `<article class="b1382-session ${row.type}${done?' completed':''}">
      <div class="b1382-session-head"><span>${escapeHtml(typeTitle(row.type))} · ${escapeHtml(status)}</span>${done?'<i>✓</i>':''}</div>
      <div class="b1382-session-body"><div><h3>${escapeHtml(label)}</h3><p>${escapeHtml(descriptionFor(row))}</p><small>${row.minutes} min${row.outsideBudget?' · outside training budget':row.optional?' · optional':''}</small></div></div>
      <div class="b1382-session-actions"><button class="secondary" type="button" onclick="bell1382Preview('${row.type}','${key}')">Preview</button><button class="good" type="button" ${done?'disabled':''} onclick="bell1382Start('${row.type}','${key}')">${done?'✓ ':''}${action}</button></div>
    </article>`;
  }

  window.renderPremiumMission=function(){
    const key=dateKey(),result=buildRows(key),required=result.rows.filter(r=>!r.optional&&!r.outsideBudget),requiredDone=required.length>0&&required.every(r=>r.completed),training=result.rows.filter(r=>r.type!=="mobility"),allDone=training.filter(r=>!r.optional).every(r=>r.completed);
    commandSetText("premiumMissionDate",key===todayKey()?"Today":localDateFromKey(key).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}));
    commandSetText("commandMissionTitle",requiredDone?"Mission Complete":training.length?training.filter(r=>r.type==="strength"||r.type==="engine").map(labelFor).join(" + "):"Recovery Day");
    commandSetText("commandMissionPurpose",requiredDone?"Today’s required training is complete.":`Required training is fit to your ${result.available}-minute availability. Daily mobility is separate.`);
    commandSetText("commandMissionDuration",`${result.available} min`);
    commandSetText("commandMissionType",requiredDone?"Complete":"Independent Sessions");
    commandSetText("commandMissionPriority",result.available!==result.usual?`Today: ${result.available} min`:`Usual: ${result.usual} min`);
    commandSetText("premiumCompletionCount",String(required.filter(r=>r.completed).length));commandSetText("premiumCompletionTotal",`of ${required.length}`);commandSetText("premiumCompletionLabel",requiredDone?"MISSION COMPLETE":"REQUIRED COMPLETE");
    const stack=document.getElementById("premiumSessionStack");if(stack){stack.className="premium-session-stack b1382-session-stack";stack.innerHTML=result.rows.map(r=>cardHtml(r,key)).join("")+(requiredDone?`<div class="b1382-tomorrow"><strong>Mission Complete</strong><span>Required work is finished for today.</span><button type="button" onclick="selectDashboardDay(addLocalDays('${key}',1))">Preview Tomorrow</button></div>`:"");}
    ["commandSelectedSessionDetail","commandStartWorkout","commandViewSession","commandModifySession"].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.add("hidden");});
  };

  // Reliable completion write: today + broad session type. History still keeps detailed records.
  if(typeof completeWorkout==="function"){
    const originalComplete=completeWorkout;
    window.completeWorkout=function(){
      const active=data.activeWorkout?{...data.activeWorkout}:null;
      const key=active?.scheduledDate||todayKey();
      const type=active?.optionalCore||/^C-/i.test(String(active?.name||""))?"core":(active?.cardioType||active?.engineMetrics||/^R-/i.test(String(active?.name||"")))?"engine":"strength";
      originalComplete.apply(this,arguments);
      setComplete(type,key);
      if(typeof renderApp==="function")renderApp();
    };
  }
  if(typeof finishMobilityRoutine==="function"){
    const originalMobility=finishMobilityRoutine;
    window.finishMobilityRoutine=function(){const key=activeMobilityDateKey||dateKey();originalMobility.apply(this,arguments);if(data.mobility?.completedDates?.includes(key)){setComplete("mobility",key);if(typeof renderApp==="function")renderApp();}};
  }

  // Expose for validation/debugging.
  window.BellDailySessions={buildRows,dayState,setComplete,isComplete,usualMinutes,todayMinutes};
})();
