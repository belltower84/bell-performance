"use strict";

function localDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;}
function localDateFromKey(key){const [y,m,d]=String(key||localDateKey()).split("-").map(Number);return new Date(y,m-1,d,12,0,0,0);}
function addLocalDays(key,delta){const d=localDateFromKey(key);d.setDate(d.getDate()+delta);return localDateKey(d);}
function mondayKeyFor(key=localDateKey()){const d=localDateFromKey(key),day=d.getDay(),offset=day===0?-6:1-day;d.setDate(d.getDate()+offset);return localDateKey(d);}
function selectedDashboardDateKey(){const today=localDateKey();data.dayNavigation=data.dayNavigation||{selectedDate:"",lastLocalDate:""};return data.dayNavigation.selectedDate||today;}
function setDashboardDate(key){data.dayNavigation.selectedDate=key;saveData();}
function navigateDashboardDay(delta){setDashboardDate(addLocalDays(selectedDashboardDateKey(),delta));}
function resetDashboardToToday(){setDashboardDate(localDateKey());}
function planDateKey(item){if(item?.scheduledDate)return item.scheduledDate;const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],idx=days.indexOf(item?.day);return idx>=0?addLocalDays(mondayKeyFor(),idx):"";}
function stampCurrentPlanDates(){const monday=mondayKeyFor();const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];(data.plan||[]).forEach((item,index)=>{const idx=Math.max(0,days.indexOf(item.day));item.scheduledDate=addLocalDays(monday,idx>=0?idx:index);item.sessionCompletions=item.sessionCompletions&&typeof item.sessionCompletions==="object"?item.sessionCompletions:{};});}
function renderDashboardDayNavigation(){const key=selectedDashboardDateKey(),today=localDateKey(),date=localDateFromKey(key),isToday=key===today;setText("missionDayHeading",isToday?"Today's Mission":`${new Intl.DateTimeFormat("en-US",{weekday:"long"}).format(date)} Mission`);setText("missionDayDate",new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric"}).format(date));const b=byId("dashboardDayButton");if(b){b.textContent=isToday?"Today":new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric"}).format(date);b.classList.toggle("viewing-today",isToday);b.title=isToday?"Viewing today":"Return to today";}document.querySelectorAll(".weekly-schedule-day").forEach(el=>el.classList.toggle("selected",el.dataset.date===key));}
function markPlannedSessionComplete(completed){let item=completed.planId?(data.plan||[]).find(x=>x.id===completed.planId):null;if(!item){const date=completed.scheduledDate||localDateKey(new Date(completed.completedAt));item=(data.plan||[]).find(x=>planDateKey(x)===date&&(x.mission===completed.name||x.secondaryMission===completed.name)&&!["skipped","replaced"].includes(x.status));}if(!item)return;item.sessionCompletions=item.sessionCompletions||{};let key=completed.planSessionKey;if(!key){const sessions=typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(item):[];key=sessions.find(x=>x.mission===completed.name&&!x.completed)?.sessionKey;}if(key)item.sessionCompletions[key]=completed.completedAt;const sessions=typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(item):[];const prescribed=sessions.filter(x=>!String(x.mission||"").startsWith("M-"));item.done=prescribed.length>0&&prescribed.every(x=>Boolean(item.sessionCompletions[x.sessionKey]));item.status=item.done?"completed":"planned";if(item.done)item.completedAt=completed.completedAt;}
function performLocalMidnightRollover(){const today=localDateKey();data.dayNavigation=data.dayNavigation||{};if(data.dayNavigation.lastLocalDate&&data.dayNavigation.lastLocalDate!==today){data.dayNavigation.selectedDate=today;data.settings.readiness.lastPromptDate="";}data.dayNavigation.lastLocalDate=today;if(!data.dayNavigation.selectedDate)data.dayNavigation.selectedDate=today;saveData({render:false});}
function scheduleMidnightRollover(){clearTimeout(window.__bellMidnightTimeout);const now=new Date(),next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,1,0);window.__bellMidnightTimeout=setTimeout(()=>{performLocalMidnightRollover();renderApp();maybePromptDailyReadiness();scheduleMidnightRollover();},Math.max(1000,next-now));}

