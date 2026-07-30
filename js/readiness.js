"use strict";

function bellAppControlMode() {
  const mode = data?.settings?.appControlMode || data?.athleteProfile?.coaching?.controlMode || "coach";
  return mode === "planner" ? "planner" : "coach";
}
function bellCoachModeEnabled() { return bellAppControlMode() === "coach"; }

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
  const quickCheckIn=readiness.checkInVersion==="quick-v1"||Boolean(readiness.sleepState||readiness.bodyState||readiness.energyState);
  if(quickCheckIn){
    const sleep=five(readiness.sleepQuality,4);
    const body=five(readiness.recoveryStatus,4);
    const energy=five(readiness.energy,4);
    let score=Math.round((sleep*.35+body*.35+energy*.30)*20);
    if(readiness.painToday===true||readiness.painToday==="yes")score=Math.min(score,45);
    return Math.max(0,Math.min(100,score));
  }
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
  const current=data.settings.readiness||{};
  if(current.lastPromptDate===todayKey()&&(current.painToday===true||current.painToday==="yes"))adjusted=Math.min(adjusted,45);
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
  const readiness=data.settings.readiness||{};
  const direct=Number(readiness.timeMinutes);
  if(Number.isFinite(direct)&&direct>=15)return direct;
  return ({1:20,2:30,3:45,4:60,5:75})[Number(readiness.timeAvailability)||3];
}

function scalingProfile() {
  const actualStatus = readinessStatus();
  const timeMinutes = timeCapacityMinutes();
  const weekly = weeklyReadinessSummary();
  if (!bellCoachModeEnabled()) return { status:"GREEN", actualStatus, adaptive:false, load:1, sets:1, conditioning:1, timeMinutes:999, reportedTimeMinutes:timeMinutes, label:"Workout Planner mode keeps the scheduled session unchanged. Readiness remains visible so you can decide whether to train, modify, or recover.", weekly };
  if (actualStatus === "GREEN") return { status:actualStatus, actualStatus, adaptive:true, load:1, sets:1, conditioning:1, timeMinutes, label:"You're ready for quality work. Today's Strength and Engine plan will fit the time you have.", weekly };
  if (actualStatus === "YELLOW") return { status:actualStatus, actualStatus, adaptive:true, load:.90, sets:.72, conditioning:.65, timeMinutes, label:"Train smart today. Keep the primary work, reduce accessory volume, and make Engine work easy or optional.", weekly };
  return { status:actualStatus, actualStatus, adaptive:true, load:.75, sets:.45, conditioning:.35, timeMinutes, label:"Recovery is the priority. Bell Performance has reduced today's demand and shifted Engine work toward easy recovery.", weekly };
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
  alert(bellCoachModeEnabled()?`Check-in saved. Mission Status: ${trainingStatusText()}.`:`Check-in saved. Readiness: ${readinessScore()}/100. Workout Planner mode left the scheduled session unchanged.`);
}

function saveDailyReadinessPrompt() {
  if(!quickReadinessIsComplete()){
    updateQuickReadinessSubmitState();
    return;
  }
  commitReadiness(collectQuickReadinessFromPrompt());
  document.getElementById("dailyReadinessModal")?.classList.add("hidden");
  const launchTour=Boolean(data.settings.pendingFirstFlightTour&&!data.settings.firstFlightTourComplete);
  saveData({render:false});
  renderApp();
  if(launchTour){
    data.settings.pendingFirstFlightTour=false;
    saveData({render:false});
    window.setTimeout(()=>{
      if(typeof launchFirstFlightTour==="function")launchFirstFlightTour();
    },300);
  }
}

function readinessSliderLabel(name,value){
  const labels={
    sleepQuality:["","Poor","Below average","Okay","Good","Excellent"],
    energy:["","Depleted","Low","Functional","Energized","Fully energized"],
    recoveryStatus:["","Very sore","Sore","Manageable","Mostly fresh","Fresh and pain-free"],
    motivation:["","Very low","Low","Willing","Ready","Highly motivated"],
    timeAvailability:["","30 min","45 min","60 min","75 min","90 min","105 min","120 min"]
  };
  return labels[name]?.[value]||String(value);
}

