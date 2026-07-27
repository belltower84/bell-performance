"use strict";

let bpScheduleWeekNumber = null;
let bpPreviewedWeekNumber = null;

function bpPlanClone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function bpWeekStatus(block,week){
  if(block===data.upcomingTrainingBlock)return "planned";
  const current=Number(block?.currentWeek||1);
  if(block===data.trainingBlock&&block?.enabled&&week===current)return "active";
  if(week<current)return "complete";
  return "planned";
}
function bpPhaseForWeek(week,total=12){
  const ratio=week/Math.max(1,total);
  if(week===total)return {name:"Performance",objective:"Express the fitness and strength developed across the block."};
  if(ratio<=.25)return {name:"Foundation",objective:"Build movement quality, repeatable training habits, and aerobic support."};
  if(ratio<=.58)return {name:"Build",objective:"Progress strength and engine workload while preserving recovery."};
  if(ratio<=.82)return {name:"Peak",objective:"Apply the highest productive workload with focused recovery."};
  return {name:"Deload & Sharpen",objective:"Reduce fatigue while preserving readiness and performance."};
}
function bpGenerateWeekForBlock(block,week){
  const savedBlock=bpPlanClone(data.trainingBlock),savedPlan=bpPlanClone(data.plan),savedRotation=data.settings?.rotationWeek,savedPhase=data.settings?.phase;
  try{
    data.trainingBlock={...bpPlanClone(block),enabled:true,currentWeek:week};
    buildCurrentWeekPlan();
    return bpPlanClone(data.plan||[]).map(x=>({...x,done:false,status:"planned"}));
  }finally{
    data.trainingBlock=savedBlock;data.plan=savedPlan;
    if(data.settings){data.settings.rotationWeek=savedRotation;data.settings.phase=savedPhase;}
  }
}
function bpPrepareBlockPlan(block){
  if(!block)return block;
  const total=Math.max(1,Number(block.lengthWeeks)||12);
  const prior=Array.isArray(block.weeks)?block.weeks:[];
  block.weeks=Array.from({length:total},(_,i)=>{
    const week=i+1,existing=prior.find(w=>Number(w.week)===week);
    return existing||{week,status:bpWeekStatus(block,week),generatedAt:new Date().toISOString(),plan:bpGenerateWeekForBlock(block,week)};
  });
  block.planBuiltAt=block.planBuiltAt||new Date().toISOString();
  return block;
}
function bpLoadActiveWeekFromPlan(){
  const block=data.trainingBlock;if(!block?.enabled)return;
  bpPrepareBlockPlan(block);
  const entry=block.weeks.find(w=>Number(w.week)===Number(block.currentWeek||1));
  if(entry?.plan?.length)data.plan=bpPlanClone(entry.plan).map(x=>({...x,done:false,status:"planned"}));
}
function bpResolvePlanBlock(){return data.upcomingTrainingBlock||data.trainingBlock;}
function bpPlanBlockLabel(block){return block?.dualGoals?.strengthGoal||data.settings?.primaryTrainingIdentity||block?.goalType||"Training Block";}
function bpCurrentTimelineWeek(block=bpResolvePlanBlock()){
  if(!block)return 1;
  if(bpScheduleWeekNumber==null)bpScheduleWeekNumber=block===data.upcomingTrainingBlock?1:Number(block.currentWeek||1);
  return Math.max(1,Math.min(Number(block.lengthWeeks)||block.weeks?.length||12,Number(bpScheduleWeekNumber)||1));
}
function bpWeekStartKey(block,week){
  const base=block?.startDate||mondayKeyFor(localDateKey());
  return addLocalDays(mondayKeyFor(base),(Number(week)-1)*7);
}
function bpWeekPlan(block,week){
  bpPrepareBlockPlan(block);
  if(block===data.trainingBlock&&Number(week)===Number(block.currentWeek||1))return data.plan||[];
  return block.weeks?.find(w=>Number(w.week)===Number(week))?.plan||[];
}
function bpWeekSessionTypes(item){return typeof scheduleTypesForItem==='function'?scheduleTypesForItem(item):[];}
function bpNavigateScheduleWeek(delta){
  const block=bpResolvePlanBlock();if(!block)return showScreen('plan');
  bpPrepareBlockPlan(block);
  bpScheduleWeekNumber=Math.max(1,Math.min(Number(block.lengthWeeks)||block.weeks.length,bpCurrentTimelineWeek(block)+Number(delta||0)));
  if(typeof renderPremiumWeek==='function')renderPremiumWeek();
  if(typeof renderWeeklyScheduleStrip==='function')renderWeeklyScheduleStrip();
}
function bpResetScheduleWeek(){bpScheduleWeekNumber=null;}
function bpRenderPlanProgress(){
  const host=document.getElementById("planProgressArea"),block=bpResolvePlanBlock();if(!host)return;
  if(!block){host.innerHTML='<div class="card"><h3>Plan Progress</h3><p class="hint">Build a training block to preview the complete plan.</p></div>';return;}
  bpPrepareBlockPlan(block);
  const current=Number(block.currentWeek||1),isUpcoming=block===data.upcomingTrainingBlock,total=Number(block.lengthWeeks)||block.weeks.length;
  host.innerHTML=`<div class="card plan-progress-card"><div class="card-title-row"><div><span class="metric-label">Training Timeline</span><h3>${bpPlanBlockLabel(block)}</h3><div class="hint">${total}-week plan • ${isUpcoming?`Starts ${bpDateLabel(block.startDate)}`:`Week ${current} active`}</div></div><button onclick="bpBuildNextWeek()">Build Next Week</button></div><div class="plan-week-grid" id="planWeekTimeline">${block.weeks.map(w=>{const phase=bpPhaseForWeek(w.week,total),status=bpWeekStatus(block,w.week);return `<button class="plan-week-tile ${status}" data-week="${w.week}" onclick="bpPreviewWeek(${w.week})"><span>${phase.name}</span><strong>Week ${w.week}</strong><small>${status==='active'?'Current':status==='complete'?'Complete':'Preview'} ›</small></button>`}).join("")}</div></div>`;
  setTimeout(()=>host.querySelector('.plan-week-tile.active')?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}),50);
}
function bpCoachBriefForWeek(block,week,plan){
  const phase=bpPhaseForWeek(week,Number(block.lengthWeeks)||12);
  const strength=plan.filter(x=>bpWeekSessionTypes(x).includes('strength')).length;
  const engine=plan.filter(x=>bpWeekSessionTypes(x).includes('engine')).length;
  const minutes=plan.reduce((sum,x)=>sum+(Number(x.prescribedDuration)||Number(scaledTemplate?.(x.mission)?.duration)||0),0);
  const fatigue=phase.name==='Peak'?'Moderate–High':phase.name.includes('Deload')?'Low–Moderate':'Moderate';
  return `<span class="metric-label">Coach’s Brief · ${phase.name}</span><h3>${phase.objective}</h3><div class="week-brief-metrics"><span><b>${strength}</b> Strength</span><span><b>${engine}</b> Engine</span><span><b>${minutes||'—'}</b> Min</span><span><b>${fatigue}</b> Fatigue</span></div><p>Preview the week now so you can plan training around work, family, and recovery. Bell may refine future prescriptions after your weekly debrief.</p>`;
}
function bpPreviewWeek(week){
  const block=bpResolvePlanBlock();if(!block)return;
  bpPrepareBlockPlan(block);bpPreviewedWeekNumber=Number(week);bpScheduleWeekNumber=Number(week);
  const plan=bpWeekPlan(block,week),phase=bpPhaseForWeek(week,Number(block.lengthWeeks)||12),status=bpWeekStatus(block,week);
  document.getElementById("weekPreviewTitle").textContent=`Week ${week} — ${phase.name}`;
  document.getElementById("weekPreviewSubtitle").textContent=`${bpPlanBlockLabel(block)} • ${status}`;
  document.getElementById("weekPreviewCoachBrief").innerHTML=bpCoachBriefForWeek(block,week,plan);
  document.getElementById("weekPreviewList").innerHTML=plan.map(x=>`<button class="week-preview-row" onclick="bpPreviewDay(${week},'${String(x.day).replaceAll("'","\\'")}')"><div><span>${x.day}</span><strong>${x.customLabel||x.mission}</strong><small>${x.detail||"Prescribed training"}</small></div>${x.prescribedDuration?`<b>${x.prescribedDuration} min</b>`:""}</button>`).join("")||'<div class="chart-empty-state">No prescribed sessions in this week.</div>';
  const build=document.getElementById('weekPreviewBuildButton');if(build)build.textContent=status==='complete'?'Rebuild Archived Week':'Rebuild This Week';
  document.getElementById("weekPreviewModal").classList.remove("hidden");document.body.classList.add("modal-open");
  if(typeof renderPremiumWeek==='function')renderPremiumWeek();
}
function bpPreviewDay(week,day){
  const block=bpResolvePlanBlock();if(!block)return;
  const plan=bpWeekPlan(block,week),item=plan.find(x=>x.day===day);if(!item)return;
  alert(`${day}: ${item.customLabel||item.mission}\n\n${item.detail||'Prescribed training'}${item.prescribedDuration?`\nEstimated time: ${item.prescribedDuration} minutes`:''}`);
}
function bpPreviewAdjacentWeek(delta){
  const block=bpResolvePlanBlock();if(!block)return;
  const next=Math.max(1,Math.min(Number(block.lengthWeeks)||block.weeks.length,(bpPreviewedWeekNumber||bpCurrentTimelineWeek(block))+Number(delta||0)));
  bpPreviewWeek(next);
}
function bpCloseWeekPreview(){document.getElementById("weekPreviewModal")?.classList.add("hidden");document.body.classList.remove("modal-open");}
function bpBuildWeek(target){
  const block=bpResolvePlanBlock();if(!block)return alert("Build a training block first.");
  bpPrepareBlockPlan(block);target=Math.max(1,Math.min(Number(block.lengthWeeks)||block.weeks.length,Number(target)||1));
  const existing=block.weeks.find(w=>Number(w.week)===target);
  if(existing&&!confirm(`Rebuild Week ${target} using your latest settings and coaching data?`))return;
  const replacement={week:target,status:"planned",generatedAt:new Date().toISOString(),plan:bpGenerateWeekForBlock(block,target)};
  block.weeks=block.weeks.map(w=>Number(w.week)===target?replacement:w);saveData({render:false});bpRenderPlanProgress();bpPreviewWeek(target);
}
function bpBuildNextWeek(){
  const block=bpResolvePlanBlock();if(!block)return alert("Build a training block first.");
  const target=block===data.upcomingTrainingBlock?1:Math.min(Number(block.currentWeek||1)+1,Number(block.lengthWeeks)||12);
  bpBuildWeek(target);
}
function bpBuildPreviewedWeek(){bpBuildWeek(bpPreviewedWeekNumber||bpCurrentTimelineWeek());}
function bpPreviewUpcomingPlan(){showScreen("plan");setTimeout(()=>{bpRenderPlanProgress();document.getElementById("planProgressArea")?.scrollIntoView({behavior:"smooth"});},50);}

