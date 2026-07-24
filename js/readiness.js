"use strict";

function sleepDurationScore(readiness = data.settings.readiness || {}) {
  const total=Math.max(0,(Number(readiness.sleepHours)||0)+(Number(readiness.sleepMinutes)||0)/60);
  if(total>=7&&total<=9)return 10;
  if(total>9)return Math.max(5,10-(total-9)*1.5);
  if(total>=6)return 7+(total-6)*3;
  if(total>=5)return 4+(total-5)*3;
  return Math.max(0,total/5*4);
}
function rawDailyReadinessScore(readiness = data.settings.readiness || {}) {
  const five=(value,fallback=4)=>Math.max(1,Math.min(5,Number.isFinite(+value)?+value:fallback));
  const duration=sleepDurationScore(readiness);
  const sleepQuality=five(readiness.sleepQuality)*2;
  const energy=five(readiness.energy)*2;
  const motivation=five(readiness.motivation)*2;
  const recovery=five(readiness.recoveryStatus)*2;
  return Math.max(0,Math.min(100,Math.round(duration*2.5+sleepQuality*1.5+energy*2.5+recovery*2+motivation*1.5)));
}
function feedbackRecoveryScore(entry) {
  if (!entry) return null;
  const n = (value, fallback) => Number.isFinite(+value) ? +value : fallback;
  const sessionQuality = n(entry.sessionQuality, 3);
  const postEnergy = n(entry.postEnergy, 3);
  const overallFeeling = n(entry.overallFeeling, 3);
  const strainRecovery = 6 - n(entry.strain, 3);
  return Math.round((sessionQuality * .25 + postEnergy * .30 + overallFeeling * .25 + strainRecovery * .20) * 20);
}

function lastSevenDaysKeys() {
  const keys = [];
  const date = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() - i);
    keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }
  return keys;
}

function weeklyReadinessSummary() {
  const keys = new Set(lastSevenDaysKeys());
  const daily = (data.readinessLog || []).filter(x => keys.has(x.date)).map(x => Number(x.score)).filter(Number.isFinite);
  const feedback = (data.sessionFeedbackLog || []).filter(x => keys.has(x.date)).map(feedbackRecoveryScore).filter(Number.isFinite);
  const hasData = daily.length > 0 || feedback.length > 0;
  if (!hasData) return { score:null, dailyAverage:null, feedbackAverage:null, checkIns:0, feedbackCount:0, lowFeedbackCount:0, trend:"NO_DATA", hasData:false };
  const dailyAverage = daily.length ? Math.round(daily.reduce((a,b)=>a+b,0) / daily.length) : Math.round(feedback.reduce((a,b)=>a+b,0) / feedback.length);
  const feedbackAverage = feedback.length ? Math.round(feedback.reduce((a,b)=>a+b,0) / feedback.length) : dailyAverage;
  const score = Math.round(dailyAverage * .65 + feedbackAverage * .35);
  const lowFeedbackCount = feedback.filter(x => x < 52).length;
  const trend = lowFeedbackCount >= 2 ? "ACCUMULATING_FATIGUE" : score >= 75 ? "BUILDING_WELL" : score >= 55 ? "MANAGE_LOAD" : "RECOVERY_NEEDED";
  return { score, dailyAverage, feedbackAverage, checkIns:daily.length, feedbackCount:feedback.length, lowFeedbackCount, trend, hasData:true };
}

function readinessScore() {
  const today = rawDailyReadinessScore();
  const weekly = weeklyReadinessSummary();
  let adjusted = weekly.hasData ? Math.round(today * .72 + weekly.score * .28) : today;
  if (weekly.lowFeedbackCount >= 2) adjusted = Math.min(adjusted, 68);
  if (weekly.lowFeedbackCount >= 3) adjusted = Math.min(adjusted, 50);
  return Math.max(0, Math.min(100, adjusted));
}

function readinessStatus(score = readinessScore()) {
  if (score >= 75) return "GREEN";
  if (score >= 52) return "YELLOW";
  return "RED";
}