// Goal- and sex-aware accessory programming. Main lifts and engine prescriptions remain unchanged.
function coreProgrammingProfile(){const sex=data.settings?.sex||"Prefer not to say",goal=String(data.trainingBlock?.dualGoals?.strengthGoal||data.trainingBlock?.goalType||data.settings?.athleteMode||"Hybrid");return{sex,goal,bodybuilding:/bodybuilding|physique|hypertrophy|recomposition/i.test(goal),strength:/powerlifting|strength/i.test(goal),athlete:/athlete|functional|hybrid/i.test(goal)};}
function applyCoreProgrammingProfile(template){if(!template?.exercises)return template;const p=coreProgrammingProfile(),copy={...template,exercises:template.exercises.map(x=>({...x}))};copy.exercises=copy.exercises.map((ex,index)=>{if(index<2)return ex;let sets=Number(ex.sets)||0,name=String(ex.name||"");if(p.bodybuilding){if(p.sex==="Female"&&/Hip Thrust|Glute|Romanian Deadlift|Lunge|Hamstring|Row|Pulldown|Face Pull/i.test(name))sets=Math.min(5,sets+1);if(p.sex==="Male"&&/Lateral Raise|Curl|Pressdown|Chest|Incline|Row/i.test(name))sets=Math.min(5,sets+1);}else if(p.strength&&/Curl|Raise|Fly|Pressdown/i.test(name))sets=Math.max(2,sets-1);else if(p.athlete&&/Carry|Jump|Sprint|Single-Arm|Split Squat|Row/i.test(name))sets=Math.min(5,sets+1);return{...ex,sets,coreProfileNote:p.sex==="Prefer not to say"?`${p.goal} accessory profile`:`${p.goal} • ${p.sex} accessory profile`};});return copy;}
const bellBaseScaledTemplate=scaledTemplate;
scaledTemplate=function(name){return applyCoreProgrammingProfile(bellBaseScaledTemplate(name));};

const bellBaseBuildPlan=buildCurrentWeekPlan;
buildCurrentWeekPlan=function(){const result=bellBaseBuildPlan.apply(this,arguments);stampCurrentPlanDates();return result;};

const bellBaseWeeklyStrip=renderWeeklyScheduleStrip;
renderWeeklyScheduleStrip=function(){bellBaseWeeklyStrip();const monday=mondayKeyFor();document.querySelectorAll("#weeklyScheduleDays .weekly-schedule-day").forEach((el,index)=>{const key=addLocalDays(monday,index);el.dataset.date=key;el.onclick=()=>setDashboardDate(key);el.classList.toggle("today",key===localDateKey());});renderDashboardDayNavigation();};


