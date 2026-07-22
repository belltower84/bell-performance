"use strict";

function weeksUntil(dateString) {
  if (!dateString) return 12;
  const target = new Date(`${dateString}T12:00:00`);
  const today = new Date();
  const days = Math.ceil((target - today) / 86400000);
  return Math.max(6, Math.min(20, Math.ceil(days / 7)));
}

function blockWeek() {
  return Math.max(1, Math.min(data.trainingBlock.lengthWeeks || 12, data.trainingBlock.currentWeek || 1));
}

function blockPhase() {
  const week = blockWeek();
  const total = data.trainingBlock.lengthWeeks || 12;
  if (week === total) return "Race Week";
  if (week >= total - 2) return "Peak & Taper";
  if (week % 4 === 0) return "Recovery & Absorption";
  if (week <= Math.ceil(total * .33)) return "Base Building";
  if (week <= Math.ceil(total * .7)) return "Build & Threshold";
  return "Race Specific";
}

function runPrescription(type, week = blockWeek()) {
  const total = data.trainingBlock.lengthWeeks || 12;
  const target = Number(data.trainingBlock.targetMinutes) || 60;
  const targetPace = target / 6.21371;
  const recovery = week % 4 === 0;
  const raceWeek = week === total;
  const progress = Math.min(1, week / Math.max(1, total - 2));
  const easyMiles = (2.0 + progress * 2.0) * (recovery ? .75 : 1);
  const longMiles = Math.min(7.0, 3.0 + progress * 3.5) * (recovery ? .72 : 1);
  const intervalCount = recovery ? 4 : Math.round(4 + progress * 4);
  const tempoMinutes = recovery ? 12 : Math.round(12 + progress * 14);

  if (raceWeek) {
    if (type === "easy") return { mission:"R-2 Easy Run", label:"Race-Week Easy Run", detail:"20–25 min very easy + 4 relaxed strides", duration:25 };
    if (type === "quality") return { mission:"R-4 Intervals", label:"Race Sharpening", detail:"10 min easy, 4 × 1 min at 10K effort with 2 min easy, cool down", duration:28 };
    return { mission:"R-5 Long Run", label:"10K Goal Run", detail:`10K goal effort • target ${target.toFixed(0)} minutes`, duration:Math.round(target) };
  }

  if (type === "easy") return { mission:"R-2 Easy Run", label:"Easy Aerobic Run", detail:`${easyMiles.toFixed(1)} miles conversational pace`, duration:Math.round(easyMiles * 12) };
  if (type === "quality") {
    if (week <= Math.ceil(total * .35)) return { mission:"R-4 Intervals", label:"Speed Development", detail:`${intervalCount} × 1 min fast / 2 min easy`, duration:30 + intervalCount };
    if (week <= Math.ceil(total * .72)) return { mission:"R-3 Tempo Run", label:"Threshold Development", detail:`${tempoMinutes} min total tempo near ${(targetPace + .5).toFixed(1)} min/mi`, duration:tempoMinutes + 18 };
    return { mission:"R-4 Intervals", label:"10K-Specific Intervals", detail:`${Math.max(4, intervalCount-1)} × 3 min near ${targetPace.toFixed(1)} min/mi / 2 min easy`, duration:42 };
  }
  return { mission:"R-5 Long Run", label:"Long Aerobic Run", detail:`${longMiles.toFixed(1)} miles easy; finish controlled`, duration:Math.round(longMiles * 12) };
}

function strengthProgression() {
  const week = blockWeek();
  const total = data.trainingBlock.lengthWeeks || 12;
  if (week === total) return { label:"Race-week maintenance", load:0.72, setScale:0.55, note:"Keep strength crisp and leave the gym fresh." };
  if (week % 4 === 0) return { label:"Deload", load:0.72, setScale:0.65, note:"Reduce fatigue while preserving movement quality." };
  const cycleWeek = ((week - 1) % 4) + 1;
  const loads = [0.76, 0.79, 0.82, 0.72];
  return { label:`Progressive overload week ${cycleWeek}`, load:loads[cycleWeek-1], setScale:1, note:"Add 5 lb when all prescribed reps are clean with 1–2 reps in reserve." };
}

