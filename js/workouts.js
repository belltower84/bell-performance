"use strict";

let timerInterval = null;
let restInterval = null;
let restRemaining = 0;
let savedPageScroll = 0;

function currentPlan() {
  return data.plan.find(item => !item.done && !["skipped","replaced"].includes(item.status)) || null;
}

function cardioPrescription(mission, modality) {
  const map = {
    "R-1 Recovery Run": {"Running":["Recovery Run","20 min easy"],"Cycling":["Easy Spin","25 min easy"],"Air Bike":["Recovery Ride","15–20 min easy"],"Rower":["Easy Row","15–20 min easy"],"Elliptical":["Easy Elliptical","20–25 min easy"],"Stair Climber":["Easy Climb","15–20 min easy"],"Swimming":["Easy Technique Swim","20–30 min easy"],"Hiking / Rucking":["Easy Hike / Ruck","25–35 min easy"],"Sprint / Field":["Movement & Tempo","20 min easy"]},
    "R-2 Easy Run": {"Running":["Easy Run","2–3 miles"],"Cycling":["Zone 2 Ride","35–45 min"],"Air Bike":["Zone 2 Air Bike","25–35 min"],"Rower":["Zone 2 Row","25–35 min"],"Elliptical":["Zone 2 Elliptical","30–40 min"],"Stair Climber":["Zone 2 Climb","20–30 min"],"Swimming":["Aerobic Swim","25–40 min"],"Hiking / Rucking":["Zone 2 Hike / Ruck","35–50 min"],"Sprint / Field":["Tempo Conditioning","20–30 min"]},
    "R-3 Tempo Run": {"Running":["Tempo Run","3 × 5 min"],"Cycling":["Tempo Ride","3 × 6 min"],"Air Bike":["Tempo Air Bike","5 × 3 min"],"Rower":["Tempo Row","4 × 4 min"],"Elliptical":["Tempo Elliptical","3 × 6 min"],"Stair Climber":["Tempo Climb","4 × 4 min"],"Swimming":["Threshold Swim","6 × 100 m"],"Hiking / Rucking":["Uphill Tempo Ruck","3 × 8 min"],"Sprint / Field":["Repeat Speed","6 × 20 sec"]},
    "R-4 Intervals": {"Running":["Fast Interval","6 × 1 min"],"Cycling":["Bike Interval","8 × 1 min"],"Air Bike":["Air Bike Sprint","10 × 20 sec"],"Rower":["Row Interval","8 × 250 m"],"Elliptical":["Elliptical Interval","8 × 1 min"],"Stair Climber":["Climb Interval","8 × 45 sec"],"Swimming":["Swim Interval","10 × 50 m"],"Hiking / Rucking":["Hill Ruck Interval","8 × 2 min"],"Sprint / Field":["Quality Sprint","6–10 reps"]},
    "R-5 Long Run": {"Running":["Long Easy Run","3–5 miles"],"Cycling":["Long Zone 2 Ride","60–90 min"],"Air Bike":["Long Aerobic Ride","35–50 min"],"Rower":["Long Easy Row","35–50 min"],"Elliptical":["Long Aerobic Session","45–60 min"],"Stair Climber":["Long Easy Climb","30–45 min"],"Swimming":["Long Aerobic Swim","40–60 min"],"Hiking / Rucking":["Long Hike / Ruck","60–120 min"],"Sprint / Field":["Extensive Tempo","30–40 min"]}
  };
  return map[mission]?.[modality] || map[mission]?.Running;
}

function applyCardioModality(name, template) {
  if (!name.startsWith("R-")) return template;
  const modality = data.settings.cardioType || "Running";
  const selected = cardioPrescription(name, modality);
  const exercises = template.exercises.map((exercise, index) => {
    const targetIndex = ["R-3 Tempo Run", "R-4 Intervals"].includes(name) ? 1 : 0;
    return index === targetIndex ? {...exercise, name:selected[0], reps:selected[1]} : exercise;
  });
  return {...template, exercises, cardioType:modality};
}

function cardioGuidance() {
  const notes = {"Running":"Best for rebuilding running durability. Keep easy days conversational.","Cycling":"Low-impact aerobic work. Use steady cadence and moderate resistance.","Air Bike":"Full-body conditioning. Avoid turning every session into a sprint.","Rower":"Drive with the legs first, then finish with the arms.","Elliptical":"Low-impact option that closely matches steady running effort.","Stair Climber":"Keep posture tall and avoid leaning heavily on the handles.","Swimming":"Prioritize relaxed breathing and efficient strokes before adding intensity.","Hiking / Rucking":"Progress time, terrain, and load gradually. Do not increase all three at once.","Sprint / Field":"Quality beats fatigue. Use full recovery for true speed work."};
  return notes[data.settings.cardioType || "Running"];
}

function saveCardioType() {
  const settingsSelect = document.getElementById("cardioType");
  data.settings.cardioType = settingsSelect?.value || data.settings.cardioType || "Running";
  const quick = document.getElementById("engineModeQuick");
  if (quick && quick.value !== data.settings.cardioType) quick.value = data.settings.cardioType;
  saveData();
}
function switchQuickEngineMode(value) {
  data.settings.cardioType = value;
  const settingsSelect = document.getElementById("cardioType");
  if (settingsSelect) settingsSelect.value = value;
  saveData();
}
function roundTo5(value) { return Math.max(5, Math.round(value / 5) * 5); }