let quickReadinessDraft={sleep:null,body:null,energy:null,pain:null,time:null};
const QUICK_READINESS_MAP={
  sleep:{poor:2,okay:4,good:5},
  body:{"beat-up":2,normal:4,fresh:5},
  energy:{drained:2,steady:4,"fired-up":5},
  time:{20:1,30:2,45:3,60:4,75:5}
};

function readinessSleepLabel(readiness=data.settings.readiness||{}){
  if(readiness.sleepState)return ({poor:"Poor",okay:"Okay",good:"Good"})[readiness.sleepState]||"Okay";
  const value=Number(readiness.sleepQuality)||3;
  return value>=5?"Good":value>=3?"Okay":"Poor";
}
function readinessBodyLabel(readiness=data.settings.readiness||{}){
  if(readiness.bodyState)return ({"beat-up":"Beat Up",normal:"Normal",fresh:"Fresh"})[readiness.bodyState]||"Normal";
  const value=Number(readiness.recoveryStatus)||3;
  return value>=5?"Fresh":value>=3?"Normal":"Beat Up";
}
function readinessEnergyLabel(readiness=data.settings.readiness||{}){
  if(readiness.energyState)return ({drained:"Drained",steady:"Steady","fired-up":"Fired Up"})[readiness.energyState]||"Steady";
  const value=Number(readiness.energy)||3;
  return value>=5?"Fired Up":value>=3?"Steady":"Drained";
}
function readinessPainLabel(readiness=data.settings.readiness||{}){
  return readiness.painToday===true||readiness.painToday==="yes"?"Review":"None";
}
function readinessTimeLabel(readiness=data.settings.readiness||{}){
  const minutes=Number(readiness.timeMinutes)||timeCapacityMinutes();
  return `${minutes}${minutes>=75?"+":""} min`;
}