function trainingStatusText(status = readinessStatus()) {
  if (status === "GREEN") return "Ready to Train";
  if (status === "YELLOW") return "Train Smart";
  return "Recover to Grow";
}

function timeCapacityMinutes() {
  return ({1:30, 2:45, 3:60, 4:75, 5:90})[Number(data.settings.readiness?.timeAvailability) || 3];
}

function scalingProfile() {
  const status = readinessStatus();
  const timeMinutes = timeCapacityMinutes();
  const weekly = weeklyReadinessSummary();
  if (status === "GREEN") return { status, load:1, sets:1, conditioning:1, timeMinutes, label:"You're ready for quality work. Today's Strength and Engine plan will fit the time you have.", weekly };
  if (status === "YELLOW") return { status, load:.90, sets:.72, conditioning:.65, timeMinutes, label:"Train smart today. Keep the primary work, reduce accessory volume, and make Engine work easy or optional.", weekly };
  return { status, load:.75, sets:.45, conditioning:.35, timeMinutes, label:"Recovery is the priority. Bell Performance has reduced today's demand and shifted Engine work toward easy recovery.", weekly };
}

function hasTodayReadiness() {
  return (data.readinessLog || []).some(x => x.date === todayKey());
}

function collectReadinessFrom(prefix = "") {
  const id = name => document.getElementById(`${prefix}${name}`);
  const sleepTotal=id("SleepDurationMinutes") ? +id("SleepDurationMinutes").value : ((+id("sleepHours")?.value||0)*60+(+id("sleepMinutes")?.value||0));
  return {
    sleepHours:Math.floor(sleepTotal/60),
    sleepMinutes:sleepTotal%60,
    sleepQuality:+id("sleepQuality").value,
    recoveryStatus:+id("recoveryStatus").value,
    energy:+id("energy").value,
    motivation:+id("motivation").value,
    timeAvailability:+id("timeAvailability").value
  };
}

function commitReadiness(values) {
  data.settings.readiness = { ...data.settings.readiness, ...values, lastPromptDate:todayKey() };
  const rawScore = rawDailyReadinessScore(data.settings.readiness);
  const entry = { date:todayKey(), score:rawScore, status:readinessStatus(rawScore), ...values };
  const index = data.readinessLog.findIndex(x => x.date === entry.date);
  if (index >= 0) data.readinessLog[index] = entry; else data.readinessLog.push(entry);
  data.settings.readiness.score = readinessScore();
  data.settings.readiness.status = readinessStatus();
}

function saveReadiness() {
  commitReadiness(collectReadinessFrom(""));
  saveData();
  alert(`Check-in saved. Mission Status: ${trainingStatusText()}.`);
}

function saveDailyReadinessPrompt() {
  commitReadiness(collectReadinessFrom("prompt"));
  document.getElementById("dailyReadinessModal")?.classList.add("hidden");
  saveData();
  renderApp();
}