function recommendedWeight(exerciseName, status) {
  const m = data.settings.maxes || {};
  const bodyweight = Number(data.settings.weight) || null;
  const scale = status === "GREEN" ? 1 : status === "YELLOW" ? 0.90 : 0.75;
  const blockLoadFactor = data.trainingBlock?.enabled ? (strengthProgression().load / 0.76) : 1;
  const table = {
    "Bench Press":{base:m.bench*0.70,label:"based on bench strength"},"Paused Bench Press":{base:m.bench*0.74,label:"based on bench strength"},"Close-Grip Bench Press":{base:m.bench*0.62,label:"based on bench strength"},"Incline Barbell Press":{base:m.bench*0.58,label:"based on bench strength"},
    "Back Squat":{base:m.squat*0.68,label:"based on squat strength"},"Tempo Back Squat":{base:m.squat*0.58,label:"based on squat strength"},"Speed Back Squat":{base:m.squat*0.50,label:"move explosively"},"Front Squat":{base:m.squat*0.52,label:"based on squat strength"},"Narrow-Stance Squat":{base:m.squat*0.55,label:"based on squat strength"},
    "Deadlift":{base:m.deadlift*0.68,label:"based on deadlift strength"},"Trap-Bar Deadlift":{base:m.deadlift*0.68,label:"based on deadlift strength"},"Romanian Deadlift":{base:m.deadlift*0.45,label:"based on deadlift strength"},"Good Morning":{base:m.squat*0.28,label:"start conservatively"},
    "Push Press":{base:m.pushPress*0.70,label:"based on push-press strength"},"Strict Overhead Press":{base:m.pushPress*0.58,label:"based on overhead strength"},
    "Incline Dumbbell Press":{base:m.bench*0.18,label:"per dumbbell"},"Flat Dumbbell Press":{base:m.bench*0.20,label:"per dumbbell"},"Arnold Press":{base:m.pushPress*0.20,label:"per dumbbell"},"Dumbbell Floor Press":{base:m.bench*0.20,label:"per dumbbell"},
    "Single-Arm Dumbbell Row":{base:m.bench*0.24,label:"per dumbbell"},"Chest-Supported Row":{base:m.bench*0.21,label:"per dumbbell or equivalent"},
    "Reverse Lunge":{base:bodyweight*0.16,label:"per dumbbell"},"Bulgarian Split Squat":{base:bodyweight*0.15,label:"per dumbbell"},"Step-up":{base:bodyweight*0.14,label:"per dumbbell"},"Walking Lunge":{base:bodyweight*0.13,label:"per dumbbell"},
    "Kettlebell Swing":{base:bodyweight*0.24,label:"suggested kettlebell"},"Farmer Carry":{base:bodyweight*0.32,label:"per hand"},"Goblet Squat":{base:bodyweight*0.25,label:"suggested dumbbell or kettlebell"}
  };
  if (["Weighted Pull-up","Weighted Chin-up"].includes(exerciseName)) {
    const add = status === "GREEN" ? 25 : status === "YELLOW" ? 10 : 0;
    return {value:add,display:add?`Bodyweight + ${add} lb`:"Bodyweight",note:"Adjust to preserve clean reps."};
  }
  if (/Pull-up|Chin-up|Push-up|Jump|Sprint|Plank|Raise|Curl|Pressdown|Extension|Fly|Face Pull|Crunch|Ab Wheel|Hamstring Curl|Leg Extension/.test(exerciseName)) return {value:"",display:"Choose by effort",note:"Use clean reps and stop before technique breaks."};
  const item = table[exerciseName];
  if (!item || !Number.isFinite(Number(item.base)) || Number(item.base) <= 0) return {value:"",display:"Choose by effort",note:"Enter your current max lifts in Athlete Settings for calculated starting weights. Until then, use clean reps and the prescribed RIR."};
  const baseline = roundTo5(item.base * scale * blockLoadFactor);
  const value = typeof prescribedWeightForExercise === "function" ? prescribedWeightForExercise(exerciseName, baseline) : baseline;
  const progress = typeof exerciseProgressionSummary === "function" ? exerciseProgressionSummary(exerciseName) : null;
  return {value,display:`${value} lb`,note: progress?.nextLoad ? `${progress.method}; ${progress.reason}` : `${item.label}; ${status.toLowerCase()} readiness applied.`};
}

function saveMaxes() {
  const read=id=>{const raw=document.getElementById(id)?.value;const value=Number(raw);return raw!==""&&Number.isFinite(value)&&value>0?value:null;};
  data.settings.maxes = {bench:read("benchMax"),squat:read("squatMax"),deadlift:read("deadliftMax"),pushPress:read("pushPressMax")};
  saveData(); alert("Training maxes saved. Blank fields remain unset.");
}

function saveRotationWeek() {
  data.settings.rotationWeek = Math.min(4, Math.max(1, +document.getElementById("rotationWeekInput").value || 1));
  saveData(); alert(`Rotation Week ${data.settings.rotationWeek} loaded.`);
}

function bellCanonicalWorkoutMission(name) {
  const raw=String(name||"").trim();
  const aliases={
    "R-1":"R-1 Recovery Run",
    "R-2":"R-2 Easy Run",
    "R-3":"R-3 Tempo Run",
    "R-4":"R-4 Intervals",
    "R-5":"R-5 Long Run",
    "M-1":"M-1 Daily Reset"
  };
  return aliases[raw]||raw;
}

