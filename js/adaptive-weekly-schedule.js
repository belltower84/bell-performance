"use strict";

const BELL_WEEKDAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const BELL_SCHEDULE_KEY = "bellWeeklyScheduleV1";

function bellScheduleState(){
  data.settings = data.settings || {};
  data.settings.trainingAvailability = data.settings.trainingAvailability || {};
  const availability = data.settings.trainingAvailability;
  if(!Array.isArray(availability.normalDays) || !availability.normalDays.length){
    const count=Math.max(2,Math.min(7,Number(data.trainingBlock?.trainingDays)||5));
    const defaults={2:["Tuesday","Friday"],3:["Monday","Wednesday","Saturday"],4:["Monday","Tuesday","Thursday","Saturday"],5:["Monday","Tuesday","Thursday","Friday","Saturday"],6:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],7:BELL_WEEKDAYS};
    availability.normalDays=[...(defaults[count]||defaults[5])];
  }
  availability.weekOverrides=availability.weekOverrides||{};
  return availability;
}
function bellOrderedDays(days){return BELL_WEEKDAYS.filter(day=>(days||[]).includes(day));}
function bellNormalTrainingDays(){return bellOrderedDays(bellScheduleState().normalDays);}
function bellSetNormalTrainingDays(days){
  const ordered=bellOrderedDays(days);
  if(!ordered.length) return false;
  const s=bellScheduleState(); s.normalDays=ordered; s.updatedAt=new Date().toISOString();
  if(data.trainingBlock){data.trainingBlock.availableDays=[...ordered];data.trainingBlock.trainingDays=ordered.length;}
  if(data.upcomingTrainingBlock){data.upcomingTrainingBlock.availableDays=[...ordered];data.upcomingTrainingBlock.trainingDays=ordered.length;}
  return true;
}
function bellWeekKey(block=data.trainingBlock,week=Number(block?.currentWeek||1)){return `${block?.startDate||todayKey()}:W${week}`;}
function bellWeekAvailability(block=data.trainingBlock,week=Number(block?.currentWeek||1)){
  const override=bellScheduleState().weekOverrides[bellWeekKey(block,week)];
  if(override?.mode==="vacation")return {mode:"vacation",days:[]};
  if(override?.mode==="custom")return {mode:"custom",days:bellOrderedDays(override.days)};
  return {mode:"normal",days:bellNormalTrainingDays()};
}
function bellSelectedCheckboxDays(container){return [...container.querySelectorAll('input[type="checkbox"][data-bell-day]:checked')].map(x=>x.value);}
function bellDayCheckboxes(selected=[]){return BELL_WEEKDAYS.map(day=>`<label class="bell-day-choice"><input type="checkbox" data-bell-day value="${day}" ${selected.includes(day)?"checked":""}><span><strong>${day.slice(0,3)}</strong><small>${day}</small></span></label>`).join("");}
function bellSyncOnboardingDays(){
  const host=document.getElementById("onboardingWeekdayChoices");if(!host)return;
  const days=bellSelectedCheckboxDays(host);const count=document.getElementById("onboardingTrainingDays");if(count)count.value=String(days.length||5);
}
function bellSaveOnboardingDays(){
  const host=document.getElementById("onboardingWeekdayChoices");if(!host)return true;
  const days=bellSelectedCheckboxDays(host);
  if(days.length<2){alert("Select at least two normal training days.");return false;}
  bellSetNormalTrainingDays(days);return true;
}
function bellSessionProfile(item){
  const text=[item?.mission,item?.customLabel].filter(Boolean).join(" ").toLowerCase();
  const mobility=/mobility|daily reset|recovery reset/.test(text);
  const engine=!mobility&&/^r-|run|engine|interval|tempo|threshold|zone 2|aerobic|ruck|bike|row/.test(text);
  const strength=!mobility&&!engine;
  const lower=strength&&/lower|squat|deadlift|leg|hinge/.test(text);
  const upper=strength&&!lower&&/upper|bench|press|pull/.test(text);
  const full=strength&&!lower&&!upper;
  const longEngine=engine&&/long run|long aerobic|long endurance/.test(text);
  const hardEngine=engine&&/interval|tempo|threshold|quality|sprint|hill|vo2/.test(text);
  return {mobility,engine,strength,lower,upper,full,longEngine,hardEngine,easyEngine:engine&&!longEngine&&!hardEngine};
}
function bellEnsureDisciplineExposures(plan,block=data.trainingBlock||{}){
  if(!Array.isArray(plan))return plan;
  const targets=typeof bellDisciplineExposureTargets==="function"?bellDisciplineExposureTargets(block):{strength:3,engine:2};
  const result=plan.map(item=>({...item}));
  const count=kind=>result.filter(item=>bellSessionProfile(item)[kind]).length;
  const cloneFor=(kind,index)=>{
    const pool=result.filter(item=>bellSessionProfile(item)[kind]);
    if(!pool.length)return null;
    const source={...pool[index%pool.length]};
    source.done=false;source.status="planned";source.id=`bell-${kind}-${Date.now()}-${index}`;
    if(kind==="strength"){
      const p=bellSessionProfile(source);
      source.mission=`S-${count("strength")+1}`;
      source.customLabel=p.lower?"Secondary Lower Strength":p.upper?"Secondary Upper Strength":"Secondary Full-Body Strength";
      source.detail=`${source.detail||"Mission-specific strength exposure"} · Added to meet the discipline's weekly strength target.`;
    }else{
      source.mission=`R-${count("engine")+1}`;
      source.customLabel=source.customLabel||"Easy Engine Support";
      source.detail=`${source.detail||"Aerobic support"} · Added to meet the discipline's weekly engine target.`;
    }
    return source;
  };
  let guard=0;
  while(count("strength")<targets.strength&&guard++<10){const item=cloneFor("strength",guard);if(!item)break;result.push(item);}
  guard=0;
  while(count("engine")<targets.engine&&guard++<10){const item=cloneFor("engine",guard);if(!item)break;result.push(item);}
  return result;
}