function updateReadinessControlModeUI(){
  const coachMode=bellCoachModeEnabled();
  const dailyTime=document.getElementById("dailyTimeQuestion");if(dailyTime)dailyTime.hidden=!coachMode;
  const onboardingTime=document.getElementById("onboardingTimeAvailability")?.closest("label");if(onboardingTime)onboardingTime.hidden=!coachMode;
  const submit=document.getElementById("quickReadinessSubmit");if(submit)submit.textContent=coachMode?"Build Today’s Mission":"Save Today’s Check-In";
}
function updateReadinessSliderDisplay(){
  updateReadinessControlModeUI();
  const sleep=document.getElementById("promptSleepDurationMinutes");
  if(sleep){const minutes=+sleep.value||0;const output=document.getElementById("promptSleepDurationValue");if(output)output.textContent=`${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,"0")}m`;}
  ["sleepQuality","energy","recoveryStatus","motivation","timeAvailability"].forEach(name=>{
    const input=document.getElementById(`prompt${name}`),output=document.getElementById(`prompt${name}Value`);if(input&&output)output.textContent=`${input.value} · ${readinessSliderLabel(name,+input.value)}`;
  });
}
function setQuickChoiceUI(group,value){
  document.querySelectorAll(`[data-readiness-group="${group}"]`).forEach(button=>{
    const selected=String(button.dataset.value)===String(value);
    button.classList.toggle("selected",selected);
    button.setAttribute("aria-pressed",selected?"true":"false");
  });
}
function selectDailyReadinessChoice(group,value){
  if(!["sleep","body","energy"].includes(group))return;
  quickReadinessDraft[group]=value;
  setQuickChoiceUI(group,value);
  updateQuickReadinessSubmitState();
}
function selectDailyPain(value){
  quickReadinessDraft.pain=value;
  setQuickChoiceUI("pain",value);
  const detail=document.getElementById("quickPainDetail");if(detail)detail.classList.toggle("hidden",value!=="yes");
  if(value!=="yes"){const notes=document.getElementById("promptPainNotes");if(notes)notes.value="";}
  updateQuickReadinessSubmitState();
}
function selectDailyTime(minutes){
  quickReadinessDraft.time=Number(minutes);
  setQuickChoiceUI("time",Number(minutes));
  updateQuickReadinessSubmitState();
}
function quickReadinessIsComplete(){
  const core=Boolean(quickReadinessDraft.sleep&&quickReadinessDraft.body&&quickReadinessDraft.energy&&quickReadinessDraft.pain);
  const timeReady=!bellCoachModeEnabled()||Number.isFinite(Number(quickReadinessDraft.time));
  const painNote=String(document.getElementById("promptPainNotes")?.value||"").trim();
  const painReady=quickReadinessDraft.pain!=="yes"||painNote.length>=3;
  return core&&timeReady&&painReady;
}
function updateQuickReadinessSubmitState(){
  updateReadinessControlModeUI();
  const submit=document.getElementById("quickReadinessSubmit"),progress=document.getElementById("quickReadinessProgress");
  const required=bellCoachModeEnabled()?5:4;
  const complete=[quickReadinessDraft.sleep,quickReadinessDraft.body,quickReadinessDraft.energy,quickReadinessDraft.pain].filter(Boolean).length+(bellCoachModeEnabled()&&quickReadinessDraft.time?1:0);
  const painNote=String(document.getElementById("promptPainNotes")?.value||"").trim();
  const needsPainNote=quickReadinessDraft.pain==="yes"&&painNote.length<3;
  if(submit)submit.disabled=!quickReadinessIsComplete();
  if(progress)progress.textContent=needsPainNote?"Add a short pain note so Bell knows what to protect.":complete>=required?"Check-in complete. Your score will appear on the dashboard.":`${complete} of ${required} answered`;
}
function collectQuickReadinessFromPrompt(){
  const sleep=quickReadinessDraft.sleep,body=quickReadinessDraft.body,energyState=quickReadinessDraft.energy;
  const sleepMinutes=({poor:330,okay:405,good:480})[sleep]||420;
  const energy=QUICK_READINESS_MAP.energy[energyState]||4;
  const time=Number(quickReadinessDraft.time)||45;
  return {
    checkInVersion:"quick-v1",
    sleepState:sleep,
    bodyState:body,
    energyState,
    painToday:quickReadinessDraft.pain==="yes",
    painNotes:String(document.getElementById("promptPainNotes")?.value||"").trim(),
    timeMinutes:time,
    timeAvailability:QUICK_READINESS_MAP.time[time]||3,
    sleepHours:Math.floor(sleepMinutes/60),
    sleepMinutes:sleepMinutes%60,
    sleepQuality:QUICK_READINESS_MAP.sleep[sleep]||4,
    recoveryStatus:QUICK_READINESS_MAP.body[body]||4,
    energy,
    motivation:energy
  };
}
function populateReadinessPrompt(){
  updateReadinessControlModeUI();
  const r=data.settings.readiness||{},todayComplete=r.lastPromptDate===todayKey();
  quickReadinessDraft={
    sleep:todayComplete?(r.sleepState||((Number(r.sleepQuality)||3)>=5?"good":(Number(r.sleepQuality)||3)>=3?"okay":"poor")):null,
    body:todayComplete?(r.bodyState||((Number(r.recoveryStatus)||3)>=5?"fresh":(Number(r.recoveryStatus)||3)>=3?"normal":"beat-up")):null,
    energy:todayComplete?(r.energyState||((Number(r.energy)||3)>=5?"fired-up":(Number(r.energy)||3)>=3?"steady":"drained")):null,
    pain:todayComplete?(r.painToday?"yes":"no"):null,
    time:todayComplete?(Number(r.timeMinutes)||({1:20,2:30,3:45,4:60,5:75})[Number(r.timeAvailability)]||45):null
  };
  ["sleep","body","energy","pain","time"].forEach(group=>setQuickChoiceUI(group,quickReadinessDraft[group]));
  const notes=document.getElementById("promptPainNotes");if(notes)notes.value=todayComplete?String(r.painNotes||""):"";
  const detail=document.getElementById("quickPainDetail");if(detail)detail.classList.toggle("hidden",quickReadinessDraft.pain!=="yes");
  updateQuickReadinessSubmitState();
}
function openDailyReadiness(){
  populateReadinessPrompt();
  document.getElementById("dailyReadinessModal")?.classList.remove("hidden");
}
function maybePromptDailyReadiness() {
  if (!data.settings.coachMessages?.setupComplete || hasTodayReadiness() || !bellCoachModeEnabled()) return;
  const modal = document.getElementById("dailyReadinessModal");
  if (!modal) return;
  openDailyReadiness();
}