function scaledTemplate(name) {
  name=bellCanonicalWorkoutMission(name);
  let base = getWorkoutTemplate(name);
  if (!base) return null;
  base = blockRunOverride(name, base);
  if (typeof applyEquipmentToTemplate === "function") base = applyEquipmentToTemplate(base);
  if (!(data.trainingBlock?.enabled && name.startsWith("R-"))) base = applyCardioModality(name, base);
  const profile = scalingProfile();
  const isMobility = name.startsWith("M-");
  const isRun = name.startsWith("R-");
  const scaled = {
    ...base,
    name,
    label:getWorkoutLabel(name),
    rotationWeek:getRotationWeek(),
    equipmentLocation:base.equipmentLocation || (typeof activeEquipmentLocation === "function" ? activeEquipmentLocation().name : ""),
    readinessStatus:profile.status,
    duration:isRun
      ? (profile.status === "RED" ? Math.min(25, Math.max(15, Number(base.duration) || 20)) : Math.max(10, Number(base.duration) || 30))
      : Math.max(10, Math.min(profile.timeMinutes, Math.round(base.duration * (isMobility ? 1 : profile.status === "GREEN" ? 1 : profile.status === "YELLOW" ? 0.82 : 0.58)))) ,
    exercises:base.exercises.map(exercise => {
      const originalSets = exercise.sets;
      let sets = exercise.sets;
      let reps = exercise.reps;
      if (!isMobility) {
        sets = Math.max(1, Math.floor(exercise.sets * (isRun ? profile.conditioning : profile.sets)));
        if (profile.status === "GREEN") sets = originalSets;
        if (!isRun && !isMobility && data.trainingBlock?.enabled) sets = Math.max(1, Math.floor(sets * strengthProgression().setScale));
        if (profile.status === "YELLOW" && exercise.block === "Golden Era Finisher") sets = Math.min(2, sets);
        if (profile.status === "RED" && exercise.block === "Golden Era Finisher") sets = 0;
        if (isRun && profile.status === "RED") { reps = (data.settings.cardioType||"Running") === "Running" ? "15–25 min easy walk or walk/jog" : "15–25 min very easy"; sets = 1; }
      }
      const recommendation = recommendedWeight(exercise.name, profile.status);
      return {...exercise,originalSets,sets,reps,recommendedWeight:recommendation.value,recommendationDisplay:recommendation.display,recommendationNote:recommendation.note,scaleNote:sets===0?"RED: optional finisher removed to protect recovery":profile.status === "GREEN"?`GREEN: ${sets} sets as written`:profile.status === "YELLOW"?`YELLOW: scaled to ${sets} sets and reduced load`: `RED: scaled to ${sets} sets and technique-focused load`};
    }).filter(exercise => exercise.sets > 0).filter((exercise, index) => {
      if (isMobility) return true;
      const cap = profile.timeMinutes;
      if (cap <= 30) return index < 3 && exercise.block !== "Golden Era Finisher";
      if (cap <= 45) return index < 4;
      if (cap <= 60) return index < 6;
      return true;
    })
  };
  scaled.exercises.forEach((exercise,index)=>{
    if(!/back[- ]?off/i.test(String(exercise.block||"")))return;
    let sourceIndex=-1;
    for(let i=index-1;i>=0;i--){if(scaled.exercises[i].name===exercise.name){sourceIndex=i;break;}}
    if(sourceIndex<0)return;
    const source=scaled.exercises[sourceIndex];
    const percentages=String(exercise.reps||"").match(/(\d{2,3})(?:\s*[–-]\s*(\d{2,3}))?%/);
    if(!percentages||!Number.isFinite(Number(source.recommendedWeight)))return;
    const low=Number(percentages[1]),high=Number(percentages[2]||percentages[1]);
    const factor=((low+high)/2)/100;
    const backoff=roundTo5(Number(source.recommendedWeight)*factor);
    exercise.backoffSourceIndex=sourceIndex;
    exercise.backoffPercent=factor;
    exercise.recommendedWeight=backoff;
    exercise.recommendationDisplay=`${backoff} lb`;
    exercise.recommendationNote=`Automatically calculated at ${low}${high!==low?`–${high}`:""}% of the recommended top-set load (${source.recommendedWeight} lb). Editing the top-set weight updates this block.`;
  });
  return scaled;
}

function warmupSetsFor(exercise) {
  if (!exercise || !['Primary Strength','Primary Hypertrophy'].includes(exercise.block)) return [];
  const work = Number(exercise.recommendedWeight);
  if (!Number.isFinite(work) || work < 45) return [];
  const bar = exercise.name.includes("Dumbbell") ? 0 : 45;
  const rounds = [
    { label: "Warm-up 1", weight: Math.max(bar, roundTo5(work * .40)), reps: "8" },
    { label: "Warm-up 2", weight: Math.max(bar, roundTo5(work * .60)), reps: "5" },
    { label: "Warm-up 3", weight: Math.max(bar, roundTo5(work * .78)), reps: "3" }
  ];
  return rounds.filter((x, i, arr) => i === 0 || x.weight > arr[i-1].weight);
}

function renderWarmupPanel() {
  const panel = document.getElementById("warmupPanel");
  const first = data.activeWorkout?.exercises?.find(ex => ["Primary Strength","Primary Hypertrophy"].includes(ex.block));
  const warmups = warmupSetsFor(first);
  if (!panel || !first || !warmups.length) { if (panel) panel.classList.add("hidden"); return; }
  panel.classList.remove("hidden");
  panel.innerHTML = `<h3>Generated Warm-up — ${first.name}</h3><div class="hint">Complete these before the working sets. Adjust if you need more preparation.</div>${warmups.map(x => `<div class="warmup-row"><strong>${x.label}</strong><span>${x.weight} lb × ${x.reps}</span></div>`).join("")}`;
}

function beginRestTimer(seconds, exerciseName) {
  clearInterval(restInterval);
  restRemaining = Math.max(0, Number(seconds) || 0);
  if (!restRemaining) return;
  const panel = document.getElementById("restPanel");
  if (panel) panel.classList.remove("hidden");
  setText("currentExerciseOut", `Recover for ${exerciseName}`);
  updateRestDisplay();
  restInterval = setInterval(() => {
    restRemaining -= 1;
    updateRestDisplay();
    if (restRemaining <= 0) {
      clearInterval(restInterval);
      if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
      setText("currentExerciseOut", "Rest complete — begin the next set");
    }
  }, 1000);
}

function updateRestDisplay() {
  const timer = document.getElementById("restTimer");
  if (!timer) return;
  const m = String(Math.floor(Math.max(0, restRemaining) / 60)).padStart(2, "0");
  const sec = String(Math.max(0, restRemaining) % 60).padStart(2, "0");
  timer.textContent = `${m}:${sec}`;
}
function adjustRestTimer(delta) { restRemaining = Math.max(0, restRemaining + delta); updateRestDisplay(); }
function skipRestTimer() { clearInterval(restInterval); restRemaining = 0; updateRestDisplay(); document.getElementById("restPanel")?.classList.add("hidden"); setText("currentExerciseOut", "Begin the next set when ready"); }

