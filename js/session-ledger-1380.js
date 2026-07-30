"use strict";

/* Bell Performance 13.8.0 — Unified Session State
   One durable ledger record is the source of truth for launch, progress,
   completion, required/optional status, and daily time allocation. */
(function installBellSessionLedger(){
  const originalSessionsFromPlanItem = window.sessionsFromPlanItem;
  const originalBeginPlannedWorkout = window.beginPlannedWorkout;
  const originalCompleteWorkout = window.completeWorkout;
  const originalDailySessionBudget = window.bellDailySessionBudget;
  const LEDGER_SCHEMA_VERSION = 1;

  function clean(value){ return String(value ?? "").trim(); }
  function same(a,b){ return clean(a) === clean(b); }
  function canonicalMission(value){
    return typeof window.bellCanonicalWorkoutMission === "function"
      ? clean(window.bellCanonicalWorkoutMission(value))
      : clean(value);
  }
  function dateForItem(item){
    if(typeof window.bellCanonicalPlanDateKey === "function"){
      const key=window.bellCanonicalPlanDateKey(item, data.trainingBlock, Number(data.trainingBlock?.currentWeek||1));
      if(key)return key;
    }
    if(item?.scheduledDate)return item.scheduledDate;
    if(typeof window.planDateKey === "function")return window.planDateKey(item);
    return "";
  }
  function typeForSession(session){
    if(typeof window.premiumSessionType === "function")return window.premiumSessionType(session);
    if(typeof window.scheduleTypeForMission === "function")return window.scheduleTypeForMission(session?.mission,session?.label,session?.detail)||"strength";
    return /^R-|run|cycle|row|aerobic|engine|interval/i.test(`${session?.mission||""} ${session?.label||""}`)?"engine":"strength";
  }
  function ledgerRoot(){
    if(!data.sessionLedger || typeof data.sessionLedger !== "object"){
      data.sessionLedger={schemaVersion:LEDGER_SCHEMA_VERSION,entries:{},migratedAt:"",updatedAt:""};
    }
    if(!data.sessionLedger.entries || typeof data.sessionLedger.entries !== "object")data.sessionLedger.entries={};
    data.sessionLedger.schemaVersion=LEDGER_SCHEMA_VERSION;
    return data.sessionLedger;
  }
  function sessionId(planId,sessionKey,date){
    return `bell-session:${encodeURIComponent(clean(date)||"undated")}:${encodeURIComponent(clean(planId)||"plan")}:${encodeURIComponent(clean(sessionKey)||"session")}`;
  }
  function historyRecordFor(raw,item,date,type){
    const targetMission=canonicalMission(raw.mission);
    return (data.history||[]).find(record=>{
      if(!(record?.completed || record?.status==="completed"))return false;
      const identity=record.completionIdentity||{};
      if(record.sessionLedgerId && same(record.sessionLedgerId,sessionId(item?.id,raw.sessionKey,date)))return true;
      if((record.planSessionKey&&same(record.planSessionKey,raw.sessionKey))||(identity.sessionKey&&same(identity.sessionKey,raw.sessionKey))){
        if(!record.planId || same(record.planId,item?.id))return true;
      }
      const recordDate=record.scheduledDate||identity.scheduledDate||clean(record.completedAt).slice(0,10);
      if(date&&recordDate&&recordDate!==date)return false;
      const recordType=record.sessionType||identity.type||((record.cardioType||record.engineMetrics)?"engine":"strength");
      if(recordType!==type)return false;
      return canonicalMission(record.name||record.mission||identity.mission)===targetMission;
    })||null;
  }
  function rawSessions(item){
    if(typeof originalSessionsFromPlanItem !== "function")return [];
    return originalSessionsFromPlanItem(item).map(session=>({...session}));
  }
  function ensureEntry(item,raw){
    const root=ledgerRoot();
    const date=raw.scheduledDate||dateForItem(item);
    const id=sessionId(item?.id??raw.planId,raw.sessionKey,date);
    let entry=root.entries[id];
    const type=typeForSession(raw);
    if(!entry){
      entry=root.entries[id]={
        id,
        schemaVersion:LEDGER_SCHEMA_VERSION,
        planId:item?.id??raw.planId??null,
        sessionKey:raw.sessionKey,
        scheduledDate:date,
        type,
        workoutId:canonicalMission(raw.mission),
        sourceMission:raw.mission,
        displayName:raw.label||"",
        required:raw.optional!==true,
        optional:raw.optional===true,
        plannedMinutes:Number(raw.prescribedDuration)||0,
        allocatedMinutes:Number(raw.allocatedMinutes)||Number(raw.prescribedDuration)||0,
        allocationSignature:"",
        status:"planned",
        startedAt:null,
        completedAt:null,
        historyCompletedAt:null,
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()
      };
    }else{
      Object.assign(entry,{
        planId:item?.id??raw.planId??entry.planId,
        sessionKey:raw.sessionKey||entry.sessionKey,
        scheduledDate:date||entry.scheduledDate,
        type,
        workoutId:canonicalMission(raw.mission)||entry.workoutId,
        sourceMission:raw.mission||entry.sourceMission,
        displayName:raw.label||entry.displayName,
        plannedMinutes:Number(raw.prescribedDuration)||entry.plannedMinutes||0
      });
    }
    const legacyTimestamp=item?.sessionCompletions?.[raw.sessionKey];
    const history=historyRecordFor(raw,item,date,type);
    if(entry.status!=="completed" && (legacyTimestamp||raw.completed||history)){
      entry.status="completed";
      entry.completedAt=entry.completedAt||legacyTimestamp||history?.completedAt||new Date().toISOString();
      entry.historyCompletedAt=history?.completedAt||entry.historyCompletedAt||null;
    }
    entry.updatedAt=new Date().toISOString();
    return entry;
  }
  function syncItem(item){
    return rawSessions(item).map(raw=>({raw,entry:ensureEntry(item,raw)}));
  }
  function syncAll(){
    ledgerRoot();
    (data.plan||[]).forEach(syncItem);
    if(!data.sessionLedger.migratedAt)data.sessionLedger.migratedAt=new Date().toISOString();
    data.sessionLedger.updatedAt=new Date().toISOString();
    return data.sessionLedger;
  }
  function entryFor(planId,sessionKey,scheduledDate){
    syncAll();
    const entries=Object.values(ledgerRoot().entries);
    return entries.find(entry=>same(entry.planId,planId)&&same(entry.sessionKey,sessionKey)&&(scheduledDate?entry.scheduledDate===scheduledDate:true))
      || entries.find(entry=>same(entry.sessionKey,sessionKey)&&(scheduledDate?entry.scheduledDate===scheduledDate:true))
      || null;
  }
  function entryForSession(session){
    return session?.sessionLedgerId?ledgerRoot().entries[session.sessionLedgerId]:entryFor(session?.planId,session?.sessionKey,session?.scheduledDate);
  }
  function ledgerSessionsFromPlanItem(item){
    return syncItem(item).map(({raw,entry})=>({
      ...raw,
      sessionLedgerId:entry.id,
      status:entry.status,
      completed:entry.status==="completed",
      started:entry.status==="in_progress",
      optional:entry.optional===true,
      required:entry.required!==false,
      allocatedMinutes:Number(entry.allocatedMinutes)||Number(raw.allocatedMinutes)||Number(raw.prescribedDuration)||0,
      prescribedDuration:Number(entry.allocatedMinutes)||Number(raw.prescribedDuration)||0,
      scheduledDate:entry.scheduledDate||raw.scheduledDate
    }));
  }

  window.bellEnsureSessionLedger=syncAll;
  window.bellSessionLedgerEntry=entryFor;
  window.sessionsFromPlanItem=ledgerSessionsFromPlanItem;
  window.bellPlannedSessionCompleted=function(item,sessionKey,mission,scheduledDate){
    const entry=entryFor(item?.id,sessionKey,scheduledDate||dateForItem(item));
    return entry?.status==="completed";
  };

  if(typeof originalDailySessionBudget === "function"){
    window.bellDailySessionBudget=function ledgerDailySessionBudget(sessions,key){
      syncAll();
      const result=originalDailySessionBudget(sessions,key);
      const date=key||window.selectedDashboardDateKey?.()||window.localDateKey?.()||"";
      const signature=[date,result.checkedIn?1:0,result.available,...result.sessions.map(s=>`${s.sessionKey}:${s.optional?1:0}`)].join("|");
      let changed=false;
      result.sessions.forEach(session=>{
        const entry=entryForSession(session)||entryFor(session.planId,session.sessionKey,date);
        if(!entry)return;
        if(entry.allocationSignature!==signature || !Number(entry.allocatedMinutes)){
          entry.allocatedMinutes=Number(session.minutes)||Number(session.plannedMinutes)||Number(entry.plannedMinutes)||30;
          entry.allocationSignature=signature;
          changed=true;
        }
        entry.optional=session.optional===true;
        entry.required=!entry.optional;
        session.minutes=Number(entry.allocatedMinutes)||Number(session.minutes)||30;
        session.allocatedMinutes=session.minutes;
        session.optional=entry.optional;
        session.required=entry.required;
        session.completed=entry.status==="completed";
        session.status=entry.status;
        session.sessionLedgerId=entry.id;
      });
      if(changed && typeof window.saveData === "function")window.saveData({render:false});
      return result;
    };
  }

  if(typeof originalBeginPlannedWorkout === "function"){
    window.beginPlannedWorkout=function ledgerBeginPlannedWorkout(planId,sessionKey,mission){
      const resolved=typeof window.resolvePlannedSession==="function"?window.resolvePlannedSession(planId,sessionKey,mission):{item:null,session:null};
      const date=resolved.session?.scheduledDate||dateForItem(resolved.item)||window.selectedDashboardDateKey?.()||"";
      const entry=entryFor(resolved.item?.id??planId,resolved.session?.sessionKey??sessionKey,date);
      if(entry?.status==="completed")return;
      const result=originalBeginPlannedWorkout.apply(this,arguments);
      if(data.activeWorkout){
        const exact=entry||entryFor(data.activeWorkout.planId,data.activeWorkout.planSessionKey,data.activeWorkout.scheduledDate);
        if(exact){
          exact.status="in_progress";
          exact.startedAt=exact.startedAt||new Date().toISOString();
          exact.updatedAt=new Date().toISOString();
          data.activeWorkout.sessionLedgerId=exact.id;
          data.activeWorkout.planId=exact.planId;
          data.activeWorkout.planSessionKey=exact.sessionKey;
          data.activeWorkout.scheduledDate=exact.scheduledDate;
          data.activeWorkout.sessionType=exact.type;
          data.activeWorkout.prescribedDuration=Number(exact.allocatedMinutes)||data.activeWorkout.prescribedDuration;
          data.activeWorkout.duration=Number(exact.allocatedMinutes)||data.activeWorkout.duration;
          if(typeof window.saveData==="function")window.saveData({render:false});
        }
      }
      return result;
    };
  }

  function markEntryComplete(entry,timestamp){
    if(!entry)return false;
    entry.status="completed";
    entry.completedAt=timestamp;
    entry.updatedAt=timestamp;
    const item=(data.plan||[]).find(candidate=>same(candidate.id,entry.planId));
    if(item){
      item.sessionCompletions=item.sessionCompletions&&typeof item.sessionCompletions==="object"?item.sessionCompletions:{};
      item.sessionCompletions[entry.sessionKey]=timestamp;
      const required=ledgerSessionsFromPlanItem(item).filter(session=>session.required!==false);
      item.done=required.length>0&&required.every(session=>session.completed);
      item.status=item.done?"completed":"planned";
      if(item.done)item.completedAt=timestamp;else delete item.completedAt;
    }
    return true;
  }

  if(typeof originalCompleteWorkout === "function"){
    window.completeWorkout=function ledgerCompleteWorkout(){
      const active=data.activeWorkout;
      if(!active)return originalCompleteWorkout.apply(this,arguments);
      syncAll();
      const entry=(active.sessionLedgerId&&ledgerRoot().entries[active.sessionLedgerId])
        ||entryFor(active.planId,active.planSessionKey,active.scheduledDate);
      const timestamp=new Date().toISOString();
      markEntryComplete(entry,timestamp);
      active.sessionLedgerId=entry?.id||active.sessionLedgerId||null;
      active.sessionType=entry?.type||active.sessionType||((active.cardioType||active.engineMetrics)?"engine":"strength");
      if(typeof window.saveData==="function")window.saveData({render:false});
      try{
        const result=originalCompleteWorkout.apply(this,arguments);
        const completed=(data.history||[]).find(record=>record.sessionLedgerId===entry?.id)
          ||(data.history||[]).find(record=>same(record.planSessionKey,entry?.sessionKey)&&same(record.planId,entry?.planId));
        if(completed&&entry){
          completed.sessionLedgerId=entry.id;
          completed.sessionType=entry.type;
          completed.planId=entry.planId;
          completed.planSessionKey=entry.sessionKey;
          completed.scheduledDate=entry.scheduledDate;
          entry.historyCompletedAt=completed.completedAt||timestamp;
        }
        if(typeof window.saveData==="function")window.saveData();
        return result;
      }catch(error){
        if(entry){entry.status="in_progress";entry.completedAt=null;entry.updatedAt=new Date().toISOString();}
        if(typeof window.saveData==="function")window.saveData({render:false});
        throw error;
      }
    };
  }

  // Initialize and migrate existing 13.7.x local profiles once the app scripts are loaded.
  syncAll();
  if(typeof window.saveData==="function")window.saveData({render:false});
})();