function bellOptimizeConcurrentPlan(plan,days){
  if(!Array.isArray(plan))return plan;
  const allowed=bellOrderedDays(days);if(!allowed.length)return [];
  const dayIndex=Object.fromEntries(BELL_WEEKDAYS.map((d,i)=>[d,i]));
  const assigned=Object.fromEntries(allowed.map(d=>[d,[]]));
  const primary=plan.filter(x=>!bellSessionProfile(x).mobility),support=plan.filter(x=>bellSessionProfile(x).mobility);
  const profiles=day=>(assigned[day]||[]).map(bellSessionProfile);
  const place=(item,candidates,score)=>{const pool=candidates.length?candidates:allowed;const day=[...pool].sort((a,b)=>score(a)-score(b))[0];item.day=day;assigned[day].push(item);};
  const longItems=primary.filter(x=>bellSessionProfile(x).longEngine),remaining=primary.filter(x=>!bellSessionProfile(x).longEngine);
  longItems.forEach(item=>place(item,[allowed.includes("Saturday")?"Saturday":allowed.at(-1)],()=>0));
  const strengthItems=remaining.filter(x=>bellSessionProfile(x).strength);
  const anchorTemplates={2:["Monday","Friday"],3:["Monday","Tuesday","Friday"],4:["Monday","Tuesday","Thursday","Friday"],5:["Monday","Tuesday","Wednesday","Friday","Saturday"]};
  const anchors=(anchorTemplates[Math.min(5,strengthItems.length)]||BELL_WEEKDAYS).filter(d=>allowed.includes(d)&&!profiles(d).some(q=>q.longEngine));
  strengthItems.forEach((item,index)=>{
    const candidates=allowed.filter(d=>!profiles(d).some(q=>q.longEngine));
    const target=anchors[index]||candidates.find(d=>!assigned[d].length)||candidates[index%candidates.length];
    place(item,[target],()=>0);
  });
  remaining.filter(x=>bellSessionProfile(x).engine).forEach(item=>{
    const p=bellSessionProfile(item);
    place(item,allowed,day=>{
      const existing=profiles(day);let score=existing.length*35;
      if(existing.some(q=>q.longEngine))score+=500;
      if(existing.some(q=>q.upper))score-=28;
      if(existing.some(q=>q.lower))score+=p.easyEngine?18:160;
      if(existing.some(q=>q.full))score+=p.easyEngine?8:75;
      if(p.hardEngine)Object.keys(assigned).forEach(other=>{if(profiles(other).some(q=>q.lower)&&Math.abs(dayIndex[other]-dayIndex[day])<=1)score+=45;});
      if(!existing.length&&["Wednesday","Thursday"].includes(day))score-=8;
      return score;
    });
  });
  const occupied=()=>allowed.filter(d=>assigned[d].length);
  support.forEach((item,index)=>{const daysWithTraining=occupied();const day=daysWithTraining.length?daysWithTraining[index%daysWithTraining.length]:allowed[index%allowed.length];item.day=day;item.supportComponent=true;assigned[day].push(item);});
  return allowed.flatMap(day=>assigned[day]);
}
function bellApplyDaysToPlan(plan,days){return bellOptimizeConcurrentPlan(plan,days);}