function beginToday() { const session=typeof dashboardSessionsForToday==="function"?dashboardSessionsForToday()[0]:null; if(session) beginPlannedWorkout(session.planId,session.sessionKey,session.mission); else alert("No prescribed training is scheduled for the selected day. Choose a workout from Training if you want an optional session."); }
function beginWorkout(name, context={}) {
  name=bellCanonicalWorkoutMission(name);
  if(data.activeWorkout){if(data.activeWorkout.name===name){openWorkoutUI();startTimer();return;}if(!confirm("Another workout is already in progress. Discard it and start this session?"))return;data.activeWorkout=null;}
  let template=scaledTemplate(name); if(!template) return;
  const planned=context.planId?data.plan?.find(item=>String(item.id)===String(context.planId)):data.plan?.find(item=>!item.done&&(bellCanonicalWorkoutMission(item.mission)===name||bellCanonicalWorkoutMission(item.secondaryMission)===name));
  const prescriptionApplication=typeof bellPrescriptionApplicationForPlanSession==="function"?bellPrescriptionApplicationForPlanSession(planned,context.sessionKey||null,name):null;
  if(prescriptionApplication&&typeof bellApplyClosedLoopPrescription==="function")template=bellApplyClosedLoopPrescription(template,prescriptionApplication,{mission:name,eventRole:planned?.eventRole,enduranceRole:planned?.enduranceRole,sessionRole:planned?.sessionRole,eventPhase:planned?.eventPhase,longitudinalPhase:planned?.longitudinalPhase,scheduledDate:planned?.scheduledDate});
  const plannedDuration=prescriptionApplication?Number(template.duration):(Number(context.prescribedDuration)||(planned?.mission===name?planned?.prescribedDuration:planned?.secondaryDuration));
  const prescribedDuration=Math.max(10,Number(plannedDuration)||Number(template.duration)||30);
  if(typeof bellCapWorkoutTemplateToMinutes==="function")template=bellCapWorkoutTemplateToMinutes(template,prescribedDuration,name);
  data.activeWorkout={name,label:context.displayLabel||template.label,rotationWeek:template.rotationWeek,duration:prescribedDuration,prescribedDuration,prescriptionApplicationId:prescriptionApplication?.applicationId||null,prescriptionApplication:prescriptionApplication||null,startedAt:null,timerStartedAt:null,timerAccumulatedSeconds:0,timerRunning:false,stage:"briefing",planId:context.planId||planned?.id||null,planSessionKey:context.sessionKey||null,scheduledDate:context.scheduledDate||planned?.scheduledDate||null,optionalCore:Boolean(context.optionalCore),elapsed:0,rpe:"",difficulty:"right",painSeverity:0,painArea:"",techniqueIssue:false,techniqueIssueNote:"",notes:"",readiness:{score:readinessScore(),status:readinessStatus()},cardioType:name.startsWith("R-")?(data.settings.cardioType||"Running"):null,engineMetrics:name.startsWith("R-")?{manualTime:"",distance:"",distanceUnit:(data.settings.cardioType==="Swimming"?"m":"mi"),avgHeartRate:"",elevationGain:"",elevationUnit:"ft"}:null,exercises:template.exercises.map(rawExercise=>{const exercise=(typeof applySavedExerciseReplacement==="function"?applySavedExerciseReplacement(rawExercise):rawExercise);return ({name:exercise.name,block:exercise.block,prescription:`${exercise.sets} × ${exercise.reps}`,originalSets:exercise.originalSets,cue:exercise.cue,equipmentAdjusted:exercise.equipmentAdjusted,injuryAdjusted:exercise.injuryAdjusted,restrictedPattern:exercise.restrictedPattern,originalExercise:exercise.originalExercise,scaleNote:exercise.scaleNote,recommendedWeight:exercise.recommendedWeight,recommendationDisplay:exercise.recommendationDisplay,recommendationNote:exercise.recommendationNote,backoffSourceIndex:exercise.backoffSourceIndex,backoffPercent:exercise.backoffPercent,advancedTechnique:exercise.advancedTechnique||null,bellPhase:exercise.bellPhase||null,rest:exercise.rest||0,feedback:"",feedbackSaved:false,methodology:(typeof methodologyForExercise==="function"?methodologyForExercise(exercise).name:"Progressive overload"),plannedReps:exercise.reps,sets:Array.from({length:exercise.sets},(_,index)=>({set:index+1,plannedWeight:typeof exercise.recommendedWeight==="number"?exercise.recommendedWeight:"",plannedReps:exercise.reps,weight:typeof exercise.recommendedWeight==="number"?exercise.recommendedWeight:"",reps:exercise.reps,rpe:"",rir:"",done:false}))});})};
  if(typeof bpNormalizeWorkout==="function")bpNormalizeWorkout(data.activeWorkout);
  saveData({render:false}); openWorkoutUI();
}
function openWorkoutUI() {
  const active=data.activeWorkout; if(!active) return;
  if(typeof bpNormalizeWorkout==="function")bpNormalizeWorkout(active);
  if(!document.body.classList.contains("workout-open")){savedPageScroll=window.scrollY;document.body.style.top=`-${savedPageScroll}px`;document.body.classList.add("workout-open");}
  document.getElementById("workoutModal").classList.remove("hidden");
  const isEngine = Boolean(active.cardioType) || String(active.name||"").startsWith("R-");
  const female = (data.settings.sex || "Male") === "Female";
  document.body.classList.toggle("engine-session", isEngine);
  document.body.classList.toggle("female-session", female);
  const displayTitle = typeof bellWorkoutDisplayLabel==='function' ? bellWorkoutDisplayLabel(active) : (active.label||active.name);
  const title = active.cardioType&&displayTitle!==active.cardioType?`${displayTitle} • ${active.cardioType}`:displayTitle;
  document.getElementById("activeTitle").textContent=title;
  setText("activeTrainingType", active.optionalCore ? "Optional Core Training" : (isEngine ? "Engine Training" : "Strength Training"));
  setText("workoutHeroTitle", displayTitle);
  setText("workoutHeroFocus", active.focus?.length ? active.focus.join(" • ") : (active.optionalCore ? "Train the trunk without compromising the primary plan." : (isEngine ? "Build sustainable capacity with controlled effort." : "Execute quality sets with strong technique.")));
  setText("workoutHeroDuration", `${active.duration} min`);
  setText("workoutHeroStatus", active.intensity || "Moderate");
  setText("workoutHeroWeek", `Week ${active.week || 1} • ${active.phase || "Training"}`);
  setText("workoutZoneLabel", trainingStatusText(active.readiness?.status || readinessStatus()));
  renderMissionBriefing(active);
  const art = document.getElementById("workoutHeroArt");
  if (art) {
    if (typeof assignArtworkWithFallback === "function") assignArtworkWithFallback(art, isEngine ? "engine" : "strength", `workout-${active.name || "session"}`);
    else art.src = isEngine ? "./assets/engine-mountain-trail.jpg?v=8530" : "./assets/strength-classic.jpg?v=8530";
  }
  renderActiveWorkout();
  renderWorkoutStage();
  renderEngineResultFields();
}

