"use strict";
/* Bell Performance 13.22.17 — recursion-safe date-bound completion identity. */
(function(){
  const same=(a,b)=>String(a??"")===String(b??"");
  const canonical=value=>typeof bellCanonicalWorkoutMission==="function"?bellCanonicalWorkoutMission(value):String(value||"").trim();
  const dateFor=item=>item?.scheduledDate||(typeof planDateKey==="function"?planDateKey(item):"");
  const recordDate=record=>record?.scheduledDate||record?.completionIdentity?.scheduledDate||String(record?.completedAt||"").slice(0,10);
  const recordType=record=>{
    if(record?.completionIdentity?.type)return record.completionIdentity.type;
    if(record?.sessionType)return record.sessionType;
    const mission=canonical(record?.name||record?.mission);
    return /^R-/i.test(mission)||record?.cardioType||record?.engineMetrics?"engine":"strength";
  };
  const missionType=mission=>/^R-/i.test(canonical(mission))?"engine":"strength";

  // Completion identity must move with the calendar date, not merely the plan slot.
  window.sessionCompletionKey=function(planItem,slot,sessionIndex){
    const date=dateFor(planItem)||"undated";
    return `${date}:${planItem?.id||planItem?.day||"session"}:${slot}${Number.isInteger(sessionIndex)?`:${sessionIndex}`:""}`;
  };

  window.bellHistoryCompletesPlannedSession=function(item,sessionKey,mission,scheduledDate){
    const targetDate=scheduledDate||dateFor(item);
    const targetMission=canonical(mission);
    const targetType=missionType(mission);
    // Count same-type formal sessions directly from the raw plan item. Do NOT call
    // sessionsFromPlanItem() here: that helper asks completion state for each session,
    // which would recurse back into this function.
    const rawMissions=[item?.mission,item?.secondaryMission];
    if(Array.isArray(item?.sessions))item.sessions.forEach(session=>rawMissions.push(session?.mission));
    const sameTypeCount=rawMissions.filter(value=>value&&!String(value).startsWith("M-")&&missionType(value)===targetType).length;
    return (data.history||[]).some(record=>{
      if(!(record?.completed||record?.status==="completed"))return false;
      const rDate=recordDate(record);
      // Date is authoritative. A matching legacy slot key can never complete another day.
      if(targetDate&&rDate!==targetDate)return false;
      const identity=record.completionIdentity||{};
      if((record.planSessionKey&&same(record.planSessionKey,sessionKey))||(identity.sessionKey&&same(identity.sessionKey,sessionKey)))return true;
      const rMission=canonical(identity.mission||record.name||record.mission);
      if(rMission&&same(rMission,targetMission))return true;
      return recordType(record)===targetType&&sameTypeCount===1;
    });
  };

  window.bellPlannedSessionCompleted=function(item,sessionKey,mission,scheduledDate){
    return Boolean(item?.sessionCompletions?.[sessionKey]||window.bellHistoryCompletesPlannedSession(item,sessionKey,mission,scheduledDate));
  };

  function strictHistoryMatch(item,session){
    return window.bellHistoryCompletesPlannedSession(item,session.sessionKey,session.mission,session.scheduledDate||dateFor(item));
  }

  window.bellRepairScheduleCompletionIdentity=function(){
    const today=typeof localDateKey==="function"?localDateKey():new Date().toISOString().slice(0,10);
    let changed=false;
    (data.plan||[]).forEach(item=>{
      const date=dateFor(item);
      item.sessionCompletions=item.sessionCompletions&&typeof item.sessionCompletions==="object"?item.sessionCompletions:{};
      const sessions=typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(item):[];
      const rebuilt={};
      sessions.forEach(session=>{
        if(strictHistoryMatch(item,session)){
          const record=(data.history||[]).find(r=>recordDate(r)===(session.scheduledDate||date)&&(
            same(canonical(r?.completionIdentity?.mission||r?.name||r?.mission),canonical(session.mission)) || recordType(r)===missionType(session.mission)
          ));
          rebuilt[session.sessionKey]=record?.completedAt||item.sessionCompletions?.[session.sessionKey]||new Date().toISOString();
        }
      });
      if(JSON.stringify(rebuilt)!==JSON.stringify(item.sessionCompletions)){item.sessionCompletions=rebuilt;changed=true;}
      const required=sessions.filter(s=>!String(s.mission||"").startsWith("M-")&&!s.optionalCore);
      const shouldDone=required.length>0&&required.every(s=>Boolean(rebuilt[s.sessionKey]));
      // Especially important for future sessions accidentally marked complete after availability changes.
      if(item.done!==shouldDone){item.done=shouldDone;changed=true;}
      const nextStatus=shouldDone?"completed":(["skipped","replaced"].includes(item.status)?item.status:"planned");
      if(item.status!==nextStatus){item.status=nextStatus;changed=true;}
      if(!shouldDone&&item.completedAt){delete item.completedAt;changed=true;}
      if(date>today&&shouldDone&&!required.every(s=>strictHistoryMatch(item,s))){item.done=false;item.status="planned";delete item.completedAt;item.sessionCompletions={};changed=true;}
    });
    if(changed&&typeof saveData==="function")saveData({render:false});
    return changed;
  };

  const baseBuild=window.buildCurrentWeekPlan;
  if(typeof baseBuild==="function")window.buildCurrentWeekPlan=function(){
    const result=baseBuild.apply(this,arguments);
    window.bellRepairScheduleCompletionIdentity();
    return result;
  };

  document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>window.bellRepairScheduleCompletionIdentity(),120));
})();
