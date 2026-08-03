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
function bellCanonicalRoles(item){
  return [item?.eventRole,item?.enduranceRole,item?.exerciseRole,item?.physiqueRole,item?.sessionRole]
    .filter(Boolean).map(value=>String(value).trim().toLowerCase());
}
function bellSessionProfile(item){
  const labelText=[item?.mission,item?.customLabel,item?.label].filter(Boolean).join(" ").toLowerCase();
  const roles=bellCanonicalRoles(item),has=(...tokens)=>roles.some(role=>tokens.some(token=>role===token||role.includes(token)));
  const recoveryDay=has("recovery_day")||(/^m-/i.test(String(item?.mission||""))&&/recovery|reset|mobility/.test(labelText));
  const mobility=recoveryDay||has("mobility")||/daily reset|recovery reset/.test(labelText);
  const canonicalLong=has("long_run","long_ride","long_endurance","race_rehearsal","event_rehearsal","simulation","brick","test_simulation","course_simulation");
  const canonicalHard=has("quality_run","run_quality","bike_quality","quality","interval","race_pace","round_conditioning");
  const canonicalEasy=has("easy_run","easy_ride","easy","swim","aerobic_recovery","cardio","cardio_recovery","recovery_aerobic");
  const canonicalEngine=canonicalLong||canonicalHard||canonicalEasy||has("endurance","conditioning","loaded_endurance");
  const canonicalStrength=has("strength_support","strength_skill","primary_lift","secondary_lift","hypertrophy","resistance","strength","carry_strength","grip_strength");
  const textEngine=!mobility&&/^r-|\brun\b|engine|interval|tempo|threshold|zone 2|aerobic|ruck|\bbike\b|\brow\b|swim|brick|simulation/.test(labelText);
  const engine=!mobility&&(canonicalEngine||(!canonicalStrength&&textEngine));
  const strength=!mobility&&!engine&&(canonicalStrength||!textEngine);
  const lower=strength&&(has("lower","competition_squat","competition_deadlift")||/lower|squat|deadlift|\bleg|hinge|posterior/.test(labelText));
  const upper=strength&&!lower&&(has("upper","competition_bench","overhead")||/upper|bench|press|pull|grip/.test(labelText));
  const full=strength&&!lower&&!upper;
  const longEngine=engine&&(canonicalLong||/long run|long ride|long aerobic|long endurance|race rehearsal|event simulation|course simulation|full test|brick/.test(labelText));
  const hardEngine=engine&&!longEngine&&(canonicalHard||/interval|tempo|threshold|quality|sprint|hill|vo2|race pace|competition rounds/.test(labelText));
  return {mobility,engine,strength,lower,upper,full,longEngine,hardEngine,easyEngine:engine&&!longEngine&&!hardEngine,roles};
}
function bellSessionRole(item){
  const p=bellSessionProfile(item),text=`${item?.customLabel||""} ${item?.mission||""}`.toLowerCase();
  if(p.longEngine)return "engine-long";
  if(p.hardEngine)return "engine-quality";
  if(p.easyEngine)return "engine-easy";
  if(p.lower)return /secondary|volume|athletic/.test(text)?"strength-lower-secondary":"strength-lower-primary";
  if(p.upper)return /secondary|volume|athletic/.test(text)?"strength-upper-secondary":"strength-upper-primary";
  if(p.strength)return "strength-full-body";
  if(p.mobility)return "mobility";
  return "other";
}
function bellUniqueSessionKey(item){return `${bellSessionRole(item)}:${String(item?.customLabel||item?.mission||"").trim().toLowerCase()}`;}
function bellCloneSessionTemplate(source,role,index){
  const item=JSON.parse(JSON.stringify(source||{}));
  item.done=false;item.status="planned";item.id=`bell-${role}-${Date.now()}-${index}`;
  const definitions={
    "strength-upper-primary":{mission:"S-1",label:"Primary Upper Strength"},
    "strength-lower-primary":{mission:"S-2",label:"Primary Lower Strength"},
    "strength-upper-secondary":{mission:"S-3",label:"Athletic Upper Strength"},
    "strength-lower-secondary":{mission:"S-4",label:"Secondary Lower Strength"},
    "strength-full-body":{mission:"S-4",label:"Full-Body Strength"},
    "engine-easy":{mission:"R-1",label:"Easy Aerobic Support"},
    "engine-quality":{mission:"R-2",label:"Run Quality"},
    "engine-long":{mission:"R-3",label:"Long Run"}
  };
  const d=definitions[role];if(d){item.mission=d.mission;item.customLabel=d.label;}
  if(role.startsWith("engine-")){
    const kind=role==="engine-quality"?"quality":role==="engine-long"?"long":"easy";
    let prescription=null;try{prescription=typeof engineWeekPrescription==="function"?engineWeekPrescription(kind):null;}catch(_){}
    item.prescribedDuration=Number(prescription?.duration)||Number(item.prescribedDuration)||Number(scaledTemplate?.(item.mission)?.duration)||30;
    item.detail=prescription?.detail||`Complete the ${d?.label||role} prescription at controlled, phase-appropriate effort.`;
  }else item.detail=`${item.detail||"Mission-specific training"} · Unique ${d?.label||role} exposure.`;
  delete item.secondaryMission;delete item.secondaryLabel;delete item.secondaryDetail;delete item.secondaryDuration;delete item.sessions;
  return item;
}