function bellApplyAvailabilityToWeek(block,week,plan){
  const choice=bellWeekAvailability(block,week);
  if(choice.mode==="vacation")return [];
  return bellApplyDaysToPlan(bellEnsureDisciplineExposures(plan,block),choice.days);
}

const bellBaseBuildCurrentWeekPlan=typeof buildCurrentWeekPlan==="function"?buildCurrentWeekPlan:null;
if(bellBaseBuildCurrentWeekPlan){
  buildCurrentWeekPlan=function(){
    const result=bellBaseBuildCurrentWeekPlan.apply(this,arguments);
    if(data.trainingBlock?.enabled)data.plan=bellApplyAvailabilityToWeek(data.trainingBlock,Number(data.trainingBlock.currentWeek||1),data.plan||[]);
    return result;
  };
}
const bellBaseGenerateWeek=typeof bpGenerateWeekForBlock==="function"?bpGenerateWeekForBlock:null;
if(bellBaseGenerateWeek){
  bpGenerateWeekForBlock=function(block,week){return bellApplyAvailabilityToWeek(block,week,bellBaseGenerateWeek(block,week));};
}
const bellBaseCompleteOnboarding=typeof completeOnboarding==="function"?completeOnboarding:null;
if(bellBaseCompleteOnboarding){completeOnboarding=function(){if(!bellSaveOnboardingDays())return;return bellBaseCompleteOnboarding.apply(this,arguments);};}

function bellInjectSettingsAvailability(){
  const screen=document.getElementById("more");if(!screen||document.getElementById("trainingAvailabilityCard"))return;
  const card=document.createElement("div");card.className="card";card.id="trainingAvailabilityCard";
  card.innerHTML=`<div class="status-line"><div><span class="metric-label">Weekly Scheduling</span><h3>Training Availability</h3><p class="sub">Bell schedules formal sessions only on the days you select.</p></div></div><div class="bell-weekday-grid" id="settingsWeekdayChoices">${bellDayCheckboxes(bellNormalTrainingDays())}</div><div class="row"><button class="good" type="button" onclick="bellSaveSettingsAvailability()">Save Training Days</button><button class="secondary" type="button" onclick="bellOpenWeeklyCheckIn()">Plan Next Week</button></div>`;
  screen.insertBefore(card,screen.querySelector(".mission-management-card")||screen.firstChild);
}
function bellSaveSettingsAvailability(){
  const host=document.getElementById("settingsWeekdayChoices"),days=bellSelectedCheckboxDays(host);
  if(days.length<2)return alert("Select at least two normal training days.");
  bellSetNormalTrainingDays(days);
  if(data.trainingBlock?.enabled){buildCurrentWeekPlan();if(typeof bpPrepareBlockPlan==="function"){data.trainingBlock.weeks=[];bpPrepareBlockPlan(data.trainingBlock);}}
  saveData({render:false});if(typeof bellSyncMissionAndPlan==="function"&&typeof bellCloudConnected==="function"&&bellCloudConnected())bellRunInBackground(bellSyncMissionAndPlan());renderApp();alert("Training availability saved. Upcoming sessions were rebuilt around those days.");
}

