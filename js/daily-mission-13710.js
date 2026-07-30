"use strict";

/* Bell Performance 13.7.10 — Time-budgeted, selectable daily mission sessions. */
let bellSelectedMissionSessionKey = null;
const bellOriginalRenderPremiumMission = typeof renderPremiumMission === "function" ? renderPremiumMission : null;

function bellSessionPlannedMinutes(session){
  return Math.max(10,Number(session?.prescribedDuration)||Number(scaledTemplate(session?.mission)?.duration)||30);
}
function bellSessionOptional(session,sessions=[]){
  const text=`${session?.label||""} ${session?.detail||""} ${session?.mission||""}`.toLowerCase();
  if(session?.optional===true||/\boptional\b|if time allows|bonus work/.test(text))return true;
  const combined=sessions.some(x=>premiumSessionType(x)==="strength")&&sessions.some(x=>premiumSessionType(x)==="engine");
  if(combined&&premiumSessionType(session)==="engine"&&selectedDashboardDateKey()===todayKey()){
    const status=readinessStatus(readinessScore());
    if(status==="YELLOW"||status==="RED")return true;
  }
  return false;
}
function bellDailySessionBudget(sessions=premiumAllSessions(),key=selectedDashboardDateKey()){
  const rows=(sessions||[]).map(session=>({...session,type:premiumSessionType(session),plannedMinutes:bellSessionPlannedMinutes(session)}));
  const readiness=data.settings?.readiness||{};
  const isToday=key===todayKey()||key===localDateKey();
  const hasCurrentCheckIn=readiness.lastPromptDate===todayKey()||readiness.lastPromptDate===key||hasTodayReadiness()||Boolean(readiness.checkInVersion&&Number(readiness.timeMinutes)>=15);
  const checkedIn=isToday&&hasCurrentCheckIn;
  const available=checkedIn?Math.max(15,timeCapacityMinutes()):rows.reduce((sum,x)=>sum+x.plannedMinutes,0);
  rows.forEach(row=>row.optional=bellSessionOptional(row,rows));
  const required=rows.filter(x=>!x.optional&&!x.completed), optional=rows.filter(x=>x.optional&&!x.completed);
  const plannedRequired=required.reduce((sum,x)=>sum+x.plannedMinutes,0);
  let target=Math.min(available,plannedRequired||available);
  if(required.length===1){required[0].minutes=Math.max(10,target||required[0].plannedMinutes);}
  else if(required.length>1){
    const strength=required.find(x=>x.type==="strength"),engine=required.find(x=>x.type==="engine");
    if(strength&&engine){
      const engineMin=Math.min(20,Math.max(10,Math.round(target*.30/5)*5));
      const strengthMin=Math.max(20,target-engineMin);
      strength.minutes=strengthMin;engine.minutes=Math.max(10,target-strengthMin);
      required.filter(x=>x!==strength&&x!==engine).forEach(x=>x.minutes=Math.max(10,Math.floor((target-strength.minutes-engine.minutes)/Math.max(1,required.length-2))));
    }else{
      const totalWeight=required.reduce((sum,x)=>sum+x.plannedMinutes,0)||1;
      required.forEach(x=>x.minutes=Math.max(10,Math.round((target*x.plannedMinutes/totalWeight)/5)*5));
    }
  }
  const used=required.reduce((sum,x)=>sum+(x.minutes||0),0);
  const spare=Math.max(0,available-used);
  optional.forEach((x,index)=>{x.minutes=Math.max(10,Math.min(x.plannedMinutes,index===0&&spare>=10?spare:Math.min(20,x.plannedMinutes)));});
  rows.filter(x=>x.completed).forEach(x=>x.minutes=x.plannedMinutes);
  return {available,checkedIn,requiredMinutes:used,sessions:rows};
}
function bellCapWorkoutTemplateToMinutes(template,minutes,name){
  const result={...template,duration:minutes,exercises:[...(template.exercises||[])]};
  const isEngine=String(name||"").startsWith("R-")||result.exercises.some(x=>/run|bike|row|aerobic|interval|zone/i.test(`${x.name||""} ${x.reps||""}`));
  if(isEngine)return result;
  const maxExercises=minutes<=25?3:minutes<=35?4:minutes<=45?5:minutes<=60?6:99;
  result.exercises=result.exercises.filter((exercise,index)=>index<maxExercises&&!((minutes<=45)&&/finisher/i.test(String(exercise.block||""))));
  return result;
}
function bellMissionSessionDescription(session){
  const template=scaledTemplate(session?.mission)||{};
  return String(session?.detail||template.coachBrief||template.description||premiumSessionDescription(session)||"Complete the prescribed work with controlled effort and quality execution.").replace(/\s+/g," ").trim();
}
function bellSelectMissionSession(sessionKey){bellSelectedMissionSessionKey=sessionKey;renderPremiumMission();}
function bellMissionSessionCards(budget,futureDay){
  return budget.sessions.map(session=>{
    const selected=session.sessionKey===bellSelectedMissionSessionKey;
    const type=session.type==="engine"?"Engine":"Strength";
    const status=session.completed?"Complete":session.optional?"Optional":"Required";
    return `<button type="button" class="command-session-choice${selected?' selected':''}${session.completed?' complete':''}" onclick="bellSelectMissionSession('${escapeHtml(session.sessionKey)}')" aria-pressed="${selected}"><span class="command-session-choice-top"><b>${escapeHtml(type)}</b><em class="${session.optional?'optional':''}">${escapeHtml(status)}</em></span><strong>${escapeHtml(premiumDisplayLabel(session))}</strong><small>${session.minutes} min${session.optional?' · not included in required total':''}</small><i>${futureDay?'Preview':'Select'} ›</i></button>`;
  }).join("");
}
function bellRenderSelectedMissionDetail(session,budget,futureDay){
  let detail=document.getElementById("commandSelectedSessionDetail");
  const stack=document.getElementById("premiumSessionStack");
  if(!detail&&stack){detail=document.createElement("div");detail.id="commandSelectedSessionDetail";detail.className="command-selected-session-detail";stack.insertAdjacentElement("afterend",detail);}
  if(!detail)return;
  if(!session){detail.innerHTML="";detail.classList.add("hidden");return;}
  detail.classList.remove("hidden");
  detail.innerHTML=`<div><span>${escapeHtml(session.type==="engine"?'Engine Session':'Strength Session')} · ${session.optional?'Optional':'Required'}</span><h3>${escapeHtml(premiumDisplayLabel(session))}</h3><p>${escapeHtml(bellMissionSessionDescription(session))}</p></div><div class="command-selected-session-time"><strong>${session.minutes}</strong><small>minutes</small></div>`;
  const start=document.getElementById("commandStartWorkout"),view=document.getElementById("commandViewSession"),modify=document.getElementById("commandModifySession");
  if(start){
    const active=data.activeWorkout?.planSessionKey===session.sessionKey;
    start.disabled=Boolean(session.completed);
    start.textContent=session.completed?"✓ Session Complete":futureDay?"☷ Preview Session":active?`▶ Resume ${session.type==='engine'?'Engine':'Strength'}`:`▶ Start ${session.type==='engine'?'Engine':'Strength'}`;
    start.onclick=session.completed?null:()=>commandSessionCall(session,futureDay?'preview':'start');
  }
  if(view){view.disabled=false;view.textContent="☷ View Description";view.onclick=()=>commandSessionCall(session,"preview");}
  if(modify){modify.disabled=futureDay||session.completed;modify.textContent=session.optional?"Optional Session":"✎ Modify";modify.onclick=session.optional?()=>openCommandTile("coaching"):()=>commandSessionCall(session,"preview");}
}