function renderMissionBriefing(active){
  if(!active)return;
  const displayTitle=typeof bellWorkoutDisplayLabel==='function'?bellWorkoutDisplayLabel(active):(active.label||active.name);
  setText("workoutBriefHeading", `${displayTitle} supports the current mission`);
  setText("workoutCoachBrief", active.coachBrief || "Execute the prescribed work with deliberate technique and controlled effort.");
  const focus=document.getElementById("workoutFocusList");
  if(focus)focus.innerHTML=(active.focus||[]).map(item=>`<span>${item}</span>`).join("");
  const sections=document.getElementById("workoutSectionList");
  if(sections)sections.innerHTML=(active.sections||[]).map(section=>`<div class="mission-section-row"><span>${section.title}</span><strong>${section.minutes} min</strong></div>`).join("");
  setText("workoutBreakdownTotal", `${active.duration || 0} min`);
  const success=document.getElementById("workoutSuccessList");
  if(success)success.innerHTML=(active.successCriteria||[]).map(item=>`<div class="mission-success-row"><b>✓</b><span>${item}</span></div>`).join("");
  setText("workoutSetCount", String(active.workSets ?? 0));
  setText("workoutIntensity", active.intensity || "Moderate");
  setText("workoutEquipment", (active.equipment||[]).join(" • ") || "See exercise list");
  const next=active.nextWorkout;
  setText("workoutNextTitle", next?.title || "No session scheduled");
  setText("workoutNextDetail", next ? `${next.day ? `${next.day} • ` : ""}${next.duration} min` : "Complete this mission, then review the plan.");
}