function readinessSliderLabel(name,value){
  const labels={
    sleepQuality:["","Poor","Below average","Okay","Good","Excellent"],
    energy:["","Depleted","Low","Functional","Energized","Fully energized"],
    recoveryStatus:["","Very sore","Sore","Manageable","Mostly fresh","Fresh and pain-free"],
    motivation:["","Very low","Low","Willing","Ready","Highly motivated"],
    timeAvailability:["","20–30 min","30–45 min","45–60 min","60–75 min","90+ min"]
  };
  return labels[name]?.[value]||String(value);
}
function updateReadinessSliderDisplay(){
  const sleep=document.getElementById("promptSleepDurationMinutes");
  if(sleep){const minutes=+sleep.value||0;const output=document.getElementById("promptSleepDurationValue");if(output)output.textContent=`${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,"0")}m`;}
  ["sleepQuality","energy","recoveryStatus","motivation","timeAvailability"].forEach(name=>{
    const input=document.getElementById(`prompt${name}`),output=document.getElementById(`prompt${name}Value`);if(input&&output)output.textContent=`${input.value} · ${readinessSliderLabel(name,+input.value)}`;
  });
}
function populateReadinessPrompt(){
  const r=data.settings.readiness||{};
  const sleep=document.getElementById("promptSleepDurationMinutes");if(sleep)sleep.value=Math.max(180,Math.min(720,(Number(r.sleepHours)||7)*60+(Number(r.sleepMinutes)||0)));
  const defaults={sleepQuality:4,recoveryStatus:4,energy:4,motivation:4,timeAvailability:3};
  Object.keys(defaults).forEach(name=>{const el=document.getElementById(`prompt${name}`);if(el)el.value=r[name]??defaults[name];});
  updateReadinessSliderDisplay();
}
function maybePromptDailyReadiness() {
  if (!data.settings.coachMessages?.setupComplete || hasTodayReadiness()) return;
  const modal = document.getElementById("dailyReadinessModal");
  if (!modal) return;
  populateReadinessPrompt();
  modal.classList.remove("hidden");
}

function pendingFeedbackSession(){return (data.history||[]).find(x=>x.completedAt===data.pendingFeedbackSessionId);}
function saveSessionFeedback() {
  const sessionId=data.pendingFeedbackSessionId,session=pendingFeedbackSession(),isEngine=Boolean(session?.cardioType)||String(session?.name||"").startsWith("R-");
  const entry=isEngine?{sessionId,date:todayKey(),type:"engine",effortAccuracy:+document.getElementById("engineFeedbackEffort").value,breathing:+document.getElementById("engineFeedbackBreathing").value,legFreshness:+document.getElementById("engineFeedbackLegs").value,symptoms:+document.getElementById("engineFeedbackSymptoms").value,sessionQuality:+document.getElementById("engineFeedbackEffort").value,postEnergy:+document.getElementById("engineFeedbackLegs").value,overallFeeling:Math.round((+document.getElementById("engineFeedbackBreathing").value + +document.getElementById("engineFeedbackLegs").value)/2),strain:+document.getElementById("engineFeedbackSymptoms").value,notes:document.getElementById("feedbackNotes").value.trim()}:{sessionId,date:todayKey(),type:"strength",sessionQuality:+document.getElementById("feedbackSessionQuality").value,postEnergy:+document.getElementById("feedbackPostEnergy").value,overallFeeling:+document.getElementById("feedbackOverallFeeling").value,strain:+document.getElementById("feedbackStrain").value,notes:document.getElementById("feedbackNotes").value.trim()};
  if(session)session.feedback=entry;const existing=data.sessionFeedbackLog.findIndex(x=>x.sessionId===sessionId);if(existing>=0)data.sessionFeedbackLog[existing]=entry;else data.sessionFeedbackLog.push(entry);data.pendingFeedbackSessionId=null;document.getElementById("sessionFeedbackModal")?.classList.add("hidden");saveData();
}
function skipSessionFeedback(){data.pendingFeedbackSessionId=null;document.getElementById("sessionFeedbackModal")?.classList.add("hidden");saveData();}
function openPendingSessionFeedback(){if(!data.pendingFeedbackSessionId)return;const session=pendingFeedbackSession(),isEngine=Boolean(session?.cardioType)||String(session?.name||"").startsWith("R-");document.getElementById("strengthFeedbackFields")?.classList.toggle("hidden",isEngine);document.getElementById("engineFeedbackFields")?.classList.toggle("hidden",!isEngine);const title=document.getElementById("feedbackTitle"),intro=document.getElementById("feedbackIntro");if(title)title.textContent=isEngine?"How did the engine session perform?":"How did that strength session land?";if(intro)intro.textContent=isEngine?"Report effort accuracy, breathing, leg response, and symptoms so the Coach Engine can progress distance and intensity logically.":"This feedback becomes part of your rolling seven-day readiness and strength progression.";document.getElementById("sessionFeedbackModal")?.classList.remove("hidden");}
