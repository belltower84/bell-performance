"use strict";

let timerInterval = null;
let restInterval = null;
let restRemaining = 0;
let savedPageScroll = 0;

function currentPlan() {
  return data.plan.find(item => !item.done) || data.plan[0] || null;
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

function saveCardioType() { data.settings.cardioType = document.getElementById("cardioType").value; saveData(); }
function roundTo5(value) { return Math.max(5, Math.round(value / 5) * 5); }

function recommendedWeight(exerciseName, status) {
  const m = data.settings.maxes || {};
  const bodyweight = Number(data.settings.weight) || 207;
  const scale = status === "GREEN" ? 1 : status === "YELLOW" ? 0.90 : 0.75;
  const blockLoadFactor = data.trainingBlock?.enabled ? (strengthProgression().load / 0.76) : 1;
  const table = {
    "Bench Press":{base:(m.bench||315)*0.70,label:"based on bench strength"},"Paused Bench Press":{base:(m.bench||315)*0.74,label:"based on bench strength"},"Close-Grip Bench Press":{base:(m.bench||315)*0.62,label:"based on bench strength"},"Incline Barbell Press":{base:(m.bench||315)*0.58,label:"based on bench strength"},
    "Back Squat":{base:(m.squat||455)*0.68,label:"based on squat strength"},"Tempo Back Squat":{base:(m.squat||455)*0.58,label:"based on squat strength"},"Speed Back Squat":{base:(m.squat||455)*0.50,label:"move explosively"},"Front Squat":{base:(m.squat||455)*0.52,label:"based on squat strength"},"Narrow-Stance Squat":{base:(m.squat||455)*0.55,label:"based on squat strength"},
    "Deadlift":{base:(m.deadlift||455)*0.68,label:"based on deadlift strength"},"Trap-Bar Deadlift":{base:(m.deadlift||455)*0.68,label:"based on deadlift strength"},"Romanian Deadlift":{base:(m.deadlift||455)*0.45,label:"based on deadlift strength"},"Good Morning":{base:(m.squat||455)*0.28,label:"start conservatively"},
    "Push Press":{base:(m.pushPress||185)*0.70,label:"based on push-press strength"},"Strict Overhead Press":{base:(m.pushPress||185)*0.58,label:"based on overhead strength"},
    "Incline Dumbbell Press":{base:(m.bench||315)*0.18,label:"per dumbbell"},"Flat Dumbbell Press":{base:(m.bench||315)*0.20,label:"per dumbbell"},"Arnold Press":{base:(m.pushPress||185)*0.20,label:"per dumbbell"},"Dumbbell Floor Press":{base:(m.bench||315)*0.20,label:"per dumbbell"},
    "Single-Arm Dumbbell Row":{base:(m.bench||315)*0.24,label:"per dumbbell"},"Chest-Supported Row":{base:(m.bench||315)*0.21,label:"per dumbbell or equivalent"},
    "Reverse Lunge":{base:bodyweight*0.16,label:"per dumbbell"},"Bulgarian Split Squat":{base:bodyweight*0.15,label:"per dumbbell"},"Step-up":{base:bodyweight*0.14,label:"per dumbbell"},"Walking Lunge":{base:bodyweight*0.13,label:"per dumbbell"},
    "Kettlebell Swing":{base:bodyweight*0.24,label:"suggested kettlebell"},"Farmer Carry":{base:bodyweight*0.32,label:"per hand"},"Goblet Squat":{base:bodyweight*0.25,label:"suggested dumbbell or kettlebell"}
  };
  if (["Weighted Pull-up","Weighted Chin-up"].includes(exerciseName)) {
    const add = status === "GREEN" ? 25 : status === "YELLOW" ? 10 : 0;
    return {value:add,display:add?`Bodyweight + ${add} lb`:"Bodyweight",note:"Adjust to preserve clean reps."};
  }
  if (/Pull-up|Chin-up|Push-up|Jump|Sprint|Plank|Raise|Curl|Pressdown|Extension|Fly|Face Pull|Crunch|Ab Wheel|Hamstring Curl|Leg Extension/.test(exerciseName)) return {value:"",display:"Choose by effort",note:"Use clean reps and stop before technique breaks."};
  const item = table[exerciseName];
  if (!item) return {value:"",display:"Choose by effort",note:status === "GREEN" ? "Finish with 1–2 reps in reserve." : status === "YELLOW" ? "Finish with about 3 reps in reserve." : "Keep effort easy and technique-focused."};
  const baseline = roundTo5(item.base * scale * blockLoadFactor);
  const value = typeof prescribedWeightForExercise === "function" ? prescribedWeightForExercise(exerciseName, baseline) : baseline;
  const progress = typeof exerciseProgressionSummary === "function" ? exerciseProgressionSummary(exerciseName) : null;
  return {value,display:`${value} lb`,note: progress?.nextLoad ? `${progress.method}; ${progress.reason}` : `${item.label}; ${status.toLowerCase()} readiness applied.`};
}

function saveMaxes() {
  data.settings.maxes = {bench:+document.getElementById("benchMax").value||315,squat:+document.getElementById("squatMax").value||455,deadlift:+document.getElementById("deadliftMax").value||455,pushPress:+document.getElementById("pushPressMax").value||185};
  saveData(); alert("Training maxes saved. Weight recommendations have been updated.");
}

function saveRotationWeek() {
  data.settings.rotationWeek = Math.min(4, Math.max(1, +document.getElementById("rotationWeekInput").value || 1));
  saveData(); alert(`Rotation Week ${data.settings.rotationWeek} loaded.`);
}

function scaledTemplate(name) {
  let base = getWorkoutTemplate(name);
  if (!base) return null;
  base = blockRunOverride(name, base);
  if (typeof applyEquipmentToTemplate === "function") base = applyEquipmentToTemplate(base);
  if (!(data.trainingBlock?.enabled && name.startsWith("R-"))) base = applyCardioModality(name, base);
  const profile = scalingProfile();
  const isMobility = name.startsWith("M-");
  const isRun = name.startsWith("R-");
  return {
    ...base,
    name,
    label:getWorkoutLabel(name),
    rotationWeek:getRotationWeek(),
    equipmentLocation:base.equipmentLocation || (typeof activeEquipmentLocation === "function" ? activeEquipmentLocation().name : ""),
    readinessStatus:profile.status,
    duration:Math.max(10, Math.min(profile.timeMinutes, Math.round(base.duration * (isMobility ? 1 : profile.status === "GREEN" ? 1 : profile.status === "YELLOW" ? 0.82 : 0.58)))) ,
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

function beginToday() { const plan=currentPlan(); if(plan) beginWorkout(plan.mission); else alert("All planned sessions are complete. Choose a workout from the Workouts tab."); }
function beginWorkout(name) {
  const template=scaledTemplate(name); if(!template) return;
  data.activeWorkout={name,label:template.label,rotationWeek:template.rotationWeek,startedAt:new Date().toISOString(),elapsed:0,rpe:"",notes:"",readiness:{score:readinessScore(),status:readinessStatus()},cardioType:name.startsWith("R-")?(data.settings.cardioType||"Running"):null,exercises:template.exercises.map(exercise=>({name:exercise.name,block:exercise.block,prescription:`${exercise.sets} × ${exercise.reps}`,originalSets:exercise.originalSets,cue:exercise.cue,equipmentAdjusted:exercise.equipmentAdjusted,originalExercise:exercise.originalExercise,scaleNote:exercise.scaleNote,recommendedWeight:exercise.recommendedWeight,recommendationDisplay:exercise.recommendationDisplay,recommendationNote:exercise.recommendationNote,rest:exercise.rest||0,feedback:"",feedbackSaved:false,methodology:(typeof methodologyForExercise==="function"?methodologyForExercise(exercise).name:"Progressive overload"),sets:Array.from({length:exercise.sets},(_,index)=>({set:index+1,weight:typeof exercise.recommendedWeight==="number"?exercise.recommendedWeight:"",reps:exercise.reps,done:false}))}))};
  saveData({render:false}); openWorkoutUI(); startTimer();
}
function openWorkoutUI() {
  const active=data.activeWorkout; if(!active) return;
  if(!document.body.classList.contains("workout-open")){savedPageScroll=window.scrollY;document.body.style.top=`-${savedPageScroll}px`;document.body.classList.add("workout-open");}
  document.getElementById("workoutModal").classList.remove("hidden");
  const isEngine = Boolean(active.cardioType) || String(active.name||"").startsWith("R-");
  const female = (data.settings.sex || "Male") === "Female";
  document.body.classList.toggle("engine-session", isEngine);
  document.body.classList.toggle("female-session", female);
  const title = active.cardioType?`${active.label||active.name} • ${active.cardioType}`:(active.label||active.name);
  document.getElementById("activeTitle").textContent=title;
  setText("activeTrainingType", isEngine ? "Engine Training" : "Strength Training");
  setText("workoutHeroTitle", active.label || active.name);
  setText("workoutHeroFocus", isEngine ? "Build sustainable capacity with controlled effort." : "Execute quality sets with strong technique.");
  setText("workoutHeroDuration", `${Math.max(10, Math.round((active.exercises?.length || 4) * (isEngine ? 6 : 11)))} min`);
  setText("workoutHeroStatus", `${active.readiness?.status || readinessStatus()} Zone`);
  setText("workoutZoneLabel", trainingStatusText(active.readiness?.status || readinessStatus()));
  const art = document.getElementById("workoutHeroArt");
  if (art) art.src = typeof chooseArtwork === "function" ? chooseArtwork(isEngine ? "engine" : "strength", `workout-${active.name || "session"}`) : (isEngine ? "./assets/artwork/engine/mountain-trail.jpg?v=670" : "./assets/artwork/strength/powerlifting.jpg?v=670");
  renderActiveWorkout();
}
function renderActiveWorkout() {
  const active=data.activeWorkout; if(!active) return;
  const container=document.getElementById("activeExercises"); container.innerHTML="";
  let lastBlock="";
  active.exercises.forEach((exercise,exerciseIndex)=>{
    if(exercise.block && exercise.block!==lastBlock){const heading=document.createElement("div");heading.className="workout-block-title";heading.textContent=exercise.block;container.appendChild(heading);lastBlock=exercise.block;}
    const card=document.createElement("div"); card.className="exercise-card";
    card.innerHTML=`<div class="exercise-head"><div class="exercise-num">${exerciseIndex+1}</div><div class="grow"><div class="exercise-name">${exercise.name}</div><div class="prescription">${exercise.prescription}</div><div class="method-chip">${exercise.methodology||"Progressive overload"}</div><div class="cue">${exercise.cue||""}</div><div class="cue"><strong>Readiness:</strong> ${exercise.scaleNote||"As written"}</div><div class="cue"><strong>Starting weight:</strong> ${exercise.recommendationDisplay||"Choose by effort"}</div><div class="cue">${exercise.recommendationNote||""}</div></div></div><div class="set-head"><span>Set</span><span>Weight</span><span>Reps</span><span>Done</span></div><div id="sets-${exerciseIndex}"></div><div class="exercise-feedback"><span>How did this exercise feel?</span><div class="feedback-buttons"><button class="${exercise.feedback==='easy'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'easy')">Too Easy</button><button class="${exercise.feedback==='right'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'right')">Just Right</button><button class="${exercise.feedback==='heavy'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'heavy')">Too Heavy</button><button class="issue ${exercise.feedback==='pain'?'selected':''}" onclick="recordExerciseFeedback(${exerciseIndex},'pain')">Pain / Technique</button></div><div class="feedback-result">${exercise.feedback ? 'Saved for next-session progression.' : 'Rate after the final working set.'}</div></div>`;
    container.appendChild(card);
    const setsContainer=card.querySelector(`#sets-${exerciseIndex}`);
    exercise.sets.forEach((set,setIndex)=>{const row=document.createElement("div");row.className="set-row";row.innerHTML=`<span>${set.set}</span><input inputmode="decimal" value="${set.weight}" oninput="updateSet(${exerciseIndex},${setIndex},'weight',this.value)"><input inputmode="text" value="${set.reps}" oninput="updateSet(${exerciseIndex},${setIndex},'reps',this.value)"><input type="checkbox" ${set.done?"checked":""} onchange="updateSet(${exerciseIndex},${setIndex},'done',this.checked)">`;setsContainer.appendChild(row);});
  });
  renderWarmupPanel();
  const nextExercise = active.exercises.find(exercise => exercise.sets.some(set => !set.done));
  setText("currentExerciseOut", nextExercise ? nextExercise.name : "All working sets complete");
  document.getElementById("sessionRpe").value=active.rpe||"";document.getElementById("sessionNotes").value=active.notes||"";updateTimerDisplay();updateWorkoutProgress();
}
function updateSet(exerciseIndex,setIndex,field,value){const exercise=data.activeWorkout.exercises[exerciseIndex];exercise.sets[setIndex][field]=value;saveData({render:false});updateWorkoutProgress();if(field==='done'&&value){const next=exercise.sets.find(set=>!set.done);if(next){beginRestTimer(exercise.rest||60,exercise.name);}else{const nextExercise=data.activeWorkout.exercises.slice(exerciseIndex+1).find(ex=>ex.sets.some(set=>!set.done));setText('currentExerciseOut',nextExercise?nextExercise.name:'All working sets complete');if(nextExercise)beginRestTimer(Math.min(90,exercise.rest||60),nextExercise.name);}}}
function recordExerciseFeedback(exerciseIndex, feedback){
  const exercise=data.activeWorkout?.exercises?.[exerciseIndex]; if(!exercise)return; exercise.feedback=feedback; exercise.feedbackSaved=true; saveData({render:false}); renderActiveWorkout();
}
function persistActive(){if(!data.activeWorkout)return;data.activeWorkout.rpe=document.getElementById("sessionRpe").value;data.activeWorkout.notes=document.getElementById("sessionNotes").value;saveData({render:false});}
function updateWorkoutProgress(){const sets=data.activeWorkout?.exercises.flatMap(exercise=>exercise.sets)||[];const completed=sets.filter(set=>set.done).length;const pct=sets.length?Math.round((completed/sets.length)*100):0;const bar=document.getElementById("workoutProgressBar");const text=document.getElementById("workoutProgressText");if(bar)bar.style.width=`${pct}%`;if(text)text.textContent=`${completed}/${sets.length} sets complete`;}
function startTimer(){clearInterval(timerInterval);timerInterval=setInterval(()=>{if(!data.activeWorkout)return;data.activeWorkout.elapsed=(data.activeWorkout.elapsed||0)+1;updateTimerDisplay();if(data.activeWorkout.elapsed%15===0)saveData({render:false});},1000);}
function updateTimerDisplay(){const elapsed=data.activeWorkout?.elapsed||0;const minutes=String(Math.floor(elapsed/60)).padStart(2,"0");const seconds=String(elapsed%60).padStart(2,"0");const timer=document.getElementById("workoutTimer");if(timer)timer.textContent=`${minutes}:${seconds}`;}
function closeWorkout(){if(data.activeWorkout)persistActive();document.getElementById("workoutModal").classList.add("hidden");clearInterval(timerInterval);clearInterval(restInterval);document.body.classList.remove("workout-open","engine-session","female-session");document.body.style.top="";window.scrollTo(0,savedPageScroll);}
function completeWorkout(){if(!data.activeWorkout)return;persistActive();const completed={...data.activeWorkout,completedAt:new Date().toISOString()};if(typeof applyCompletedWorkoutProgression==="function")applyCompletedWorkoutProgression(completed);data.history.unshift(completed);const plan=data.plan.find(item=>item.mission===completed.name&&!item.done);if(plan)plan.done=true;closeWorkout();data.activeWorkout=null;data.pendingFeedbackSessionId=completed.completedAt;saveData();openPendingSessionFeedback();}
function discardWorkout(){if(!confirm("Discard this workout?"))return;closeWorkout();data.activeWorkout=null;saveData();}