function renderActiveWorkout() {
  const active=data.activeWorkout;if(!active)return;
  const container=document.getElementById("activeExercises");container.innerHTML="";
  let lastBlock="";
  active.exercises.forEach((exercise,exerciseIndex)=>{
    if(exercise.block&&exercise.block!==lastBlock){
      const heading=document.createElement("div");heading.className="workout-block-title";heading.textContent=exercise.block;container.appendChild(heading);lastBlock=exercise.block;
    }
    const card=document.createElement("article");card.className=`exercise-card streamlined-exercise${exercise.injuryAdjusted?" injury-adjusted":""}`;
    const isEngine=Boolean(active.cardioType)||String(active.name||"").startsWith("R-");
    const safeName=String(exercise.name).replace(/'/g,"\'");
    const detailItems=[];
    if(exercise.advancedTechnique)detailItems.push(`<div class="exercise-detail-line"><strong>${escapeHtml(exercise.advancedTechnique.name)}</strong><span>${escapeHtml(exercise.advancedTechnique.short)}</span></div>`);
    if(exercise.scaleNote)detailItems.push(`<div class="exercise-detail-line"><strong>Readiness</strong><span>${escapeHtml(exercise.scaleNote)}</span></div>`);
    if(!isEngine)detailItems.push(`<div class="exercise-detail-line"><strong>Starting load</strong><span>${escapeHtml(exercise.recommendationDisplay||"Choose by effort")}</span></div>`);
    if(!isEngine&&exercise.recommendationNote)detailItems.push(`<div class="exercise-detail-line"><strong>Why</strong><span>${escapeHtml(exercise.recommendationNote)}</span></div>`);
    if(exercise.injuryAdjusted)detailItems.push(`<div class="exercise-detail-line warning"><strong>Adjusted</strong><span>Replaced ${escapeHtml(exercise.originalExercise||"the original movement")} using your saved limitation profile.</span></div>`);
    const feedbackButtons=isEngine
      ? `<button class="${exercise.feedback==='below'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'below')">Below Target</button><button class="${exercise.feedback==='target'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'target')">On Target</button><button class="${exercise.feedback==='hard'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'hard')">Too Hard</button><button class="issue ${exercise.feedback==='symptoms'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'symptoms')">Pain / Symptoms</button>`
      : `<button class="${exercise.feedback==='easy'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'easy')">Too Easy</button><button class="${exercise.feedback==='right'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'right')">Just Right</button><button class="${exercise.feedback==='heavy'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'heavy')">Too Heavy</button><button class="issue ${exercise.feedback==='pain'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'pain')">Pain / Technique</button>`;
    card.innerHTML=`
      <header class="exercise-head streamlined-head"><div class="exercise-num">${exerciseIndex+1}</div><div class="grow"><div class="exercise-name-row"><div><div class="exercise-name">${escapeHtml(exercise.name)}</div><div class="prescription">${escapeHtml(exercise.prescription)}</div></div><div class="exercise-card-actions"><button type="button" onclick="openExerciseDetail('${safeName}')">Guide</button>${isEngine?"":`<button type="button" onclick="openExerciseSwap(${exerciseIndex})">Replace</button>`}</div></div>${exercise.cue?`<p class="exercise-primary-cue">${escapeHtml(exercise.cue)}</p>`:""}</div></header>
      ${detailItems.length?`<details class="exercise-guidance-drawer"><summary>Coaching & load guidance</summary><div class="exercise-detail-grid">${detailItems.join("")}</div></details>`:""}
      <div class="set-table-wrap"><div class="set-head ${isEngine?"engine-response-head":"strength-response-head"}"><span>${isEngine?"Round":"Set"}</span><span>${isEngine?"Target":"Weight"}</span><span>${isEngine?"Result":"Reps"}</span>${isEngine?"":"<span>RPE</span><span>RIR</span>"}<span>Done</span></div><div id="sets-${exerciseIndex}"></div></div>
      <details class="exercise-feedback-drawer"><summary>${exercise.feedback?"Feedback saved":"Rate this exercise"}</summary><div class="exercise-feedback"><div class="feedback-buttons">${feedbackButtons}</div><div class="feedback-result">${exercise.feedback?(isEngine?'Saved for future conditioning progression.':'Saved for next-session progression.'):(isEngine?'Rate effort, breathing, and control after the segment.':'Rate the movement after the final working set.')}</div></div></details>`;
    container.appendChild(card);
    const setsContainer=card.querySelector(`#sets-${exerciseIndex}`);
    exercise.sets.forEach((set,setIndex)=>{
      const row=document.createElement("div");row.className=`set-row ${isEngine?"engine-response-row":"strength-response-row"}`;
      row.innerHTML=`<span>${set.set}</span><input aria-label="${isEngine?'Target':'Weight'} for ${escapeHtml(exercise.name)} ${isEngine?'round':'set'} ${set.set}" inputmode="decimal" value="${escapeHtml(set.weight)}" oninput="updateSet(${exerciseIndex},${setIndex},'weight',this.value)"><input aria-label="${isEngine?'Result':'Reps'} for ${escapeHtml(exercise.name)} ${isEngine?'round':'set'} ${set.set}" inputmode="text" value="${escapeHtml(set.reps)}" oninput="updateSet(${exerciseIndex},${setIndex},'reps',this.value)">${isEngine?"":`<input aria-label="RPE for ${escapeHtml(exercise.name)} set ${set.set}" inputmode="decimal" min="1" max="10" step="0.5" type="number" value="${escapeHtml(set.rpe??'')}" oninput="updateSet(${exerciseIndex},${setIndex},'rpe',this.value)"><input aria-label="Reps in reserve for ${escapeHtml(exercise.name)} set ${set.set}" inputmode="decimal" min="0" max="10" step="0.5" type="number" value="${escapeHtml(set.rir??'')}" oninput="updateSet(${exerciseIndex},${setIndex},'rir',this.value)">`}<input aria-label="Mark ${escapeHtml(exercise.name)} ${isEngine?'round':'set'} ${set.set} complete" type="checkbox" ${set.done?"checked":""} onchange="updateSet(${exerciseIndex},${setIndex},'done',this.checked)">`;
      setsContainer.appendChild(row);
    });
  });
  renderWarmupPanel();
  const nextExercise=active.exercises.find(exercise=>exercise.sets.some(set=>!set.done));
  setText("currentExerciseOut",nextExercise?nextExercise.name:"All working sets complete");
  document.getElementById("sessionRpe").value=active.rpe||"";
  document.getElementById("sessionDifficulty").value=active.difficulty||"right";
  document.getElementById("sessionPainSeverity").value=active.painSeverity||0;
  document.getElementById("sessionPainArea").value=active.painArea||"";
  document.getElementById("sessionTechniqueIssue").checked=Boolean(active.techniqueIssue);
  document.getElementById("sessionTechniqueNote").value=active.techniqueIssueNote||"";
  document.getElementById("sessionNotes").value=active.notes||"";
  toggleSessionTechniqueDetail();updateTimerDisplay();updateWorkoutProgress();
}

function updateSet(exerciseIndex,setIndex,field,value){const exercise=data.activeWorkout.exercises[exerciseIndex];exercise.sets[setIndex][field]=value;if(field==='weight'&&setIndex===0){const topLoad=Number(value);let changed=false;data.activeWorkout.exercises.forEach(candidate=>{if(candidate.backoffSourceIndex!==exerciseIndex||!Number.isFinite(topLoad)||topLoad<=0)return;const backoff=roundTo5(topLoad*Number(candidate.backoffPercent||0));candidate.recommendedWeight=backoff;candidate.recommendationDisplay=`${backoff} lb`;candidate.recommendationNote=`Automatically recalculated from the entered top-set load of ${topLoad} lb.`;candidate.sets.forEach(set=>{if(!set.done)set.weight=backoff;});changed=true;});if(changed){saveData({render:false});renderActiveWorkout();return;}}saveData({render:false});updateWorkoutProgress();if(field==='done'&&value){const next=exercise.sets.find(set=>!set.done);if(next){beginRestTimer(exercise.rest||60,exercise.name);}else{const nextExercise=data.activeWorkout.exercises.slice(exerciseIndex+1).find(ex=>ex.sets.some(set=>!set.done));setText('currentExerciseOut',nextExercise?nextExercise.name:'All working sets complete');if(nextExercise)beginRestTimer(Math.min(90,exercise.rest||60),nextExercise.name);}}}
function recordExerciseFeedback(exerciseIndex, feedback){
  const exercise=data.activeWorkout?.exercises?.[exerciseIndex]; if(!exercise)return; exercise.feedback=feedback; exercise.feedbackSaved=true; saveData({render:false}); renderActiveWorkout();
}
function toggleSessionTechniqueDetail(){const checked=Boolean(document.getElementById("sessionTechniqueIssue")?.checked);document.getElementById("sessionTechniqueDetail")?.classList.toggle("hidden",!checked);}
function persistActive(){if(!data.activeWorkout)return;data.activeWorkout.rpe=document.getElementById("sessionRpe")?.value||"";data.activeWorkout.difficulty=document.getElementById("sessionDifficulty")?.value||"right";data.activeWorkout.painSeverity=Number(document.getElementById("sessionPainSeverity")?.value)||0;data.activeWorkout.painArea=document.getElementById("sessionPainArea")?.value?.trim()||"";data.activeWorkout.techniqueIssue=Boolean(document.getElementById("sessionTechniqueIssue")?.checked);data.activeWorkout.techniqueIssueNote=document.getElementById("sessionTechniqueNote")?.value?.trim()||"";data.activeWorkout.notes=document.getElementById("sessionNotes")?.value||"";if(data.activeWorkout.engineMetrics){const manual=parseEngineTime(data.activeWorkout.engineMetrics.manualTime);data.activeWorkout.officialElapsed=manual||data.activeWorkout.elapsed||0;data.activeWorkout.engineMetrics.pace=calculateEnginePace(data.activeWorkout.engineMetrics,data.activeWorkout.officialElapsed);}saveData({render:false});}
function parseEngineTime(value){const parts=String(value||"").trim().split(":").map(Number);if(parts.some(Number.isNaN))return 0;if(parts.length===3)return parts[0]*3600+parts[1]*60+parts[2];if(parts.length===2)return parts[0]*60+parts[1];if(parts.length===1)return parts[0]*60;return 0;}
function formatEngineTime(seconds){seconds=Math.max(0,Math.round(Number(seconds)||0));const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),sec=seconds%60;return h?`${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`:`${m}:${String(sec).padStart(2,"0")}`;}
function calculateEnginePace(metrics,elapsed){const distance=Number(metrics?.distance)||0;if(!distance||!elapsed)return"";if(metrics.distanceUnit==="m"||metrics.distanceUnit==="yd")return`${Math.round(distance/(elapsed/60))} ${metrics.distanceUnit}/min`;return`${formatEngineTime(elapsed/distance)} /${metrics.distanceUnit}`;}
function updateEngineMetric(field,value){if(!data.activeWorkout?.engineMetrics)return;data.activeWorkout.engineMetrics[field]=value;renderEnginePacePreview();saveData({render:false});}
function renderEngineResultFields(){const card=document.getElementById("engineResultCard"),metrics=data.activeWorkout?.engineMetrics;if(!card)return;card.classList.toggle("hidden",!metrics);if(!metrics)return;const values={engineManualTime:metrics.manualTime||formatEngineTime(data.activeWorkout.elapsed||0),engineDistance:metrics.distance||"",engineDistanceUnit:metrics.distanceUnit||"mi",engineAvgHeartRate:metrics.avgHeartRate||"",engineElevation:metrics.elevationGain||"",engineElevationUnit:metrics.elevationUnit||"ft"};Object.entries(values).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=v;});renderEnginePacePreview();}
function renderEnginePacePreview(){const out=document.getElementById("enginePacePreview"),metrics=data.activeWorkout?.engineMetrics;if(!out||!metrics)return;const elapsed=parseEngineTime(metrics.manualTime)||data.activeWorkout.elapsed||0;const pace=calculateEnginePace(metrics,elapsed);out.textContent=pace?`Calculated pace: ${pace} • Official time: ${formatEngineTime(elapsed)}`:"Enter time and distance to calculate pace.";}
function updateWorkoutProgress(){const sets=data.activeWorkout?.exercises.flatMap(exercise=>exercise.sets)||[];const completed=sets.filter(set=>set.done).length;const pct=sets.length?Math.round((completed/sets.length)*100):0;const bar=document.getElementById("workoutProgressBar");const text=document.getElementById("workoutProgressText");if(bar)bar.style.width=`${pct}%`;if(text)text.textContent=`${completed}/${sets.length} sets complete`;}
function activeWorkoutElapsed(){const active=data.activeWorkout;if(!active)return 0;const accumulated=active.timerAccumulatedSeconds!==undefined&&active.timerAccumulatedSeconds!==null?Number(active.timerAccumulatedSeconds)||0:Number(active.elapsed)||0;if(!active.timerRunning||!active.timerStartedAt)return Math.max(0,Math.floor(accumulated));const delta=Math.max(0,Math.floor((Date.now()-new Date(active.timerStartedAt).getTime())/1000));return Math.max(0,Math.floor(accumulated+delta));}
function syncActiveWorkoutTimer(){if(!data.activeWorkout)return 0;const elapsed=activeWorkoutElapsed();data.activeWorkout.elapsed=elapsed;return elapsed;}
function startTimer(){clearInterval(timerInterval);if(!data.activeWorkout)return;if(data.activeWorkout.timerRunning!==false&&!data.activeWorkout.timerStartedAt)data.activeWorkout.timerStartedAt=new Date().toISOString();data.activeWorkout.timerRunning=true;timerInterval=setInterval(()=>{if(!data.activeWorkout)return;const elapsed=syncActiveWorkoutTimer();updateTimerDisplay();if(elapsed%15===0)saveData({render:false});},1000);updateTimerDisplay();}
function updateTimerDisplay(){const elapsed=syncActiveWorkoutTimer();const hours=Math.floor(elapsed/3600);const minutes=String(Math.floor((elapsed%3600)/60)).padStart(2,"0");const seconds=String(elapsed%60).padStart(2,"0");const timer=document.getElementById("workoutTimer");if(timer)timer.textContent=hours?`${String(hours).padStart(2,"0")}:${minutes}:${seconds}`:`${minutes}:${seconds}`;}
function closeWorkout(){if(data.activeWorkout){syncActiveWorkoutTimer();persistActive();}document.getElementById("workoutModal").classList.add("hidden");clearInterval(timerInterval);clearInterval(restInterval);document.body.classList.remove("workout-open","engine-session","female-session");document.body.style.top="";window.scrollTo(0,savedPageScroll);}
function completeWorkout(){
  if(!data.activeWorkout)return;
  syncActiveWorkoutTimer();
  persistActive();
  if(data.activeWorkout.engineMetrics&&!parseEngineTime(data.activeWorkout.engineMetrics.manualTime)){
    data.activeWorkout.engineMetrics.manualTime=formatEngineTime(data.activeWorkout.elapsed||0);
    data.activeWorkout.officialElapsed=data.activeWorkout.elapsed||0;
  }
  // Preserve the exact planned-session identity before the active workout is cleared.
  const launchIdentity={
    planId:data.activeWorkout.planId,
    sessionKey:data.activeWorkout.planSessionKey,
    scheduledDate:data.activeWorkout.scheduledDate,
    mission:data.activeWorkout.name,
    type:(data.activeWorkout.cardioType||data.activeWorkout.engineMetrics)?"engine":"strength"
  };
  const completed={...data.activeWorkout,timerRunning:false,completed:true,status:"completed",completedAt:new Date().toISOString()};
  if(typeof applyCompletedWorkoutProgression==="function")applyCompletedWorkoutProgression(completed);
  if(typeof bellBuildStructuredCompletion==="function")completed.structuredCompletion=bellBuildStructuredCompletion(completed);
  if(typeof bellRecordAthleteResponse==="function")completed.adaptiveResponse=bellRecordAthleteResponse(completed);
  data.history.unshift(completed);
  let recorded=false;
  if(typeof markPlannedSessionComplete==="function")recorded=Boolean(markPlannedSessionComplete(completed));
  // Exact-key fallback: completion must never depend on a renamed Engine mission.
  const exactItem=(data.plan||[]).find(item=>String(item.id)===String(launchIdentity.planId))||
    (data.plan||[]).find(item=>typeof sessionsFromPlanItem==="function"&&sessionsFromPlanItem(item).some(session=>String(session.sessionKey)===String(launchIdentity.sessionKey)));
  if(exactItem&&launchIdentity.sessionKey){
    exactItem.sessionCompletions=exactItem.sessionCompletions&&typeof exactItem.sessionCompletions==="object"?exactItem.sessionCompletions:{};
    exactItem.sessionCompletions[launchIdentity.sessionKey]=completed.completedAt;
    completed.planId=exactItem.id;
    completed.planSessionKey=launchIdentity.sessionKey;
    completed.scheduledDate=launchIdentity.scheduledDate||exactItem.scheduledDate||completed.scheduledDate;
    completed.sessionType=launchIdentity.type;
    completed.completionIdentity={planId:exactItem.id,sessionKey:launchIdentity.sessionKey,mission:typeof bellCanonicalWorkoutMission==="function"?bellCanonicalWorkoutMission(launchIdentity.mission):launchIdentity.mission,type:launchIdentity.type,scheduledDate:completed.scheduledDate};
    const planned=typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(exactItem):[];
    const required=planned.filter(session=>!String(session.mission||"").startsWith("M-")&&!session.optionalCore);
    exactItem.done=required.length>0&&required.every(session=>Boolean(exactItem.sessionCompletions[session.sessionKey]));
    exactItem.status=exactItem.done?"completed":"planned";
    if(exactItem.done)exactItem.completedAt=completed.completedAt;else delete exactItem.completedAt;
    recorded=true;
  }
  completed.planCompletionRecorded=recorded;
  if(!recorded){
    const plan=data.plan.find(item=>item.mission===completed.name&&!item.done&&!["skipped","replaced"].includes(item.status));
    if(plan){plan.done=true;plan.status="completed";plan.completedAt=completed.completedAt;}
  }
  closeWorkout();
  data.activeWorkout=null;
  data.pendingFeedbackSessionId=completed.completedAt;
  saveData();
  if(typeof renderBellCommercialHome==="function")setTimeout(renderBellCommercialHome,0);
  if(typeof renderPremiumMission==="function")setTimeout(renderPremiumMission,0);
  openPendingSessionFeedback();
}
function discardWorkout(){if(!confirm("Discard this workout?"))return;closeWorkout();data.activeWorkout=null;saveData();}