function bellExplodeConcurrentPlan(plan){
  if(!Array.isArray(plan))return [];
  const out=[];
  const cleanBase=item=>{
    const copy={...item};
    delete copy.secondaryMission;delete copy.secondaryLabel;delete copy.secondaryDetail;delete copy.secondaryDuration;delete copy.sessions;
    return copy;
  };
  plan.forEach((raw,index)=>{
    if(!raw)return;
    const baseId=String(raw.id||`plan-${index}`);
    const primary=cleanBase(raw);
    if(primary.mission)out.push(primary);
    if(raw.secondaryMission){
      out.push({
        id:`${baseId}-secondary`,day:raw.day,scheduledDate:raw.scheduledDate,
        mission:raw.secondaryMission,customLabel:raw.secondaryLabel,
        detail:raw.secondaryDetail,prescribedDuration:raw.secondaryDuration,
        done:Boolean(raw.sessionCompletions?.[`${baseId}:secondary`]||false),status:'planned',
        concurrentSourceId:baseId,concurrentSlot:'secondary'
      });
    }
    if(Array.isArray(raw.sessions))raw.sessions.forEach((session,sessionIndex)=>{
      if(!session?.mission)return;
      out.push({
        id:`${baseId}-session-${sessionIndex}`,day:raw.day,scheduledDate:raw.scheduledDate,
        mission:session.mission,customLabel:session.label||session.customLabel,
        detail:session.detail,prescribedDuration:session.prescribedDuration||session.duration,
        done:Boolean(raw.sessionCompletions?.[`${baseId}:session:${sessionIndex}`]||false),status:'planned',
        concurrentSourceId:baseId,concurrentSlot:`session:${sessionIndex}`
      });
    });
  });
  return out;
}

function bellEnsureDisciplineExposures(plan,block=data.trainingBlock||{},targetOverride=null){
  if(!Array.isArray(plan))return plan;
  const targets=targetOverride||(typeof bellDisciplineExposureTargets==="function"?bellDisciplineExposureTargets(block):{strength:3,engine:2});
  const result=[];const seen=new Set();
  for(const raw of plan){
    const item={...raw},key=bellUniqueSessionKey(item),p=bellSessionProfile(item);
    if(p.longEngine&&result.some(x=>bellSessionProfile(x).longEngine))continue;
    if(!seen.has(key)){seen.add(key);result.push(item);}
  }
  const strengthSources=result.filter(x=>bellSessionProfile(x).strength);
  const engineSources=result.filter(x=>bellSessionProfile(x).engine);
  const preferredStrength=["strength-upper-primary","strength-lower-primary","strength-upper-secondary","strength-lower-secondary"];
  const preferredEngine=["engine-easy","engine-quality","engine-long"];
  const addMissing=(roles,target,sources,kind)=>{
    let index=0;
    while(result.filter(x=>bellSessionProfile(x)[kind]).length<target&&index<roles.length){
      const role=roles[index++];
      if(result.some(x=>bellSessionRole(x)===role))continue;
      const source=sources.find(x=>{
        const p=bellSessionProfile(x);
        return role.includes("upper")?p.upper:role.includes("lower")?p.lower:role==="engine-long"?p.longEngine:role==="engine-quality"?p.hardEngine:role==="engine-easy"?p.easyEngine:p.strength;
      })||sources[(index-1)%Math.max(1,sources.length)];
      if(!source)break;
      result.push(bellCloneSessionTemplate(source,role,index));
    }
  };
  addMissing(preferredStrength,targets.strength,strengthSources,"strength");
  addMissing(preferredEngine,targets.engine,engineSources,"engine");
  return result;
}
function bellValidateGeneratedWeek(plan,targets){
  const strength=plan.filter(x=>bellSessionProfile(x).strength),engine=plan.filter(x=>bellSessionProfile(x).engine);
  const duplicateKeys=new Set(),seen=new Set();
  for(const item of plan){const key=bellUniqueSessionKey(item);if(seen.has(key))duplicateKeys.add(key);seen.add(key);}
  return {passed:strength.length===targets.strength&&engine.length===targets.engine&&engine.filter(x=>bellSessionProfile(x).longEngine).length<=1&&!duplicateKeys.size,
    strength:strength.length,engine:engine.length,duplicates:[...duplicateKeys]};
}