function pendingFeedbackSession(){return (data.history||[]).find(x=>x.completedAt===data.pendingFeedbackSessionId);}
function saveSessionFeedback() {
  const sessionId=data.pendingFeedbackSessionId,session=pendingFeedbackSession(),isEngine=Boolean(session?.cardioType)||String(session?.name||"").startsWith("R-");
  const entry=isEngine?{sessionId,date:todayKey(),type:"engine",effortAccuracy:+document.getElementById("engineFeedbackEffort").value,breathing:+document.getElementById("engineFeedbackBreathing").value,legFreshness:+document.getElementById("engineFeedbackLegs").value,symptoms:+document.getElementById("engineFeedbackSymptoms").value,sessionQuality:+document.getElementById("engineFeedbackEffort").value,postEnergy:+document.getElementById("engineFeedbackLegs").value,overallFeeling:Math.round((+document.getElementById("engineFeedbackBreathing").value + +document.getElementById("engineFeedbackLegs").value)/2),strain:+document.getElementById("engineFeedbackSymptoms").value,notes:document.getElementById("feedbackNotes").value.trim()}:{sessionId,date:todayKey(),type:"strength",sessionQuality:+document.getElementById("feedbackSessionQuality").value,postEnergy:+document.getElementById("feedbackPostEnergy").value,overallFeeling:+document.getElementById("feedbackOverallFeeling").value,strain:+document.getElementById("feedbackStrain").value,notes:document.getElementById("feedbackNotes").value.trim()};
  if(session)session.feedback=entry;const existing=data.sessionFeedbackLog.findIndex(x=>x.sessionId===sessionId);if(existing>=0)data.sessionFeedbackLog[existing]=entry;else data.sessionFeedbackLog.push(entry);data.pendingFeedbackSessionId=null;document.getElementById("sessionFeedbackModal")?.classList.add("hidden");saveData();setTimeout(()=>{if(typeof maybeOpenSundayDebrief==="function")maybeOpenSundayDebrief();},150);
}
function skipSessionFeedback(){data.pendingFeedbackSessionId=null;document.getElementById("sessionFeedbackModal")?.classList.add("hidden");saveData();setTimeout(()=>{if(typeof maybeOpenSundayDebrief==="function")maybeOpenSundayDebrief();},150);}
function openPendingSessionFeedback(){if(!data.pendingFeedbackSessionId)return;const session=pendingFeedbackSession(),isEngine=Boolean(session?.cardioType)||String(session?.name||"").startsWith("R-");document.getElementById("strengthFeedbackFields")?.classList.toggle("hidden",isEngine);document.getElementById("engineFeedbackFields")?.classList.toggle("hidden",!isEngine);const title=document.getElementById("feedbackTitle"),intro=document.getElementById("feedbackIntro");if(title)title.textContent=isEngine?"How did the engine session perform?":"How did that strength session land?";if(intro)intro.textContent=isEngine?"Report effort accuracy, breathing, leg response, and symptoms so the Coach Engine can progress distance and intensity logically.":"This feedback becomes part of your rolling seven-day readiness and strength progression.";document.getElementById("sessionFeedbackModal")?.classList.remove("hidden");}