function workoutTemplatePreview(name, context={}){
  let template=scaledTemplate(name);if(!template)return null;
  const planned=context.planId?data.plan?.find(item=>String(item.id)===String(context.planId)):data.plan?.find(item=>!item.done&&(bellCanonicalWorkoutMission(item.mission)===name||bellCanonicalWorkoutMission(item.secondaryMission)===name));
  const application=typeof bellPrescriptionApplicationForPlanSession==="function"?bellPrescriptionApplicationForPlanSession(planned,context.sessionKey||null,name):null;
  if(application&&typeof bellApplyClosedLoopPrescription==="function")template=bellApplyClosedLoopPrescription(template,application,{mission:name,eventRole:planned?.eventRole,enduranceRole:planned?.enduranceRole,sessionRole:planned?.sessionRole,eventPhase:planned?.eventPhase,longitudinalPhase:planned?.longitudinalPhase,scheduledDate:planned?.scheduledDate});
  const plannedDuration=application?template.duration:(planned?.mission===name?planned?.prescribedDuration:planned?.secondaryDuration);
  return {name,label:template.label||name,duration:Math.max(10,Number(plannedDuration)||Number(template.duration)||30),exercises:template.exercises||[],coachBrief:template.coachBrief||'Execute the prescribed work with deliberate technique and controlled effort.',prescriptionApplication:application};
}
function previewPlannedWorkout(planId,sessionKey,name){
  const resolved=typeof resolvePlannedSession==='function'?resolvePlannedSession(planId,sessionKey,name):{item:null,session:null};
  const actualName=bellCanonicalWorkoutMission(resolved.session?.mission||name);
  const workout=workoutTemplatePreview(actualName,{planId:resolved.item?.id??planId,sessionKey:resolved.session?.sessionKey||sessionKey});
  openWorkoutPreview(workout,()=>{closeWorkoutPreview();beginPlannedWorkout(planId,sessionKey,actualName);});
}
function previewActiveWorkout(){if(!data.activeWorkout)return;openWorkoutPreview(data.activeWorkout,()=>{closeWorkoutPreview();beginWorkoutFlow();});}
function openWorkoutPreview(workout,onBegin){
  if(!workout)return;const modal=document.getElementById('workoutPreviewModal'),content=document.getElementById('workoutPreviewContent');
  setText('workoutPreviewTitle',typeof bellWorkoutDisplayLabel==='function'?bellWorkoutDisplayLabel(workout):(workout.label||workout.name));setText('workoutPreviewMeta',`${workout.duration||30} minutes · ${(workout.exercises||[]).length} exercises`);
  const warmups=(workout.exercises||[]).filter(x=>/warm/i.test(String(x.block||'')));
  const cooldowns=(workout.exercises||[]).filter(x=>/cool|recovery/i.test(String(x.block||'')));
  const main=(workout.exercises||[]).filter(x=>!warmups.includes(x)&&!cooldowns.includes(x));
  const rows=list=>list.map((x,i)=>`<div class="preview-exercise-row"><span>${i+1}</span><div><strong>${escapeHtml(x.name)}</strong><small>${x.prescription||`${x.sets||''} × ${x.reps||''}`}</small></div></div>`).join('');
  content.innerHTML=`${warmups.length?`<h3>Warm-Up</h3>${rows(warmups)}`:''}${main.length?`<h3>Main Training</h3>${rows(main)}`:''}${cooldowns.length?`<h3>Cooldown</h3>${rows(cooldowns)}`:''}`;
  const btn=document.getElementById('previewBeginButton');btn.onclick=onBegin||closeWorkoutPreview;modal.classList.remove('hidden');
}

