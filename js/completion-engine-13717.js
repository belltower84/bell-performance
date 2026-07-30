"use strict";

/* Bell Performance 13.7.17 — robust Strength/Engine completion identity. */
(function(){
  const same=(a,b)=>String(a??"")===String(b??"");
  const canonical=value=>typeof bellCanonicalWorkoutMission==="function"?bellCanonicalWorkoutMission(value):String(value||"").trim();
  const sessionType=session=>{
    const mission=canonical(session?.mission||session?.name);
    if(/^R-/i.test(mission)||session?.cardioType||session?.engineMetrics)return "engine";
    if(typeof scheduleTypeForMission==="function")return scheduleTypeForMission(mission,session?.label,session?.detail)||"strength";
    return "strength";
  };
  const recordDate=record=>record?.scheduledDate||record?.completionIdentity?.scheduledDate||String(record?.completedAt||"").slice(0,10);
  const rawItemSessions=item=>{
    if(!item)return[];
    const result=[];
    const add=(mission,slot,index,label,detail)=>{if(!mission||String(mission).startsWith("M-"))return;result.push({mission,label,detail,sessionKey:typeof sessionCompletionKey==="function"?sessionCompletionKey(item,slot,index):`${item.id||item.day}:${slot}${Number.isInteger(index)?`:${index}`:""}`});};
    add(item.mission,"primary",undefined,item.customLabel,item.detail);
    add(item.secondaryMission,"secondary",undefined,item.secondaryLabel,item.secondaryDetail);
    (item.sessions||[]).forEach((session,index)=>add(session?.mission,"session",index,session?.label||session?.customLabel,session?.detail));
    return result;
  };

  window.bellHistoryCompletesPlannedSession=function(item,sessionKey,mission,scheduledDate){
    const targetMission=canonical(mission);
    const targetDate=scheduledDate||item?.scheduledDate||(typeof planDateKey==="function"?planDateKey(item):"");
    const targetType=sessionType({mission});
    const itemSessions=rawItemSessions(item);
    const sameTypeSessions=itemSessions.filter(s=>sessionType(s)===targetType);
    return (data.history||[]).some(record=>{
      if(!(record?.completed||record?.status==="completed"))return false;
      const identity=record.completionIdentity||{};
      if((record.planSessionKey&&same(record.planSessionKey,sessionKey))||(identity.sessionKey&&same(identity.sessionKey,sessionKey)))return true;
      const linkedPlanId=record.planId??identity.planId;
      if(linkedPlanId!=null&&!same(linkedPlanId,item?.id))return false;
      const date=recordDate(record);
      if(targetDate&&date&&date!==targetDate)return false;
      const recordMission=canonical(identity.mission||record.name||record.mission);
      if(recordMission&&same(recordMission,targetMission))return true;
      const recordType=identity.type||record.sessionType||sessionType(record);
      // A combined day has one Strength and one Engine prescription. Type + plan + date
      // is a safe fallback when a legacy Engine alias changed after completion.
      return recordType===targetType&&sameTypeSessions.length===1;
    });
  };

  window.bellPlannedSessionCompleted=function(item,sessionKey,mission,scheduledDate){
    return Boolean(item?.sessionCompletions?.[sessionKey]||item?.done||window.bellHistoryCompletesPlannedSession(item,sessionKey,mission,scheduledDate));
  };

  window.markPlannedSessionComplete=function(completed){
    const plan=data.plan||[];
    const completedDate=completed.scheduledDate||String(completed.completedAt||"").slice(0,10)||localDateKey();
    const completedMission=canonical(completed.name||completed.mission);
    const completedType=sessionType(completed);
    let item=completed.planId!=null?plan.find(x=>same(x.id,completed.planId)):null;

    if(!item&&completed.planSessionKey&&typeof sessionsFromPlanItem==="function"){
      item=plan.find(candidate=>sessionsFromPlanItem(candidate).some(session=>same(session.sessionKey,completed.planSessionKey)))||null;
    }
    if(!item){
      item=plan.find(candidate=>{
        if((typeof planDateKey==="function"?planDateKey(candidate):candidate.scheduledDate)!==completedDate||["skipped","replaced"].includes(candidate.status))return false;
        const sessions=typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(candidate):[];
        return sessions.some(session=>same(canonical(session.mission),completedMission))||sessions.filter(session=>sessionType(session)===completedType).length===1;
      })||null;
    }
    if(!item){console.error("Bell: unable to link completed workout to plan",completed);return false;}

    item.sessionCompletions=item.sessionCompletions&&typeof item.sessionCompletions==="object"?item.sessionCompletions:{};
    const sessions=typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(item):[];
    let matched=sessions.find(session=>same(session.sessionKey,completed.planSessionKey))||null;
    if(!matched)matched=sessions.find(session=>same(canonical(session.mission),completedMission)&&!bellPlannedSessionCompleted(item,session.sessionKey,session.mission,session.scheduledDate))||null;
    if(!matched)matched=sessions.find(session=>same(canonical(session.mission),completedMission))||null;
    if(!matched){
      const sameType=sessions.filter(session=>sessionType(session)===completedType);
      matched=sameType.find(session=>!bellPlannedSessionCompleted(item,session.sessionKey,session.mission,session.scheduledDate))||(sameType.length===1?sameType[0]:null);
    }
    if(!matched){console.error("Bell: plan found but completed session could not be identified",{completed,item,sessions});return false;}

    const timestamp=completed.completedAt||new Date().toISOString();
    item.sessionCompletions[matched.sessionKey]=timestamp;
    completed.planId=item.id;
    completed.planSessionKey=matched.sessionKey;
    completed.scheduledDate=matched.scheduledDate||item.scheduledDate||completedDate;
    completed.sessionType=sessionType(matched);
    completed.completionIdentity={
      planId:item.id,
      sessionKey:matched.sessionKey,
      mission:canonical(matched.mission),
      type:completed.sessionType,
      scheduledDate:completed.scheduledDate
    };

    const prescribed=sessions.filter(session=>!String(session.mission||"").startsWith("M-")&&!session.optionalCore);
    item.done=prescribed.length>0&&prescribed.every(session=>Boolean(item.sessionCompletions[session.sessionKey])||bellHistoryCompletesPlannedSession(item,session.sessionKey,session.mission,session.scheduledDate));
    item.status=item.done?"completed":"planned";
    if(item.done)item.completedAt=timestamp;else delete item.completedAt;
    return true;
  };
})();