// 8.0.2: Optional rotating Core sessions. These are logged but never block prescribed-day completion.
function coreGoalProfile(){
  const goal=String(data.trainingBlock?.dualGoals?.strengthGoal||data.trainingBlock?.goalType||data.settings?.athleteMode||"Hybrid");
  return {
    goal,
    hypertrophy:/bodybuilding|physique|hypertrophy|recomposition/i.test(goal),
    strength:/powerlifting|max strength|strength/i.test(goal),
    endurance:/endurance|running|race|engine/i.test(goal)
  };
}
function completedOptionalCoreSessions(){return (data.history||[]).filter(x=>x?.optionalCore||String(x?.name||"").startsWith("C-"));}
function optionalCoreCompletedForDate(key=selectedDashboardDateKey()){return completedOptionalCoreSessions().some(x=>(x.scheduledDate||String(x.completedAt||"").slice(0,10))===key);}
function mostRecentCoreCode(){const hit=completedOptionalCoreSessions().filter(x=>/^C-[ABC]/.test(String(x?.name||""))).sort((a,b)=>new Date(b.completedAt||0)-new Date(a.completedAt||0))[0];return String(hit?.name||"").match(/^C-([ABC])/)?.[1]||"";}
function hoursSinceLastHardCore(){const hit=completedOptionalCoreSessions().filter(x=>/^C-[ABC]/.test(String(x?.name||""))).sort((a,b)=>new Date(b.completedAt||0)-new Date(a.completedAt||0))[0];if(!hit?.completedAt)return Infinity;return Math.max(0,(Date.now()-new Date(hit.completedAt).getTime())/36e5);}
function nextCoreCode(){const last=mostRecentCoreCode();return last==="A"?"B":last==="B"?"C":"A";}
function isRestDashboardDay(key=selectedDashboardDateKey()){
  const items=(data.plan||[]).filter(item=>planDateKey(item)===key&&!['skipped','replaced'].includes(item.status));
  return items.flatMap(item=>typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(item):[]).length===0;
}
function coreSessionName(key=selectedDashboardDateKey()){
  if(isRestDashboardDay(key)||readinessStatus()==="RED"||hoursSinceLastHardCore()<36) return "C-R Recovery Core";
  return `C-${nextCoreCode()} Optional Core`;
}
function coreTemplate(name){
  const p=coreGoalProfile(), rest=String(name).startsWith("C-R"), code=String(name).match(/^C-([ABC])/)?.[1]||"R";
  const volume=p.hypertrophy?1:0;
  const templates={
    A:{label:"Core A — Bracing & Anti-Extension",exercises:[
      {name:"Ab Wheel",block:"Anti-Extension",sets:3+volume,reps:"6–12",rest:45,cue:"Keep ribs down and stop before the low back extends."},
      {name:"Dead Bug",block:"Pelvic Control",sets:3,reps:"8–10/side",rest:30,cue:"Exhale fully and keep the low back gently connected to the floor."},
      {name:"Front Plank",block:"Isometric Bracing",sets:2+(p.strength?1:0),reps:"30–60 sec",rest:30,cue:"Brace as if preparing for contact; do not sag."}
    ]},
    B:{label:"Core B — Anti-Rotation & Lateral Stability",exercises:[
      {name:"Pallof Press",block:"Anti-Rotation",sets:3+volume,reps:"10–12/side",rest:30,cue:"Do not let the cable rotate the torso."},
      {name:"Suitcase Carry",block:"Loaded Stability",sets:3+(p.strength?1:0),reps:"30–50 yd/side",rest:45,cue:"Walk tall without leaning toward or away from the load."},
      {name:"Side Plank",block:"Lateral Stability",sets:2,reps:"30–45 sec/side",rest:30,cue:"Keep hips stacked and ribs down."}
    ]},
    C:{label:"Core C — Trunk & Hip Flexion",exercises:[
      {name:"Hanging Knee Raise",block:"Hip Flexion & Pelvic Control",sets:3+volume,reps:"8–15",rest:45,cue:"Curl the pelvis instead of only lifting the knees."},
      {name:"Cable Crunch",block:"Loaded Trunk Flexion",sets:3+volume,reps:"10–15",rest:45,cue:"Bring ribs toward pelvis without pulling with the arms."},
      {name:"Reverse Crunch",block:"Lower-Trunk Control",sets:2,reps:"12–20",rest:30,cue:"Lift the pelvis smoothly; avoid swinging."}
    ]},
    R:{label:"Recovery Core + Mobility",exercises:[
      {name:"Dead Bug",block:"Low-Fatigue Control",sets:2,reps:"6–8/side",rest:20,cue:"Slow breathing and perfect control."},
      {name:"Bird Dog",block:"Cross-Body Stability",sets:2,reps:"6–8/side",rest:20,cue:"Reach long without rotating the pelvis."},
      {name:"Pallof Press",block:"Anti-Rotation",sets:2,reps:"8–10/side",rest:25,cue:"Use a light resistance and stay tall."},
      {name:"Side Plank",block:"Lateral Stability",sets:2,reps:"20–30 sec/side",rest:25,cue:"Stop well before shaking or form loss."}
    ]}
  };
  const chosen=templates[rest?"R":code]||templates.A;
  if(p.endurance&&!rest){chosen.exercises=chosen.exercises.map(ex=>({...ex,sets:Math.min(3,ex.sets)}));}
  return {label:chosen.label,duration:rest?10:15,rotationWeek:getRotationWeek?.()||1,exercises:chosen.exercises.map(ex=>({...ex,originalSets:ex.sets,scaleNote:rest?"Optional recovery work — keep effort easy":"Optional core work — stop 2–3 reps before failure",recommendedWeight:"",recommendationDisplay:"Choose by control",recommendationNote:"Progress only when every rep remains controlled."}))};
}
const bellCoreScaledTemplate=scaledTemplate;
scaledTemplate=function(name){if(String(name||"").startsWith("C-"))return coreTemplate(name);return bellCoreScaledTemplate(name);};
function beginOptionalCore(key=selectedDashboardDateKey()){
  if(optionalCoreCompletedForDate(key)){alert("Optional core has already been completed for this day.");return;}
  beginWorkout(coreSessionName(key),{optionalCore:true,scheduledDate:key});
}
function optionalCoreCardHtml(key=selectedDashboardDateKey()){
  const done=optionalCoreCompletedForDate(key),name=coreSessionName(key),rest=String(name).startsWith("C-R"),template=coreTemplate(name),status=readinessStatus();
  const guidance=rest?"Low-fatigue trunk control and mobility. Keep it easy and skip it when full recovery is the better choice.":"A rotating 10–15 minute session that complements the primary workout without affecting day completion.";
  return `<span class="metric-label">Optional Core${done?' • Completed ✓':''}</span><h3>${template.label}</h3><p class="hint">${guidance}</p><div class="sub">${template.duration} minutes • ${status} readiness • Does not affect the streak or prescribed-day completion</div><div class="row"><button class="secondary" ${done?'disabled':''} onclick="beginOptionalCore('${key}')">${done?'Core Complete':'Start Optional Core'}</button>${rest?`<button class="secondary" onclick="document.getElementById('mobilityFocus').scrollIntoView({behavior:'smooth'})">Open Mobility</button>`:''}</div>`;
}
const bellBaseRenderTodayTrainingCards=renderTodayTrainingCards;
renderTodayTrainingCards=function(){
  bellBaseRenderTodayTrainingCards();
  const key=selectedDashboardDateKey(),items=(data.plan||[]).filter(item=>planDateKey(item)===key&&!['skipped','replaced'].includes(item.status));
  const prescribed=items.flatMap(sessionsFromPlanItem),eligible=prescribed.length<=1;
  const option=byId('singleSessionOption'),empty=byId('noTrainingForDay');
  empty?.querySelector('.optional-core-rest')?.remove();
  if(eligible&&prescribed.length===1&&option){option.classList.remove('hidden');option.innerHTML=optionalCoreCardHtml(key);}
  if(eligible&&!prescribed.length&&empty){empty.classList.remove('hidden');empty.insertAdjacentHTML('beforeend',`<div class="optional-core-rest">${optionalCoreCardHtml(key)}</div>`);}
};