function bellIntegratedSupportForItem(item){
  const p=bellSessionProfile(item);
  const text=`${item?.customLabel||""} ${item?.mission||""}`.toLowerCase();
  let mobilityFocus="Full Body Reset";
  if(p.lower||/run|sprint|interval|long/.test(text))mobilityFocus="Hips, Ankles & Posterior Chain";
  else if(p.upper)mobilityFocus="Shoulders & Thoracic Spine";
  const hardDay=p.longEngine||p.hardEngine||(p.lower&&/primary|heavy/.test(text));
  const coreRequired=p.strength&&!hardDay;
  const coreOptional=!coreRequired&&!p.longEngine;
  return {
    mobility:{included:true,placement:"cooldown",minutes:p.longEngine?8:10,focus:mobilityFocus},
    core:{included:coreRequired||coreOptional,required:coreRequired,optional:coreOptional,minutes:coreRequired?8:coreOptional?6:0,focus:p.upper?"Anti-extension & carry stability":p.lower?"Anti-rotation & bracing":"Trunk stability"}
  };
}
function bellIntegrateMobilityAndCore(plan){
  if(!Array.isArray(plan))return plan;
  return plan.filter(item=>!bellSessionProfile(item).mobility).map(item=>{
    const support=bellIntegratedSupportForItem(item);
    return {...item,integratedSupport:support,supportComponent:false};
  });
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
  const anchorTemplates={2:["Monday","Friday"],3:["Monday","Tuesday","Friday"],4:["Monday","Tuesday","Wednesday","Friday"],5:["Monday","Tuesday","Wednesday","Friday","Saturday"]};
  const anchors=(anchorTemplates[Math.min(5,strengthItems.length)]||BELL_WEEKDAYS).filter(d=>allowed.includes(d)&&!profiles(d).some(q=>q.longEngine));
  strengthItems.forEach((item,index)=>{
    const candidates=allowed.filter(d=>!profiles(d).some(q=>q.longEngine));
    const target=anchors[index]||candidates.find(d=>!assigned[d].length)||candidates[index%candidates.length];
    place(item,[target],()=>0);
  });
  if(allowed.includes("Friday")&&strengthItems.length>=4&&!profiles("Friday").some(q=>q.strength)){
    const donor=allowed.find(d=>d!=="Friday"&&assigned[d].filter(x=>bellSessionProfile(x).strength).length>1);
    if(donor){const idx=assigned[donor].findIndex(x=>bellSessionProfile(x).strength);const [moved]=assigned[donor].splice(idx,1);moved.day="Friday";assigned.Friday.push(moved);}
  }
  remaining.filter(x=>bellSessionProfile(x).engine).forEach(item=>{
    const p=bellSessionProfile(item);
    place(item,allowed,day=>{
      const existing=profiles(day);let score=existing.length*35;
      if(existing.some(q=>q.engine))score+=1000;
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


function bellWeekOneRemainingDays(block,week,days){
  const ordered=bellOrderedDays(days);
  if(Number(week)!==1||!block?.startDate)return ordered;
  const start=localDateFromKey(block.startDate),today=localDateFromKey(todayKey());
  const startKey=block.startDate;
  if(startKey>todayKey())return ordered;
  const jsDay=start.getDay(),mondayIndex=(jsDay+6)%7;
  return ordered.filter(day=>BELL_WEEKDAYS.indexOf(day)>=mondayIndex);
}
function bellPartialWeekTargets(base,remainingDays){
  const n=remainingDays.length;
  if(n>=5)return base;
  const caps={0:{strength:0,engine:0},1:{strength:1,engine:0},2:{strength:1,engine:1},3:{strength:2,engine:2},4:{strength:3,engine:2}}[n]||base;
  return {strength:Math.min(base.strength,caps.strength),engine:Math.min(base.engine,caps.engine)};
}
function bellMissionAlignedExposureTargets(base,block,remainingDays){
  const n=remainingDays.length,mission=block?.mission||{};
  const eventText=`${mission.eventType||""} ${mission.developmentGoal||""} ${data.settings?.primaryTrainingIdentity||""}`.toLowerCase();
  if(mission.path==="event"){
    const family=typeof currentEventFamilyId==="function"?currentEventFamilyId(mission.eventType):(
      /5k|10k|half marathon|marathon/.test(eventText)?"running":
      /cycling time trial/.test(eventText)?"cycling":
      /triathlon/.test(eventText)?"multisport":
      /hyrox|crossfit|combat sports/.test(eventText)?"functional":
      /powerlifting|strongman/.test(eventText)?"strength_competition":
      /obstacle course/.test(eventText)?"obstacle_loaded":
      /bodybuilding|physique/.test(eventText)?"physique":"tactical"
    );
    const full={
      running:{strength:2,engine:4},cycling:{strength:2,engine:4},multisport:{strength:1,engine:5},
      functional:{strength:2,engine:4},strength_competition:/strongman/.test(eventText)?{strength:4,engine:2}:{strength:4,engine:1},
      tactical:{strength:3,engine:3},obstacle_loaded:{strength:3,engine:3},physique:{strength:4,engine:2}
    }[family]||base;
    if(n<=1)return {strength:n,engine:0};
    return full;
  }
  if(/bodybuilding|physique/.test(eventText)){
    if(n<=1)return {strength:n,engine:0};
    const engine=n>=3?1:0;
    return {strength:Math.min(Number(base.strength)||4,Math.max(1,n-engine),4),engine:Math.min(Number(base.engine)||1,engine)};
  }
  return base;
}
function bellEventPriority(item){
  const roles=bellCanonicalRoles(item),text=`${item?.customLabel||""} ${item?.mission||""}`.toLowerCase();
  if(roles.some(role=>/simulation|rehearsal|event_day|long_run|long_ride|brick/.test(role))||/simulation|race rehearsal|long run|long ride|brick|full test/.test(text))return 100;
  if(roles.some(role=>/quality|run_quality|bike_quality/.test(role))||/quality|threshold|interval|competition rounds/.test(text))return 90;
  if(roles.some(role=>/primary_lift|strength_skill|hypertrophy|resistance/.test(role)))return 80;
  if(roles.some(role=>/easy|swim|aerobic_recovery|cardio/.test(role)))return 70;
  return 50;
}
function bellTrimPlanToTargets(plan,targets){
  const strength=plan.filter(x=>bellSessionProfile(x).strength),engine=plan.filter(x=>bellSessionProfile(x).engine),other=plan.filter(x=>!bellSessionProfile(x).strength&&!bellSessionProfile(x).engine&&!bellSessionProfile(x).mobility);
  const eventActive=data.trainingBlock?.mission?.path==="event";
  const strengthOrder=['strength-upper-primary','strength-lower-primary','strength-upper-secondary','strength-lower-secondary','strength-full-body'];
  const engineOrder=eventActive?['engine-long','engine-quality','engine-easy']:['engine-easy','engine-quality','engine-long'];
  const pick=(items,roles,count)=>{
    const out=[];
    const ordered=eventActive?[...items].sort((a,b)=>bellEventPriority(b)-bellEventPriority(a)):items;
    for(const role of roles){for(const item of ordered){if(out.length>=count)break;if(!out.includes(item)&&bellSessionRole(item)===role)out.push(item);}if(out.length>=count)break;}
    for(const item of ordered){if(out.length>=count)break;if(!out.includes(item))out.push(item);}return out;
  };
  return [...pick(strength,strengthOrder,targets.strength),...pick(engine,engineOrder,targets.engine),...other];
}
function bellApplyAvailabilityToWeek(block,week,plan){
  const choice=bellWeekAvailability(block,week);
  if(choice.mode==="vacation")return [];
  const effectiveDays=bellWeekOneRemainingDays(block,week,choice.days);
  const baseTargets=typeof bellDisciplineExposureTargets==="function"?bellDisciplineExposureTargets(block):{strength:3,engine:2};
  const missionTargets=bellMissionAlignedExposureTargets(baseTargets,block,effectiveDays);
  const targets=bellPartialWeekTargets(missionTargets,effectiveDays);
  const atomic=bellExplodeConcurrentPlan(plan);
  const integrated=bellIntegrateMobilityAndCore(atomic);
  const generated=bellEnsureDisciplineExposures(integrated,block,targets);
  const trimmed=bellTrimPlanToTargets(generated,targets);
  const validation=bellValidateGeneratedWeek(trimmed,targets);
  if(!validation.passed)console.warn("Bell weekly exposure validation failed",validation);
  return bellApplyDaysToPlan(trimmed,effectiveDays);
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
  document.getElementById("bellMissionSupportRows")?.remove();
}

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
        const integrated=item.integratedSupport||bellIntegratedSupportForItem(item);
        const additions=[];
        if(integrated?.core?.included)additions.push(`${integrated.core.required?"Core":"Optional Core"} · ${integrated.core.minutes} min`);
        if(integrated?.mobility?.included)additions.push(`Cooldown Mobility · ${integrated.mobility.minutes} min`);
        return `<div class="bell-day-component primary"><div class="grow"><div class="sub">${item.customLabel||item.mission}</div>${item.detail?`<div class="hint">${item.detail}</div>`:""}${additions.length?`<div class="hint bell-integrated-support">Includes: ${additions.join(" • ")}</div>`:""}</div><div class="plan-actions"><span class="plan-status-chip">${statusLabel}</span>${status==="completed"?"":`<button class="secondary compact-button" onclick="openMissedSessionManager(${index})">Manage</button>`}</div></div>`;
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