renderPremiumMission=function(){
  const key=selectedDashboardDateKey();
  if(commandUnifiedCloudMission(key)){bellOriginalRenderPremiumMission?.();return;}
  const date=localDateFromKey(key),today=localDateKey(),futureDay=key>today;
  commandSetText("premiumMissionDate",key===today?"Today":date.toLocaleDateString("en-US",{month:"short",day:"numeric"}));
  const todayButton=document.getElementById("premiumTodayButton");if(todayButton)todayButton.textContent=key===today?"Today":"Return";
  const sessions=premiumAllSessions().sort((a,b)=>({strength:0,engine:1}[premiumSessionType(a)]??2)-({strength:0,engine:1}[premiumSessionType(b)]??2));
  if(!sessions.length){bellSelectedMissionSessionKey=null;bellOriginalRenderPremiumMission?.();return;}
  const budget=bellDailySessionBudget(sessions,key);
  if(!budget.sessions.some(x=>x.sessionKey===bellSelectedMissionSessionKey&&!x.completed))bellSelectedMissionSessionKey=(budget.sessions.find(x=>!x.completed&&!x.optional)||budget.sessions.find(x=>!x.completed)||budget.sessions[0])?.sessionKey||null;
  const selected=budget.sessions.find(x=>x.sessionKey===bellSelectedMissionSessionKey)||budget.sessions[0];
  const completed=budget.sessions.filter(x=>x.completed).length,total=budget.sessions.length;
  const strength=budget.sessions.find(x=>x.type==="strength"),engine=budget.sessions.find(x=>x.type==="engine");
  const title=typeof bellCombinedWorkoutDisplayLabel==="function"?bellCombinedWorkoutDisplayLabel(sessions):budget.sessions.map(premiumDisplayLabel).join(" + ");
  const required=budget.sessions.filter(x=>!x.optional),optional=budget.sessions.filter(x=>x.optional);
  const requiredTotal=required.reduce((sum,x)=>sum+x.minutes,0);
  commandSetText("premiumCompletionCount",completed);commandSetText("premiumCompletionTotal",`of ${total}`);commandSetText("premiumCompletionLabel",completed===total?"MISSION COMPLETE":"COMPLETE");
  commandSetText("commandMissionTitle",title);commandSetText("commandMissionPurpose",budget.checkedIn?`Today’s required work fits your ${budget.available}-minute availability.${optional.length?' Optional support is clearly marked and does not count toward the required total.':''}`:premiumSessionDescription(strength||engine||sessions[0]));
  commandSetText("commandMissionDuration",`${requiredTotal} min${optional.length?' required':''}`);commandSetText("commandMissionType",[strength?"Strength":"",engine?"Engine":""].filter(Boolean).join(" + "));commandSetText("commandMissionPriority",futureDay?"Preview Only":optional.length?"Required + Optional":total>1?"Two-Part Mission":"Primary Session");
  const stack=document.getElementById("premiumSessionStack");if(stack)stack.innerHTML=bellMissionSessionCards(budget,futureDay);
  bellRenderSelectedMissionDetail(selected,budget,futureDay);
  const status=readinessStatus(readinessScore());
  commandSetText("commandAdjustmentTitle",budget.checkedIn?"Fit to your available time":"Planned prescription");
  commandSetText("commandAdjustmentDetail",budget.checkedIn?`${requiredTotal} of ${budget.available} minutes assigned across required sessions.${optional.length?" Optional work is separate.":""}`:(status==="YELLOW"?"Quality-first volume and controlled effort.":status==="RED"?"Demand reduced to protect recovery.":"Execute the planned work with quality."));
};