let bellWeeklyTargetWeek=null;
function bellOpenWeeklyCheckIn(){
  const block=data.trainingBlock;if(!block?.enabled)return alert("Start a training block before planning next week.");
  bellWeeklyTargetWeek=Math.min(Number(block.lengthWeeks||12),Number(block.currentWeek||1)+1);
  const modal=document.getElementById("bellWeeklyCheckInModal"),normal=bellNormalTrainingDays();
  document.getElementById("bellWeeklyTargetLabel").textContent=`Week ${bellWeeklyTargetWeek}`;
  document.getElementById("bellWeeklyCustomDays").innerHTML=bellDayCheckboxes(normal);
  document.querySelector('input[name="bellWeeklyMode"][value="normal"]').checked=true;
  bellToggleWeeklyMode();modal.classList.remove("hidden");document.body.classList.add("modal-open");
}
function bellCloseWeeklyCheckIn(){document.getElementById("bellWeeklyCheckInModal")?.classList.add("hidden");document.body.classList.remove("modal-open");}
function bellToggleWeeklyMode(){const mode=document.querySelector('input[name="bellWeeklyMode"]:checked')?.value||"normal";document.getElementById("bellWeeklyCustomWrap")?.classList.toggle("hidden",mode!=="custom");}
function bellSaveWeeklyCheckIn(){
  const block=data.trainingBlock,week=bellWeeklyTargetWeek;if(!block||!week)return;
  const mode=document.querySelector('input[name="bellWeeklyMode"]:checked')?.value||"normal";
  let days=[];if(mode==="custom")days=bellSelectedCheckboxDays(document.getElementById("bellWeeklyCustomDays"));
  if(mode==="custom"&&days.length<1)return alert("Select at least one training day for next week.");
  const key=bellWeekKey(block,week);bellScheduleState().weekOverrides[key]={mode,days:bellOrderedDays(days),savedAt:new Date().toISOString()};
  if(typeof bpPrepareBlockPlan==="function")bpPrepareBlockPlan(block);
  const plan=mode==="vacation"?[]:bellApplyAvailabilityToWeek(block,week,bellBaseGenerateWeek?bellBaseGenerateWeek(block,week):[]);
  const entry=block.weeks?.find(x=>Number(x.week)===week);if(entry){entry.plan=plan;entry.generatedAt=new Date().toISOString();entry.scheduleConfirmed=true;entry.vacation=mode==="vacation";}
  saveData({render:false});bellCloseWeeklyCheckIn();renderApp();alert(mode==="vacation"?`Week ${week} is set as vacation / planned time off. Formal training is paused and mobility remains optional.`:`Week ${week} was rebuilt around ${mode==="normal"?"your normal schedule":days.join(", ")}.`);
}
function bellWeekComplete(){
  const items=(data.plan||[]).filter(x=>!["skipped","replaced"].includes(x.status));if(!items.length)return false;
  return items.every(x=>x.done||x.status==="completed");
}
function bellMaybePromptNextWeek(){
  const block=data.trainingBlock;if(!block?.enabled||!bellWeekComplete()||Number(block.currentWeek||1)>=Number(block.lengthWeeks||12))return;
  const next=Number(block.currentWeek||1)+1,key=bellWeekKey(block,next),s=bellScheduleState();
  if(s.weekOverrides[key]||s.lastPromptedWeek===key)return;
  s.lastPromptedWeek=key;saveData({render:false});setTimeout(()=>bellOpenWeeklyCheckIn(),250);
}
function bellRenderMissionSupportRows(){
  const card=document.querySelector(".bell11-mission-card");if(!card)return;
  let host=document.getElementById("bellMissionSupportRows");if(!host){host=document.createElement("div");host.id="bellMissionSupportRows";host.className="bell-mission-support-rows";card.appendChild(host);}
  const key=typeof selectedDashboardDateKey==="function"?selectedDashboardDateKey():todayKey();
  const mobilityDone=(data.mobility?.completedDates||[]).includes(key),minutes=Number(data.mobility?.minutes)||10,focus=typeof resolvedMobilityFocus==="function"?resolvedMobilityFocus():"Mobility";
  const coreDone=typeof optionalCoreCompletedForDate==="function"?optionalCoreCompletedForDate(key):false;
  const coreName=typeof coreSessionName==="function"?coreSessionName(key):"Optional Core";
  const coreTemplateData=typeof coreTemplate==="function"?coreTemplate(coreName):{label:"Optional Core",duration:10};
  host.innerHTML=`<div class="bell-support-row ${mobilityDone?"complete":""}"><div><span class="metric-label">${mobilityDone?"Completed ✓":"Recovery"}</span><strong>${minutes} min ${focus} Mobility</strong><small>Complete morning, post-workout, or evening.</small></div><button class="secondary" type="button" onclick="bellOpenMobilityFromMission()">${mobilityDone?"View":"Start Mobility"}</button></div><div class="bell-support-row optional ${coreDone?"complete":""}"><div><span class="metric-label">Optional${coreDone?" • Completed ✓":""}</span><strong>${coreTemplateData.label}</strong><small>${coreTemplateData.duration||10} minutes • Does not block mission completion.</small></div><button class="secondary" type="button" ${coreDone?"disabled":""} onclick="beginOptionalCore('${key}')">${coreDone?"Core Complete":"Start Core"}</button></div>`;
}
function bellOpenMobilityFromMission(){showScreen("home");setTimeout(()=>document.getElementById("dailyMobilityCard")?.scrollIntoView({behavior:"smooth",block:"start"}),50);}

