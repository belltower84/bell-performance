"use strict";

function bpPlanClone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function bpWeekStatus(block,week){if(block===data.trainingBlock&&block.enabled&&week===Number(block.currentWeek||1))return"active";if(week<Number(block.currentWeek||1))return"complete";return"planned";}
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
  block.weeks=Array.from({length:total},(_,i)=>{
    const week=i+1,existing=block.weeks?.find?.(w=>Number(w.week)===week);
    return existing||{week,status:bpWeekStatus(block,week),generatedAt:new Date().toISOString(),plan:bpGenerateWeekForBlock(block,week)};
  });
  block.planBuiltAt=new Date().toISOString();
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
function bpRenderPlanProgress(){
  const host=document.getElementById("planProgressArea"),block=bpResolvePlanBlock();if(!host)return;
  if(!block?.weeks?.length){host.innerHTML='<div class="card"><h3>Plan Progress</h3><p class="hint">Build a training block to preview the complete plan.</p></div>';return;}
  const current=Number(block.currentWeek||1),isUpcoming=block===data.upcomingTrainingBlock;
  host.innerHTML=`<div class="card plan-progress-card"><div class="card-title-row"><div><span class="metric-label">Plan Progress</span><h3>${bpPlanBlockLabel(block)}</h3><div class="hint">${block.lengthWeeks||block.weeks.length}-week plan • ${isUpcoming?`Starts ${bpDateLabel(block.startDate)}`:`Week ${current} active`}</div></div><button onclick="bpBuildNextWeek()">Build Next Week</button></div><div class="plan-week-grid">${block.weeks.map(w=>`<button class="plan-week-tile ${bpWeekStatus(block,w.week)}" onclick="bpPreviewWeek(${w.week})"><span>Week ${w.week}</span><strong>${bpWeekStatus(block,w.week)==="active"?"Active":bpWeekStatus(block,w.week)==="complete"?"Complete":"Planned"}</strong><small>Preview ›</small></button>`).join("")}</div></div>`;
}
function bpPreviewWeek(week){
  const block=bpResolvePlanBlock();if(!block)return;
  bpPrepareBlockPlan(block);const entry=block.weeks.find(w=>Number(w.week)===Number(week));if(!entry)return;
  document.getElementById("weekPreviewTitle").textContent=`Week ${week} Preview`;
  document.getElementById("weekPreviewSubtitle").textContent=`${bpPlanBlockLabel(block)} • ${bpWeekStatus(block,week)}`;
  document.getElementById("weekPreviewList").innerHTML=entry.plan.map(x=>`<div class="week-preview-row"><div><span>${x.day}</span><strong>${x.customLabel||x.mission}</strong><small>${x.detail||"Prescribed training"}</small></div>${x.prescribedDuration?`<b>${x.prescribedDuration} min</b>`:""}</div>`).join("");
  document.getElementById("weekPreviewModal").classList.remove("hidden");document.body.classList.add("modal-open");
}
function bpCloseWeekPreview(){document.getElementById("weekPreviewModal")?.classList.add("hidden");document.body.classList.remove("modal-open");}
function bpBuildNextWeek(){
  const block=bpResolvePlanBlock();if(!block)return alert("Build a training block first.");
  bpPrepareBlockPlan(block);
  const target=block===data.upcomingTrainingBlock?1:Math.min(Number(block.currentWeek||1)+1,Number(block.lengthWeeks)||block.weeks.length);
  const existing=block.weeks.find(w=>Number(w.week)===target);
  if(existing&&!confirm(`Rebuild Week ${target} using your latest settings and coaching data?`))return;
  const replacement={week:target,status:"planned",generatedAt:new Date().toISOString(),plan:bpGenerateWeekForBlock(block,target)};
  block.weeks=block.weeks.map(w=>Number(w.week)===target?replacement:w);saveData({render:false});bpRenderPlanProgress();bpPreviewWeek(target);
}
function bpPreviewUpcomingPlan(){showScreen("plan");setTimeout(()=>{bpRenderPlanProgress();document.getElementById("planProgressArea")?.scrollIntoView({behavior:"smooth"});},50);}

const bpPlanBaseRenderApp=renderApp;
renderApp=function(){bpPlanBaseRenderApp();bpRenderPlanProgress();};