document.addEventListener("DOMContentLoaded",()=>{normalizeData();performLocalMidnightRollover();if((data.plan||[]).some(item=>!item.scheduledDate))stampCurrentPlanDates();scheduleMidnightRollover();document.addEventListener("visibilitychange",()=>{if(!document.hidden){const before=data.dayNavigation?.lastLocalDate;performLocalMidnightRollover();if(before!==data.dayNavigation?.lastLocalDate)renderApp();}});});


// 8.0.1: Every prescribed session receives a visible, session-specific warm-up.
function bellWarmupRoutine(active=data.activeWorkout){
  if(!active) return [];
  if(active.optionalCore)return [{title:"Prepare",detail:"2–3 minutes easy movement and diaphragmatic breathing"},{title:"Mobilize",detail:"Cat-cow • thoracic rotation • gentle hip flexor stretch"},{title:"Prime",detail:"1 easy practice set of the first movement before working sets"}];
  const isEngine=Boolean(active.cardioType)||String(active.name||"").startsWith("R-");
  const names=(active.exercises||[]).map(ex=>String(ex.name||"")).join(" ").toLowerCase();
  const status=active.readiness?.status||readinessStatus();
  const short=status==="RED";
  if(isEngine){
    const modality=String(active.cardioType||data.settings?.cardioType||"Running").toLowerCase();
    const dynamic=modality.includes("run")||modality.includes("ruck")
      ? ["Ankle rocks + calf raises","Leg swings, front/back and lateral","Walking lunge with reach","Easy skips or marching drills"]
      : modality.includes("row")
        ? ["Easy rowing","Cat-cow + thoracic rotations","Bodyweight hinge","Progressive strokes"]
        : modality.includes("swim")
          ? ["Arm circles + band pull-aparts","Thoracic rotations","Easy technique laps","Progressive build laps"]
          : ["Easy modality pace","Hip and ankle mobility","Bodyweight squat + hinge","Progressive cadence pickups"];
    return [
      {title:"Raise",detail:`${short?3:5} minutes very easy ${active.cardioType||"movement"}`},
      {title:"Mobilize",detail:dynamic.slice(0,2).join(" • ")},
      {title:"Activate",detail:dynamic.slice(2).join(" • ")},
      {title:"Build",detail:short?"2 × 15-second controlled pickups":"3 × 20-second pickups, gradually reaching session pace"}
    ];
  }
  const lower=/squat|deadlift|hinge|lunge|split squat|leg press|hamstring|glute|calf/.test(names);
  const upper=/bench|press|row|pulldown|pull-up|chin-up|curl|triceps|raise|fly/.test(names);
  const general=[
    {title:"Raise",detail:`${short?3:5} minutes easy bike, rower, treadmill, or brisk walk`},
    {title:"Mobilize",detail:lower&&upper?"Ankle rocks • 90/90 hip switches • thoracic rotations • band dislocates":lower?"Ankle rocks • 90/90 hip switches • adductor rock-backs":upper?"Thoracic rotations • band dislocates • scapular wall slides":"Dynamic full-body mobility"},
    {title:"Activate",detail:lower&&upper?"Glute bridge 2 × 10 • dead bug 2 × 6/side • band pull-apart 2 × 12":lower?"Glute bridge 2 × 10 • dead bug 2 × 6/side • bodyweight squat 2 × 8":upper?"Band pull-apart 2 × 12 • scap push-up 2 × 8 • light external rotation 2 × 10":"Dead bug 2 × 6/side • bird dog 2 × 6/side"}
  ];
  const first=(active.exercises||[]).find(ex=>["Primary Strength","Primary Hypertrophy"].includes(ex.block))||(active.exercises||[])[0];
  const ramp=warmupSetsFor(first);
  general.push({title:"Ramp",detail:ramp.length?`${first.name}: ${ramp.map(x=>`${x.weight} lb × ${x.reps}`).join(" • ")}`:`Perform 2–4 gradually heavier practice sets for ${first?.name||"the first compound lift"}; none count as working sets.`});
  return general;
}

renderWarmupPanel=function(){
  const panel=document.getElementById("warmupPanel");
  if(!panel)return;
  const routine=bellWarmupRoutine();
  panel.classList.remove("hidden");
  panel.innerHTML=`<div class="warmup-heading"><div><span class="metric-label">Required Preparation</span><h3>Session Warm-Up</h3></div><span class="warmup-time">8–12 min</span></div><div class="hint">Complete this before the working sets. Keep it crisp—prepared, not fatigued.</div><div class="warmup-grid">${routine.map((item,index)=>`<label class="warmup-step"><input type="checkbox" onchange="this.closest('.warmup-step').classList.toggle('completed',this.checked)"><span><b>${index+1}. ${item.title}</b><small>${item.detail}</small></span></label>`).join("")}</div>`;
};