const bellBaseRenderAppAdaptive=typeof renderApp==="function"?renderApp:null;
if(bellBaseRenderAppAdaptive){renderApp=function(){const result=bellBaseRenderAppAdaptive.apply(this,arguments);bellInjectSettingsAvailability();bellRenderMissionSupportRows();bellMaybePromptNextWeek();return result;};}


const bellBaseRenderPlan=typeof renderPlan==="function"?renderPlan:null;
if(bellBaseRenderPlan){
  renderPlan=function(){
    const container=byId("planList");if(!container)return;
    container.innerHTML="";
    const groups=BELL_WEEKDAYS.map(day=>({day,items:(data.plan||[]).map((item,index)=>({item,index})).filter(x=>x.item.day===day)})).filter(g=>g.items.length);
    groups.forEach(group=>{
      const row=document.createElement("div");row.className="plan-row bell-grouped-day-card";
      const components=group.items.map(({item,index})=>{
        const status=item.status||(item.done?"completed":"planned"),statusLabel={planned:"Planned",completed:"Completed",rescheduled:"Rescheduled",skipped:"Skipped",replaced:"Replaced"}[status]||status;
        const support=bellSessionProfile(item).mobility||item.supportComponent;
        return `<div class="bell-day-component ${support?"support":"primary"}"><div class="grow"><div class="sub">${item.customLabel||item.mission}</div>${item.detail?`<div class="hint">${item.detail}</div>`:""}${support?`<div class="hint">Recovery component — does not consume the training day.</div>`:""}</div><div class="plan-actions"><span class="plan-status-chip">${statusLabel}</span>${status==="completed"?"":`<button class="secondary compact-button" onclick="openMissedSessionManager(${index})">Manage</button>`}</div></div>`;
      }).join("");
      row.innerHTML=`<div class="bell-grouped-day-heading"><strong>${group.day}</strong><span>${group.items.length} component${group.items.length===1?"":"s"}</span></div>${components}`;
      container.appendChild(row);
    });
  };
}

document.addEventListener("DOMContentLoaded",()=>{
  bellScheduleState();
  const onboarding=document.getElementById("onboardingWeekdayChoices");if(onboarding){onboarding.innerHTML=bellDayCheckboxes(bellNormalTrainingDays());onboarding.addEventListener("change",bellSyncOnboardingDays);bellSyncOnboardingDays();}
  document.querySelectorAll('input[name="bellWeeklyMode"]').forEach(x=>x.addEventListener("change",bellToggleWeeklyMode));
  bellInjectSettingsAvailability();bellRenderMissionSupportRows();
});