function coachRecommendation() {
  if (!data.trainingBlock.enabled) return "Build a goal-based block in More → Goal Builder. The first release uses reliable coaching rules; an online AI layer can be added later.";
  const phase = blockPhase();
  const readiness = readinessStatus(readinessScore());
  const strength = strengthProgression();
  if (readiness === "RED") return `${phase}: readiness is red. Keep only essential work, make conditioning easy, and skip optional finishers today.`;
  if (readiness === "YELLOW") return `${phase}: use the planned session but trim one accessory set and avoid grinding. ${strength.note}`;
  return `${phase}: you are cleared to progress. ${strength.note}`;
}

function generateTrainingBlock() {
  const targetDate = document.getElementById("blockTargetDate").value;
  const targetMinutes = +document.getElementById("blockTargetMinutes").value || 60;
  const length = targetDate ? weeksUntil(targetDate) : (+document.getElementById("blockLength").value || 12);
  data.trainingBlock = {
    ...data.trainingBlock,
    enabled:true,
    goalType:document.getElementById("blockGoalType").value,
    targetDate,
    targetMinutes,
    lengthWeeks:length,
    currentWeek:1,
    runDays:+document.getElementById("blockRunDays").value || 3,
    strengthDays:+document.getElementById("blockStrengthDays").value || 3,
    maintainStrength:document.getElementById("blockMaintainStrength").checked,
    startDate:todayKey(),
    generatedAt:new Date().toISOString()
  };
  buildCurrentWeekPlan();
  saveData();
  alert(`${data.trainingBlock.goalType} block created: ${length} weeks.`);
}

function buildCurrentWeekPlan() {
  if (!data.trainingBlock.enabled) return;
  const easy = runPrescription("easy");
  const quality = runPrescription("quality");
  const long = runPrescription("long");
  const strength3 = data.trainingBlock.strengthDays >= 3;
  data.settings.rotationWeek = ((blockWeek() - 1) % 4) + 1;
  data.settings.phase = `${data.trainingBlock.goalType} • ${blockPhase()}`;
  data.plan = [
    {day:"Monday", mission:"S-1 Upper Strength", detail:strengthProgression().label, done:false},
    {day:"Tuesday", mission:easy.mission, detail:easy.detail, customLabel:easy.label, done:false},
    {day:"Wednesday", mission:"S-2 Lower Strength", detail:strengthProgression().label, done:false},
    {day:"Thursday", mission:quality.mission, detail:quality.detail, customLabel:quality.label, done:false},
    {day:"Friday", mission:strength3 ? "S-3 Athletic Upper" : "M-1 Daily Reset", detail:strength3 ? "Short upper-body strength + Golden Era accessories" : "Mobility and recovery", done:false},
    {day:"Saturday", mission:long.mission, detail:long.detail, customLabel:long.label, done:false},
    {day:"Sunday", mission:"M-1 Daily Reset", detail:"Recovery, walking, and mobility", done:false}
  ];
}

function advanceBlockWeek() {
  if (!data.trainingBlock.enabled) return alert("Create a training block first.");
  if (data.trainingBlock.currentWeek >= data.trainingBlock.lengthWeeks) return alert("This block is complete.");
  data.trainingBlock.currentWeek += 1;
  buildCurrentWeekPlan();
  saveData();
}

function saveBlockWeek() {
  if (!data.trainingBlock.enabled) return alert("Create a training block first.");
  data.trainingBlock.currentWeek = Math.max(1, Math.min(data.trainingBlock.lengthWeeks, +document.getElementById("currentBlockWeekInput").value || 1));
  buildCurrentWeekPlan();
  saveData();
}

function blockRunOverride(name, base) {
  if (!data.trainingBlock.enabled || data.trainingBlock.goalType !== "10K") return base;
  let type = null;
  if (name === "R-2 Easy Run") type = "easy";
  if (name === "R-3 Tempo Run" || name === "R-4 Intervals") type = "quality";
  if (name === "R-5 Long Run") type = "long";
  if (!type) return base;
  const p = runPrescription(type);
  if (type === "easy" && (data.settings.cardioType || "Running") !== "Running") {
    const modality = data.settings.cardioType;
    const swap = cardioPrescription("R-2 Easy Run", modality);
    return {...base, duration:p.duration, exercises:[{name:swap[0], block:"Aerobic Cross-Training", sets:1, reps:swap[1], rest:0, cue:`Approved easy-day substitute. Return to running for quality and long sessions to preserve 10K specificity.`}]};
  }
  return {...base, duration:p.duration, exercises:[{name:p.label, block:"Goal Progression", sets:1, reps:p.detail, rest:0, cue:type === "easy" ? "Conversational running builds durability for the 10K goal." : "Complete this as a run; race-specific quality cannot be fully replaced by cross-training."}]};
}
