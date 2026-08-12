"use strict";
/* Bell Performance 13.22.18 — strict date + workout identity completion matching. */
(function(){
  const same=(a,b)=>String(a??"")===String(b??"");
  const canonical=value=>typeof bellCanonicalWorkoutMission==="function"?bellCanonicalWorkoutMission(value):String(value||"").trim();
  const dateFor=item=>item?.scheduledDate||(typeof planDateKey==="function"?planDateKey(item):"");
  const localKey=value=>{
    if(!value)return "";
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return String(value);
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return String(value).slice(0,10);
    if(typeof localDateKey==="function")return localDateKey(d);
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };
  const recordDate=record=>record?.scheduledDate||record?.completionIdentity?.scheduledDate||record?.dailySessionDate||localKey(record?.completedAt);
  const missionFromRecord=record=>canonical(record?.completionIdentity?.mission||record?.mission||record?.name||record?.label);

  window.sessionCompletionKey=function(planItem,slot,sessionIndex){
    const date=dateFor(planItem)||"undated";
    return `${date}:${planItem?.id||planItem?.day||"session"}:${slot}${Number.isInteger(sessionIndex)?`:${sessionIndex}`:""}`;
  };

  window.bellHistoryCompletesPlannedSession=function(item,sessionKey,mission,scheduledDate){
    const targetDate=scheduledDate||dateFor(item);
    const targetMission=canonical(mission);
    return (data.history||[]).some(record=>{
      if(!(record?.completed||record?.status==="completed"))return false;
      const rDate=recordDate(record);
      // Scheduled calendar date is mandatory. Completion cannot migrate to a rebuilt day.
      if(!targetDate||!rDate||rDate!==targetDate)return false;
      const identity=record.completionIdentity||{};
      // New date-bound identity is strongest.
      if(identity.sessionKey&&same(identity.sessionKey,sessionKey))return true;
      if(record.planSessionKey&&same(record.planSessionKey,sessionKey))return true;
      // Legacy recovery is allowed only when the workout mission itself matches.
      const rMission=missionFromRecord(record);
      if(rMission&&targetMission&&same(rMission,targetMission))return true;
      return false;
    });
  };

  window.bellPlannedSessionCompleted=function(item,sessionKey,mission,scheduledDate){
    // Never trust item.done after schedule regeneration. Rebuild from strict history/date identity.
    return Boolean(item?.sessionCompletions?.[sessionKey]||window.bellHistoryCompletesPlannedSession(item,sessionKey,mission,scheduledDate));
  };

  function rawSessions(item){
    const out=[];
    const add=(mission,slot,index)=>{
      if(!mission||String(mission).startsWith("M-"))return;
      const sessionKey=window.sessionCompletionKey(item,slot,index);
      out.push({mission,slot,index,sessionKey,scheduledDate:dateFor(item)});
    };
    add(item?.mission,"primary");
    add(item?.secondaryMission,"secondary");
    if(Array.isArray(item?.sessions))item.sessions.forEach((session,index)=>add(session?.mission,"session",index));
    return out;
  }

  window.bellRepairScheduleCompletionIdentity=function(){
    let changed=false;
    (data.plan||[]).forEach(item=>{
      const sessions=rawSessions(item);
      const rebuilt={};
      sessions.forEach(session=>{
        if(window.bellHistoryCompletesPlannedSession(item,session.sessionKey,session.mission,session.scheduledDate)){
          const record=(data.history||[]).find(r=>{
            if(recordDate(r)!==session.scheduledDate)return false;
            const id=r?.completionIdentity||{};
            return same(id.sessionKey,session.sessionKey)||same(r?.planSessionKey,session.sessionKey)||same(missionFromRecord(r),canonical(session.mission));
          });
          rebuilt[session.sessionKey]=record?.completedAt||true;
        }
      });
      const old=item.sessionCompletions&&typeof item.sessionCompletions==="object"?item.sessionCompletions:{};
      if(JSON.stringify(old)!==JSON.stringify(rebuilt)){item.sessionCompletions=rebuilt;changed=true;}
      const shouldDone=sessions.length>0&&sessions.every(s=>Boolean(rebuilt[s.sessionKey]));
      if(Boolean(item.done)!==shouldDone){item.done=shouldDone;changed=true;}
      const nextStatus=shouldDone?"completed":(["skipped","replaced"].includes(item.status)?item.status:"planned");
      if(item.status!==nextStatus){item.status=nextStatus;changed=true;}
      if(!shouldDone&&item.completedAt){delete item.completedAt;changed=true;}
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

  document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{
    window.bellRepairScheduleCompletionIdentity();
    try{typeof renderAll==="function"&&renderAll();}catch(_){}
  },160));
})();