const bpBaseWeeklySchedule=renderWeeklyScheduleStrip;
renderWeeklyScheduleStrip=function(){
  const block=bpResolvePlanBlock();if(!block)return bpBaseWeeklySchedule();
  const host=byId('weeklyScheduleDays');if(!host)return;
  bpPrepareBlockPlan(block);const week=bpCurrentTimelineWeek(block),plan=bpWeekPlan(block,week),startKey=bpWeekStartKey(block,week),today=localDateKey(),days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],short=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  setText('weeklyScheduleKicker',bpWeekStatus(block,week)==='active'?'This Week':bpWeekStatus(block,week)==='complete'?'Completed Week':'Plan Preview');
  setText('weeklyScheduleTitle',`Week ${week} · ${bpPhaseForWeek(week,block.lengthWeeks).name}`);
  host.innerHTML=days.map((day,index)=>{const key=addLocalDays(startKey,index),items=plan.filter(x=>x.day===day&&!['skipped','replaced'].includes(x.status)),types=[];items.forEach(i=>bpWeekSessionTypes(i).forEach(t=>{if(!types.includes(t))types.push(t)}));const codes=types.length?types.map(t=>`<i class="schedule-code ${t}">${t==='strength'?'S':'E'}</i>`).join(''):'<i class="schedule-code rest">R</i>';return `<button class="weekly-schedule-day ${key===today?'today':''}" onclick="bpPreviewWeek(${week})"><span class="day-name">${short[index]}</span><span class="day-date">${localDateFromKey(key).toLocaleDateString('en-US',{month:'numeric',day:'numeric'})}</span><div class="weekly-schedule-codes">${codes}</div></button>`}).join('');
};

const bpPlanBaseRenderApp=renderApp;
renderApp=function(){bpPlanBaseRenderApp();bpRenderPlanProgress();};

document.addEventListener('DOMContentLoaded',()=>{
  ['premiumWeekDays','weeklyScheduleDays'].forEach(id=>{const el=document.getElementById(id);if(!el)return;let x=null;el.addEventListener('touchstart',e=>x=e.changedTouches[0].clientX,{passive:true});el.addEventListener('touchend',e=>{if(x==null)return;const dx=e.changedTouches[0].clientX-x;if(Math.abs(dx)>45)bpNavigateScheduleWeek(dx<0?1:-1);x=null},{passive:true});});
});
