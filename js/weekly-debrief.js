"use strict";

let weeklyDebriefState={difficulty:"",summary:null};

function weekStartKey(date=new Date()){
  const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const day=d.getDay();
  const diff=day===0?-6:1-day;
  d.setDate(d.getDate()+diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function sundayKeyForWeek(date=new Date()){
  const d=new Date(`${weekStartKey(date)}T12:00:00`);d.setDate(d.getDate()+6);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function weeklyDebriefId(){return `${data.trainingBlock?.generatedAt||data.trainingBlock?.startDate||"block"}-w${data.trainingBlock?.currentWeek||1}`;}
function weeklySessionType(item){
  const mission=String(item?.mission||"");
  if(mission.startsWith("S-"))return "Strength";
  if(mission.startsWith("R-")||/run|engine|conditioning/i.test(mission))return "Engine";
  if(mission.startsWith("M-")||/mobility|reset|recovery/i.test(mission))return "Mobility";
  if(/core/i.test(mission))return "Core";
  return "Other";
}
function gradeFromPercent(pct){if(pct>=95)return"A+";if(pct>=90)return"A";if(pct>=87)return"A-";if(pct>=83)return"B+";if(pct>=80)return"B";if(pct>=77)return"B-";if(pct>=73)return"C+";if(pct>=70)return"C";if(pct>=65)return"D";return"Needs Work";}
function weeklyDebriefSummary(){
  const plan=(data.plan||[]).filter(x=>x.status!=="replaced");
  const categories={Strength:{scheduled:0,completed:0},Engine:{scheduled:0,completed:0},Mobility:{scheduled:0,completed:0},Core:{scheduled:0,completed:0}};
  plan.forEach(item=>{const type=weeklySessionType(item);if(categories[type]){categories[type].scheduled++;if(item.done||item.status==="completed")categories[type].completed++;}});
  const scheduled=plan.length,completed=plan.filter(x=>x.done||x.status==="completed").length,pct=Math.round(completed/Math.max(1,scheduled)*100);
  const start=weekStartKey(),end=sundayKeyForWeek();
  const readiness=(data.readinessLog||[]).filter(x=>x.date>=start&&x.date<=end&&Number.isFinite(Number(x.score))).map(x=>Number(x.score));
  const avgReadiness=readiness.length?Math.round(readiness.reduce((a,b)=>a+b,0)/readiness.length):null;
  const missed=plan.filter(x=>["skipped","rescheduled"].includes(x.status)).length;
  return{scheduled,completed,pct,grade:gradeFromPercent(pct),categories,avgReadiness,missed,start,end};
}
function categoryMetricHtml(name,rec){
  if(!rec.scheduled)return`<div class="weekly-debrief-metric"><span>${name}</span><strong>Support work</strong><small>Integrated across sessions</small></div>`;
  const pct=Math.round(rec.completed/rec.scheduled*100);
  return`<div class="weekly-debrief-metric"><span>${name}</span><strong>${rec.completed}/${rec.scheduled} complete</strong><small>${gradeFromPercent(pct)} performance</small></div>`;
}
function athleteResponseForDebrief(){
  return typeof bellAthleteResponseSummary==="function"?bellAthleteResponseSummary():{status:"collecting",label:"Collecting response data",detail:"Bell is still building a comparable response trend.",factors:{intensity:1,volume:1,engine:1}};
}
function coachAssessmentForWeek(s){
  const response=athleteResponseForDebrief();
  if(["safety_hold","protect"].includes(response.status))return`${response.detail} Weekly completion does not override pain or movement-quality feedback.`;
  if(["rebuild","regress","hold"].includes(response.status))return`${response.detail} Bell will preserve the mission while keeping the next exposure achievable.`;
  if(["progress","accelerate"].includes(response.status))return`${response.detail} Progression remains capped and is based on repeated completed work, not one exceptional session.`;
  if(s.pct>=90&&(!s.avgReadiness||s.avgReadiness>=70))return"You handled the week well. Bell is recording the response and will wait for enough comparable evidence before making a larger change.";
  if(s.pct>=75)return"You completed most of the important work. Next week will preserve the priority sessions while Bell continues to compare actual performance with the prescription.";
  if(s.avgReadiness!==null&&s.avgReadiness<60)return"Recovery was the main limiter this week. Bell will protect the core plan, reduce optional volume, and avoid forcing progression until readiness and completed performance improve.";
  return"Consistency was below the level needed for progression. Bell will repeat key exposures and will not assign catch-up volume.";
}
function renderWeeklyDebriefSummary(){
  const s=weeklyDebriefSummary();weeklyDebriefState.summary=s;
  document.getElementById("weeklyDebriefTitle").textContent=`Week ${data.trainingBlock?.currentWeek||1} Complete`;
  document.getElementById("weeklyDebriefLead").textContent=`${s.completed} of ${s.scheduled} scheduled sessions completed. Review the week before moving forward.`;
  document.getElementById("weeklyScoreOut").textContent=`${s.pct}%`;
  document.getElementById("weeklyGradeOut").textContent=s.grade;
  document.getElementById("weeklyGradeDetail").textContent=s.avgReadiness===null?`${s.missed} session changes • readiness data still building`:`Average readiness ${s.avgReadiness}% • ${s.missed} session changes`;
  document.getElementById("weeklyCategorySummary").innerHTML=Object.entries(s.categories).map(([n,r])=>categoryMetricHtml(n,r)).join("");
  document.getElementById("weeklyCoachAssessment").textContent=coachAssessmentForWeek(s);
}
function resetWeeklyDebriefSteps(){
  document.getElementById("weeklyDebriefSummaryStep")?.classList.remove("hidden");
  document.getElementById("weeklyDebriefCheckInStep")?.classList.add("hidden");
  document.getElementById("weeklyDebriefPreviewStep")?.classList.add("hidden");
  document.getElementById("buildingWeekState")?.classList.remove("hidden");
  document.getElementById("nextWeekPreviewContent")?.classList.add("hidden");
}
function hasIncompleteSundayTraining(){
  const sunday=(data.plan||[]).find(x=>String(x.day||"").toLowerCase()==="sunday");
  if(!sunday||sunday.done||sunday.status==="completed")return false;
  const type=weeklySessionType(sunday);
  return type==="Strength"||type==="Engine"||type==="Core";
}
function remainingWeekSessions(){return(data.plan||[]).filter(x=>x.status!=="replaced"&&!x.done&&x.status!=="completed");}
function openWeeklyDebrief(manual=false){
  if(!data.trainingBlock?.enabled){if(manual)alert("Create or activate a training block first.");return false;}
  const isSunday=new Date().getDay()===0;
  if(!manual&& !isSunday)return false;
  if(!manual&&hasIncompleteSundayTraining())return false;
  const seen=(data.performanceReviews?.weeklyDebriefs||[]).some(x=>x.id===weeklyDebriefId()&&x.completed);
  if(seen&&!manual)return false;
  if(manual){
    const remaining=remainingWeekSessions();
    if(remaining.length){const list=remaining.slice(0,4).map(x=>`• ${x.day||"Scheduled"} — ${x.label||x.mission||"Training"}`).join("\n");const more=remaining.length>4?`\n• and ${remaining.length-4} more`:"";if(!confirm(`Complete Week now?\n\nYou still have ${remaining.length} scheduled session${remaining.length===1?"":"s"} remaining:\n${list}${more}\n\nContinuing will move these sessions into the weekly review as incomplete and require the full athlete check-in before next week is built.`))return false;}
  }
  weeklyDebriefState={difficulty:"",summary:null,manual};
  resetWeeklyDebriefSteps();renderWeeklyDebriefSummary();
  const kicker=document.getElementById("weeklyDebriefKicker");if(kicker)kicker.textContent=isSunday&&!manual?"Sunday Coach’s Debrief":"Complete Week";
  document.getElementById("weeklyDebriefModal")?.classList.remove("hidden");document.body.classList.add("modal-open");
  return true;
}
function maybeOpenSundayDebrief(){return openWeeklyDebrief(false);}
function closeWeeklyDebrief(){document.getElementById("weeklyDebriefModal")?.classList.add("hidden");document.body.classList.remove("modal-open");}
function showWeeklyCheckIn(){document.getElementById("weeklyDebriefSummaryStep").classList.add("hidden");document.getElementById("weeklyDebriefCheckInStep").classList.remove("hidden");}
function showWeeklySummary(){document.getElementById("weeklyDebriefCheckInStep").classList.add("hidden");document.getElementById("weeklyDebriefSummaryStep").classList.remove("hidden");}
function selectWeeklyDifficulty(button){weeklyDebriefState.difficulty=button.dataset.value;document.querySelectorAll("#weeklyDifficultyChoices button").forEach(x=>x.classList.toggle("selected",x===button));}
function nextWeekCoachPlan(summary,difficulty,pain,energy){
  const response=athleteResponseForDebrief();
  if(pain!=="none"||["safety_hold","protect"].includes(response.status))return`${response.detail} Update your limitations or seek qualified medical guidance if symptoms persist or worsen.`;
  if(["rebuild","regress","hold"].includes(response.status))return response.detail;
  if(["progress","accelerate"].includes(response.status))return`${response.detail} Bell will retain the same mission structure and apply only the capped dose change.`;
  if(difficulty==="hard"||energy<=2||summary.avgReadiness!==null&&summary.avgReadiness<60)return"Next week keeps the main progression but trims optional volume and caps high-intensity conditioning. The goal is to restore momentum without avoidable fatigue.";
  return"Bell will keep the prescription stable while it gathers another comparable response. Missed sessions are not punished with catch-up volume.";
}
function buildWeeklyPreview(){
  if(!weeklyDebriefState.difficulty){alert("Choose how difficult the week felt before continuing.");return;}
  const pain=document.getElementById("weeklyPainArea").value,energy=Number(document.getElementById("weeklyEnergy").value)||3,summary=weeklyDebriefState.summary||weeklyDebriefSummary();
  document.getElementById("weeklyDebriefCheckInStep").classList.add("hidden");document.getElementById("weeklyDebriefPreviewStep").classList.remove("hidden");
  document.getElementById("nextWeekPreviewTitle").textContent=data.trainingBlock.currentWeek>=data.trainingBlock.lengthWeeks?"Training Block Complete":`Week ${data.trainingBlock.currentWeek+1}`;
  setTimeout(()=>{
    const progression=typeof strengthProgression==="function"?strengthProgression():{label:"Progressive training"};
    const phase=typeof blockPhase==="function"?blockPhase():"Build";
    const response=athleteResponseForDebrief();
    const responseFactors=`Load ${Math.round((response.factors?.intensity||1)*100)}% • Volume ${Math.round((response.factors?.volume||1)*100)}% • Engine ${Math.round((response.factors?.engine||1)*100)}%`;
    document.getElementById("nextWeekPreviewGrid").innerHTML=`<div class="weekly-debrief-metric"><span>Strength</span><strong>${progression.label}</strong><small>Planned versus completed sets, reps, load, RPE, and RIR</small></div><div class="weekly-debrief-metric"><span>Engine</span><strong>${phase}</strong><small>Time, distance, pace, heart rate, and completed effort</small></div><div class="weekly-debrief-metric"><span>Athlete response</span><strong>${response.label}</strong><small>${responseFactors}</small></div><div class="weekly-debrief-metric"><span>Recovery</span><strong>${pain==="none"?"Maintain mobility":"Protect reported area"}</strong><small>Pain and technique flags override progression</small></div><div class="weekly-debrief-metric"><span>Expected schedule</span><strong>${data.trainingBlock.trainingDays||5} training days</strong><small>${data.trainingBlock.sessionMinutes||75}-minute target sessions • no catch-up volume</small></div>`;
    document.getElementById("nextWeekCoachPlan").textContent=nextWeekCoachPlan(summary,weeklyDebriefState.difficulty,pain,energy);
    document.getElementById("beginNextWeekButton").textContent=data.trainingBlock.currentWeek>=data.trainingBlock.lengthWeeks?"Complete Training Block":"Begin Next Week";
    document.getElementById("buildingWeekState").classList.add("hidden");document.getElementById("nextWeekPreviewContent").classList.remove("hidden");
  },650);
}
function confirmAdvanceTrainingWeek(){
  const summary=weeklyDebriefState.summary||weeklyDebriefSummary(),entry={id:weeklyDebriefId(),week:data.trainingBlock.currentWeek,completedAt:new Date().toISOString(),completed:true,summary,athleteResponse:athleteResponseForDebrief(),difficulty:weeklyDebriefState.difficulty,painArea:document.getElementById("weeklyPainArea").value,energy:Number(document.getElementById("weeklyEnergy").value)||3,notes:document.getElementById("weeklyNotes").value.trim()};
  data.performanceReviews.weeklyDebriefs=data.performanceReviews.weeklyDebriefs||[];const old=data.performanceReviews.weeklyDebriefs.findIndex(x=>x.id===entry.id);if(old>=0)data.performanceReviews.weeklyDebriefs[old]=entry;else data.performanceReviews.weeklyDebriefs.push(entry);
  if(data.trainingBlock.currentWeek<data.trainingBlock.lengthWeeks){if(typeof archiveUnresolvedPlanSessions==="function")archiveUnresolvedPlanSessions("weekly_debrief");data.trainingBlock.currentWeek++;if(typeof bpPrepareBlockPlan==="function")bpPrepareBlockPlan(data.trainingBlock);if(typeof bpLoadActiveWeekFromPlan==="function")bpLoadActiveWeekFromPlan();else buildCurrentWeekPlan();}
  else{data.trainingBlock.completedAt=new Date().toISOString();data.trainingBlock.status="completed";if(typeof bpArchiveBlock==="function")bpArchiveBlock(data.trainingBlock,"block_completed");data.trainingBlock.enabled=false;data.plan=[];}
  saveData();closeWeeklyDebrief();renderApp();showScreen("home");
}