function closeWorkoutPreview(){document.getElementById('workoutPreviewModal')?.classList.add('hidden');}
function beginWorkoutFlow(){
  const active=data.activeWorkout;if(!active)return;active.stage='warmup';active.startedAt=active.startedAt||new Date().toISOString();active.timerStartedAt=new Date().toISOString();active.timerRunning=true;saveData({render:false});renderWorkoutStage();startTimer();
}
function advanceToTraining(){const active=data.activeWorkout;if(!active)return;active.stage='training';saveData({render:false});renderWorkoutStage();}
function renderWorkoutStage(){
  const active=data.activeWorkout;if(!active)return;const stage=active.stage||'training';
  const modal=document.getElementById('workoutModal'),hero=document.getElementById('workoutHero'),briefing=document.getElementById('missionBriefing'),briefActions=document.getElementById('workoutBriefActions'),warm=document.getElementById('warmupPanel'),warmActions=document.getElementById('warmupActions'),control=document.getElementById('workoutControlCard'),exercises=document.getElementById('activeExercises'),completion=document.getElementById('workoutCompletionCard');
  if(modal)modal.dataset.workoutStage=stage;
  hero?.classList.toggle('hidden',stage!=='briefing');briefing?.classList.toggle('hidden',stage!=='briefing');briefActions?.classList.toggle('hidden',stage!=='briefing');
  warm?.classList.toggle('hidden',stage!=='warmup');warmActions?.classList.toggle('hidden',stage!=='warmup');
  control?.classList.toggle('hidden',stage==='briefing');exercises?.classList.toggle('hidden',stage!=='training');completion?.classList.toggle('hidden',stage!=='training');
  if(stage==='briefing'){active.timerRunning=false;setText('currentExerciseOut','Review the mission, then begin when ready');}
  if(stage==='warmup')setText('currentExerciseOut','Complete the warm-up, then advance to training');
  if(stage==='training'){
    const nextExercise=active.exercises?.find(exercise=>exercise.sets?.some(set=>!set.done));
    setText('currentExerciseOut',nextExercise?nextExercise.name:'All working sets complete');
  }
}
